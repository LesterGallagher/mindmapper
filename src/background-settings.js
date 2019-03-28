
const $ = require('jquery');
const { rgb2hex } = require('./util');
const storage = require('./storage');

const $modal = $('#background-color-modal');

const db = storage.constructor.getDB();

function init() {
    const bodyBgColor = rgb2hex($(document.body).css('background-color'))
    const localStorageColor = localStorage.getItem('bg-color-v1');
    $('#backgroundColorInput').val(localStorageColor || bodyBgColor);
    if (localStorageColor) {
        document.body.style.backgroundColor = localStorageColor;
    }
    db.get('bg-image-v1').then(blob => {
        if (!blob) return;
        const url = window.URL.createObjectURL(blob)
        document.body.style.backgroundSize = document.body.style.backgroundSize || 'initial';
        document.body.style.backgroundImage = 'url(' + url + ')';
    });
    if (localStorage.getItem('bg-repeat-v1') !== undefined) {
        document.body.style.backgroundRepeat = localStorage.getItem('bg-repeat-v1') ? 'repeat' : 'no-repeat';
        $('#backgroundRepeatInput').get(0).checked = JSON.parse(localStorage.getItem('bg-repeat-v1'));
    }
    if (localStorage.getItem('bg-size-v1') !== undefined) {
        document.body.style.backgroundSize = localStorage.getItem('bg-size-v1');
        $('#backgroundSizeSelect').val(localStorage.getItem('bg-size-v1'));
    }
}

init();

$modal.find('.form').on('submit', e => e.preventDefault());

$('#backgroundRepeatInput').on('change', e => {
    document.body.style.backgroundRepeat = e.target.checked ? 'repeat' : 'no-repeat';
    localStorage.setItem('bg-repeat-v1', e.target.checked);
});

$('#backgroundSizeSelect').on('change', e => {
    document.body.style.backgroundSize = e.target.value;
    localStorage.setItem('bg-size-v1', e.target.value);
});

$('#backgroundImage').on('change', e => {
    document.body.style.backgroundSize = document.body.style.backgroundSize || 'initial';
    document.body.style.backgroundImage = 'url(' + window.URL.createObjectURL(e.target.files[0]) + ')';
    db.set('bg-image-v1', e.target.files[0]);
});

$('#backgroundColorInput').on('change', e => {
    document.body.style.backgroundColor = e.target.value;
    localStorage.setItem('bg-color-v1', e.target.value);
});

$('#backgroundResetButton').on('click', e => {
    document.body.style.backgroundImage = null;
    document.body.style.backgroundColor = null;
    document.body.style.backgroundSize = null;
    document.body.style.backgroundRepeat = null;

    localStorage.removeItem('bg-color-v1');
    localStorage.removeItem('bg-size-v1');
    localStorage.removeItem('bg-repeat-v1');
    db.delete('bg-image-v1');

    init();
});