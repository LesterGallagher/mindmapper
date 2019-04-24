import * as firebase from 'firebase';
import { field } from './interactivity';

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
$('#node-image-select-form-file').on('submit', e => {
    e.preventDefault();
    console.log(_imageElem);
    if (_imageElem) {
        const imageElemRef = _imageElem;
        $(imageElemRef).find('img').attr('src', src)
        firebase.storage()
            .ref('mindmaps/' + conf.room)
            .put(blob)
            .then(snapshot => snapshot.ref.getDownloadURL())
            .then(downloadURL => {
                src = downloadURL;
                $('#node-image-select-preview').attr('src', downloadURL);
                $(imageElemRef).find('img').attr('src', downloadURL);
                field.emit('elem_modified', {
                    key: $(imageElemRef).attr('data-key'),
                    src: downloadURL
                });
            }).catch(error => {
                alert(`Failed to upload file and get link - ${error}`);
            });
    }
    return false;
});
$('#node-image-select-form-url').on('submit', e => {
    e.preventDefault();
    console.log(src);
    if (_imageElem) {
        $(_imageElem).find('img').attr('src', src);
        field.emit('elem_modified', {
            key: $(_imageElem).attr('data-key'),
            src: src
        });
    }
    return false;
});
$('#nodeImage').on('change.imagemodal', e => {
    blob = e.target.files[0];
    src = window.URL.createObjectURL(blob);
    $('#node-image-select-preview').attr('src', src);
});

$('#nodeUrl').on('change.imagemodal', e => {
    src = e.target.value;
    console.log(src);
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
