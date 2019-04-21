

export function rgb2hex(rgb) {
    if (/^#[0-9A-F]{6}$/i.test(rgb)) return rgb;

    rgb = rgb.match(/^rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(,\s*\d+)?\s*\)$/);
    function hex(x) {
        return ("0" + parseInt(x).toString(16)).slice(-2);
    }
    return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
}

export function encodeIntoQuery(data, discardEmptyOrNull) {
    var ret = [];
    for (var key in data) {
        if (data.hasOwnProperty(key)) {
            if (discardEmptyOrNull && !data[key] && typeof data[key] !== 'number')
                continue;
            ret.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
        }
    }
    return ret ? '?' + ret.join('&') : '';
}

export function decodeQuery(url, discardEmpty) {
    url = (url || window.location.href).split('?')[1] || '';
    var ret = {}, url, qKVP, qParts = url.split('&');
    for (var i = 0; i < qParts.length; i++) {
        qKVP = qParts[i].split('=');
        if (discardEmpty && (!qKVP[0] || !qKVP[1])) continue;
        ret[decodeURIComponent(qKVP[0])] = decodeURIComponent(qKVP[1]);
    }
    return ret;
}