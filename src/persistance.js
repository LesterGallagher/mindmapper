import * as firebase from 'firebase';
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/storage';
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


const config = {
    apiKey: "AIzaSyAru0WoUG5NBKauUOvo5naWv8jW28LT-rI",
    authDomain: "mindmapper-a27ea.firebaseapp.com",
    databaseURL: "https://mindmapper-a27ea.firebaseio.com",
    projectId: "mindmapper-a27ea",
    storageBucket: "mindmapper-a27ea.appspot.com",
    messagingSenderId: "976340770009"
};
const app = firebase.initializeApp(config);
const db = firebase.firestore();

firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);

firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        var isAnonymous = user.isAnonymous;
        var uid = user.uid;
    } else {
        firebase.auth().signInAnonymously().catch(function (error) {
            // Handle Errors here.
            var errorCode = error.code;
            var errorMessage = error.message;
            alert('Sign in Anonymously failed. We failed to verify that you are a valid user.');
        });
    }
});

exports.percistanceLoaded = false;

const refreshTimeSince = () => {
    $saveBtnTime.text(timeago.format(timeSinceLastSave))
}

setInterval(refreshTimeSince, 5000);

if (conf.ispublic === 'false') {
    exports.dataId = conf.id || Math.random().toString(36);

    if (conf.id) {
        storage.getMindviews().then(maps => {
            const data = maps[conf.id];
            if (!data) {
                $('#fullscreen-loader').fadeOut();
            } else {
                stateLoader.readData(data);
            }
        });
        $('#fullscreen-loader').fadeOut();
    } else {
        document.getElementById('mainh').value = conf.name;
        $('#fullscreen-loader').fadeOut();
    }

    $saveBtn.add($saveMenuBtn).on('click', () => {
        // saveOnDevice();
        const state = stateSave.compileState(exports.dataId);
        state.type = 'app_storage'
        storage.putMindview(state).then(() => {
            interactivity.setSaved();
            timeSinceLastSave = new Date();
            refreshTimeSince();
            if (!conf.id) {
                window.location.href = window.location.origin + '/mindmapper.html?ispublic=false&id=' + exports.dataId;
            }
        });
    });
} else {
    if (conf.firestore === 'true') {
        firebase.auth().onAuthStateChanged(function (user) {
            db.collection('mindmaps').doc(conf.room).get().then(function (doc) {
                if (doc.exists) {
                    const data = doc.data();
                    if (events.gotHotData === false) stateLoader.readData(data);

                    exports.percistanceLoaded = true;
                    exports.dataId = data.static.id;

                    events.socketReadyPromise.then(() => {
                        $('#fullscreen-loader').fadeOut();
                    });
                } else {
                    // doc.data() will be undefined in this case
                    alert("Document does not exist.");
                    window.history.back();
                }
            }).catch(function (error) {
                console.error(error);
                alert("Error getting document:" + error.toString());
                window.history.back();
            });
        });
    } else {
        $.ajax({
            url: "https://api.myjson.com/bins/" + conf.room,
            type: 'GET',
            success: function (data) {
                if (events.gotHotData === false) stateLoader.readData(data);

                exports.percistanceLoaded = true;
                exports.dataId = data.static.id;

                events.socketReadyPromise.then(() => {
                    $('#fullscreen-loader').fadeOut();
                });
            },
            error: function (data, t1, t2) {
                alert(t2);
                window.history.back();
            }
        });
    }

    $saveBtn.add($saveMenuBtn).on('click', () => {
        saveToJsonOnline();
    });
}

const saveOnDevice = () => {
    var blob = new Blob([JSON.stringify(stateSave.compileState(exports.dataId))], { type: "application/json;charset=utf-8" });
    var saveAs = FileSaver.saveAs(blob, $('#mainh').val() + '-mindview.onmm');
    console.log(saveAs);
    interactivity.setSaved();
    timeSinceLastSave = new Date();
    refreshTimeSince();
}

const saveToJsonOnline = exports.saveToJsonOnline = () => {
    const type = conf.firestore === 'true' ? 'firestore' : 'api_bin';

    storage.putMindview({
        type,
        room: conf.room,
        static: {
            id: exports.dataId,
            name: $('#mainh').val(),
            timestamp: Date.now()
        }
    });

    if (conf.firestore === 'true') {
        // console.log('save');
        const data = stateSave.compileState(exports.dataId);
        data.static.timestamp = firebase.firestore.FieldValue.serverTimestamp();
        db.collection('mindmaps').doc(conf.room).set(Object.assign({}, data))
            .then(() => {
                timeSinceLastSave = new Date();
                refreshTimeSince();
                interactivity.setSaved();
            }).catch(err => {
                console.error(err);
                alert('Unable to save' + err.toString());
            });
    } else {
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
}









