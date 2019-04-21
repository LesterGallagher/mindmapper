(function (e, t, n) { var r = e.querySelectorAll("html")[0]; r.className = r.className.replace(/(^|\s)no-js(\s|$)/, "$1js$2") })(document, window, 0);

require('winstrap/dist/css/winstrap.min.css');
const $ = require('jquery');
window['jQuery'] = $;
require('bootstrap/dist/js/bootstrap');
require('./css/home.css');
import { decodeQuery } from './util';

const storage = require('./storage');
const IndexedDBStorage = require('./indexeddb-wrapper.js');
const { saveAs } = require('file-saver');
const timeago = require('timeago.js');
require('./winstrap');
const createSavedMindview = require('./mustache-templates/home-saved-mindmap.mustache').default;

var gi = document.getElementById.bind(document);
var form = gi('new-room');
var input = gi('mindmap-name');
const pub = gi('public')
const connectRoomForm = gi('connect-room');
const connectRoomUrl = gi('connect-room-url');

form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!pub.checked) {
        window.location.href = window.location.origin + '/mindmapper.html?ispublic=false&name=' + input.value;
        return;
    }
    var obj = {
        static: {
            name: input.value,
            id: Math.random().toString(36),
        },
        elems: [
            {
                key: 'default key',
                id: 0,
                type: 0,
                leftpos: '80px',
                toppos: '80px',
                connected_elems: [],
                'font-size': '25.6px',
                content: 'new title'
            }
        ],
        lines: []
    };

    $.ajax({
        url: "https://api.myjson.com/bins",
        type: "POST",
        data: JSON.stringify(obj),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        error: function (XMLHttpRequest, textStatus, errorThrown) {
            alert("Status: " + textStatus + "\nError: " + errorThrown);
        },
        success: function (data, textStatus, jqXHR) {
            var urlPortions = data.uri.split('/');
            var id = urlPortions[urlPortions.length - 1];
            window.location.href = window.location.origin + '/mindmapper.html?ispublic=true&room=' + id;
        }
    });
    return false;
});

$('#master-items > *').each(function (i) {
    $(this).on('click', function () {
        $('#detail-items [detail-item-index]').hide();
        $('#detail-items [detail-item-index=' + i + ']').show();
    })
});
$('#detail-items [detail-item-index]').hide();
$('#detail-items [detail-item-index=0]').show();

$('[data-iframe-load]').each(function (i) {
    $(this).attr('src', $(this).attr('data-iframe-load'));
});

connectRoomForm.onsubmit = event => {
    event.preventDefault();
    const urlOrId = connectRoomUrl.value;
    let id;
    if (urlOrId.indexOf('mindmapper.html') !== -1) {
        const query = decodeQuery(urlOrId);
        id = query.room;
    } else id = urlOrId;
    console.log('test', id);
    window.location.href = window.location.origin + '/mindmapper.html?ispublic=true&room=' + id;
    return false;
}

function updateMindviews() {

    var $savedMindviews = $('#saved-mindviews').empty();
    var json = localStorage.getItem('mindviewer-mindviews-storage-v2');
    var mmaps = JSON.parse(json);
    var prefix = 'mindview-items-';
    for (var key in mmaps) {
        (function (key) {
            var mm = mmaps[key];

            console.log(createSavedMindview);

            var $entityItem = $(createSavedMindview({
                timeago: timeago().format(new Date(mm.static.timestamp)),
                date: new Date(mm.static.timestamp).toDateString(),
                name: (mm.static.name || 'Unnamed'),
                available: (mm.type === 'api_bin' ? 'online' : '')
            }));

            $savedMindviews.append($entityItem);

            $entityItem.find('.btn-open').on('click', function () {
                if (mm.type === 'api_bin') {
                    window.location.href = window.location.origin + '/mindmapper.html?ispublic=true&id=' + mm.static.id + '&room=' + mm.room;
                } else {
                    window.location.href = window.location.origin + '/mindmapper.html?ispublic=false&id=' + mm.static.id;
                }
            });

            $entityItem.find('.btn-download').on('click', function () {
                if (mm.type === 'api_bin') {
                    $.get("https://api.myjson.com/bins/" + mm.room, function (data, textStatus, jqXHR) {
                        saveAs(new Blob([JSON.stringify(data)]), (mm.static.name || 'Unnamed') + '-mindview.onmm');
                    });
                } else {
                    storage.getMindviews().then(mindviews => {
                        const storedMM = mindviews[mm.static.id];

                        saveAs(new Blob([JSON.stringify(storedMM)]), storedMM.static.name + '-mindview.onmm');
                    });
                }
            });

            $entityItem.find('.btn-delete').on('click', function () {
                if (confirm('Are you sure?')) {
                    storage.deleteMindview(mm);
                    $entityItem.remove();
                }
            });
        })(key);
    }

    if ($savedMindviews.children().length === 0) {
        $('<div class="container-fluid padded-top"><h2>No saved mindviews.</h2><p>There\'s nothing here...</p></div>').appendTo($savedMindviews);
    }

}

updateMindviews();

function injectLoader(container) {
    $('<div class="progress-ring">\
        <div class="progress-circle"></div>\
        <div class="progress-circle"></div>\
        <div class="progress-circle"></div>\
        <div class="progress-circle"></div>\
        <div class="progress-circle"></div>\
    </div>').appendTo(container);
}

// Drag & Drop

var isAdvancedUpload = function () {
    var div = document.createElement('div');
    return (('draggable' in div) || ('ondragstart' in div && 'ondrop' in div)) && 'FormData' in window && 'FileReader' in window;
}();

var $form = $('.box');

if (isAdvancedUpload) {
    $form.addClass('has-advanced-upload');
}

if (isAdvancedUpload) {

    var droppedFiles = false;

    $form.on('drag dragstart dragend dragover dragenter dragleave drop', function (e) {
        e.preventDefault();
        e.stopPropagation();
    })
        .on('dragover dragenter', function () {
            $form.addClass('is-dragover');
        })
        .on('dragleave dragend drop', function () {
            $form.removeClass('is-dragover');
        })
        .on('drop', function (e) {
            droppedFiles = e.originalEvent.dataTransfer.files;
        });

}

$form.on('submit', function (e) {
    if ($form.hasClass('is-uploading')) return false;

    $form.addClass('is-uploading').removeClass('is-error');

    if (isAdvancedUpload) {
        e.preventDefault();

        var ajaxData = new FormData($form.get(0));

        if (droppedFiles) {
            $.each(droppedFiles, function (i, file) {
                ajaxData.append($input.attr('name'), file);
            });
        }

        $.ajax({
            url: $form.attr('action'),
            type: $form.attr('method'),
            data: ajaxData,
            dataType: 'json',
            cache: false,
            contentType: false,
            processData: false,
            complete: function () {
                $form.removeClass('is-uploading');
            },
            success: function (data) {
                $form.addClass(data.success == true ? 'is-success' : 'is-error');
                if (!data.success) alert(data.error);
            },
            error: function () {
                alert('error');
                // Log the error, show an alert, whatever works for you
            }
        });
    }
});

var $input = $form.find('input[type="file"]'),
    $label = $form.find('label'),
    showFiles = function (files) {
        $label.text(files.length > 1 ? ($input.attr('data-multiple-caption') || '').replace('{count}', files.length) : files[0].name);
        showMMInfo(files);
    };


$form.on('drop', function (e) {
    droppedFiles = e.originalEvent.dataTransfer.files; // the files that were dropped
    showFiles(droppedFiles);
});

$input.on('change', function (e) {
    showFiles(e.target.files);
});

function showMMInfo(files) {
    var fr = new FileReader();
    fr.onload = function (e) {
        var result = e.target.result;
        var data = JSON.parse(result);
        if (data.type === 'api_bin') {
            storage.putMindview({
                type: 'api_bin',
                room: data.room,
                static: {
                    id: data.static.id,
                    name: data.static.name,
                    timestamp: data.static.timestamp
                }
            });
            $.ajax({
                type: 'PUT',
                url: 'https://api.myjson.com/bins/' + data.room,
                data: result,
                async: false,
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                error: function (XMLHttpRequest, textStatus, errorThrown) {
                    alert('unable to save mind map');
                },
                success: function (data, textStatus, jqXHR) {
                    updateMindviews();
                    alert('Stored online');
                }
            });
        } else {
            storage.putMindview(data).then(() => {
                updateMindviews();
                alert('Stored in app storage');
            });
        }
    }
    fr.readAsText(files[0]);
}