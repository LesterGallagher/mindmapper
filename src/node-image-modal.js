const $ = require('jquery');
const conf = require('./conf');

const $modal = $('#node-image-select');

let _imageElem = null;
let src = null;
let blob = null;

const unsetImage = () => {
    src = null;
    blob = null;
    _imageElem = null;
};

$('#node-image-select-preview').attr('src', $(this).attr('src'));
$('#node-image-select form').on('submit', e => {
    e.preventDefault();
    console.log(src);
    if (_imageElem) {
        $(_imageElem).find('img').attr('src', src)
    }
    return false;
});
$('#nodeImage').on('change.imagemodal', e => {
    blob = e.target.files[0];
    src = window.URL.createObjectURL(blob);
    $('#node-image-select-preview').attr('src', src);
});

$modal.on('hidden.bs.modal', function () {
    unsetImage();
});

export const open = elem => {
    if (_imageElem) unsetImage(_imageElem);
    _imageElem = elem;
    $modal.modal().show();
    $('#node-image-select-preview').attr('src', $(elem).find('img').attr('src'));
}
