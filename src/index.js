
require('./css/index.css');
require('./core');

const interactivity = require('./interactivity');
const stateloader = require('./stateloader');
const statesave = require('./statesave');
const colortheme = require('./color-theme');
const persistance = require('./persistance');
const events = require('./events');
const conf = require('./conf');
const $ = require('jquery');

window.onbeforeunload = function() {
    if (conf.ispublic === 'false') {
        if (interactivity.getSaved()) {
            
        } else {
            return "You have unsaved progress. Are you sure you want to go back to the homepage?";
        }
    } else {
        persistance.saveToJsonOnline();
    }
}

$('#btn-back-home').on('click', function() {
    window.location.href = window.location.origin + '/index.html';
});