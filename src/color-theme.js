const $ = require('jquery');

const $chooseColorTheme = $('#choose-color-theme');
const $chooseColorOptions = $('#choose-color-theme-options');

const $mmelemStyle = $('#mmelem-style');
const $mmwindowStyle = $('#mmwindow-style');

let theme = (window.localStorage && window.localStorage.theme) || 'dark';

const themes = {
    dark: '#30303b',
    indian: '#E09f3e',
    light: '#8aa29e',
    matriks: '#00ff00',
    monokai: '#a6e22e',
    raster: '#c2fcf7',
    russian: '#420039',
}

const itemWidth = 60;
const itemHeight = 60;

const setThemeOptionUI = () => {
    $chooseColorOptions.empty();
    let i = 1;
    for (const key in themes) {
        if (themes.hasOwnProperty(key) && key !== theme) {
            const color = themes[key];
            $chooseColorOptions.append(`
                <button class="option" data-color="${color}" data-name="${key}"
                    style="left: ${i++ * itemWidth}px; background-color: ${color}"></button>
            `);
        }
    }
    $chooseColorOptions.css('width', i * itemWidth);
    $chooseColorTheme.css('background-color', themes[theme]);
}
setThemeOptionUI();

$chooseColorOptions.on('click', 'button.option', e => {
    console.log(e.target);
    setColorTheme($(e.target).attr('data-name'));
});

const setColorTheme = exports.setColorTheme = themeName => {
    theme = themeName;
    setThemeOptionUI();
    $mmelemStyle.attr('href', 'styles/mmelemsstyle-' + theme + '.css');
    $mmwindowStyle.attr('href', 'styles/mmwindow-' + theme + '.css');
    if (window.localStorage) localStorage.theme = themeName;
}


