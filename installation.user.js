// ==UserScript==
// @name         Instagram followers statistics
// @namespace    http://russdreamer.github.io/
// @version      5.3
// @author       Iga Kovtun
// @description  A simple script to track instagram followers/unfollowers since official instagram API doesn't allow to do it anymore.
// @iconURL      https://raw.githubusercontent.com/russdreamer/instagram-followers-statistics/master/img/logo.jpg
// @updateURL    https://github.com/russdreamer/instagram-followers-statistics/raw/master/installation.user.js
// @downloadURL  https://github.com/russdreamer/instagram-followers-statistics/raw/master/installation.user.js
// @supportURL   https://github.com/russdreamer/instagram-followers-statistics/issues
// @match      https://www.instagram.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addElement
// @connect      raw.githubusercontent.com
// @connect      github.com
// @connect      gga3q6ztt2.execute-api.eu-north-1.amazonaws.com
// @run-at       document-body
// ==/UserScript==

(function() {
    'use strict';
    GM_xmlhttpRequest ( {
        method:     'GET',
        url:        "https://raw.githubusercontent.com/russdreamer/instagram-followers-statistics/master/console_script_v4.js",
        onload:     function (responseDetails) {
            loadScript(responseDetails.responseText);
            window.addEventListener("message", receiveAction, false);
        }
    });
})();

function receiveAction(event) {
    var messageJSON;
    try {
        messageJSON = JSON.parse (event.data);
    }
    catch (ignore) {}
    if (!messageJSON) return;
    if (messageJSON[0] == "mURL") {
        GM_xmlhttpRequest ( {
            method:     'GET',
            url:        messageJSON[1]
        } );
    }
}

function loadScript(scriptText) {
    const escapeHTMLPolicy = typeof trustedTypes !== 'undefined'? trustedTypes.createPolicy("htmlInstagramEscape", {
        createScript: (html) => html,
    }) : null;
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.text = escapeHTMLPolicy !== null? escapeHTMLPolicy.createScript(scriptText) : scriptText;
    GM_addElement('script', {
        textContent: scriptText
    });
}
