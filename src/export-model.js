const $ = require('jquery');
const saveAs = require('file-saver');
const font = require('winstrap/dist/fonts/glyphs/winjs-symbols.ttf');
const JSZip = require('jszip');
const domtoimage = require('dom-to-image');

console.log(font);

$('#export-modal, form').on('submit', e => {
    e.preventDefault();

    var title = $('#mainh').val();
    const field = $('#field').get(0);

    var formData = new FormData(e.target);
    console.log(formData);

    var includeBackground = formData.get('includeBackground') === 'on';

    console.log(includeBackground);

    switch (formData.get('format')) {
        case 'html':
            $('#field input, #field textarea').each(function (i) {
                this.setAttribute('value', $(this).val());
            });
            const newDoc = document.implementation.createHTMLDocument(title);
            $(newDoc.body).append($(field).clone(false));
            const zip = new JSZip();
            const imageUrl = ($(field).css('background-image') || '').replace(/url\(["']?/, '').replace(/["']?\);?/, '');
            const imagePromise = (imageUrl && includeBackground) ? fetch(imageUrl).then(x => x.blob()) : Promise.resolve();
            const newFontName = font.replace('/bundle/', '');
            const fontPromise = fetch(font).then(x => x.blob());
            Promise.all(
                [
                    fetch($('#mmwindow-style').attr('href')),
                    fetch($('#mmelem-style').attr('href')),
                    fetch('bundle/vendor.bundle.css'),
                    fetch('bundle/main.bundle.css')
                ].map(f => f.then(x => x.text()))
            ).then((styles) => {
                const head = $(newDoc).find('head').get(0);
                styles.forEach(style => {
                    head.appendChild(newDoc.createElement('style')).textContent = style.replace(font, newFontName);
                });
                imagePromise.then(imageBlob => {
                    if (imageUrl && includeBackground) {
                        const extension = imageBlob.type.replace('image/', '');
                        const filename = 'background.' + extension;
                        zip.file(filename, imageBlob);
                        newDoc.body.style.backgroundImage = 'url("' + filename + '")';
                    }
                    fontPromise.then(blob => {
                        zip.file(newFontName, blob);
                        const html = new XMLSerializer().serializeToString(newDoc);
                        zip.file('index.html', html);
                        zip.generateAsync({ type: "blob" }).then(function (blob) {
                            saveAs(blob, title + '.zip');
                        });
                    })
                })
            });
            break;
        default: 'png'
            let prevStyle;
            if (!includeBackground) {
                prevStyle = field.getAttribute('style');
                field.setAttribute('style', 'background-image: none; background-color: transparent');
            }
            domtoimage.toBlob(field).then(blob => {
                saveAs(blob, title + '.png');
                if (!includeBackground) {
                    field.setAttribute('style', prevStyle);
                }
            }).catch(error => {
                if (!includeBackground) {
                    field.setAttribute('style', prevStyle);
                }
                alert('Error: ' + error);
            });
            break;
    }

    return false;
})