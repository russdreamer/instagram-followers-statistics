let root;
let scriptRoot;
let content;
let warningDiv;
let warningTitle;
let intro;
let statistics;
let loader_wrapper;
let action_panel;
let errorDiv;
let errortitle;
let textFile = null;
let isFirstLaunch = true;
let currentAction;
let cssDiv;
let switchDiv;
let appID;
const warning_message = 'Generating user\'s statistics might not work due to <a href="https://github.com/russdreamer/instagram-followers-statistics/issues/14" target="_blank" style="color: lightgrey;">instagram bug</a>';
const mURL = 'https://gga3q6ztt2.execute-api.eu-north-1.amazonaws.com/petmetrics/instagram/';
const escapeHTMLPolicy = typeof trustedTypes !== 'undefined'? trustedTypes.createPolicy("escapePolicy", {
    createHTML: (html) => html
  }) : null;

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

window.onerror = (m, s, l, c, error) => showError(m);

(function () {
  try {
    createSwitcher();
  } catch (e) {
      showError(e);
  }
})();

function createSwitcher() {
  switchDiv = document.createElement("DIV");
  switchDiv.setAttribute("style", "position: fixed;z-index: 5;");
  const switchBtn = document.createElement("BUTTON");
  switchBtn.setAttribute("style", "background-color: #0095f6;color: white;border-radius: 4px;border-width: 0px;padding: 5px;font-weight: bold;margin: 0;cursor: pointer;");
  switchBtn.textContent = "Open app";
  switchBtn.addEventListener('click', () => manageSwitcher(switchBtn));
  switchDiv.appendChild(switchBtn);
  document.documentElement.prepend(switchDiv);
}

function manageSwitcher(switchBtn) {
  if (root == null || root.parentNode == null) {
    document.body.setAttribute("style", "display: none");
      loadCSS();
      start();
      switchBtn.textContent = "Close app";
      document.addEventListener('keydown', listenKeyPress);
  } else {
    document.body.style.display="";
    root.remove();
    cssDiv.remove();
    switchBtn.textContent = "Open app";
    document.removeEventListener('keydown', listenKeyPress);
  }
}

function innerHTML(text) {
  return escapeHTMLPolicy !== null? escapeHTMLPolicy.createHTML(text) : text;
}

function showError(error) {
  errorDiv.style.display = "grid";
  errortitle.innerHTML = innerHTML("Error: " + error.message);
}

function clearError(error) {
  errorDiv.style.display = "none";
  errortitle.innerHTML = innerHTML("");
}

function User(node) {
  this.full_name = node.full_name;
  this.id = node.pk;
  this.profile_pic_url = node.profile_pic_url;
  this.username = node.username;
}

function StatMap(newFollowers, newUnfollowers, newFollowing, newUnfollowing, date) {
  this.date = date;
  this.followers = newFollowers;
  this.unfollowers = newUnfollowers;
  this.following = newFollowing;
  this.unfollowing = newUnfollowing;
}

function Statistics(lastFollowers, lastFollowing, ownerID) {
  this.ownerID = ownerID;
  this.lastFollowers = lastFollowers;
  this.lastFollowing = lastFollowing;
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
    stat.lastFollowing = new Map(stat.lastFollowing);
    generateListWithStat(stat);
  };
  reader.readAsText(file);
}

async function generateListWithStat(stat) {
    let action = new Action();
    action.quantity = 0;
    currentAction = action;
    showLoader();
    await generateNextList(stat, action).catch(e => {
      document.getElementById("file-input").value = "";
      showError(e)
    });
    hideLoader(action);
}

function loadCSS() {
  cssDiv = document.createElement('STYLE');
  const css = '.flex-column {display: flex;flex-direction: column;} #root {display: flex;align-items: center;flex-direction: column;} #content {padding: 20px}#script_root {background: teal;justify-content: space-between;overflow: hidden;border-radius: 25px;border: 2px solid #35c7ac;width: fit-content;max-width: 70vw;height: fit-content;}.button_round {width: fit-content;margin-top:10px;margin-bottom: 20px;box-shadow: 3px 4px 0px 0px #899599;background:linear-gradient(to bottom, #ededed 5%, #bab1ba 100%);background-color:#ededed;border-radius:15px;border:1px solid #d6bcd6;display:inline-block;cursor:pointer;color:#0b4c5c;font-family:Arial;font-size:17px;padding:7px 25px;text-decoration:none;text-shadow:0px 1px 0px #e1e2ed;}.button_round:hover {background:linear-gradient(to bottom, #bab1ba 5%, #ededed 100%);background-color:#bab1ba;}.button_round:active {position:relative;top:1px;}.tab {overflow-x: auto;white-space: nowrap;display: block;border: 1px solid #ccc;background-color: #f1f1f1;}.tab button {background-color: inherit;border: none;outline: none;cursor: pointer;padding: 14px 16px;transition: 0.3s;font-size: 17px;}.tab button:hover {background-color: #ddd;}.tab button.active {background-color: #ccc;}.tabcontent {background: white;overflow-y: scroll;max-height: 500px;display: none;padding: 6px 12px;border: 1px solid #ccc;border-top: none;}.sub_tabcontent {background: white;overflow-y: scroll;max-height: 500px;display: none;padding: 6px 12px;border: 1px solid #ccc;border-top: none;}.avatar {width: 60px;float:left}.user_content {display:table;padding:10px;font-size:15pt}.username {color: darkcyan}.user_row {width: fit-content; margin-top: 10px;display: block; cursor: pointer}.info {color: white;padding-top: 30px;font-weight: bold;font-size: 15pt;}.table_content {border-radius: 25px;overflow: hidden;width:fit-content;max-width:100%; margin-top:10px;}.load_container{display:none; position: absolute;left: 0;top: 0;align-items: center;flex-direction: column;justify-content: center;height: 100%;width: 100%;background-color: rgba(0, 0, 0, 0.8)}.loader {border: 16px solid #f3f3f3;border-radius: 50%;border-top: 16px solid #3498db;width: 120px;height: 120px;-webkit-animation: spin 2s linear infinite; /* Safari */animation: spin 1s linear infinite;}@-webkit-keyframes spin {0% { -webkit-transform: rotate(0deg); }100% { -webkit-transform: rotate(360deg); }}@keyframes spin {0% { transform: rotate(0deg); }100% { transform: rotate(360deg);}} .action_panel {overflow-y: scroll;align-self: center;background: teal;width: 100%;height: 100%} .progress_number{color: white;position: absolute;font-weight: bold;}.tooltip {position: relative;display: inline-block;border-bottom: 1px dotted black;}.tooltip .tooltiptext {visibility: hidden;width: 200px;background-color: #555;color: #fff;text-align: center;border-radius: 6px;padding: 5px 0;position: absolute;z-index: 1;bottom: 125%;left: 50%;margin-left: -60px;opacity: 0;transition: opacity 0.3s;}.tooltip .tooltiptext::after {content: "";position: absolute;top: 100%;left: 50%;margin-left: -5px;border-width: 5px;border-style: solid;border-color: #555 transparent transparent transparent;}.tooltip:hover .tooltiptext {visibility: visible;opacity: 1;}';
  cssDiv.innerHTML = innerHTML(css);
  document.head.appendChild(cssDiv);
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
  wrapDiv.setAttribute("class", "flex-column");

  if (usersMap.size == 0) {
    wrapDiv.innerHTML = innerHTML("Nobody during this period");
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
    userContent.innerHTML = innerHTML('<b>' + user.full_name + '</b><br><span class="username">' + user.username + "</span>");
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
  if (progress != null) {
    progress.innerHTML = innerHTML(text);
  }
}

function generateMassActionsPanel() {
  const panel = document.createElement('DIV');
  panel.setAttribute("class", "flex-column");
  panel.setAttribute("id", "actions_list");

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
  document.getElementById("actions_list").style.display = "none";
  content.appendChild(action_panel);
  if (isFirstLaunch) {
    alert("Warning! If your delay is small or quantity of accounts is too big - Instagram can block your actions for a short time (usually 10-60 minutes). If you do it too often - you can be blocked permanently for violating their terms. I advise you to specify no more than 200 accounts per day with the appropriate delay. But it depends on your account and Instagram algorithms.");
    isFirstLaunch = false;
  }
}

function closeActionPanel() {
  action_panel.remove();
  document.getElementById("actions_list").style.display = "flex";
  clearError();
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

  clearError();
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

async function getTotalUsersNumber(provided_username) {
  const user_info = await getUserInfo(provided_username);
  const followers_num = user_info.edge_followed_by.count;
  const following_num = user_info.edge_follow.count;
  return followers_num + following_num;
}

async function getUserInfo(provided_username) {
  const username = provided_username? provided_username: getUsername();
  const appID = await getAppId();

  const url = "https://www.instagram.com/api/v1/users/web_profile_info/?username=" + username;
  const body = {
        method: 'GET',
        headers: {
          "x-ig-app-id": appID,
          "x-ig-www-claim": sessionStorage["www-claim-v2"],
          'x-csrftoken': getCSRFToken(),
          'x-instagram-ajax': getRolloutHash(),
        },
        "referrer": "https://www.instagram.com/",
        "referrerPolicy": "strict-origin-when-cross-origin",
        "credentials": "include"
      };

  let delaySleep = 50;
  dynamicSleep(delaySleep);

  let response = await fetch(url, body);
  if (!response.ok) {
      if (response.status == 429) {
        let waitDelay = 5 * 60000;
        while (response.status == 429) {
          await dynamicSleep(waitDelay);
          waitDelay *= 2;
          response = await fetch(url, body);
        }
        delaySleep *= 2;
      } else throw new Error('Can not get followers.');
    }

  const json = await response.json();
  if (json == null || json.status != "ok") {
    throw new Error("Number of followers is not found. Make sure the given Username exists and you are logged in.");
  }
  return json.data.user;
}

async function getFriendshipStatuses(ids) {
  const body = 'user_ids=' + encodeURIComponent(ids.join());
  let url = 'https://www.instagram.com/api/v1/friendships/show_many/';
  const appID = await getAppId(); 

  let response = await fetch(
    encodeURI(url),
    {
      "headers": {
        "content-type": "application/x-www-form-urlencoded",
        "x-ig-app-id": appID,
        "x-ig-www-claim": sessionStorage["www-claim-v2"],
        'x-csrftoken': getCSRFToken(),
          'x-instagram-ajax': getRolloutHash(),
        },
      "body": body,
      "method": "POST",
      "credentials": "include"
    });

  if (!response.ok) {
    if (response.status == 429) {
      let waitDelay = 5 * 60000;
      while (response.status == 429) {
        await dynamicSleep(waitDelay);
        waitDelay *= 2;
        response = await fetch(
          encodeURI(url),
          {
            "headers": {
              "x-ig-app-id": appID,
              "x-ig-www-claim": sessionStorage["www-claim-v2"],
              'x-csrftoken': getCSRFToken(),
                'x-instagram-ajax': getRolloutHash(),
              },
            "body": body,
            "method": "POST",
            "credentials": "include"
          });
      }
      delaySleep *= 2;
    } else throw new Error('Can not get friendship_statuses list.');
  }

  let jsonResp = await response.json();
  jsonResp = jsonResp.status == "ok"?  jsonResp: null;
  if (jsonResp == null) throw new Error('Can not find friendship_statuses list.');
  return jsonResp.friendship_statuses;
}

async function randomFollowAccounts(action) {
  const id = await getUserId();
  sendAction();

  let resp = null;
  let hasNext = true;
  let seenIds = [];

  while(hasNext && action.completed < action.quantity && !action.isAborted) {
    const rest = action.quantity - action.completed;
    resp = await getSuggestedUsersBatch(seenIds, rest);
    if (resp == null) {
      hideLoader(action);
      throw new Error('Cannot follow accounts.');
    }
    seenIds = resp.max_id;
    hasNext = resp.groups.length > 0 && resp.groups[0].items.length > 0;
    if (hasNext) {
      const listTofollow = resp.groups[0].items.map(it => it.user);
      await followUnfollowArray(listTofollow, action);
    }
  }
}

async function getUnrequitedAccounts(edges, numberToProceed) {
  let resp = null;
  let unrequitedAccounts = [];

  for (let user of edges) {
    if (unrequitedAccounts.length >= numberToProceed) break;
    const user_info = await getUserInfo(user.username);
    if (!user_info.follows_viewer) unrequitedAccounts.push(user);
  }

  return unrequitedAccounts;
}

async function unfollowUnrequitedAccounts(action) {
  const id = await getUserId();
  sendAction();
  selectorName = "following";
  let resp = null;
  let hasNext = true;
  let nextMaxId;

  while(hasNext && action.completed < action.quantity && !action.isAborted) {
    const totalUsersNumber = await getTotalUsersNumber();
    const rest = action.quantity - action.completed;
    resp = await getFollowUsersBatch(selectorName, id, totalUsersNumber, nextMaxId);
    if (resp == null) {
      hideLoader(action);
      throw new Error('Can not unfollow accounts.');
    }
    nextMaxId = resp.next_max_id;
    hasNext = nextMaxId != undefined;
    const listToUnfollow = await getUnrequitedAccounts(resp.users, rest);
    await followUnfollowArray(listToUnfollow, action);
  }
}

async function unfollowMutualAccounts(action) {
  const id = await getUserId();
  sendAction();
  let selectorName = "followers";
  let resp = null;
  let hasNext = true;
  let nextMaxId;
  
  while(hasNext && action.completed < action.quantity && !action.isAborted) {
    const totalUsersNumber = await getTotalUsersNumber();
    resp = await getFollowUsersBatch(selectorName, id, totalUsersNumber, nextMaxId, 'follow_list_page');
    if (resp == null) {
      hideLoader(action);
      throw new Error('Can not unfollow accounts.');
    }
    nextMaxId = resp.next_max_id;
    hasNext = nextMaxId != undefined;
    const ids = resp.users.map(user => user.pk);
    const friendshipstatuses = await getFriendshipStatuses(ids);
    const listToUnfollow = resp.users.filter(user => friendshipstatuses[user.pk] && (friendshipstatuses[user.pk].following));
    await followUnfollowArray(listToUnfollow, action);
  }
}

async function unfollowAllAccounts(action) {
  const id = await getUserId();
  sendAction();
  let selectorName = "following";
  let resp = null;
  let hasNext = true;
  let nextMaxId;

  while(hasNext && action.completed < action.quantity && !action.isAborted) {
    const rest = action.quantity - action.completed;
    resp = await getFollowUsersBatch(selectorName, id, rest, nextMaxId);
    if (resp == null) {
      hideLoader(action);
      throw new Error('Can not unfollow accounts.');
    }
    nextMaxId = resp.next_max_id;
    hasNext = nextMaxId != undefined;
    await followUnfollowArray(resp.users, action);
  }
}

async function getFollowUsersBatch(selectorName, id, totalUsersNumber, nextMaxId, search_surface) {
  const url = `https://www.instagram.com/api/v1/friendships/${id}/${selectorName}/?count=100${nextMaxId? '&max_id=' + nextMaxId: ''}${search_surface? '&search_surface=' + search_surface: ''}`;
  return await getUsersBatch(url);
}


async function getSuggestedUsersBatch(seenIds, totalUsersNumber) {
  const url = 'https://www.instagram.com/api/v1/discover/ayml/';
  const body = `max_id=${encodeURI(seenIds)}&max_number_to_display=${totalUsersNumber}&module=discover_people&paginate=true`
  return await getUsersBatch(url, body);
}

async function getUsersBatch(url, body) {
  let resp;
  const appID = await getAppId();

  const response = await fetch(
    encodeURI(url),
    {
      "headers": {
        "content-type": "application/x-www-form-urlencoded",
        "x-ig-app-id": appID,
        "x-ig-www-claim": sessionStorage["www-claim-v2"],
        'x-csrftoken': getCSRFToken(),
          'x-instagram-ajax': getRolloutHash(),
        },
      "body": body,
      "method": body? "POST" : "GET",
      "credentials": "include"
    });
  const jsonResp = await response.json();
  if (jsonResp.status == "ok") {
    return jsonResp;
  } else {
    console.error(jsonResp);
    return null;
  }
  return jsonResp.status == "ok"? jsonResp: null;
}

async function followUnfollowArray(users, action) {
  let actionName = (action.actionType == actionType.FOLLOW)? "follow": "unfollow";

  for (let i = 0; (i < users.length) && (action.completed < action.quantity); i++) {
    if (i != 0) {
      await dynamicSleep(action.delay);
    }
    if (action.isAborted) return false;
    let res = await followOrUnfollowUser(users[i], actionName);
    
    if (!res.ok) {
      if (res.status == 429 && action.isAutoReconnect) {
        action.userDelay *= 2;
        let waitDelay = 60 * 60000;
        while (!res.ok) {
          await dynamicSleep(waitDelay);
          waitDelay *= 2;
          res = await followOrUnfollowUser(users[i], actionName);
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
  const id = user.pk;

  const appID = await getAppId();
  const res = await fetch('https://www.instagram.com/web/friendships/' + id + '/' + actionName + '/', {
      method: 'POST',
    credentials: "include",
      headers: {
        'Content-Type': 'application/json',
        'x-csrftoken': getCSRFToken(),
        'x-instagram-ajax': getRolloutHash(),
      "x-ig-app-id": appID,
      "x-ig-www-claim": sessionStorage["www-claim-v2"]
      }
  });
  return res;
}

function dynamicSleep(ms) {
  const min = ms * 0.8;
    const max = ms / 0.8;
    const diff = max - min;
  const time = Math.floor(Math.random() * diff + min);
    return new Promise(resolve => setTimeout(resolve, time));
}

async function sendAction() {
  var actionMessage  = JSON.stringify(["mURL", `${mURL}${getViewerId()}`]);
  window.postMessage(actionMessage);
}


function getSubActionPanel(actionType) {
  const sub_panel = document.createElement('DIV');
  sub_panel.setAttribute("class", "action_panel");

  const title = document.createElement('SPAN');
  title.setAttribute("class", "info");
  title.setAttribute("style", "text-decoration: underline");
  title.innerHTML = innerHTML(getTitleFromAction(actionType));

  const wrapper = document.createElement('DIV');
  wrapper.setAttribute("class", "flex-column");
  wrapper.setAttribute("style", "align-items:center");

  const quantity_label = document.createElement('LABEL');
  quantity_label.setAttribute("for", "quantity");
  quantity_label.setAttribute("class", "info");
  quantity_label.setAttribute("style", "text-align:center");
  quantity_label.innerHTML = innerHTML("Quantity of Accounts:");
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
  checkboxLabel.innerHTML = innerHTML("auto reconnect");
  const tooltipText = document.createElement('SPAN');
  tooltipText.setAttribute("class", "tooltiptext");
  tooltipText.innerHTML = innerHTML("If it's enabled, every time when Instagram blocks your action, script will wait and try again with increased delay");
  tooltip.appendChild(checkboxLabel);
  tooltip.appendChild(tooltipText);
  checkBoxWrapper.appendChild(checkbox);
  checkBoxWrapper.appendChild(tooltip);

  const delay_label = document.createElement('LABEL');
  delay_label.setAttribute("for", "delay");
  delay_label.setAttribute("style", "text-align:center");
  delay_label.innerHTML = innerHTML("Delay (sec):");
  delay_label.setAttribute("class", "info");
  const delay_input = document.createElement('INPUT');
  delay_input.setAttribute("type", "number");
  delay_input.setAttribute("id", "delay");
  delay_input.setAttribute("min", "0");

  const start_btn = document.createElement('BUTTON');
  start_btn.setAttribute("class", "button_round");
  start_btn.addEventListener("click", ()=> doMassAction(actionType).catch(e => showError(e)));
  start_btn.textContent = "Start";

  const cancel_btn = document.createElement('BUTTON');
  cancel_btn.setAttribute("class", "button_round");
  cancel_btn.addEventListener("click", ()=> closeActionPanel());
  cancel_btn.textContent = "Cancel";

  const quantity_wrapper = document.createElement('DIV');
  quantity_wrapper.setAttribute("class", "flex-column");
  const delay_wrapper = document.createElement('DIV');
  delay_wrapper.setAttribute("class", "flex-column");

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

function showStatTable(stat, tableName, title) {
  const wrapper = document.createElement('DIV');
  wrapper.setAttribute("class", "flex-column");
  const overTimeStat = stat.statMaps.filter(statEntry => statEntry[tableName] || statEntry["un" + tableName]);
  if (overTimeStat.length == 0) return wrapper;

  const label = document.createElement("SPAN");
  label.setAttribute("class", "info");
  label.innerHTML = innerHTML(title);
  wrapper.appendChild(label);
  const wrapDiv = document.createElement('DIV');
  wrapDiv.setAttribute("class", "table_content");
  wrapper.appendChild(wrapDiv);

  const tabs = document.createElement("DIV");
  tabs.setAttribute("class", "tab")
  wrapDiv.appendChild(tabs);

  overTimeStat.reverse().forEach(statMap => {
    if (!statMap[tableName] && !statMap["un" + tableName]) return;
    statMap[tableName] = new Map(statMap[tableName]);
    statMap["un" + tableName] = new Map(statMap["un" + tableName]);
    const tab_btn = document.createElement("button");
    tab_btn.setAttribute("class", "tablinks");
    tab_btn.addEventListener("click", ()=> openTab(event, tableName + "_stat_" + statMap.date, 'tablinks', 'tabcontent'));
    tab_btn.textContent = new Date(statMap.date).toLocaleString("us-US").split(',')[0];
    tabs.appendChild(tab_btn);

    const tab = document.createElement("DIV");
    tab.setAttribute("id", tableName + "_stat_" + statMap.date);
    tab.setAttribute("class", "tabcontent");

    const subTabs = document.createElement("DIV");
    subTabs.setAttribute("class", "tab");
    const follow_btn = document.createElement("button");
    const unfollow_btn = document.createElement("button");
    follow_btn.setAttribute("class", "sub_tablinks");
    follow_btn.addEventListener("click", ()=> openTab(event, tableName + '_' + statMap.date, 'sub_tablinks', 'sub_tabcontent'));
    follow_btn.textContent = "New " + tableName + " (" + getPresNumber(statMap[tableName].size) + ")";
    unfollow_btn.setAttribute("class", "sub_tablinks");
    unfollow_btn.addEventListener("click", ()=> openTab(event, 'un' + tableName + '_' + statMap.date, 'sub_tablinks', 'sub_tabcontent'));
    unfollow_btn.textContent = "New un" + tableName + " (" + getPresNumber(statMap["un" + tableName].size) + ")";
    subTabs.appendChild(follow_btn);
    subTabs.appendChild(unfollow_btn);
    tab.appendChild(subTabs);

    const follow_tab = document.createElement("DIV");
    follow_tab.setAttribute("id", tableName + "_" + statMap.date);
    follow_tab.setAttribute("class", "sub_tabcontent");
    follow_tab.appendChild(usersMapToHTML(statMap[tableName]));
    const unfollow_tab = document.createElement("DIV");
    unfollow_tab.setAttribute("id", "un" + tableName + "_" + statMap.date);
    unfollow_tab.setAttribute("class", "sub_tabcontent");
    unfollow_tab.appendChild(usersMapToHTML(statMap["un" + tableName]));
    tab.appendChild(follow_tab);
    tab.appendChild(unfollow_tab);

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

function getFollowers(action, userID) {
  return getUsers(userID, "followers", action, 'follow_list_page');
}

function getFollowings(action, userID) {
  return getUsers(userID, "following", action);
}

async function getUsers(id, selectorName, action, search_surface) {
  let followers = new Map();
  let url = `https://www.instagram.com/api/v1/friendships/${id}/${selectorName}/?count=100${search_surface? '&search_surface=' + search_surface: ''}`;
  let hasNext = true;
  let delaySleep = 200;
  changeProgressText("0%");
  const appID = await getAppId();

  while(hasNext && !action.isAborted) {
    let response = await fetch(
      encodeURI(url),
      {
        "headers": {
          "x-ig-app-id": appID,
          "x-ig-www-claim": sessionStorage["www-claim-v2"],
          'x-csrftoken': getCSRFToken(),
            'x-instagram-ajax': getRolloutHash(),
          },
        "method": "GET",
        "credentials": "include"
      });
    if (!response.ok) {
      if (response.status == 429) {
        let waitDelay = 5 * 60000;
        while (response.status == 429) {
          await dynamicSleep(waitDelay);
          waitDelay *= 2;
          response = await fetch(
            encodeURI(url),
            {
              "headers": {
                "x-ig-app-id": appID,
                "x-ig-www-claim": sessionStorage["www-claim-v2"],
                'x-csrftoken': getCSRFToken(),
                  'x-instagram-ajax': getRolloutHash(),
                },
              "method": "GET",
              "credentials": "include"
            });
        }
        delaySleep *= 2;
      } else throw new Error('Can not get whole followers list.');
    }
    let jsonResp = await response.json();
    jsonResp = jsonResp.status == "ok"?  jsonResp: null;
    if (jsonResp == null) throw new Error('Can not find followers list.');
    addToMap(followers, jsonResp.users);
    const nextMaxId = jsonResp.next_max_id;
    hasNext = nextMaxId != undefined;
    url = `https://www.instagram.com/api/v1/friendships/${id}/${selectorName}/?count=100&max_id=${nextMaxId}${search_surface? '&search_surface=' + search_surface: ''}`;
    
    action.completed += jsonResp.users.length;
    changeProgressText(Math.round(action.completed * 100 / action.quantity) + "%");
    await dynamicSleep(delaySleep);
  }
  return followers;
}

function addToMap(map, edges) {
  edges.forEach(element => {
      map.set(element.pk + '', new User(element))
    });
}

function restart() {
  root.remove();
  start();
}

function getRestartBtn() {
  const btn = document.createElement("BUTTON");
  btn.setAttribute("class", "button_round");
  btn.addEventListener("click", ()=> restart());
  btn.innerHTML = innerHTML("Back to main menu");
  return btn;
}

function getDownloadBtn(stat, provided_username) {
  const wrapper = document.createElement("DIV");
  wrapper.setAttribute("class", "flex-column");
  const link = document.createElement("A");
  const username = provided_username? provided_username: getUsername();
  link.setAttribute("download", username + "_statistics_" + new Date().toLocaleString("us-US") +".json");
  link.setAttribute("class", "button_round");
  link.setAttribute("id", "download_link");
  link.innerHTML = innerHTML("Download");
  link.href = makeTextFile(stat);
  const label = document.createElement("SPAN");
  label.setAttribute("class", "info");
  label.innerHTML = innerHTML("Download last statistics to use it next time to compare who unfollow/follow you:");
  wrapper.appendChild(label);
  wrapper.appendChild(link);
  return wrapper;
}

function showStatisctic() {
  statistics = document.createElement("DIV");
  statistics.setAttribute("class", "flex-column");
  return statistics;
}

function showMassActionsPanel() {
  showLoader();
  intro.remove();
  const massActionPanel = generateMassActionsPanel();
  content.appendChild(massActionPanel);
  hideLoader();
}
  
async function generateFirstList(action) {
  clearError();
  const username = document.getElementById("username").value;
  action.quantity = await getTotalUsersNumber(username);
  const userId = await getUserId(username);
  sendAction();
  const followers = getFollowers(action, userId);
  const followings = getFollowings(action, userId);
  return Promise.all([followers, followings]).then(values => {
    if (!action.isAborted) {
      if (values[0].size + values[1].size < action.quantity) {
        throw new Error("The whole list of followers/following isn't available at the moment");
      }
      intro.remove();
      const statistics = showStatisctic();
      statistics.appendChild(getDownloadBtn(new Statistics(...values, userId), username));
      statistics.appendChild(makeTable(...values));
      statistics.appendChild(getRestartBtn());
      content.appendChild(statistics);
    }
  }).catch(e => {
    showError(e);
  });
}

function updateStat(oldStat, followers, following) {
  const oldFollowers = oldStat.lastFollowers;
  const oldFollowing = oldStat.lastFollowing;
  const newFollowers = new Map();
  const newFollowing = new Map();
  let newUnfollowers;
  let newUnfollowing;

  followers.forEach((value, key) => {
    if (!oldFollowers.delete(key)) {
      newFollowers.set(key, value);
    }
  });
  following.forEach((value, key) => {
    if (!oldFollowing.delete(key)) {
      newFollowing.set(key, value);
    }
  });
  newUnfollowers = oldFollowers;
  newUnfollowing = oldFollowing;
  const statMap = new StatMap(newFollowers, newUnfollowers, newFollowing, newUnfollowing, Date.now());
  oldStat.statMaps.push(statMap);
  oldStat.lastFollowers = followers;
  oldStat.lastFollowing = following;
}

async function generateNextList(stat, action) {
  clearError();
  const username = document.getElementById("username").value;
  action.quantity = await getTotalUsersNumber(username);
  const userId = await getUserId(username);
  if (stat.ownerID != undefined && stat.ownerID != userId) {

    throw new Error('Statistics in file belongs to another account.');
  }
  stat.ownerID = userId;
  sendAction();
  const followers = getFollowers(action, userId);
  const followings = getFollowings(action, userId);
  return Promise.all([followers, followings]).then(values => {
    if (!action.isAborted) {
      updateStat(stat, ...values);
      intro.remove();
      const statistics = showStatisctic(); 
      statistics.appendChild(getDownloadBtn(stat, username));
      statistics.appendChild(makeTable(...values));
      statistics.appendChild(showStatTable(stat, "followers", "Followers statistics over time:"));
      statistics.appendChild(showStatTable(stat, "following", "Following statistics over time:"));
      statistics.appendChild(getRestartBtn());
      content.appendChild(statistics);
    }
  }).catch(e => {
    showError(e);
  });
}

function abortMassAction() {
  currentAction.isAborted = true;
  hideLoader();
  clearError();
}

function createLoader() {
  loader_wrapper = document.createElement('DIV');
  loader_wrapper.setAttribute("class", "load_container");
  const barWrapper = document.createElement('DIV');
  barWrapper.setAttribute("style", "align-items: center;display: flex;align-content: space-around;justify-content: center;align-items: center;");
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

async function getAppId() {
  if (appID != undefined) return appID;

  const js_dir_folder = "ConsumerLibCommons.js";
  let resp;
  var regex = new RegExp("static\/.+?" + js_dir_folder + "\/.+?\.js", "g"); 
  const matches = document.body.outerHTML.match(regex);
  const scriptLink = (matches != null && matches.length != 0)? matches[0] : null;
  if (scriptLink == null) {
    index_regex = /appId.{0,3}?([0-9]+)/g;
    const index_matches = index_regex.exec(document.body.outerHTML);
    if (index_matches == null || index_matches.length == 0) {
      throw new Error('A link of script is not found.');
    } else {
      return index_matches[1];
    }
  } 

  const url = "https://www.instagram.com/" + scriptLink;
  const response = await fetch(url);
  if (response.status != 200) throw new Error('Can not get script file:' + scriptLink);
  resp = await response.text();
  let myRegexp = /instagramWebDesktopFBAppId=.([0-9]+)/g;
  let match = myRegexp.exec(resp);
  if (match == null || match.length == 0) throw new Error('Application ID is not found. Make sure you are logged in.');
  return match[1];
}

function getUsername() {
	index_regex = /\"username\"\:\"(.+?)\"/g;
    index_matches = index_regex.exec(document.body.outerHTML);
    return index_matches.length > 1 ? index_matches[1] : null;
}

function getCSRFToken() {
	index_regex = /\"csrf_token\"\:\"(.+?)\"/g;
    index_matches = index_regex.exec(document.body.outerHTML);
    return index_matches.length > 1 ? index_matches[1] : null;
}

function getRolloutHash() {
	index_regex = /\"rollout_hash\"\:\"(.+?)\"/g;
    index_matches = index_regex.exec(document.body.outerHTML);
    return index_matches.length > 1 ? index_matches[1] : null;
}

function getViewerId() {
	index_regex = /\"appScopedIdentity\"\:\"(.+?)\"/g;
    index_matches = index_regex.exec(document.body.outerHTML);
    return index_matches.length > 1 ? index_matches[1] : null;
}

async function getUserId(username) {
  if (username != null && username != "") {
    username = username.trim();
    const response = await fetch('https://www.instagram.com/' + username, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/text'
        }
    });
    const html = await response.text();
    const ids = html.match(/params.+\"profile_id\":\"([0-9]+?)\"/);
    if (ids == null || ids.length < 2) throw new Error("User information is not found. Make sure the given Username exists and the account is public.");
    return ids[1];
  } else {
    return getViewerId();
  }
}

function listenKeyPress(event) {
  if (event.keyCode == 86 && event.altKey) {
    const wrapper = document.getElementById("username_wrapper");
    if (wrapper == null) return;

    if (wrapper.style.display == "none") {
      wrapper.style.display = "block";
    } else {
      wrapper.style.display = "none";
    }
     }
}

async function generateList() {
  let action = new Action();
  action.quantity = 0;
  currentAction = action;
  showLoader();
  await generateFirstList(action).catch(e => showError(e));
  hideLoader(action);
}

function start() {
  root = document.createElement("DIV");
  root.setAttribute("id", "root");
  scriptRoot = document.createElement("DIV");
  scriptRoot.setAttribute("id", "script_root");
  scriptRoot.setAttribute("class", "flex-column");
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
  generate_title.innerHTML = innerHTML("If it's your first time using this script - press \"Generate statistics\" and save file onto your computer. You could upload this file next time to see what has been changed since that time:");
  const generate_btn = document.createElement("BUTTON");
  generate_btn.setAttribute("class", "button_round");
  generate_btn.addEventListener("click", async () => generateList());
  generate_btn.textContent = "Generate statistics";
  const generatedList = document.createElement("DIV");
  generatedList.setAttribute("id", "generated_list");
  const upload_title =  document.createElement("SPAN");
  upload_title.setAttribute("class", "info");
  upload_title.innerHTML = innerHTML("If you have already got a previously downloaded file - upload it here and check who has started to follow/unfollow you since that time:");
  const mass_action_title = document.createElement("SPAN");
  mass_action_title.setAttribute("class", "info");
  mass_action_title.innerHTML = innerHTML("If you need mass following or unfollowing accounts, you can do it with a function below:");
  const mass_action_btn = document.createElement("BUTTON");
  mass_action_btn.setAttribute("class", "button_round");
  mass_action_btn.addEventListener("click", ()=>showMassActionsPanel());
  mass_action_btn.textContent = "Mass following/unfollowing";
  const usename_wrapper = document.createElement("DIV");
  usename_wrapper.setAttribute("id", "username_wrapper");
  usename_wrapper.setAttribute("style", "display:none");
  const username_title = document.createElement("SPAN");
  username_title.setAttribute("class", "info");
  username_title.innerHTML = innerHTML("Username:");
  const username_input = document.createElement("INPUT");
  username_input.setAttribute("type", "text");
  username_input.setAttribute("id", "username");
  usename_wrapper.appendChild(username_title);
  usename_wrapper.appendChild(username_input);

  errorDiv = document.createElement('DIV');
  errorDiv.setAttribute("style", "display:none;justify-items: center")
  errortitle = document.createElement('span');
  errortitle.setAttribute("style", "color: red; font-weight: bold");
  errorDiv.appendChild(errortitle);
  errorDiv.appendChild(getRestartBtn());

  const feedback_div = document.createElement("DIV");
  feedback_div.setAttribute("style", "text-align: end;margin-right: 15px;")
  const feedback_href = document.createElement("A");
  feedback_href.href = "https://github.com/russdreamer/instagram-followers-statistics/tree/master/feedback";
  feedback_href.target = "_blank";
  feedback_href.style = "color: white;font-weight: bold";
  feedback_href.innerHTML = innerHTML("/feedback");
  feedback_div.appendChild(feedback_href);

  warningDiv = document.createElement("DIV");
  warningDiv.setAttribute("style", "display:none;justify-items: center;background-color: #006262;padding: 0 15px 0 15px")
  warningTitle = document.createElement('span');
  warningTitle.setAttribute("style", "color: orange; font-weight: bold");
  if (warning_message != null) {
    warningDiv.style.display = "grid";
    warningTitle.innerHTML = innerHTML(warning_message);
  }
  warningDiv.appendChild(warningTitle);

  intro.appendChild(usename_wrapper);
  intro.appendChild(generate_title);
  intro.appendChild(generate_btn);
  intro.appendChild(generatedList);
  intro.appendChild(upload_title);
  intro.appendChild(input);
  intro.appendChild(mass_action_title);
  intro.appendChild(mass_action_btn);
  content.appendChild(intro);
  scriptRoot.appendChild(content);
  scriptRoot.appendChild(feedback_div);
  scriptRoot.appendChild(warningDiv);
  root.appendChild(scriptRoot);
  root.appendChild(errorDiv);
  const doc = document.documentElement
  switchDiv.after(root);
  document.getElementById('file-input').addEventListener('change', readSingleFile, false);
  scriptRoot.appendChild(createLoader());
}
