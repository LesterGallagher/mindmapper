require('./css/sharing-buttons.css');
const createSharingButtons = require('./mustache-templates/sharing-buttons.mustache').default;
const $ = require('jquery');
const conf = require('./conf');

const init = () => {
    var size = 'medium';
    size = size.toLowerCase();
    if (size !== 'small' && size !== 'large') size = 'medium';

    var description = encodeURIComponent(document.querySelector('meta[name=description]').getAttribute('content'));
    var title = encodeURIComponent($('#mainh').val() + ' Mindmap');
    var url = encodeURIComponent(new window.URL(location.pathname + location.search, 'https://mindmapper.esstudio.site').href);
    var imageUrl = 'https://mindmapper.esstudio.site/public/img/mindmap.png';

    $('#sharing-modal .modal-body').append('Share using this url: <strong>' + decodeURIComponent(url) + '</strong>');

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
