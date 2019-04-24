import { decodeQuery } from './util';
const { room, ispublic, name, id, firestore, theme } = decodeQuery(null, true);

module.exports = {
    apiUrl: 'https://api.esstudio.site/api/mindviewer-web',
    room,
    ispublic, 
    name: name || '',
    id,
    firestore,
    theme
}

console.log('conf', module.exports);
