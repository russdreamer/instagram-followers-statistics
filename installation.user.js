// ==UserScript==
// @name         Instagram followers statistics
// @namespace    http://russdreamer.github.io/
// @version      2.0
// @author       Iga Kovtun
// @description  A simple script to track instagram followers/unfollowers since official instagram API doesn't allow to do it anymore.
// @iconURL      https://raw.githubusercontent.com/russdreamer/instagram-followers-statistics/master/img/logo.jpg
// @updateURL    https://github.com/russdreamer/instagram-followers-statistics/raw/master/installation.user.js
// @downloadURL  https://github.com/russdreamer/instagram-followers-statistics/raw/master/installation.user.js
// @supportURL   https://github.com/russdreamer/instagram-followers-statistics/issues
// @include      https://www.instagram.com/*
// @grant        GM_xmlhttpRequest
// @connect      raw.githubusercontent.com
// @connect      github.com
// @run-at       document-body
// ==/UserScript==

(function() {
    'use strict';
    GM_xmlhttpRequest ( {
        method:     'GET',
        url:        "https://raw.githubusercontent.com/russdreamer/instagram-followers-statistics/master/console_script.js",
        onload:     function (responseDetails) {
            loadScript(responseDetails.responseText);
        }
    });
})();

function loadScript(scriptText) {
    var script = document.createElement('script');
    script.innerHTML = scriptText;
    var head = document.getElementsByTagName("head")[0];
    head.appendChild(script);
}