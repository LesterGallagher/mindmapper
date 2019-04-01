
const $ = require('jquery');
const { rgb2hex } = require('./util');
const storage = require('./storage');

const $modal = $('#background-color-modal');

const field = $('#field').get(0);

const db = storage.constructor.getDB();

function init() {
    const bodyBgColor = rgb2hex($(field).css('background-color'))
    const localStorageColor = localStorage.getItem('bg-color-v1');
    $('#backgroundColorInput').val(localStorageColor || bodyBgColor);
    if (localStorageColor) {
        field.style.backgroundColor = localStorageColor;
    }
    db.get('bg-image-v1').then(blob => {
        if (!blob) return;
        const url = window.URL.createObjectURL(blob)
        field.style.backgroundSize = field.style.backgroundSize || 'initial';
        field.style.backgroundImage = 'url(' + url + ')';
    });
    if (localStorage.getItem('bg-repeat-v1') !== undefined) {
        field.style.backgroundRepeat = localStorage.getItem('bg-repeat-v1') ? 'repeat' : 'no-repeat';
        $('#backgroundRepeatInput').get(0).checked = JSON.parse(localStorage.getItem('bg-repeat-v1'));
        $('#backgroundImageRemoveButton').show();
    }
    if (localStorage.getItem('bg-size-v1') !== undefined) {
        field.style.backgroundSize = localStorage.getItem('bg-size-v1');
        $('#backgroundSizeSelect').val(localStorage.getItem('bg-size-v1'));
    }
}

init();

$modal.find('.form').on('submit', e => e.preventDefault());

$('#backgroundRepeatInput').on('change', e => {
    field.style.backgroundRepeat = e.target.checked ? 'repeat' : 'no-repeat';
    localStorage.setItem('bg-repeat-v1', e.target.checked);
});

$('#backgroundSizeSelect').on('change', e => {
    field.style.backgroundSize = e.target.value;
    localStorage.setItem('bg-size-v1', e.target.value);
});

$('#backgroundImageRemoveButton').on('click', e => {
    field.style.backgroundImage = null;
    db.delete('bg-image-v1');
    $('#backgroundImageRemoveButton').hide();
});

$('#backgroundImage').on('change', e => {
    field.style.backgroundSize = field.style.backgroundSize || 'initial';
    field.style.backgroundImage = 'url(' + window.URL.createObjectURL(e.target.files[0]) + ')';
    db.set('bg-image-v1', e.target.files[0]);
    $('#backgroundImageRemoveButton').show();
});

$('#backgroundColorInput').on('input', e => {
    field.style.backgroundColor = e.target.value;
    localStorage.setItem('bg-color-v1', e.target.value);
});

$('#backgroundResetButton').on('click', e => {
    field.style.backgroundImage = null;
    field.style.backgroundColor = null;
    field.style.backgroundSize = null;
    field.style.backgroundRepeat = null;

    localStorage.removeItem('bg-color-v1');
    localStorage.removeItem('bg-size-v1');
    localStorage.removeItem('bg-repeat-v1');
    db.delete('bg-image-v1');

    init();
});