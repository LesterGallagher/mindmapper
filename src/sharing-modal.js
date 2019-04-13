const $ = require('jquery');
const conf = require('./conf');

const generateSharingButtonsHTML = require('./sharing-buttons');

const init = () => {
    const html = generateSharingButtonsHTML({
        facebook: true,
        twitter: true,
        google: true,
        tumblr: true,
        email: true,
        pinterest: true,
        linkedin: true,
        reddit: true,
        xing: true,
        whatsapp: true,
        hackernews: true,
        vk: true,
        telegram: true,
    },
        $('#mainh').val() + ' Mindmap',
        document.querySelector('meta[name=description]').getAttribute('content'),
        'https://mindmapper.esstudio.site',
        location.pathname + location.search,
        'https://mindmapper.esstudio.site/public/img/mindmap.png',
        'medium');

    $('#sharing-modal .modal-body').get(0).innerHTML = html;

}

if (conf.ispublic === 'true') {
    window.addEventListener('load', e => {
        if (window.requestIdleCallback) window.requestIdleCallback(init);
        else init();
    });
    $('#sharing-modal-opener').show();
} 
