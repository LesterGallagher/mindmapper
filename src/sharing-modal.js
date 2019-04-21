require('./css/sharing-buttons.css');
const createSharingButtons = require('./mustache-templates/sharing-buttons.mustache').default;
const $ = require('jquery');
const conf = require('./conf');
import { decodeQuery } from './util';

const init = () => {
    var size = 'medium';
    size = size.toLowerCase();
    if (size !== 'small' && size !== 'large') size = 'medium';

    var description = encodeURIComponent(document.querySelector('meta[name=description]').getAttribute('content'));
    var title = encodeURIComponent($('#mainh').val() + ' Mindview');
    var url = encodeURIComponent(new window.URL(location.pathname + location.search, 'https://mindviewer.esstudio.site').href);
    const id = decodeQuery(null).room;
    var imageUrl = 'https://mindviewer.esstudio.site/public/img/mindmap.png';

    $('#sharing-modal .modal-body').append('Share using this url: <strong>' + decodeURIComponent(url) + '</strong><br>');
    $('#sharing-modal .modal-body').append('Share using this room ID: <strong>' + decodeURIComponent(id) + '</strong>');

    $('#sharing-modal .modal-body').append(createSharingButtons({
        title,
        description,
        url,
        imageUrl,
        size
    }));

}

if (conf.ispublic === 'true') {
    window.addEventListener('load', e => {
        if (window.requestIdleCallback) window.requestIdleCallback(init);
        else init();
    });
    $('#sharing-modal-opener').show();
} 
