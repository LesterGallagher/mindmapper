import { decodeQuery } from './util';
const { room, ispublic, name, id, firestore } = decodeQuery(null, true);

console.log(room, ispublic, name, id);

module.exports = {
    apiUrl: 'https://api.esstudio.site/api/mindviewer-web',
    room,
    ispublic, 
    name: name || '',
    id,
    firestore
}

