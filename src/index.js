require('winstrap/dist/css/winstrap.min.css');
const $ = require('jquery');
window['jQuery'] = $;
require('bootstrap/dist/js/bootstrap');
require('./css/mindviewer.css');

require('./core');

const interactivity = require('./interactivity');
const stateloader = require('./stateloader');
const statesave = require('./statesave');
const colortheme = require('./color-theme');
const persistance = require('./persistance');
const events = require('./events');
const conf = require('./conf');
require('./background-settings');
require('./export-modal');
require('./sharing-modal');


function isOnline() {

}

function isFocused() {
    return document.hasFocus();
}

function isOffline() {
    if (isFocused()) {
        if (conf.ispublic) {
            events.noInternetConnection();
        }
    }
}

window.addEventListener("online", isOnline, false);
window.addEventListener("offline", isOffline, false);

window.addEventListener("focus", onFocus, false);

document.addEventListener("resume", onFocus, false);

function onFocus(event) {
    if (window.navigator.onLine === false) {
        if (conf.ispublic) {
            events.noInternetConnection();
        }
    }
}

window.onbeforeunload = function () {
    if (conf.ispublic === 'false') {
        if (interactivity.getSaved()) {

        } else {
            return "You have unsaved progress. Are you sure you want to go back to the homepage?";
        }
    } else {
        persistance.saveToJsonOnline();
    }
}

$('#btn-back-home').on('click', function () {
    window.location.href = window.location.origin + '/index.html';
});

console.log(conf.ispublic)
if (!conf.ispublic !== 'true') {
    $('#spawn_elem_btn3').show();
}

