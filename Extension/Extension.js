// ==UserScript==
// @name         Geoguessr Location Resolver EXTERNAL
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Receive geoguessr location to any device.
// @author       0x978
// @match        https://www.geoguessr.com/*
// @match        https://geoguessr.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=geoguessr.com
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @connect      georesolver.0x978.com
// @connect      *
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    // Fiksni ID koji je već unapred upisan i u tvojoj Android aplikaciji!
    // Ne moraš da pritiskaš F9 niti da kucaš kod na telefonu.
    const DEFAULT_USER_ID = "11111111-1111-4111-8111-111111111111";
    const SERVER_URL = "https://georesolver.0x978.com/coords";

    let userId = DEFAULT_USER_ID;

    // ====================================Send To Server====================================
    function sendCoords(lat, lng) {
        const payload = JSON.stringify({
            lat: lat,
            lng: lng,
            sessionId: userId
        });

        if (typeof GM_xmlhttpRequest === "function") {
            GM_xmlhttpRequest({
                method: "POST",
                url: SERVER_URL,
                headers: { "Content-Type": "application/json; charset=UTF-8" },
                data: payload
            });
        } else {
            fetch(SERVER_URL, {
                method: "POST",
                body: payload,
                headers: { "Content-Type": "application/json; charset=UTF-8" }
            }).catch(() => {});
        }
    }

    // ====================================Overwriting XHR====================================
    function hookXHR(win) {
        if (!win || !win.XMLHttpRequest) return;
        const originalOpen = win.XMLHttpRequest.prototype.open;
        if (originalOpen._geoHooked) return;

        win.XMLHttpRequest.prototype.open = function (method, url) {
            if (typeof method === "string" && method.toUpperCase() === "POST" && typeof url === "string" &&
                (url.startsWith("https://maps.googleapis.com/$rpc/google.internal.maps.mapsjs.v1.MapsJsInternalService/GetMetadata") ||
                 url.startsWith("https://maps.googleapis.com/$rpc/google.internal.maps.mapsjs.v1.MapsJsInternalService/SingleImageSearch"))) {

                this.addEventListener("load", function () {
                    try {
                        const pattern = /-?\d+\.\d+,-?\d+\.\d+/g;
                        const match = this.responseText.match(pattern);
                        if (match && match[0]) {
                            const [lat, lng] = match[0].split(",").map(Number);
                            sendCoords(lat, lng);
                        }
                    } catch (e) {}
                });
            }
            return originalOpen.apply(this, arguments);
        };
        win.XMLHttpRequest.prototype.open._geoHooked = true;
    }

    hookXHR(window);
    if (typeof unsafeWindow !== "undefined") {
        hookXHR(unsafeWindow);
    }

    // Opciono: Ako pritisneš F9, prikazaće koji je aktivni ID
    window.addEventListener("keydown", function (e) {
        if (e.key === "F9" || e.code === "F9" || e.keyCode === 120) {
            e.preventDefault();
            e.stopPropagation();
            prompt("Tvoj GeoResolver User ID:", userId);
        }
    }, true);
})();
