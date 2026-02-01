// ==UserScript==
// @name         Instagram followers statistics
// @namespace    http://russdreamer.github.io/
// @version      6.0
// @author       Iga Kovtun, lzrdblzzrd
// @description  A simple script to track instagram followers/unfollowers since official instagram API doesn't allow to do it anymore.
// @iconURL      https://raw.githubusercontent.com/russdreamer/instagram-followers-statistics/master/img/logo.jpg
// @updateURL    https://github.com/russdreamer/instagram-followers-statistics/raw/master/installation.user.js
// @downloadURL  https://github.com/russdreamer/instagram-followers-statistics/raw/master/installation.user.js
// @supportURL   https://github.com/russdreamer/instagram-followers-statistics/issues
// @match        https://www.instagram.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // --- CONFIGURATION ---
    const CONFIG = {
        ENDPOINTS: {
            USER_INFO: (username) => `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`,
            FRIENDSHIPS_SHOW_MANY: 'https://www.instagram.com/api/v1/friendships/show_many/',
            FOLLOW_LIST: (id, type) => `https://www.instagram.com/api/v1/friendships/${id}/${type}/`,
            SUGGESTED: 'https://www.instagram.com/api/v1/discover/ayml/',
            ACTION: (id, action) => `https://www.instagram.com/web/friendships/${id}/${action}/`
        },
        LIMITS: {
            MAX_RETRIES: 5
        }
    };

    // --- UTILITIES ---
    const Utils = {
        sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

        dynamicSleep: (ms) => {
            const min = ms * 0.8;
            const max = ms * 1.2;
            const time = Math.floor(Math.random() * (max - min) + min);
            return Utils.sleep(time);
        },

        getPresNumber: (number) => {
            if (number === 0) return 0;
            const suffixes = ["", "K", "M", "B", "T"];
            const suffixNum = Math.floor(("" + number).length / 3);
            let shortValue = parseFloat((suffixNum !== 0 ? (number / Math.pow(1000, suffixNum)) : number).toPrecision(2));
            if (shortValue % 1 !== 0) shortValue = shortValue.toFixed(1);
            return shortValue + suffixes[suffixNum];
        },

        downloadFile: (data, filename) => {
            const blob = new Blob([JSON.stringify(data, (key, value) => (value instanceof Map ? [...value] : value), 2)], {
                type: 'application/json'
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };

    // --- API MANAGER ---
    class ApiManager {
        constructor() {
            this.headers = null;
            this.appId = null;
        }

        async init() {
            if (this.headers) return;

            let csrfToken = null;
            let appId = null;
            let rolloutHash = null;

            // Scanning scripts for tokens
            for (const script of document.scripts) {
                const content = script.textContent;
                if (!content) continue;

                if (!csrfToken && content.includes('csrf_token')) {
                    const match = content.match(/"csrf_token":"(.*?)"/);
                    if (match) csrfToken = match[1];
                }
                if (!appId && content.includes('APP_ID')) {
                    const match = content.match(/"APP_ID":"(\d+)"/);
                    if (match) appId = match[1];
                }
                if (!rolloutHash && content.includes('rollout_hash')) {
                    const match = content.match(/"rollout_hash":"(.*?)"/);
                    if (match) rolloutHash = match[1];
                }
                if (csrfToken && appId) break;
            }

            // Fallback AppID
            if (!appId) {
                appId = "936619743392459";
            }

            if (!csrfToken) throw new Error("CSRF Token not found. Please ensure you are logged in.");

            this.appId = appId;
            this.headers = {
                "x-ig-app-id": this.appId,
                "x-ig-www-claim": sessionStorage.getItem("www-claim-v2") || "0",
                "x-csrftoken": csrfToken,
                "x-instagram-ajax": rolloutHash || "1",
                "x-requested-with": "XMLHttpRequest"
            };
        }

        async request(url, options = {}) {
            await this.init();

            const fetchOptions = {
                method: options.method || 'GET',
                headers: {
                    ...this.headers,
                    ...(options.headers || {})
                },
                credentials: 'include'
            };

            if (options.body) {
                fetchOptions.body = options.body;
                fetchOptions.headers['content-type'] = 'application/x-www-form-urlencoded';
            }

            let retries = 0;
            while (retries < CONFIG.LIMITS.MAX_RETRIES) {
                try {
                    if (options.signal && options.signal.aborted) throw new Error("Aborted");

                    const response = await fetch(url, fetchOptions);

                    if (response.status === 429) {
                        const waitTime = (Math.pow(2, retries) * 30000) + (Math.random() * 10000);
                        await Utils.sleep(waitTime);
                        retries++;
                        continue;
                    }

                    if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
                    return await response.json();

                } catch (e) {
                    if (e.message === "Aborted") throw e;
                    retries++;
                    await Utils.sleep(2000);
                }
            }
            throw new Error(`Max retries reached for ${url}`);
        }

        async getUserInfo(username) {
            if (!username) {
                // Try to find username in scripts if not provided
                const script = Array.from(document.scripts).find(s => s.textContent.includes('"username"'));
                if (script) {
                    const match = script.textContent.match(/"username":"(.*?)"/);
                    if (match) username = match[1];
                }
            }
            if (!username) throw new Error("Cannot determine username.");

            const data = await this.request(CONFIG.ENDPOINTS.USER_INFO(username));
            if (!data?.data?.user) throw new Error("User not found or private.");
            return data.data.user;
        }

        async performAction(userId, actionType) {
            const url = CONFIG.ENDPOINTS.ACTION(userId, actionType === 'follow' ? 'create' : 'destroy');
            return await this.request(url, {
                method: 'POST'
            });
        }
    }

    // --- UI MANAGER ---
    class UIManager {
        constructor() {
            this.root = null;
            this.launcher = null;
            this.progressText = null;
            this.stylesLoaded = false;
            this.onReopen = null;
        }

        injectStyles() {
            if (this.stylesLoaded) return;
            const css = `
                #insta-stats-root { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 9999; background: rgba(0,0,0,0.85); display: flex; flex-direction: column; align-items: center; justify-content: center; }
                .is-panel { background: #1c1c1c; padding: 25px; border-radius: 12px; width: 90%; max-width: 650px; box-shadow: 0 10px 30px rgba(0,0,0,0.8); border: 1px solid #333; max-height: 90vh; display: flex; flex-direction: column; }
                .is-scroll-area { overflow-y: auto; padding-right: 5px; flex: 1; }
                
                .is-btn { background: #0095f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px; margin: 4px; transition: 0.2s; }
                .is-btn:hover { background: #0085e0; }
                .is-btn.secondary { background: #333; }
                .is-btn.secondary:hover { background: #444; }
                .is-btn.danger { background: #ed4956; }
                
                .is-input { background: #262626; border: 1px solid #363636; color: white; padding: 10px; border-radius: 6px; width: 100%; margin-bottom: 10px; box-sizing: border-box; }
                .is-row { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; margin-bottom: 10px; }
                .is-title { font-size: 20px; margin-bottom: 15px; text-align: center; color: #e0f1ff; font-weight: bold; }
                .is-text { color: #a8a8a8; font-size: 13px; margin-bottom: 8px; }
                .is-loader { border: 3px solid #333; border-top: 3px solid #fff; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite; margin: 15px auto; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

                .is-tabs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; margin: 10px 0; }
                .is-tab-btn { background: #262626; border: 1px solid #333; color: #aaa; padding: 10px; border-radius: 6px; cursor: pointer; display: flex; flex-direction: column; align-items: center; font-size: 12px; }
                .is-tab-btn b { font-size: 16px; color: #fff; margin-bottom: 2px; }
                .is-tab-btn:hover { background: #303030; }
                .is-tab-btn.active { background: #333; border-color: #0095f6; color: #fff; }
                
                .is-user-list { background: #151515; border: 1px solid #333; border-radius: 6px; margin-top: 10px; max-height: 300px; overflow-y: auto; display: none; }
                .is-user-list.visible { display: block; }
                .is-user-row { display: flex; align-items: center; padding: 8px 12px; border-bottom: 1px solid #222; }
                .is-user-row:last-child { border-bottom: none; }
                .is-user-row:hover { background: #202020; }
                .is-avatar { width: 32px; height: 32px; border-radius: 50%; margin-right: 10px; background: #333; }
                .is-user-info { display: flex; flex-direction: column; overflow: hidden; }
                .is-link { color: #fff; text-decoration: none; font-weight: 600; font-size: 13px; }
                .is-link:hover { text-decoration: underline; }
                .is-subtext { color: #777; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                
                #is-launcher { position: fixed; bottom: 20px; left: 20px; z-index: 9998; box-shadow: 0 4px 12px rgba(0,0,0,0.5); }

                ::-webkit-scrollbar { width: 8px; }
                ::-webkit-scrollbar-track { background: #1c1c1c; }
                ::-webkit-scrollbar-thumb { background: #444; border-radius: 4px; }
                ::-webkit-scrollbar-thumb:hover { background: #555; }
            `;
            const style = document.createElement('style');
            style.innerHTML = css;
            document.head.appendChild(style);
            this.stylesLoaded = true;
        }

        createOverlay() {
            this.injectStyles();

            // Clean up existing elements
            if (this.root) {
                this.root.remove();
                this.root = null;
            }
            if (this.launcher) {
                this.launcher.remove();
            }

            this.root = document.createElement('div');
            this.root.id = 'insta-stats-root';
            document.body.appendChild(this.root);
            return this.root;
        }

        renderLauncher(callback) {
            this.injectStyles();
            this.onReopen = callback;

            if (this.root) {
                this.root.remove();
                this.root = null;
            }
            if (this.launcher) this.launcher.remove();

            this.launcher = document.createElement('button');
            this.launcher.id = 'is-launcher';
            this.launcher.className = 'is-btn';
            this.launcher.textContent = 'Open App';
            this.launcher.onclick = () => {
                this.launcher.remove();
                if (this.onReopen) this.onReopen();
            };
            document.body.appendChild(this.launcher);
        }

        renderMainMenu(callbacks) {
            this.root.innerHTML = '';
            const panel = document.createElement('div');
            panel.className = 'is-panel';

            panel.innerHTML = `
                <div class="is-title">Instagram Statistics</div>
                <div class="is-scroll-area">
                    <div style="margin: 15px 0; border: 1px solid #333; padding: 15px; border-radius: 8px;">
                        <label class="is-text">Username (empty for current):</label>
                        <input type="text" id="is-target-username" class="is-input" placeholder="username...">
                        <button id="is-btn-gen" class="is-btn" style="width:100%">🔍 Generate Statistics</button>
                    </div>
                    
                    <div style="margin: 15px 0; border: 1px solid #333; padding: 15px; border-radius: 8px;">
                        <label class="is-text">Upload previous JSON to compare:</label>
                        <input type="file" id="is-file-upload" class="is-input" accept=".json" style="padding: 5px;">
                    </div>

                    <div style="text-align:center; margin-top:10px">
                        <button id="is-btn-tools" class="is-btn danger" style="opacity: 0.8">🛠 Mass Actions</button>
                    </div>
                </div>
                <div style="margin-top: 15px; border-top: 1px solid #333; padding-top: 10px; text-align: right;">
                    <button id="is-btn-close" class="is-btn secondary">Close</button>
                </div>
            `;

            this.root.appendChild(panel);

            // Scoped listeners
            panel.querySelector('#is-btn-close').onclick = () => callbacks.onClose();
            panel.querySelector('#is-btn-gen').onclick = () => callbacks.onGenerate(panel.querySelector('#is-target-username').value);
            panel.querySelector('#is-btn-tools').onclick = () => callbacks.onTools();
            panel.querySelector('#is-file-upload').onchange = (e) => callbacks.onUpload(e);
        }

        renderProgress(title) {
            this.root.innerHTML = '';
            const panel = document.createElement('div');
            panel.className = 'is-panel';
            panel.style.alignItems = 'center';
            panel.style.justifyContent = 'center';
            panel.style.height = 'auto';

            panel.innerHTML = `
                <div class="is-title">${title}</div>
                <div class="is-loader"></div>
                <div id="is-progress-text" class="is-text" style="font-size: 15px; color: #fff;">Initializing...</div>
                <button id="is-btn-abort" class="is-btn danger" style="margin-top: 20px;">Stop</button>
            `;
            this.root.appendChild(panel);

            this.progressText = panel.querySelector('#is-progress-text');
            return panel.querySelector('#is-btn-abort');
        }

        updateProgress(text) {
            if (this.progressText) this.progressText.textContent = text;
        }

        renderResults(stats, callbacks) {
            this.root.innerHTML = '';
            const panel = document.createElement('div');
            panel.className = 'is-panel';

            const mutual = stats.mutual;
            const notBack = stats.youFollowButNotBack;
            const fans = stats.followYouButNotBack;

            panel.innerHTML = `
                <div class="is-title">Analysis Results</div>
                <div class="is-row" style="justify-content: center; gap: 15px; color: #aaa; font-size: 13px;">
                    <span>Followers: <b style="color:white">${Utils.getPresNumber(stats.followers.size)}</b></span>
                    <span>Following: <b style="color:white">${Utils.getPresNumber(stats.following.size)}</b></span>
                </div>
                
                <div class="is-scroll-area">
                    <div class="is-text" style="margin-top:10px">Categories (click to expand):</div>
                    <div class="is-tabs">
                        <div class="is-tab-btn" data-target="list-mutual">
                            <b>${mutual.length}</b>Mutual
                        </div>
                        <div class="is-tab-btn" data-target="list-notback" style="border-color: #ed495680">
                            <b style="color:#ed4956">${notBack.length}</b>Not Back
                        </div>
                        <div class="is-tab-btn" data-target="list-fans" style="border-color: #0095f680">
                            <b style="color:#0095f6">${fans.length}</b>Fans
                        </div>
                    </div>

                    ${stats.diff ? `
                    <div class="is-text" style="margin-top:10px">Changes since last file:</div>
                    <div class="is-tabs" style="grid-template-columns: 1fr 1fr;">
                        <div class="is-tab-btn" data-target="list-new-followers">
                            <b style="color:#0095f6">+${stats.diff.newFollowers.length}</b>New
                        </div>
                        <div class="is-tab-btn" data-target="list-unfollowers">
                            <b style="color:#ed4956">-${stats.diff.unfollowers.length}</b>Unfollowed
                        </div>
                    </div>
                    ` : ''}

                    <div id="is-list-container" class="is-user-list"></div>
                </div>

                <div class="is-row" style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #333;">
                    <button id="is-btn-dl" class="is-btn">💾 Download JSON</button>
                    <button id="is-btn-back" class="is-btn secondary">Back</button>
                </div>
            `;
            this.root.appendChild(panel);

            const container = panel.querySelector('#is-list-container');
            const tabs = panel.querySelectorAll('.is-tab-btn');

            const lists = {
                'list-mutual': mutual,
                'list-notback': notBack,
                'list-fans': fans,
                'list-new-followers': stats.diff ? stats.diff.newFollowers : [],
                'list-unfollowers': stats.diff ? stats.diff.unfollowers : []
            };

            tabs.forEach(tab => {
                tab.onclick = () => {
                    const targetKey = tab.dataset.target;
                    const isActive = tab.classList.contains('active');

                    tabs.forEach(t => t.classList.remove('active'));
                    container.innerHTML = '';

                    if (!isActive) {
                        tab.classList.add('active');
                        this.renderUserList(lists[targetKey], container);
                        container.classList.add('visible');
                    } else {
                        container.classList.remove('visible');
                    }
                };
            });

            panel.querySelector('#is-btn-dl').onclick = callbacks.onDownload;
            panel.querySelector('#is-btn-back').onclick = callbacks.onBack;
        }

        renderUserList(users, container) {
            if (!users || users.length === 0) {
                container.innerHTML = '<div style="padding:15px; text-align:center; color:#777">List is empty</div>';
                return;
            }

            const fragment = document.createDocumentFragment();
            const limit = 2000;

            users.slice(0, limit).forEach(u => {
                const row = document.createElement('div');
                row.className = 'is-user-row';
                row.innerHTML = `
                    <img src="${u.pic}" class="is-avatar" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iIzU1NSIgZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg=='">
                    <div class="is-user-info">
                        <a href="https://www.instagram.com/${u.username}/" target="_blank" class="is-link">${u.username}</a>
                        <span class="is-subtext">${u.full_name || ''}</span>
                    </div>
                `;
                fragment.appendChild(row);
            });

            if (users.length > limit) {
                const more = document.createElement('div');
                more.style.padding = '10px';
                more.style.textAlign = 'center';
                more.style.color = '#777';
                more.textContent = `...and ${users.length - limit} more (download JSON for full list)`;
                fragment.appendChild(more);
            }

            container.appendChild(fragment);
        }

        renderToolsMenu(callbacks) {
            this.root.innerHTML = '';
            const panel = document.createElement('div');
            panel.className = 'is-panel';

            panel.innerHTML = `
                <div class="is-title">Mass Actions</div>
                <!-- Removed unnecessary container that caused scrollbars -->
                <div style="margin-bottom: 15px;">
                    <div class="is-text" style="color:#ed4956; background:#330000; padding:10px; border-radius:6px; border:1px solid #500">
                        ⚠️ <b>Warning:</b> Instagram blocks frequent actions.
                        <br>Recommendation: Max 50-100 actions per day.
                        <br>Interval: At least 20-30 seconds.
                    </div>
                    
                    <div style="margin-top:15px">
                        <label class="is-text">Quantity:</label>
                        <input type="number" id="is-tool-qty" class="is-input" value="50">
                        
                        <label class="is-text">Delay (seconds):</label>
                        <input type="number" id="is-tool-delay" class="is-input" value="20">
                    </div>

                    <div style="margin-top:15px">
                        <button class="is-btn" id="is-act-unfollow-non" style="width:100%; margin-bottom:8px">
                            Unfollow Not Mutual
                        </button>
                        <button class="is-btn danger" id="is-act-unfollow-all" style="width:100%">
                            Unfollow ALL (Danger!)
                        </button>
                    </div>
                </div>
                <div style="margin-top: auto; border-top: 1px solid #333; padding-top: 10px;">
                    <button class="is-btn secondary" id="is-btn-back" style="width:100%">Back to Menu</button>
                </div>
            `;
            this.root.appendChild(panel);

            const getSettings = () => ({
                qty: parseInt(panel.querySelector('#is-tool-qty').value, 10),
                delay: parseInt(panel.querySelector('#is-tool-delay').value, 10) * 1000
            });

            panel.querySelector('#is-act-unfollow-non').onclick = () => callbacks.onAction('UNFOLLOW_NON_MUTUAL', getSettings());
            panel.querySelector('#is-act-unfollow-all').onclick = () => callbacks.onAction('UNFOLLOW_ALL', getSettings());
            panel.querySelector('#is-btn-back').onclick = callbacks.onBack;
        }
    }

    // --- MAIN APP LOGIC ---
    class App {
        constructor() {
            this.api = new ApiManager();
            this.ui = new UIManager();
            this.abortController = null;
            this.currentUser = null;
        }

        start() {
            // Start by showing the Launcher button only.
            // API initialization happens only when the user clicks the button.
            this.ui.renderLauncher(() => this.initializeAndShow());
        }

        async initializeAndShow() {
            try {
                // Initialize tokens and user info only if not already done
                if (!this.currentUser) {
                    this.ui.createOverlay();
                    this.ui.renderProgress("Initializing...");
                    await this.api.init();
                    this.currentUser = await this.api.getUserInfo();
                }
                this.showMainMenu();
            } catch (e) {
                alert("Error initializing: " + e.message + "\nPlease make sure you are logged in to Instagram.");
                this.ui.renderLauncher(() => this.initializeAndShow());
            }
        }

        showMainMenu() {
            if (!this.ui.root) this.ui.createOverlay();
            this.ui.renderMainMenu({
                onGenerate: (username) => this.generateStats(username),
                onUpload: (e) => this.handleFileUpload(e),
                onTools: () => this.ui.renderToolsMenu({
                    onBack: () => this.showMainMenu(),
                    onAction: (type, settings) => this.runMassAction(type, settings)
                }),
                onClose: () => this.ui.renderLauncher(() => this.showMainMenu())
            });
        }

        async fetchUsers(userId, type, limit = 0, onProgress) {
            const users = new Map();
            let nextMaxId = null;
            let hasNext = true;
            let count = 0;
            const signal = this.abortController.signal;

            while (hasNext && (limit === 0 || count < limit)) {
                if (signal.aborted) throw new Error("Aborted");

                let url = CONFIG.ENDPOINTS.FOLLOW_LIST(userId, type);
                url += `?count=200${nextMaxId ? '&max_id=' + nextMaxId : ''}`;

                const response = await this.api.request(url, {
                    signal
                });

                if (!response.users) break;

                for (const user of response.users) {
                    users.set(user.pk, {
                        id: user.pk,
                        username: user.username,
                        full_name: user.full_name,
                        pic: user.profile_pic_url
                    });
                }

                count = users.size;
                nextMaxId = response.next_max_id;
                hasNext = !!nextMaxId;

                if (onProgress) onProgress(count);

                await Utils.dynamicSleep(300);
            }
            return users;
        }

        async generateStats(targetUsername) {
            this.abortController = new AbortController();
            const btnAbort = this.ui.renderProgress("Fetching Data...");
            btnAbort.onclick = () => this.abortController.abort();

            try {
                const user = targetUsername ? await this.api.getUserInfo(targetUsername) : this.currentUser;
                const userId = user.id;

                this.ui.updateProgress("Fetching Followers...");
                const followers = await this.fetchUsers(userId, 'followers', 0, (n) => this.ui.updateProgress(`Followers: ${n}`));

                this.ui.updateProgress("Fetching Following...");
                const following = await this.fetchUsers(userId, 'following', 0, (n) => this.ui.updateProgress(`Following: ${n}`));

                const stats = this.calculateStats(followers, following, userId);
                this.showResults(stats);

            } catch (e) {
                if (e.message !== "Aborted") alert("Error: " + e.message);
                this.showMainMenu();
            }
        }

        calculateStats(followers, following, ownerId, oldStats = null) {
            const mutual = [];
            const youFollowButNotBack = [];
            const followYouButNotBack = [];

            following.forEach((u, id) => {
                if (followers.has(id)) mutual.push(u);
                else youFollowButNotBack.push(u);
            });

            followers.forEach((u, id) => {
                if (!following.has(id)) followYouButNotBack.push(u);
            });

            let diff = null;
            if (oldStats) {
                const oldFollowers = new Map(oldStats.lastFollowers);
                const newFollowersArr = [];
                const unfollowersArr = [];

                followers.forEach((u, id) => {
                    if (!oldFollowers.has(id)) newFollowersArr.push(u);
                });
                oldFollowers.forEach((u, id) => {
                    if (!followers.has(id)) unfollowersArr.push(u);
                });

                diff = {
                    newFollowers: newFollowersArr,
                    unfollowers: unfollowersArr
                };
            }

            return {
                ownerId,
                date: Date.now(),
                followers,
                following,
                mutual,
                youFollowButNotBack,
                followYouButNotBack,
                diff
            };
        }

        showResults(stats) {
            this.ui.renderResults(stats, {
                onDownload: () => Utils.downloadFile(stats, `insta_stats_${stats.date}.json`),
                onBack: () => this.showMainMenu()
            });
        }

        handleFileUpload(event) {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const oldData = JSON.parse(e.target.result);
                    const targetId = oldData.ownerId || oldData.ownerID || this.currentUser.id;

                    if (!targetId) {
                        throw new Error("Could not determine user ID from file.");
                    }

                    const oldFollowers = new Map(oldData.lastFollowers || oldData.followers);

                    this.abortController = new AbortController();
                    const btnAbort = this.ui.renderProgress("Updating for comparison...");
                    btnAbort.onclick = () => this.abortController.abort();

                    const currentFollowers = await this.fetchUsers(targetId, 'followers', 0, (n) => this.ui.updateProgress(`Followers: ${n}`));
                    const currentFollowing = await this.fetchUsers(targetId, 'following', 0, (n) => this.ui.updateProgress(`Following: ${n}`));

                    const stats = this.calculateStats(currentFollowers, currentFollowing, targetId, {
                        lastFollowers: oldFollowers
                    });
                    this.showResults(stats);

                } catch (err) {
                    console.error(err);
                    alert("Error parsing file: " + err.message);
                    this.showMainMenu();
                }
            };
            reader.readAsText(file);
        }

        async runMassAction(type, settings) {
            this.abortController = new AbortController();
            const btnAbort = this.ui.renderProgress("Preparing Action...");
            btnAbort.onclick = () => this.abortController.abort();

            try {
                this.ui.updateProgress("Analyzing relationships...");
                const userId = this.currentUser.id;

                const following = await this.fetchUsers(userId, 'following', 0, (n) => this.ui.updateProgress(`Fetching following: ${n}`));
                let targets = [];

                if (type === 'UNFOLLOW_NON_MUTUAL') {
                    const followers = await this.fetchUsers(userId, 'followers', 0, (n) => this.ui.updateProgress(`Fetching followers: ${n}`));
                    following.forEach((u, id) => {
                        if (!followers.has(id)) targets.push(u);
                    });
                } else if (type === 'UNFOLLOW_ALL') {
                    targets = Array.from(following.values());
                }

                targets = targets.slice(0, settings.qty);

                if (targets.length === 0) {
                    alert("No users found matching criteria.");
                    this.showMainMenu();
                    return;
                }

                let processed = 0;
                for (const user of targets) {
                    if (this.abortController.signal.aborted) break;

                    this.ui.updateProgress(`Unfollowing ${user.username} (${processed + 1}/${targets.length})`);

                    await this.api.performAction(user.id, 'unfollow');
                    processed++;

                    if (processed < targets.length) {
                        await Utils.dynamicSleep(settings.delay);
                    }
                }

                alert(`Action completed. Processed: ${processed}`);
                this.showMainMenu();

            } catch (e) {
                if (e.message !== "Aborted") alert("Error: " + e.message);
                this.showMainMenu();
            }
        }
    }

    // Launch
    const app = new App();
    app.start();

})();
