const core = require('./core.js');
const $ = require('jquery');
const interactivity = require('./interactivity');

class StateSave {
    constructor() {
        this.typetoclass = {
            "mmmain": 0,
            "mmheader": 1,
            "mmnote": 2
        };
        window.StateSave = this;
    }

    compileState (id) {

        let mmname = $(document.getElementById('mainh')).val();

        var elems = interactivity.globalelems;
        var lines = interactivity.globallines;

        var savableelems = [];
        var savablelines = [];
        var staticdata = {};

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
                if (connected_elems[j].elem["save_id"] == undefined || connected_elems[j].line["save_id"] == undefined) {
                    throw Error('one of the connected elements is null or undefined' + connected_elems[j].elem);
                }
                var connected_elem = {
                    "lineid": parseInt(connected_elems[j].line["save_id"]).toString(),
                    "elemid": parseInt(connected_elems[j].elem["save_id"]).toString(),
                }
                savebleconectedelems.push(connected_elem);
            }
            // console.log(savebleconectedelems);
            let elemclass = elems[i].attr('class').trim().split(/\s+/)[1];
            //console.log(typetoclass[elemclass]);
            let elem = {
                "id": elems[i]["save_id"],
                "key": $(elems[i]).attr('data-key'),
                "type": this.typetoclass[elemclass],
                "leftpos": $(elems[i]).css("left"),
                "toppos": $(elems[i]).css("top"),
                "connected_elems": savebleconectedelems,
                "font-size": $(elems[i]).children(this.typetoclass[elemclass] == 2 ? 'textarea' : 'input').css('font-size'),
                "width": $(elems[i]).children('textarea').css('width'),
                "height": $(elems[i]).children('textarea').css('height'),
                "content": $(elems[i]).children(this.typetoclass[elemclass] == 2 ? 'textarea' : 'input').val(),
            };
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

