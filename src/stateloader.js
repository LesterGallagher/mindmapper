const $ = require('jquery');
const interactivity = require('./interactivity');

class StateLoader {

    constructor() {
    }

    readData(data) {
        // if everyting is ok, delete all content on the page.
        // TODO check if everyting is ok
        interactivity.RemoveAll();

        document.getElementById('mainh').value = data.static.name;
        let elems = data.elems;
        let lines = data.lines;

        let id_elems = [];

        for (let i = 0; i < elems.length; i++) {
            const output = interactivity.CreateElement(elems[i]);
            id_elems[elems[i].id] = output;
        }
        for (let i = 0; i < lines.length; i++) {
            let elem1 = id_elems[lines[i].elem1];
            let elem2 = id_elems[lines[i].elem2];
            interactivity.CreateLine(lines[i]["stroke-width"], lines[i]["stroke-color"], elem1, elem2, lines[i].key);
        }
        $('#mainh').val(data.static.name);
    }

}



module.exports = new StateLoader();
