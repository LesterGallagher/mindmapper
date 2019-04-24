const core = require('./core.js');
const $ = require('jquery');
const interactivity = require('./interactivity');

class StateSave {
    constructor() {
        this.typeToClass = {
            'mmmain': interactivity.elementType.LARGE,
            'mmheader': interactivity.elementType.MIDDLE,
            'mmnote': interactivity.elementType.SMALL,
            'mmimage': interactivity.elementType.IMAGE
        };
        window.StateSave = this;
    }

    compileState(id) {

        let mmname = $(document.getElementById('mainh')).val();

        var elems = interactivity.globalelems;
        var lines = interactivity.globallines;

        var savableelems = [];
        var savablelines = [];
        var staticdata = {};

        console.log(elems);
        console.log(lines);

        for (let i = 0; i < elems.length; i++) {
            elems[i]["save_id"] = i;
        }
        for (let i = 0; i < lines.length; i++) {
            lines[i]["save_id"] = i;
        }
        for (let i = 0; i < elems.length; i++) {
            //console.log(elems[i]);
            var connected_elems = elems[i]['mmdata'].connected_elems;
            var savebleconectedelems = [];
            for (let j = 0; j < connected_elems.length; j++) {
                // console.log(connected_elems[j]);
                // console.log(connected_elems[j].elem["save_id"]);
                // console.log(connected_elems[j].line["save_id"]);
                if (connected_elems[j].elem["save_id"] === undefined || connected_elems[j].line["save_id"] === undefined) {
                    console.error('one of the connected elements is null or undefined' + connected_elems[j].elem);
                    continue;
                }
                var connected_elem = {
                    "lineid": parseInt(connected_elems[j].line["save_id"]).toString(),
                    "elemid": parseInt(connected_elems[j].elem["save_id"]).toString(),
                }
                Object.keys(connected_elem).forEach(key => connected_elem[key] === undefined && delete connected_elem[key]);
                savebleconectedelems.push(connected_elem);
            }
            // console.log(savebleconectedelems);
            let elemclass = elems[i].attr('class').trim().split(/\s+/)[1];
            //console.log(typetoclass[elemclass]);
            var elem;

            const type = this.typeToClass[elemclass];

            if (type === interactivity.elementType.IMAGE) {
                elem = {
                    "id": elems[i]["save_id"],
                    "key": $(elems[i]).attr('data-key'),
                    "type": type,
                    src: $(elems[i]).find('img').attr('src'),
                    "leftpos": $(elems[i]).css("left"),
                    "toppos": $(elems[i]).css("top"),
                    "connected_elems": savebleconectedelems,
                    "width": $(elems[i]).find('img').width() + 'px',
                    "content": $(elems[i]).find('img').attr('src')
                };
            } else {
                elem = {
                    "id": elems[i]["save_id"],
                    "key": $(elems[i]).attr('data-key'),
                    "type": type,
                    "leftpos": $(elems[i]).css("left"),
                    "toppos": $(elems[i]).css("top"),
                    "connected_elems": savebleconectedelems,
                    "font-size": $(elems[i]).children(this.typeToClass[elemclass] == 2 ? 'textarea' : 'input').css('font-size'),
                    "width": $(elems[i]).children('textarea').css('width'),
                    "height": $(elems[i]).children('textarea').css('height'),
                    "content": $(elems[i]).children(this.typeToClass[elemclass] == 2 ? 'textarea' : 'input').val(),
                };
            }
            Object.keys(elem).forEach(key => elem[key] === undefined && delete elem[key]);

            //console.log(elem);
            savableelems.push(elem);
        }
        for (let i = 0; i < lines.length; i++) {
            // console.log(lines[i]["connected_elems"]);
            let line = {
                "id": lines[i]["save_id"].toString(),
                "key": $(elems[i]).attr('data-key'),
                "stroke-width": $(lines[i]).css('stroke-width'),
                "stroke-color": core.GetColorOrUndefined($(lines[i]).css('stroke-color')),
                "elem1": lines[i]["connected_elems"].elem1["save_id"],
                "elem2": lines[i]["connected_elems"].elem2["save_id"]
            }
            Object.keys(line).forEach(key => line[key] === undefined && delete line[key]);
            savablelines.push(line);
        }
        staticdata = {
            "name": mmname,
            id: id,
            timestamp: Date.now()
        };

        //put all the data in the savable object.
        var savableobject = {
            "static": staticdata,
            "elems": savableelems,
            "lines": savablelines,
        };
        return savableobject;
    }
}

module.exports = new StateSave();

