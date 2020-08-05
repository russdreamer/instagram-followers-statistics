let root;
let scriptRoot;
let content;
let intro;
let statistics;
let loader_wrapper;
let textFile = null;

(function () {
	try {
		document.body.setAttribute("style", "display: none");
  		loadCSS();
  		start();
	} catch (e) {
  		showError(e);
	}
})();

function showError(error) {
	const errorDiv = document.createElement('DIV');
	errorDiv.setAttribute("style", "color: red; font-weight: bold");
	errorDiv.innerHTML = "Error: " + error.message;
	root.appendChild(errorDiv);
	root.appendChild(getRestartBtn());
}

function User(node) {
	this.full_name = node.full_name;
	this.id = node.id;
	this.profile_pic_url = node.profile_pic_url;
	this.username = node.username;
}

function StatMap(newFollowers, newUnfollowers, date) {
	this.date = date;
	this.followers = newFollowers;
	this.unfollowers = newUnfollowers;
}

function Statistics(lastFollowers) {
	this.lastFollowers = lastFollowers;
	this.statMaps = [];
}

function readSingleFile(e) {
	var file = e.target.files[0];
	if (!file) return;
	var reader = new FileReader();
	reader.onload = function(e) {
		var contents = e.target.result;
		const stat = JSON.parse(contents);
		stat.lastFollowers = new Map(stat.lastFollowers);
		generateNextList(stat);
	};
	reader.readAsText(file);
}

function loadCSS() {
	const css = '<style>#root {display: flex;align-items: center;justify-content: center;height: 100%;}#content {padding: 20px}#script_root {background: teal;overflow: hidden;border-radius: 25px;border: 2px solid #35c7ac;width: fit-content;max-width: 1000px;height: fit-content;}.button_round {width: fit-content;margin-top:10px;margin-bottom: 20px;box-shadow: 3px 4px 0px 0px #899599;background:linear-gradient(to bottom, #ededed 5%, #bab1ba 100%);background-color:#ededed;border-radius:15px;border:1px solid #d6bcd6;display:inline-block;cursor:pointer;color:#0b4c5c;font-family:Arial;font-size:17px;padding:7px 25px;text-decoration:none;text-shadow:0px 1px 0px #e1e2ed;}.button_round:hover {background:linear-gradient(to bottom, #bab1ba 5%, #ededed 100%);background-color:#bab1ba;}.button_round:active {position:relative;top:1px;}.tab {overflow-x: auto;white-space: nowrap;display: block;border: 1px solid #ccc;background-color: #f1f1f1;}.tab button {background-color: inherit;border: none;outline: none;cursor: pointer;padding: 14px 16px;transition: 0.3s;font-size: 17px;}.tab button:hover {background-color: #ddd;}.tab button.active {background-color: #ccc;}.tabcontent {background: white;overflow-y: scroll;max-height: 500px;display: none;padding: 6px 12px;border: 1px solid #ccc;border-top: none;}.sub_tabcontent {background: white;overflow-y: scroll;max-height: 500px;display: none;padding: 6px 12px;border: 1px solid #ccc;border-top: none;}.avatar {width: 60px;float:left}.user_content {display:table;padding:10px;font-size:15pt}.username {color: darkcyan}.user_row {width: fit-content; margin-top: 10px;display: block; cursor: pointer}.info {color: white;padding-top: 30px;font-weight: bold;font-size: 15pt;}.table_content {border-radius: 25px;overflow: hidden;width:fit-content;max-width:100%; margin-top:10px;}.load_container{display:none; position: absolute;align-items: center;justify-content: center;height: 100%;width: 100%;background-color: rgba(0, 0, 0, 0.8)}.loader {border: 16px solid #f3f3f3;border-radius: 50%;border-top: 16px solid #3498db;width: 120px;height: 120px;-webkit-animation: spin 2s linear infinite; /* Safari */animation: spin 1s linear infinite;}@-webkit-keyframes spin {0% { -webkit-transform: rotate(0deg); }100% { -webkit-transform: rotate(360deg); }}@keyframes spin {0% { transform: rotate(0deg); }100% { transform: rotate(360deg);}}</style>';
  document.head.innerHTML += css;
}

function getMutual(followersMap, followingsMap) {
	const mutual = [];
	let smallerMap;
	let biggerMap 
	if (followersMap.size < followingsMap.size) {
		smallerMap = followersMap;
		biggerMap = followingsMap;
	} else {
		smallerMap = followingsMap;
		biggerMap = followersMap;
	}

	smallerMap.forEach((value, key) => {
		if (biggerMap.has(key)) mutual.push(key);
	});

	return mutual;
}

function getFollowYou(followersMap, followingsMap) {
	const followYou = [];

	followersMap.forEach((value, key) => {
		if (!followingsMap.has(key)) followYou.push(key);
	});

	return followYou;
}

function getYouFollow(followersMap, followingsMap) {
	const youFollow = [];

	followingsMap.forEach((value, key) => {
		if (!followersMap.has(key)) youFollow.push(key);
	});

	return youFollow;
}

function usersMapToHTML(usersMap) {
	const wrapDiv = document.createElement('DIV');

	if (usersMap.size == 0) {
		wrapDiv.innerHTML = "Nobody during this period";
	}

	usersMap.forEach((value, key) => {
		const user = value;
		const userDiv = document.createElement('DIV');
		userDiv.setAttribute("class", "user_row");
		userDiv.setAttribute("onclick", "window.open('https://www.instagram.com/" + user.username + "')");
		const avatar = document.createElement('IMG');
		avatar.setAttribute("class", "avatar");
		avatar.setAttribute("src", user.profile_pic_url);
		avatar.setAttribute("alt", user.username);
		userDiv.appendChild(avatar);
		const userContent = document.createElement('DIV');
		userContent.setAttribute("class", "user_content");
		userContent.innerHTML = '<b>' + user.full_name + '</b><br><span class="username">' + user.username + "</span>";
		userDiv.appendChild(userContent);
		wrapDiv.appendChild(userDiv);
	});

	return wrapDiv;
}

function extractUsersMap(usersArray, usersMap) {
	const map = new Map();
	usersArray.forEach(id => map.set(id, usersMap.get(id)));
	return map;
}

function getPresNumber(number) {
	if (number == 0) return number;

	let num = number;
	while (num >= 1000) {
		num = num / 1000; 
	}
	const rate = number / num;
	if (rate <= 1) {
		return number;
	} else if (rate <= 1000) {
		return parseFloat(num.toFixed(1)) + "K";
	} else if (rate <= 1000000) {
		return parseFloat(num.toFixed(1)) + "M";
	} else if (rate <= 1000000000) {
		return parseFloat(num.toFixed(1)) + "B";
	} else return parseFloat((number / 1000000000000).toFixed(1)) + "T";
}

function showLoader() {
	loader_wrapper.style.display = "flex";
}

function hideLoader() {
	loader_wrapper.style.display = "none";
}

function showFollowersTable(stat) {
	const wrapper = document.createElement('DIV');
	const label = document.createElement("SPAN");
	label.setAttribute("class", "info");
	label.innerHTML = "Followers statistics over time:";
	wrapper.appendChild(label);
	const wrapDiv = document.createElement('DIV');
	wrapDiv.setAttribute("class", "table_content");
	wrapper.appendChild(wrapDiv);

	const tabs = document.createElement("DIV");
	tabs.setAttribute("class", "tab")
	wrapDiv.appendChild(tabs);

	stat.statMaps.slice().reverse().forEach(statMap => {
		statMap.followers = new Map(statMap.followers);
		statMap.unfollowers = new Map(statMap.unfollowers);
		const tab_btn = document.createElement("button");
		tab_btn.setAttribute("class", "tablinks");
		tab_btn.setAttribute("onclick", "openTab(event, '" + statMap.date + "', 'tablinks', 'tabcontent')");
		tab_btn.textContent = new Date(statMap.date).toLocaleString("us-US").split(',')[0];
		tabs.appendChild(tab_btn);

		const tab = document.createElement("DIV");
		tab.setAttribute("id", statMap.date);
		tab.setAttribute("class", "tabcontent");

		const subTabs = document.createElement("DIV");
		subTabs.setAttribute("class", "tab");
		const followers_btn = document.createElement("button");
		const unfollowers_btn = document.createElement("button");
		followers_btn.setAttribute("class", "sub_tablinks");
		followers_btn.setAttribute("onclick", "openTab(event, 'followers_" + statMap.date + "', 'sub_tablinks', 'sub_tabcontent')");
		followers_btn.textContent = "New followes (" + getPresNumber(statMap.followers.size) + ")";
		unfollowers_btn.setAttribute("class", "sub_tablinks");
		unfollowers_btn.setAttribute("onclick", "openTab(event, 'unfollowers_" + statMap.date + "', 'sub_tablinks', 'sub_tabcontent')");
		unfollowers_btn.textContent = "New unfollowes (" + getPresNumber(statMap.unfollowers.size) + ")";
		subTabs.appendChild(followers_btn);
		subTabs.appendChild(unfollowers_btn);
		tab.appendChild(subTabs);

		const followers_tab = document.createElement("DIV");
		followers_tab.setAttribute("id", "followers_" + statMap.date);
		followers_tab.setAttribute("class", "sub_tabcontent");
		followers_tab.appendChild(usersMapToHTML(statMap.followers));
		const unfollowers_tab = document.createElement("DIV");
		unfollowers_tab.setAttribute("id", "unfollowers_" + statMap.date);
		unfollowers_tab.setAttribute("class", "sub_tabcontent");
		unfollowers_tab.appendChild(usersMapToHTML(statMap.unfollowers));
		tab.appendChild(followers_tab);
		tab.appendChild(unfollowers_tab);

		wrapDiv.appendChild(tab);
	});
	return wrapper;
}

function makeTable(followersMap, followingsMap) {
	const mutualArr = getMutual(followersMap, followingsMap);
	const followYouArr = getFollowYou(followersMap, followingsMap);
	const youFollowArr = getYouFollow(followersMap, followingsMap);
	const wrapDiv = document.createElement('DIV');
	wrapDiv.setAttribute("class", "table_content");
	const tabs = document.createElement("DIV");
	tabs.setAttribute("class", "tab");

	const mutual = document.createElement("button");
	mutual.setAttribute("class", "tablinks");
	mutual.setAttribute("onclick", "openTab(event, 'mutual', 'tablinks', 'tabcontent')");
	mutual.textContent = "Mutual followers (" + getPresNumber(mutualArr.length) + ")";

	const youFollow = document.createElement("button");
	youFollow.setAttribute("class", "tablinks");
	youFollow.setAttribute("onclick", "openTab(event, 'you_follow', 'tablinks', 'tabcontent')");
	youFollow.textContent = "Who doesn't follow you (" + getPresNumber(youFollowArr.length) + ")";

	const followYou = document.createElement("button");
	followYou.setAttribute("class", "tablinks");
	followYou.setAttribute("onclick", "openTab(event, 'follow_you', 'tablinks', 'tabcontent')");
	followYou.textContent = "You don't follow back (" + getPresNumber(followYouArr.length) + ")";

	tabs.appendChild(mutual);
	tabs.appendChild(youFollow);
	tabs.appendChild(followYou);

	const mutualTab = document.createElement("DIV");
	mutualTab.setAttribute("id", "mutual");
	mutualTab.setAttribute("class", "tabcontent");
	mutualTab.appendChild(usersMapToHTML(extractUsersMap(mutualArr, followersMap)));

	const followYouTab = document.createElement("DIV");
	followYouTab.setAttribute("id", "follow_you");
	followYouTab.setAttribute("class", "tabcontent");
	followYouTab.appendChild(usersMapToHTML(extractUsersMap(followYouArr, followersMap)));

	const youFollowTab = document.createElement("DIV");
	youFollowTab.setAttribute("id", "you_follow");
	youFollowTab.setAttribute("class", "tabcontent");
	youFollowTab.appendChild(usersMapToHTML(extractUsersMap(youFollowArr, followingsMap)));

	wrapDiv.appendChild(tabs);
	wrapDiv.appendChild(mutualTab);
	wrapDiv.appendChild(followYouTab);
	wrapDiv.appendChild(youFollowTab);
	return wrapDiv;
}

function openTab(evt, tabName, linkClassName, contentClassName) {
	var i, tabcontent, tablinks;
	tabcontent = document.getElementsByClassName(contentClassName);
	for (i = 0; i < tabcontent.length; i++) {
		tabcontent[i].style.display = "none";
	}
	tablinks = document.getElementsByClassName(linkClassName);
	for (i = 0; i < tablinks.length; i++) {
		tablinks[i].className = tablinks[i].className.replace(" active", "");
	}
	document.getElementById(tabName).style.display = "block";
	evt.currentTarget.className += " active";
}

function makeTextFile(object) {
	if (textFile !== null) {
  		window.URL.revokeObjectURL(textFile);
 	}
	textFile = "data:application/octet-stream," + encodeURIComponent(JSON.stringify(object, (key, value) => (value instanceof Map ? [...value] : value)));
	return textFile;
}

function getFollowers() {
	const id = getUserId();
	const queryHash = getFollowersQueryHash();
	return queryHash.then(hash => getUsers(id, hash, "edge_followed_by"));
}

function getFollowings() {
	const id = getUserId();
 	const queryHash = getFollowingsQueryHash();
 	return queryHash.then(hash => getUsers(id, hash, "edge_follow"));
}

async function getUsers(id, queryHash, selectorName) {
	let resp;
	let followers = new Map()
	let url = "https://www.instagram.com/graphql/query/?query_hash=" + queryHash + "&variables={\"id\":\"" + id + "\",\"include_reel\":true,\"fetch_mutual\":true,\"first\":100}";
	let hasNext = true;

	while(hasNext) {
		const response = await fetch(encodeURI(url));
		const jsonResp = await response.json();
		resp = (jsonResp.status == "ok")?  jsonResp.data: null;

		if (resp == null) throw new Error('Can not find followers list.');
	addToMap(followers, resp.user[selectorName].edges);
	hasNext = resp.user[selectorName].page_info.has_next_page;
	url = "https://www.instagram.com/graphql/query/?query_hash=" + queryHash + "&variables={\"id\":\"" + id + "\",\"include_reel\":true,\"fetch_mutual\":true,\"first\":100,\"after\":\"" + resp.user[selectorName].page_info.end_cursor + "\"}";
	}
	return followers;
}

function addToMap(map, edges) {
	edges.forEach(element => {
  		const node = element.node;
    	map.set(node.id, new User(node))
  	});
}

function restart() {
	document.documentElement.removeChild(root);
	start();
}

function getRestartBtn() {
	const btn = document.createElement("BUTTON");
	btn.setAttribute("class", "button_round");
	btn.setAttribute("onclick", "restart()");
	btn.innerHTML = "Back to main menu";
	return btn;
}

function getDownloadBtn(stat) {
	const wrapper = document.createElement("DIV");
	const link = document.createElement("A");
	link.setAttribute("download", "followers_" + new Date().toLocaleString("us-US") +".json");
	link.setAttribute("class", "button_round");
	link.setAttribute("id", "download_link");
	link.innerHTML="Download";
	link.href = makeTextFile(stat);
	const label = document.createElement("SPAN");
	label.setAttribute("class", "info");
	label.innerHTML = "Download last statistics to use it next time to compare who unfollow/follow you:";
	wrapper.appendChild(label);
	wrapper.appendChild(link);
	return wrapper;
}

function showStatisctic() {
	statistics = document.createElement("DIV");
	return statistics;
}
  
function generateFirstList() {
	showLoader();
	const followers = getFollowers();
	const followings = getFollowings();
	Promise.all([followers, followings]).then(values => {
		content.removeChild(intro);
		const statistics = showStatisctic(...values); 
		statistics.appendChild(getDownloadBtn(new Statistics(values[0])));
		statistics.appendChild(makeTable(...values));
		statistics.appendChild(getRestartBtn());
		content.appendChild(statistics);
		hideLoader();
	}).catch(e => showError(e));
}

function updateStat(oldStat, followers) {
	const oldFollowers = oldStat.lastFollowers;
	const newFollowers = new Map();
	let newUnfollowers;

	followers.forEach((value, key) => {
		if (!oldFollowers.delete(key)) {
			newFollowers.set(key, value);
		}
	});
	newUnfollowers = oldFollowers;
	const statMap = new StatMap(newFollowers, newUnfollowers, Date.now());
	oldStat.statMaps.push(statMap);
	oldStat.lastFollowers = followers;
}

function generateNextList(stat) {
	showLoader();
	const followers = getFollowers();
	const followings = getFollowings();
	Promise.all([followers, followings]).then(values => {
		updateStat(stat, values[0]);
		content.removeChild(intro);
		const statistics = showStatisctic(...values); 
		statistics.appendChild(getDownloadBtn(stat));
		statistics.appendChild(makeTable(...values));
		statistics.appendChild(showFollowersTable(stat));
		statistics.appendChild(getRestartBtn());
		content.appendChild(statistics);
		hideLoader();
	});
}

function createLoader() {
	loader_wrapper = document.createElement('DIV');
	loader_wrapper.setAttribute("class", "load_container");
	const loader = document.createElement('DIV');
	loader.setAttribute("class", "loader");
	loader_wrapper.appendChild(loader);
	return loader_wrapper;
}

function getFollowersQueryHash() {
	return getQueryHash(/const t=\"(.+)?\",n=/g)
}

function getFollowingsQueryHash() {
	return getQueryHash(/,n=\"(.+)?\",u=/g)
}

async function getQueryHash(pattern) {
	let resp;
	const matches = document.body.outerHTML.match(/static\/bundles\/es6\/Consumer\.js\/.+?\.js/g);
	const scriptLink = (matches != null && matches.length != 0)? matches[0] : null;
	if (scriptLink == null) throw new Error('A link of script is not found.');

	const url = "https://www.instagram.com/" + scriptLink;
	const response = await fetch(url);
	if (response.status != 200) throw new Error('Can not get script file:' + scriptLink);
	resp = await response.text();
	let myRegexp = pattern;
	let match = myRegexp.exec(resp);
	if (match == null || match.length == 0) throw new Error('Query hash is not found.');
	return match[1];
}

function getUserId() {
	const ids = document.body.outerHTML.match(/\"id\":\"([0-9]+?)\"/);
	if (ids == null || ids.length < 2) throw new Error("User Id is not found.");
	return ids[1];
}

function start() {
	root = document.createElement("DIV");
	root.setAttribute("id", "root");
	scriptRoot = document.createElement("DIV");
	scriptRoot.setAttribute("id", "script_root");
	content = document.createElement("DIV");
	content.setAttribute("id", "content")
	intro = document.createElement("DIV");
	intro.setAttribute("id", "intro");
	intro.setAttribute("style", "display: grid");
	const input = document.createElement("INPUT");
	input.setAttribute("type", "file");
	input.setAttribute("id", "file-input");
	input.setAttribute("class", "button_round");
	const generate_title = document.createElement("SPAN");
	generate_title.setAttribute("class", "info");
	generate_title.innerHTML = "If it's your first time using this script - press \"Generate statistics\" and save file onto your computer. You could upload this file next time to see what has been changed since that time:";
	const generate_btn = document.createElement("BUTTON");
	generate_btn.setAttribute("class", "button_round");
	generate_btn.setAttribute("onclick", "generateFirstList()");
	generate_btn.setAttribute("style", "width: fit-content");
	generate_btn.textContent = "Generate statistics";
	const generatedList = document.createElement("DIV");
	generatedList.setAttribute("id", "generated_list");
	const upload_title =  document.createElement("SPAN");
	upload_title.setAttribute("class", "info");
	upload_title.innerHTML = "If you have already got a previously downloaded file - upload it here and check who has started to follow/unfollow you since that time:";

	intro.appendChild(generate_title);
	intro.appendChild(generate_btn);
	intro.appendChild(generatedList);
	intro.appendChild(upload_title);
	intro.appendChild(input);
	content.appendChild(intro);
	scriptRoot.appendChild(content);
	root.appendChild(scriptRoot);
	const doc = document.documentElement
	doc.prepend(root);
	document.getElementById('file-input')
	.addEventListener('change', readSingleFile, false);
	scriptRoot.appendChild(createLoader());
}
