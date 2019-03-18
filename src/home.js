
const storage = require('./storage');
const IndexedDBStorage = require('./indexeddb-wrapper.js');
const $ = require('jquery');
const { saveAs } = require('file-saver');
const timeago = require('timeago.js');
require('./winstrap');

var gi = document.getElementById.bind(document);
var form = gi('new-room');
var input = gi('name');
const pub = gi('public')

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

function updateMindmaps() {

    var $savedMindviews = $('#saved-mindviews').empty();
    var json = localStorage.getItem('mindmaper-mindmaps-storage-v2');
    var mmaps = JSON.parse(json);
    var prefix = 'mindmap-items-';
    for (var key in mmaps) {
        (function (key) {
            var mm = mmaps[key];
    
            var $entityItem = $('<div class="entity-list-item">\
                <div class="item-icon">\
                    <img alt="icon" height="20" src="img/mindmap-white.svg">\
                </div>\
                <div class="item-content-secondary">\
                    <div class="content-text-primary">' + timeago().format(new Date(mm.static.timestamp)) + '</div>\
                    <div class="content-text-secondary">' + new Date(mm.static.timestamp).toDateString() + '</div>\
                </div>\
                <div class="item-content-primary">\
                    <div class="content-text-primary">' + (mm.static.name || 'Unnamed') + '</div>\
                    <div class="content-text-secondary">Available ' + (mm.type === 'api_bin' ? 'online' : '') + ' </div>\
                </div>\
                <div class="item-content-expanded">\
                    <button class="btn btn-primary btn-open">Open</button>\
                    <button class="btn btn-default btn-download">Download</button>\
                    <button class="btn btn-default btn-">Delete</button>\
                </div>\
            </div>');
    
            $savedMindviews.append($entityItem);
    
            $entityItem.find('.btn-open').on('click', function () {
                window.location.href = window.location.origin + '/mindmapper.html?ispublic=' + (mm.type === 'api_bin') + '&id=' + mm.static.id;
            });
    
            $entityItem.find('.btn-download').on('click', function () {
                if (mm.type === 'api_bin') {
                    $.get("https://api.myjson.com/bins/" + mm.room, function (data, textStatus, jqXHR) {
                        saveAs(new Blob([JSON.stringify(data)]), (mm.static.name || 'Unnamed') + '-mindmap.onmm');
                    });
                } else {
                    storage.getMindmaps().then(mindmaps => {
                        const storedMM = mindmaps[mm.static.id];
        
                        saveAs(new Blob([JSON.stringify(storedMM)]), storedMM.static.name + '-mindmap.onmm');
                    });
                }
            });
    
            // if (mm.type === 'api_bin') {
            //     $.get("https://api.myjson.com/bins/" + conf.room, function (data, textStatus, jqXHR) {
            //         $entityItem.find('.item-content-secondary .content-text-secondary')
            //             .text(data.elems.)
            //     });
            // } else {
            //     storage.get(mm.static.id).then(function(mm) {
    
            //     });
            // }
        })(key);
    }

    if ($savedMindviews.children().length === 0) {
        $('<div class="container-fluid padded-top"><h2>No saved mindmaps.</h2><p>There\'s nothing here...</p></div>').appendTo($savedMindviews);
    } 
    
}

updateMindmaps();

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
                if (!data.success) $errorMsg.text(data.error);
            },
            error: function () {
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
            storage.putMindmap({
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
                    updateMindmaps();
                    alert('Stored online');
            }
            });
        } else {
            storage.putMindmap(data).then(() => {
                updateMindmaps();
                alert('Stored in app storage');
            });
        }
    }
    fr.readAsText(files[0]);
}