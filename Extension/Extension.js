// ==UserScript==
// @name         Geoguessr Location Resolver EXTERNAL
// @namespace    http://tampermonkey.net/
// @version      Beta1
// @description  Receive geoguessr location to any device.
// @author       0x978
// @match        https://www.geoguessr.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=geoguessr.com
// @grant        GM_webRequest
// @downloadURL  TBC
// @updateURL    TBC
// ==/UserScript==

// ====================================Global Vars====================================
let globalCoordinates = new Proxy({ lat: 0, lng: 0 }, {
    set(target, prop, value) {
        if(target[prop] !== value) {
            console.log(`${prop} changed to`, value);
            target[prop] = value;
            sendCoords();
            return true;
        }
    }
});

let sessionId

// ====================================Overwriting Fetch====================================

var originalOpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function(method, url) {
    if (method.toUpperCase() === 'POST' &&
        (url.startsWith('https://maps.googleapis.com/$rpc/google.internal.maps.mapsjs.v1.MapsJsInternalService/GetMetadata') ||
            url.startsWith('https://maps.googleapis.com/$rpc/google.internal.maps.mapsjs.v1.MapsJsInternalService/SingleImageSearch'))) {

        this.addEventListener('load', function () {
            let interceptedResult = this.responseText;
            const pattern = /-?\d+\.\d+,-?\d+\.\d+/g;
            let match = interceptedResult.match(pattern)[0];
            let split = match.split(",");

            let lat = Number.parseFloat(split[0]);
            let lng = Number.parseFloat(split[1]);


            globalCoordinates.lat = lat
            globalCoordinates.lng = lng
        });
    }
    return originalOpen.apply(this, arguments);
};


// ====================================Send To Server====================================
function sendCoords() {
    fetch("https://georesolver.0x978.com/coords", {
        method: "POST",
        body: JSON.stringify({
            "lat":globalCoordinates.lat,
            "lng":globalCoordinates.lng,
            "sessionId":sessionId
        }),
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
    });
}

// ====================================Misc====================================
function generateGuid() { // Taken from: https://stackoverflow.com/a/2117523 :)
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
        (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
    );
}

sessionId = generateGuid();
alert(`Your session ID is ${sessionId} please copy it and paste it into https://georesolver.0x978.com/`); // TODO Find better way?

// Usage ping - sends only script version to server to track usage.
fetch(`https://geoguessrping.0x978.com/ping?script_version=External_1.0`)