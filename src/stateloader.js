const $ = require('jquery');
const interactivity = require('./interactivity');

class StateLoader {

    constructor() {
    }

    readData(data) {

        //if everyting is ok, delete all content on the page.
        interactivity.RemoveAll();

        document.getElementById('mainh').innerHTML = data.static.name;
        let elems = data.elems;
        let lines = data.lines;
        // console.log(elems);
        // console.log(lines);

        let id_elems = [];

        for (let i = 0; i < elems.length; i++) {
            // let output = interactivity.CreateElement(elems[i].type, elems[i].leftpos, elems[i].toppos,
            //     elems[i]['font-size'], elems[i]['background-color'], 
            //     elems[i].content, elems[i].boxshadowoffset, 
            //     elems[i].width, elems[i].height, elems[i].key)
            const output = interactivity.CreateElement(elems[i]);
            id_elems[elems[i].id] = output;
        }
        // console.log(id_elems);
        for (let i = 0; i < lines.length; i++) {
            let elem1 = id_elems[lines[i].elem1];
            let elem2 = id_elems[lines[i].elem2];
            // console.log("id elems", id_elems);
            // console.log("line element 1 = ", elem1)
            // console.log("line element 2 = ", elem2)
            interactivity.CreateLine(lines[i]["stroke-width"], lines[i]["stroke-color"], elem1, elem2, lines[i].key);
        }

        $('#mainh').val(data.static.name);

    }

}



module.exports = new StateLoader();
