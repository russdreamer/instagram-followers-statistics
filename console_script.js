let root;
let scriptRoot;
let content;
let intro;
let statistics;
let loader_wrapper;
let action_panel;
let errorDiv;
let	errortitle 
let textFile = null;
let isFirstLaunch = true;
let currentAction;

const actionType = {
    FOLLOW:"FOLLOW",
    UNFOLLOW_ALL:"UNFOLLOW_ALL",
    UNFOLLOW_MUTUAL:"UNFOLLOW_MUTUAL",
    UNFOLLOW_UNREQUITED:"UNFOLLOW_UNREQUITED"
};

class Action {
	constructor(actionType, quantity, delay, isAutoReconnect) {
		this.actionType = actionType;
		this.quantity = quantity;
		this.delay = delay;
		this.isAutoReconnect = isAutoReconnect;
		this.isAborted = false;
		this.completed = 0;
	}
}

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
	errorDiv.style.display = "grid";
	errortitle.innerHTML = "Error: " + error.message;
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
	const css = '<style>#root {display: flex;align-items: center;} #content {padding: 20px}#script_root {background: teal;overflow: hidden;border-radius: 25px;border: 2px solid #35c7ac;width: fit-content;max-width: 70vw;height: fit-content;}.button_round {width: fit-content;margin-top:10px;margin-bottom: 20px;box-shadow: 3px 4px 0px 0px #899599;background:linear-gradient(to bottom, #ededed 5%, #bab1ba 100%);background-color:#ededed;border-radius:15px;border:1px solid #d6bcd6;display:inline-block;cursor:pointer;color:#0b4c5c;font-family:Arial;font-size:17px;padding:7px 25px;text-decoration:none;text-shadow:0px 1px 0px #e1e2ed;}.button_round:hover {background:linear-gradient(to bottom, #bab1ba 5%, #ededed 100%);background-color:#bab1ba;}.button_round:active {position:relative;top:1px;}.tab {overflow-x: auto;white-space: nowrap;display: block;border: 1px solid #ccc;background-color: #f1f1f1;}.tab button {background-color: inherit;border: none;outline: none;cursor: pointer;padding: 14px 16px;transition: 0.3s;font-size: 17px;}.tab button:hover {background-color: #ddd;}.tab button.active {background-color: #ccc;}.tabcontent {background: white;overflow-y: scroll;max-height: 500px;display: none;padding: 6px 12px;border: 1px solid #ccc;border-top: none;}.sub_tabcontent {background: white;overflow-y: scroll;max-height: 500px;display: none;padding: 6px 12px;border: 1px solid #ccc;border-top: none;}.avatar {width: 60px;float:left}.user_content {display:table;padding:10px;font-size:15pt}.username {color: darkcyan}.user_row {width: fit-content; margin-top: 10px;display: block; cursor: pointer}.info {color: white;padding-top: 30px;font-weight: bold;font-size: 15pt;}.table_content {border-radius: 25px;overflow: hidden;width:fit-content;max-width:100%; margin-top:10px;}.load_container{display:none; position: absolute;align-items: center;justify-content: center;height: 100%;width: 100%;background-color: rgba(0, 0, 0, 0.8)}.loader {border: 16px solid #f3f3f3;border-radius: 50%;border-top: 16px solid #3498db;width: 120px;height: 120px;-webkit-animation: spin 2s linear infinite; /* Safari */animation: spin 1s linear infinite;}@-webkit-keyframes spin {0% { -webkit-transform: rotate(0deg); }100% { -webkit-transform: rotate(360deg); }}@keyframes spin {0% { transform: rotate(0deg); }100% { transform: rotate(360deg);}} .action_panel {position: absolute;overflow-y: scroll;align-self: center;background: teal;width: 100%;height: 100%} .progress_number{color: white;position: absolute;font-weight: bold;}.tooltip {position: relative;display: inline-block;border-bottom: 1px dotted black;}.tooltip .tooltiptext {visibility: hidden;width: 200px;background-color: #555;color: #fff;text-align: center;border-radius: 6px;padding: 5px 0;position: absolute;z-index: 1;bottom: 125%;left: 50%;margin-left: -60px;opacity: 0;transition: opacity 0.3s;}.tooltip .tooltiptext::after {content: "";position: absolute;top: 100%;left: 50%;margin-left: -5px;border-width: 5px;border-style: solid;border-color: #555 transparent transparent transparent;}.tooltip:hover .tooltiptext {visibility: visible;opacity: 1;}</style>';
	const css2 = '.tooltip {position: relative;display: inline-block;border-bottom: 1px dotted black;}.tooltip .tooltiptext {visibility: hidden;width: 200px;background-color: #555;color: #fff;text-align: center;border-radius: 6px;padding: 5px 0;position: absolute;z-index: 1;bottom: 125%;left: 50%;margin-left: -60px;opacity: 0;transition: opacity 0.3s;}.tooltip .tooltiptext::after {content: "";position: absolute;top: 100%;left: 50%;margin-left: -5px;border-width: 5px;border-style: solid;border-color: #555 transparent transparent transparent;}.tooltip:hover .tooltiptext {visibility: visible;opacity: 1;}';
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
		userDiv.addEventListener("click", ()=> window.open('https://www.instagram.com/' + user.username));
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

function showLoader(text) {
	if (text) {
		changeProgressText(text);
	} else {
		changeProgressText("");
	}
	loader_wrapper.style.display = "flex";
}

function hideLoader(action) {
	if (!action || action === currentAction) {
		loader_wrapper.style.display = "none";
	}
}

async function changeProgressText(text) {
	let progress = document.getElementById("progress_number");
	progress.innerHTML = text;
}

function generateMassActionsPanel() {
	const panel = document.createElement('DIV');

	const follow_btn = document.createElement("BUTTON");
	follow_btn.setAttribute("class", "button_round");
	follow_btn.addEventListener("click", ()=> openActionPanel(actionType.FOLLOW));
	follow_btn.textContent = "Follow random accounts...";

	const all_unfollow_btn = document.createElement("BUTTON");
	all_unfollow_btn.setAttribute("class", "button_round");
	all_unfollow_btn.addEventListener("click", ()=> openActionPanel(actionType.UNFOLLOW_ALL));
	all_unfollow_btn.textContent = "Unfollow everyone...";

	const unrequited_unfollow_btn = document.createElement("BUTTON");
	unrequited_unfollow_btn.setAttribute("class", "button_round");
	unrequited_unfollow_btn.addEventListener("click", ()=> openActionPanel(actionType.UNFOLLOW_UNREQUITED));
	unrequited_unfollow_btn.textContent = "Unfollow accounts that don't follow you back...";

	const mutual_unfollow_btn = document.createElement("BUTTON");
	mutual_unfollow_btn.setAttribute("class", "button_round");
	mutual_unfollow_btn.addEventListener("click", ()=> openActionPanel(actionType.UNFOLLOW_MUTUAL));
	mutual_unfollow_btn.textContent = "Unfollow accounts that you mutually follow...";

	panel.appendChild(follow_btn);
	panel.appendChild(all_unfollow_btn);
	panel.appendChild(unrequited_unfollow_btn);
	panel.appendChild(mutual_unfollow_btn);
	panel.appendChild(getRestartBtn());

	return panel;
}

function openActionPanel(actionType) {
	action_panel = getSubActionPanel(actionType);
	content.appendChild(action_panel);
	if (isFirstLaunch) {
		alert("Warning! If your delay is small or quantity of accounts is too big - Instagram can block your actions for a short time (usually 10-60 minutes). If you do it too often - you can be blocked permanently for violating their terms. I advise you to specify no more than 200 accounts per day with the appropriate delay. But it depends on your account and Instagram algorithms.");
		isFirstLaunch = false;
	}
}

function closeActionPanel() {
	content.removeChild(action_panel);
	errorDiv.style.display = "none";
}

function getTitleFromAction(act) {
	switch (act) {
		case actionType.FOLLOW: return "FOLLOW NEW ACCOUNTS";
		case actionType.UNFOLLOW_MUTUAL: return "UNFOLLOW MUTUAL FOLLOWERS";
		case actionType.UNFOLLOW_UNREQUITED: return "UNFOLLOW WHO DON'T FOLLOW BACK";
		case actionType.UNFOLLOW_ALL: return "UNFOLLOW EVERYONE";
	}
}

async function doMassAction(actType) {
	const DEFAULT_TIME_SECONDS = 10 * 60000;
	const DEFAULT_QUANTITY = 0;

	errorDiv.style.display = "none";
	let quantity = document.getElementById("quantity").value;
	let userDelay = document.getElementById("delay").value * 1000;
	const isAutoReconnect = document.getElementById("autoreconect").checked;
	quantity = (quantity != "") ? quantity: DEFAULT_QUANTITY;
	userDelay = (userDelay != "") ? userDelay: DEFAULT_TIME_SECONDS;
	showLoader("0 of " + quantity);

	let action = new Action(actType, quantity, userDelay, isAutoReconnect);
	currentAction = action;
	switch (action.actionType) {
		case actionType.FOLLOW: await randomFollowAccounts(action); break;
		case actionType.UNFOLLOW_MUTUAL: await unfollowMutualAccounts(action); break;
		case actionType.UNFOLLOW_UNREQUITED: await unfollowUnrequitedAccounts(action); break;
		case actionType.UNFOLLOW_ALL: await unfollowAllAccounts(action); break;
	}
	hideLoader(action);
}

async function randomFollowAccounts(action) {
	let queryHash = await getSuggestionQueryHash();
	let selectorName = "edge_suggested_users";

	let resp = null;
	let hasNext = true;
	const seenIds = [];

	while(hasNext && action.completed < action.quantity && !action.isAborted) {
		resp = await getSuggestedUsersBatch(queryHash, seenIds);
		if (resp == null) throw new Error('Can not follow accounts.');
		hasNext = resp.user[selectorName].page_info.has_next_page;
		await followUnfollowArray(resp.user[selectorName].edges, action);
		resp.user[selectorName].edges.forEach(el => seenIds.push(el.node.user.id));
	}
}

async function unfollowUnrequitedAccounts(action) {
	const id = await getUserId();
 	let queryHash = await getFollowersQueryHash();
 	let selectorName = "edge_followed_by";

 	let resp = null;
	let hasNext = true;
	const mutualAccountsIds = new Set();

	while(hasNext && !action.isAborted) {
		resp = await getFollowUsersBatch(resp, selectorName, queryHash, id);
		if (resp == null) throw new Error('Can not unfollow accounts.');
		hasNext = resp.user[selectorName].page_info.has_next_page;
		resp.user[selectorName].edges
			.filter(user => user.node.followed_by_viewer || user.node.requested_by_viewer)
			.forEach(user => {
				mutualAccountsIds.add(user.node.id);
			});
	}

	hasNext = true;
	resp = null;
	selectorName = "edge_follow";
	queryHash = await getFollowingsQueryHash();
	while(hasNext && action.completed < action.quantity && !action.isAborted) {
		resp = await getFollowUsersBatch(resp, selectorName, queryHash, id);
		if (resp == null) throw new Error('Can not unfollow accounts.');
		hasNext = resp.user[selectorName].page_info.has_next_page;
		const listToUnfollow = resp.user[selectorName].edges.filter(user => !mutualAccountsIds.has(user.node.id));
		await followUnfollowArray(listToUnfollow, action);
	}
}

async function unfollowMutualAccounts(action) {
	const id = await getUserId();
 	const queryHash = await getFollowersQueryHash();
 	let selectorName = "edge_followed_by";

 	let resp = null;
	let hasNext = true;

	while(hasNext && action.completed < action.quantity && !action.isAborted) {
		resp = await getFollowUsersBatch(resp, selectorName, queryHash, id);
		if (resp == null) throw new Error('Can not unfollow accounts.');
		hasNext = resp.user[selectorName].page_info.has_next_page;
		const listToUnfollow = resp.user[selectorName].edges.filter(user => user.node.followed_by_viewer || user.node.requested_by_viewer);
		await followUnfollowArray(listToUnfollow, action);
	}
}

async function unfollowAllAccounts(action) {
	const id = await getUserId();
 	const queryHash = await getFollowingsQueryHash();
 	let selectorName = "edge_follow";

 	let resp = null;
	let hasNext = true;

	while(hasNext && action.completed < action.quantity && !action.isAborted) {
		resp = await getFollowUsersBatch(resp, selectorName, queryHash, id);
		if (resp == null) throw new Error('Can not unfollow accounts.');
		hasNext = resp.user[selectorName].page_info.has_next_page;
		await followUnfollowArray(resp.user[selectorName].edges, action);
	}
}

async function getFollowUsersBatch(lastResponse, selectorName, queryHash, id) {
	let resp;
	let url;

	if (lastResponse != null) {
		url = "https://www.instagram.com/graphql/query/?query_hash=" + queryHash + "&variables={\"id\":\"" + id + "\",\"include_reel\":true,\"fetch_mutual\":true,\"first\":100,\"after\":\"" + lastResponse.user[selectorName].page_info.end_cursor + "\"}";
	} else {
		url = "https://www.instagram.com/graphql/query/?query_hash=" + queryHash + "&variables={\"id\":\"" + id + "\",\"include_reel\":true,\"fetch_mutual\":true,\"first\":100}";
	}

	return await getUsersBatch(url);
}

async function getSuggestedUsersBatch(queryHash, seenIds) {
	const url = 'https://www.instagram.com/graphql/query/?query_hash=' + queryHash + '&variables={"fetch_media_count":0,"fetch_suggested_count":30,"ignore_cache":true,"filter_followed_friends":true,"seen_ids":[' + seenIds + '],"include_reel":true}'
	return await getUsersBatch(url);
}

async function getUsersBatch(url) {
	let resp;
	const response = await fetch(encodeURI(url));
	const jsonResp = await response.json();
	resp = (jsonResp.status == "ok")?  jsonResp.data: null;
	return resp;
}

async function followUnfollowArray(users, action) {
	let actionName = (action.actionType == actionType.FOLLOW)? "follow": "unfollow";

	for (let i = 0; (i < users.length) && (action.completed < action.quantity); i++) {
		if (i != 0) {
			await dynamicSleep(action.delay);
		}
		if (action.isAborted) return false;
		let res = await followOrUnfollowUser(users[i].node, actionName);
		
		if (!res.ok) {
			if (res.status == 429 && action.isAutoReconnect) {
				action.userDelay *= 2;
				let waitDelay = 60 * 60000;
				while (!res.ok) {
					await dynamicSleep(waitDelay);
					waitDelay *= 2;
					res = await followOrUnfollowUser(users[i].node, actionName);
				}
			} else {
				action.isAborted = true;
				hideLoader(action);
				if (currentAction === action) {
					showError(new Error("Too many actions. Try again a little bit later with bigger delay"));
				}
				return false;
			}
		}
		action.completed++;
		changeProgressText(action.completed  + " of " + action.quantity);
	}

	return true;
}

async function followOrUnfollowUser(user, actionName) {
	let id;
	if (actionName == "follow") {
		id = user.user.id
	} else id = user.id
	const res = await fetch('https://www.instagram.com/web/friendships/' + id + '/' + actionName + '/', {
  		method: 'POST',
  		headers: {
    		'Content-Type': 'application/json',
    		'x-csrftoken': window._sharedData.config.csrf_token,
    		'x-instagram-ajax': window._sharedData.rollout_hash
  		}
	});
	return res;
}

function dynamicSleep(ms) {
	const min = ms * 0.8;
  	const max = ms / 0.8;
  	const diff = max - min;
	const time = Math.floor(Math.random() * diff + min);
  	return new Promise(resolve => setTimeout(resolve, ms));
}


function getSubActionPanel(actionType) {
	const sub_panel = document.createElement('DIV');

	const title = document.createElement('SPAN');
	title.setAttribute("class", "info");
	title.setAttribute("style", "text-decoration: underline");
	title.innerHTML = getTitleFromAction(actionType);

	sub_panel.setAttribute("class", "action_panel");
	const wrapper = document.createElement('DIV');
	wrapper.setAttribute("style", "align-items:center");

	const quantity_label = document.createElement('LABEL');
	quantity_label.setAttribute("for", "quantity");
	quantity_label.setAttribute("class", "info");
	quantity_label.setAttribute("style", "text-align:center");
	quantity_label.innerHTML = "Quantity of Accounts:";
	const quantity_input = document.createElement('INPUT');
	quantity_input.setAttribute("type", "number");
	quantity_input.setAttribute("id", "quantity");
	quantity_input.setAttribute("min", "1");

	const checkBoxWrapper = document.createElement('DIV');
	checkBoxWrapper.setAttribute("style", "display: block");
	const tooltip = document.createElement('DIV');
	tooltip.setAttribute("class", "tooltip");
	const checkbox = document.createElement('INPUT');
	checkbox.setAttribute("id", "autoreconect");
	checkbox.setAttribute("type", "checkbox");
	checkboxLabel = document.createElement('LABEL');
	checkboxLabel.setAttribute("for", "autoreconect");
	checkboxLabel.setAttribute("class", "info");
	checkboxLabel.innerHTML = "auto reconnect";
	const tooltipText = document.createElement('SPAN');
	tooltipText.setAttribute("class", "tooltiptext");
	tooltipText.innerHTML = "If it's enabled, every time when Instagram blocks your action, script will wait and try again with increased delay";
	tooltip.appendChild(checkboxLabel);
	tooltip.appendChild(tooltipText);
	checkBoxWrapper.appendChild(checkbox);
	checkBoxWrapper.appendChild(tooltip);

	const delay_label = document.createElement('LABEL');
	delay_label.setAttribute("for", "delay");
	delay_label.setAttribute("style", "text-align:center");
	delay_label.innerHTML = "Delay (sec):";
	delay_label.setAttribute("class", "info");
	const delay_input = document.createElement('INPUT');
	delay_input.setAttribute("type", "number");
	delay_input.setAttribute("id", "delay");
	delay_input.setAttribute("min", "0");

	const start_btn = document.createElement('BUTTON');
	start_btn.setAttribute("class", "button_round");
	start_btn.addEventListener("click", ()=> doMassAction(actionType));
	start_btn.textContent = "Start";

	const cancel_btn = document.createElement('BUTTON');
	cancel_btn.setAttribute("class", "button_round");
	cancel_btn.addEventListener("click", ()=> closeActionPanel());
	cancel_btn.textContent = "Cancel";

	const quantity_wrapper = document.createElement('DIV');
	const delay_wrapper = document.createElement('DIV');

	quantity_wrapper.appendChild(quantity_label);
	quantity_wrapper.appendChild(quantity_input);
	delay_wrapper.appendChild(delay_label);
	delay_wrapper.appendChild(delay_input);
	wrapper.appendChild(title);
	wrapper.appendChild(quantity_wrapper);
	wrapper.appendChild(delay_wrapper);
	wrapper.appendChild(checkBoxWrapper);
	wrapper.appendChild(start_btn);
	wrapper.appendChild(cancel_btn);
	sub_panel.appendChild(wrapper);

	return sub_panel;
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
		tab_btn.addEventListener("click", ()=> openTab(event, statMap.date, 'tablinks', 'tabcontent'));
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
		followers_btn.addEventListener("click", ()=> openTab(event, 'followers_' + statMap.date, 'sub_tablinks', 'sub_tabcontent'));
		followers_btn.textContent = "New followes (" + getPresNumber(statMap.followers.size) + ")";
		unfollowers_btn.setAttribute("class", "sub_tablinks");
		unfollowers_btn.addEventListener("click", ()=> openTab(event, 'unfollowers_' + statMap.date, 'sub_tablinks', 'sub_tabcontent'));
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
	mutual.addEventListener("click", ()=> openTab(event, 'mutual', 'tablinks', 'tabcontent'));
	mutual.textContent = "Mutual followers (" + getPresNumber(mutualArr.length) + ")";

	const youFollow = document.createElement("button");
	youFollow.setAttribute("class", "tablinks");
	youFollow.addEventListener("click", ()=> openTab(event, 'you_follow', 'tablinks', 'tabcontent'));
	youFollow.textContent = "Who doesn't follow you (" + getPresNumber(youFollowArr.length) + ")";

	const followYou = document.createElement("button");
	followYou.setAttribute("class", "tablinks");
	followYou.addEventListener("click", ()=> openTab(event, 'follow_you', 'tablinks', 'tabcontent'));
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

function getFollowers(action) {
	const id = getUserId();
	const queryHash = getFollowersQueryHash();
	return queryHash.then(hash => getUsers(id, hash, "edge_followed_by", action));
}

function getFollowings(action) {
	const id = getUserId();
 	const queryHash = getFollowingsQueryHash();
 	return queryHash.then(hash => getUsers(id, hash, "edge_follow", action));
}

async function getUsers(id, queryHash, selectorName, action) {
	let resp;
	let followers = new Map();
	let url = "https://www.instagram.com/graphql/query/?query_hash=" + queryHash + "&variables={\"id\":\"" + id + "\",\"include_reel\":true,\"fetch_mutual\":true,\"first\":100}";
	let hasNext = true;

	while(hasNext && !action.isAborted) {
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
	btn.addEventListener("click", ()=> restart());
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

function showMassActionsPanel() {
	showLoader();
	content.removeChild(intro);
	const massActionPanel = generateMassActionsPanel();
	content.appendChild(massActionPanel);
	hideLoader();
}
  
function generateFirstList() {
	let action = new Action();
	currentAction = action;
	showLoader();
	const followers = getFollowers(action);
	const followings = getFollowings(action);
	Promise.all([followers, followings]).then(values => {
		if (!action.isAborted) {
			content.removeChild(intro);
			const statistics = showStatisctic(); 
			statistics.appendChild(getDownloadBtn(new Statistics(values[0])));
			statistics.appendChild(makeTable(...values));
			statistics.appendChild(getRestartBtn());
			content.appendChild(statistics);
			hideLoader(action);
		}
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
	let action = new Action();
	currentAction = action;
	showLoader();
	const followers = getFollowers(action);
	const followings = getFollowings(action);
	Promise.all([followers, followings]).then(values => {
		if (!action.isAborted) {
			updateStat(stat, values[0]);
			content.removeChild(intro);
			const statistics = showStatisctic(); 
			statistics.appendChild(getDownloadBtn(stat));
			statistics.appendChild(makeTable(...values));
			statistics.appendChild(showFollowersTable(stat));
			statistics.appendChild(getRestartBtn());
			content.appendChild(statistics);
			hideLoader(action);
		}
	});
}

function abortMassAction() {
	currentAction.isAborted = true;
	hideLoader();
}

function createLoader() {
	loader_wrapper = document.createElement('DIV');
	loader_wrapper.setAttribute("class", "load_container");
	const barWrapper = document.createElement('DIV');
	barWrapper.setAttribute("style", "align-items: center;justify-content: center;");
	const loader = document.createElement('DIV');
	const progress = document.createElement('DIV');
	progress.setAttribute("id", "progress_number");
	progress.setAttribute("class", "progress_number");
	loader.setAttribute("class", "loader");
	const button = document.createElement('button');
	button.setAttribute("class", "button_round");
	button.textContent = "Abort";
	button.addEventListener("click", ()=> abortMassAction());
	barWrapper.appendChild(loader);
	barWrapper.appendChild(progress);
	loader_wrapper.appendChild(barWrapper);
	loader_wrapper.appendChild(button);
	return loader_wrapper;
}

function getFollowersQueryHash() {
	return getQueryHash(/const t=\"(.+)?\",n=/g, "Consumer.js")
}

function getFollowingsQueryHash() {
	return getQueryHash(/,n=\"(.+)?\",u=/g, "Consumer.js")
}

function getSuggestionQueryHash() {
	return getQueryHash(/SUL_QUERY_ID=\"(.+)?\"/g, "ConsumerLibCommons.js");
}

async function getQueryHash(pattern, fileName) {
	let resp;
	var regex = new RegExp("static\/bundles\/es6\/" + fileName + "\/.+?\.js", "g"); 
	const matches = document.body.outerHTML.match(regex);
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
	generate_btn.addEventListener("click", ()=>generateFirstList());
	generate_btn.textContent = "Generate statistics";
	const generatedList = document.createElement("DIV");
	generatedList.setAttribute("id", "generated_list");
	const upload_title =  document.createElement("SPAN");
	upload_title.setAttribute("class", "info");
	upload_title.innerHTML = "If you have already got a previously downloaded file - upload it here and check who has started to follow/unfollow you since that time:";
	const mass_action_title = document.createElement("SPAN");
	mass_action_title.setAttribute("class", "info");
	mass_action_title.innerHTML = "If you need mass following or unfollowing accounts, you can do it with a function below:";
	const mass_action_btn = document.createElement("BUTTON");
	mass_action_btn.setAttribute("class", "button_round");
	mass_action_btn.addEventListener("click", ()=>showMassActionsPanel());
	mass_action_btn.textContent = "Mass following/unfollowing";

	errorDiv = document.createElement('DIV');
	errorDiv.setAttribute("style", "display:none;justify-items: center")
	errortitle = document.createElement('span');
	errortitle.setAttribute("style", "color: red; font-weight: bold");
	errorDiv.appendChild(errortitle);
	errorDiv.appendChild(getRestartBtn());

	intro.appendChild(generate_title);
	intro.appendChild(generate_btn);
	intro.appendChild(generatedList);
	intro.appendChild(upload_title);
	intro.appendChild(input);
	intro.appendChild(mass_action_title);
	intro.appendChild(mass_action_btn);
	content.appendChild(intro);
	scriptRoot.appendChild(content);
	root.appendChild(scriptRoot);
	root.appendChild(errorDiv);
	const doc = document.documentElement
	doc.prepend(root);
	document.getElementById('file-input')
	.addEventListener('change', readSingleFile, false);
	scriptRoot.appendChild(createLoader());
}