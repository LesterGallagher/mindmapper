
const { room, ispublic, name, id } = decodeQuery(null, true);

module.exports = {
    apiUrl: 'https://api.esstudio.site/api/mindviewer-web',
    room,
    ispublic, 
    name: name || '',
    id
}

function encodeIntoQuery(data, discardEmptyOrNull) {
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

function decodeQuery(url, discardEmpty) {
    url = (url || window.location.href).split('?')[1] || '';
    var ret = {}, url, qKVP, qParts = url.split('&');
    for (var i = 0; i < qParts.length; i++) {
        qKVP = qParts[i].split('=');
        if (discardEmpty && (!qKVP[0] || !qKVP[1])) continue;
        ret[decodeURIComponent(qKVP[0])] = decodeURIComponent(qKVP[1]);
    }
    return ret;
}