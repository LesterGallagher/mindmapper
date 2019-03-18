
const $ = require('jquery');
const timeago = require('timeago.js')();
const stateSave = require('./statesave');
const conf = require('./conf');
const stateLoader = require('./stateloader');
const events = require('./events');
var FileSaver = require('file-saver');
const interactivity = require('./interactivity');
const storage = require('./storage');

let timeSinceLastSave = new Date();
const $saveBtnTime = $('#save-last');
const $saveBtn = $('#save-mm');
const $saveMenuBtn = $('#save-to-storage');

exports.percistanceLoaded = false;

const refreshTimeSince = () => {
    $saveBtnTime.text(timeago.format(timeSinceLastSave))
}

setInterval(refreshTimeSince, 5000);

if (conf.ispublic === 'false') {
    $saveBtn.add($saveMenuBtn).on('click', () => {
        // saveOnDevice();
        const state = stateSave.compileState(exports.dataId);
        state.type = 'app_storage'
        storage.putMindmap(state);
        interactivity.setSaved();
        timeSinceLastSave = new Date();
        refreshTimeSince();
    });
    $('#fullscreen-loader').fadeOut();

    exports.dataId = Math.random().toString(36);
} else {

    $.get("https://api.myjson.com/bins/" + conf.room, function (data, textStatus, jqXHR) {
        if (events.gotHotData === false) stateLoader.readData(data);

        exports.percistanceLoaded = true;
        exports.dataId = data.static.id;

        events.socketReadyPromise.then(() => {
            $('#fullscreen-loader').fadeOut();
        });
    });

    $saveBtn.add($saveMenuBtn).on('click', () => {
        saveToJsonOnline();
    });

}

const saveOnDevice = () => {
    var blob = new Blob([JSON.stringify(stateSave.compileState(exports.dataId))], { type: "application/json;charset=utf-8" });
    var saveAs = FileSaver.saveAs(blob, $('#mainh').val() + '-mindmap.onmm');
    console.log(saveAs);
    interactivity.setSaved();
    timeSinceLastSave = new Date();
    refreshTimeSince();
}

const saveToJsonOnline = exports.saveToJsonOnline = () => {
    // console.log('save');
    storage.putMindmap({
        type: 'api_bin',
        room: conf.room,
        static: {
            id: exports.dataId, 
            name: $('#mainh').val(),
            timestamp: Date.now()
        }
    });
    $.ajax({
        type: 'PUT',
        url: 'https://api.myjson.com/bins/' + conf.room,
        data: JSON.stringify(stateSave.compileState(exports.dataId)),
        async: false,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        error: function (XMLHttpRequest, textStatus, errorThrown) {
            alert('unable to save mind map');
        },
        success: function (data, textStatus, jqXHR) {
            timeSinceLastSave = new Date();
            refreshTimeSince();
            interactivity.setSaved();

        }
    });
}









