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
let	errortitle;
let textFile = null;
let isFirstLaunch = true;
let currentAction;
let cssDiv;
let switchDiv;
let appID;

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
	switchDiv.setAttribute("style", "position: fixed;z-index: 5;margin-top: 54px;");
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
	} else {
		document.body.style.display="";
		root.remove();
		cssDiv.remove();
		switchBtn.textContent = "Open app";
	}
}

function showError(error) {
	errorDiv.style.display = "grid";
	errortitle.innerHTML = "Error: " + error.message;
}

function loadCSS() {
	cssDiv = document.createElement('STYLE');
	const css = '#root {display: flex;align-items: center;} #content {padding: 20px}#script_root {background: teal;overflow: hidden;border-radius: 25px;border: 2px solid #35c7ac;width: fit-content;max-width: 70vw;height: fit-content;}.button_round {width: fit-content;margin-top:10px;margin-bottom: 20px;box-shadow: 3px 4px 0px 0px #899599;background:linear-gradient(to bottom, #ededed 5%, #bab1ba 100%);background-color:#ededed;border-radius:15px;border:1px solid #d6bcd6;display:inline-block;cursor:pointer;color:#0b4c5c;font-family:Arial;font-size:17px;padding:7px 25px;text-decoration:none;text-shadow:0px 1px 0px #e1e2ed;}.button_round:hover {background:linear-gradient(to bottom, #bab1ba 5%, #ededed 100%);background-color:#bab1ba;}.button_round:active {position:relative;top:1px;}.tab {overflow-x: auto;white-space: nowrap;display: block;border: 1px solid #ccc;background-color: #f1f1f1;}.tab button {background-color: inherit;border: none;outline: none;cursor: pointer;padding: 14px 16px;transition: 0.3s;font-size: 17px;}.tab button:hover {background-color: #ddd;}.tab button.active {background-color: #ccc;}.tabcontent {background: white;overflow-y: scroll;max-height: 500px;display: none;padding: 6px 12px;border: 1px solid #ccc;border-top: none;}.sub_tabcontent {background: white;overflow-y: scroll;max-height: 500px;display: none;padding: 6px 12px;border: 1px solid #ccc;border-top: none;}.avatar {width: 60px;float:left}.user_content {display:table;padding:10px;font-size:15pt}.username {color: darkcyan}.user_row {width: fit-content; margin-top: 10px;display: block; cursor: pointer}.info {color: white;padding-top: 30px;font-weight: bold;font-size: 15pt;}.line {color: white;font-weight: bold;padding-top: 5px;font-size: 15pt;}.table_content {border-radius: 25px;overflow: hidden;width:fit-content;max-width:100%; margin-top:10px;}.load_container{display:none; position: absolute;align-items: center;justify-content: center;height: 100%;width: 100%;background-color: rgba(0, 0, 0, 0.8)}.loader {border: 16px solid #f3f3f3;border-radius: 50%;border-top: 16px solid #3498db;width: 120px;height: 120px;-webkit-animation: spin 2s linear infinite; /* Safari */animation: spin 1s linear infinite;}@-webkit-keyframes spin {0% { -webkit-transform: rotate(0deg); }100% { -webkit-transform: rotate(360deg); }}@keyframes spin {0% { transform: rotate(0deg); }100% { transform: rotate(360deg);}} .action_panel {position: absolute;overflow-y: scroll;align-self: center;background: teal;width: 100%;height: 100%} .progress_number{color: white;position: absolute;font-weight: bold;}.tooltip {position: relative;display: inline-block;border-bottom: 1px dotted black;}.tooltip .tooltiptext {visibility: hidden;width: 200px;background-color: #555;color: #fff;text-align: center;border-radius: 6px;padding: 5px 0;position: absolute;z-index: 1;bottom: 125%;left: 50%;margin-left: -60px;opacity: 0;transition: opacity 0.3s;}.tooltip .tooltiptext::after {content: "";position: absolute;top: 100%;left: 50%;margin-left: -5px;border-width: 5px;border-style: solid;border-color: #555 transparent transparent transparent;}.tooltip:hover .tooltiptext {visibility: visible;opacity: 1;}';
	cssDiv.innerHTML = css;
	document.head.appendChild(cssDiv);
}

function restart() {
	root.remove();
	start();
}

function getRestartBtn() {
	const btn = document.createElement("BUTTON");
	btn.setAttribute("class", "button_round");
	btn.addEventListener("click", ()=> restart());
	btn.innerHTML = "Back to main menu";
	return btn;
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
	const title = document.createElement("h");
	title.setAttribute("class", "info");
	title.setAttribute("style", "color: #faff00; font-size: 20pt");
	title.innerHTML = "New application version is available!";
	const l1 = document.createElement("SPAN");
	l1.setAttribute("class", "info");
	l1.innerHTML = "New functionality:";
	const l2 = document.createElement("SPAN");
	l2.setAttribute("class", "line");
	l2.innerHTML = "⚪ Track another user's followers";
	const l3 = document.createElement("SPAN");
	l3.setAttribute("class", "line");
	l3.innerHTML = "⚫ Track not only followers and unfollowers, but also who you started to follow and unfollow";
	const l4 = document.createElement("SPAN");
	l4.setAttribute("class", "line");
	l4.innerHTML = "⚪ Finally track who other users started following/unfollowing";
	const l5 = document.createElement("SPAN");
	l5.setAttribute("class", "line");
	l5.innerHTML = "⚫ Extended dashboard";
	const generate_btn = document.createElement("BUTTON");
	generate_btn.setAttribute("class", "button_round");
	generate_btn.textContent = "Update";
	const btn_link = document.createElement("A");
	btn_link.href = "https://github.com/russdreamer/instagram-followers-statistics/raw/master/installation.user.js";
	btn_link.appendChild(generate_btn);

	const warn = document.createElement("SPAN");
	warn.setAttribute("style", "color: orange;");
	warn.innerHTML = "Refresh the page after update to see new version";
	
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
	feedback_href.innerHTML = "/feedback";
	feedback_div.appendChild(feedback_href);

	intro.appendChild(title);
	intro.appendChild(l1);
	intro.appendChild(l2);
	intro.appendChild(l3);
	intro.appendChild(l4);
	intro.appendChild(l5);
	intro.appendChild(btn_link);
	intro.appendChild(warn);
	content.appendChild(intro);
	scriptRoot.appendChild(content);
	scriptRoot.appendChild(feedback_div);
	root.appendChild(scriptRoot);
	root.appendChild(errorDiv);
	const doc = document.documentElement
	switchDiv.after(root);
}
