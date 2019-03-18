const $ = require('jquery');
const io = require('socket.io-client');
const conf = require('./conf');
const stateLoader = require('./stateloader');
const stateSave = require('./statesave');
const percistance = require('./persistance');
const { field, globalelemnsHashed, globallinesHashed, CreateElement, CreateLine, removeLine } = require('./interactivity');
const { debounce, throttle } = require('./core');
const $messages = $('#messages');

const nickname = Math.random().toString(36);

let waitingForHotMindMap = true;

var socketioConnections = conf.apiUrl + '/no-persist-open-chat'

exports.gotHotData = false;

exports.socketReadyPromise = new Promise((res, rej) => {
    if (conf.ispublic === 'false') return res(); 
    var socket = io.connect(socketioConnections, { 'connect timeout': 5000 });
    socket.on('connect', function () {
        socket.emit('init', { room: conf.room, nickname }, function (isSuccess) {
            if (!isSuccess) return console.error('Unable to connect');

            socket.emit('msg', { type: 'retrieve-mm' });
            setTimeout(() => waitingForHotMindMap = false, 4000);

            const batched = [];

            const send = throttle(() => {
                if (batched.length === 0) {
                    return;
                } else if (batched.length > 1) {
                    socket.emit('msg', { type: 'batched_updates', batched });
                } else {
                    socket.emit('msg', batched[0])
                }
                batched.splice(0, batched.length);
            }, 1000 / 25 /* 25 fps */);

            const emitBatchedMsg = payload => {
                batched.push(payload);
                send();
            }

            socket.on('msg', function (data) {
                if (data.type === 'batched_updates') {
                    data.batched.forEach(innerData => {
                        innerData.from = data.from;
                        handleFieldEvent(innerData, emitBatchedMsg);
                    });
                }
                else {
                    handleFieldEvent(data, emitBatchedMsg);
                }
                console.log(data);
            });

            socket.on('disconnected', function (data) {
                console.log('disconnect', data);

                data.msg = 'User disconnected from the room.';
                writeMessageToChat(data)

                $(users[data.from]).remove();
                delete users[data.from];
            });

            configureWatcher(emitBatchedMsg)

            res();
        });

        socket.on('disconnect', function () { console.warn(' socket disconnect'); });
    });

    socket.on('connect_error', function () {
        alert('connection failed');
    });
});

const handleFieldEvent = (data, emitBatchedMsg) => {
    if (data.type === 'chat') {
        writeMessageToChat(data);
    } else if (data.type === 'update') {
        patch(data);
    } else if (data.type === 'retrieve-mm') {
        if (percistance.percistanceLoaded === false) return;
        const state = stateSave.compileState(percistance.dataId);
        emitBatchedMsg({ type: 'receive-mm', state });
    } else if (data.type === 'receive-mm') {
        if (!waitingForHotMindMap) return;
        waitingForHotMindMap = false;
        const state = data.state;
        stateLoader.readData(state);
        exports.gotHotData = true;
    }
}

const configureWatcher = emitBatchedMsg => {
    $('#mainh').on('input', (e) => {
        emitBatchedMsg({
            type: 'update',
            action: 'staticupdate',
            patch: {
                name: e.target.value,
            }
        });
    });

    field.on('elem_modified', patch => {
        emitBatchedMsg({
            type: 'update',
            action: 'elem_modified',
            patch,
        });
    });

    field.on('elem_created', patch => {
        emitBatchedMsg({
            type: 'update',
            action: 'elem_created',
            patch,
        })
    });

    field.on('elem_removed', patch => {
        emitBatchedMsg({
            type: 'update',
            action: 'elem_removed',
            patch: patch
        })
    });

    field.on('line_created', patch => {
        emitBatchedMsg({
            type: 'update',
            action: 'line_created',
            patch: patch
        });
    });

    field.on('line_removed', patch => {
        emitBatchedMsg({
            type: 'update',
            action: 'line_removed',
            patch: patch
        });
    })

    $(document).on('mousemove', throttle(e => {
        emitBatchedMsg({
            type: 'update',
            action: 'mouse',
            clientX: e.clientX,
            clientY: e.clientY,
        })
    }, 1000 / 25 /* 25 fps */, false));

}

const users = {};
const $mouses = $('#mouses');

const patch = (data) => {
    const patch = data.patch;
    if (data.action === 'mouse') {
        if (!users[data.from]) {
            console.log('disconnect', data);

            data.msg = 'User joined the room.';
            writeMessageToChat(data)

            $(users[data.from]).remove();
            delete users[data.from];
            users[data.from] = $('<div class="mouse-pos"></div>').appendTo($mouses);
        }
        users[data.from].css('top', data.clientY).css('left', data.clientX);
    }
    if (data.action === 'elem_removed') {
        const key = patch.key;
        globalelemnsHashed[key].RemoveThis();
    } else if (data.action === 'elem_modified') {
        const key = patch.key;
        if (patch.content !== undefined) {
            globalelemnsHashed[key].find('input, textarea').val(patch.content);
        }
        if (patch['font-size'] !== undefined) {
            globalelemnsHashed[key].find('input, textarea').css('font-size', patch['font-size']);
        }
        if (patch.leftpos !== undefined) {
            globalelemnsHashed[key].css('left', patch.leftpos);
            globalelemnsHashed[key].UpdateAllConnectedLines();
        }
        if (patch.toppos !== undefined) {
            globalelemnsHashed[key].css('top', patch.toppos);
            globalelemnsHashed[key].UpdateAllConnectedLines();
        }
        if (patch.width !== undefined) {
            globalelemnsHashed[key].find('textarea').outerWidth(patch.width);
            globalelemnsHashed[key].UpdateAllConnectedLines();
        }
        if (patch.height !== undefined) {
            globalelemnsHashed[key].find('textarea').outerHeight(patch.height);
            globalelemnsHashed[key].UpdateAllConnectedLines();
        }
    } else if (data.action === 'elem_created') {
        CreateElement(patch);
        console.log('created', data);
    }

    else if (data.action === 'line_created') {
        CreateLine(patch.strokewidth,
            patch.strokecolor,
            globalelemnsHashed[patch.key1],
            globalelemnsHashed[patch.key2],
            patch.key);
    }

    else if (data.action === 'line_removed') {
        removeLine(patch.key);
    }

    else if (data.action === 'staticupdate') {
        if (patch.name !== undefined) $('#mainh').val(patch.name);
    }
}


function writeMessageToChat(data) {
    var from = data.from;
    var msg = data.msg;

    var scrollBottom = $messages.scrollTop() + $messages.innerHeight() - $messages[0].scrollHeight;
    var scrollBottom = $messages.scrollTop() + $messages.height();
    $messages.append('<div class="message other">\
    <div class="msg">' + msg + '</div>\
    <div class="from">' + from + '</div>\
    </div>');
    if (scrollBottom > -1) {
        $messages.scrollTop($messages[0].scrollHeight);
    }
}


// $form.on('submit', function (e) {
//     var msg = $field.val();

//     var scrollBottom = $messages.scrollTop() + $messages.innerHeight() - $messages[0].scrollHeight;
//     console.log(scrollBottom);
//     $messages.append('<div class="message me">\
//     <div class="msg">' + msg + '</div>\
//     <div class="from">' + nickname + '</div>\
//     </div>');
//     if (scrollBottom > -1) {
//         $messages.scrollTop($messages[0].scrollHeight);
//     }
//     socket.emit('msg', { msg });
// });


