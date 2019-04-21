const core = require('./core.js');
const $ = require('jquery');
const { EventEmitter } = require('events');
let activeElem;
let globalelems = exports.globalelems = [];
let globallines = exports.globallines = [];
const { throttle } = require('./core');
const nodeImageModal = require('./node-image-modal');

const elementType = exports.elementType = {
    LARGE: 0,
    MIDDLE: 1,
    SMALL: 2,
    IMAGE: 3
};

let saved = true;

exports.getSaved = () => saved;

exports.setSaved = () => saved = true;

const globalelemnsHashed = window.globalelemnsHashed = exports.globalelemnsHashed = {};
const globallinesHashed = window.globallinesHashed = exports.globallinesHashed = {};

let mousedown = false;
$(window).on('mousedown', () => mousedown = true);
$(window).on('mouseup', () => mousedown = false);

class Field extends EventEmitter {
    constructor() {
        super();
        const $field = $('#field');
        const fieldContentInput = e => {
            const content = e.target.value;
            const key = $(e.target).parent('.mmelem').attr('data-key');
            fieldEmitThrottled('elem_modified', { key, content });
        }
        $field.on('input', '.mmelem textarea', fieldContentInput);
        $field.on('input', '.mmelem input', fieldContentInput);

        const textAreaSizeChange = e => {
            const width = $(e.target).outerWidth();
            const height = $(e.target).outerHeight();
            const id = globalelems.map(x => x[0]).indexOf($(e.target).closest('.mmelem')[0]);
            const key = $(e.target).attr('data-key');
            fieldEmitThrottled('elem_modified', { key, width, height });
            globalelems[id].UpdateAllConnectedLines();
        }

        $(window).on('mousemove', e => {
            if (mousedown && $(e.target).is('.mmelem textarea')) textAreaSizeChange(e);
        });

        $field.on('mouseup', '.mmelem textarea', textAreaSizeChange);
    }
}

const field = exports.field = new Field();

const fieldEmitThrottled = throttle((type, payload) => field.emit(type, payload), 1000 / 25);

exports.RemoveAll = () => {
    globallines.length = 0;
    globalelems.length = 0;
    for (const key in globalelemnsHashed) {
        if (globalelemnsHashed.hasOwnProperty(key)) {
            delete globalelemnsHashed[key];
        }
    }
    for (const key in globallinesHashed) {
        if (globallinesHashed.hasOwnProperty(key)) {
            delete globallinesHashed[key];
        }
    }
    $('svg').empty();//remove all lines
    $('#field').children('.mmelem').remove();
    saved = false;
}
exports.CreateElement = (state) => {
    const { type, leftpos, toppos, fontsize, backgroundcolor, content, boxshadowcol, width, height, key } = state;
    let loadedelem = CreateNewElement(type, key).elem;
    $(loadedelem).css('left', leftpos);
    $(loadedelem).css('top', toppos);
    $(loadedelem).children('textarea').css('font-size', fontsize);
    $(loadedelem).children('textarea').css('width', width);
    $(loadedelem).children('textarea').css('height', height);
    $(loadedelem).children('textarea').val(content);
    $(loadedelem).children('textarea').on('click', e => e.stopPropagation());
    $(loadedelem).children('input').on('click', e => e.stopPropagation());
    $(loadedelem).children('input').css('font-size', fontsize);
    $(loadedelem).children('input').val(content);
    $(loadedelem).find('img').attr('width', (width || '').replace('px', ''));
    $(loadedelem).find('img').attr('src', content);
    if (backgroundcolor !== undefined) {
        $(loadedelem).css('background-color', backgroundcolor);
    }

    saved = false;
    return loadedelem;
}

function CreateLine(strokewidth, strokecolor, elem1, elem2, key, emit = false) {
    exports.CreateLine(strokewidth, strokecolor, elem1, elem2, key);

    if (emit) {
        fieldEmitThrottled('line_created', {
            strokewidth,
            strokecolor,
            key1: $(elem1).attr('data-key'),
            key2: $(elem2).attr('data-key'),
            key
        });
    }

    saved = false;
}

exports.CreateLine = (strokewidth, strokecolor, elem1, elem2, key) => {
    let elem = elem1;
    var pos = core.GetMiddleOfElement(elem);
    var svg_wrapper = $('#svg_wrapper');


    var line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    line.setAttribute('d', "M282,143 C151,140 395,421 271,415");
    line.setAttribute('d', SetPathData(line, 'x1', pos.x, 0, 0));
    line.setAttribute('d', SetPathData(line, 'y1', pos.y, 0, 0));
    line.setAttribute('d', SetPathData(line, 'x2', pos.x, 0, 0));
    line.setAttribute('d', SetPathData(line, 'y2', pos.y, 0, 0));

    line.setAttribute('class', "genline");

    line.ChangeWidth = (e) => {
        var amount = e.wheelDelta;
        amount = (amount / Math.abs(amount));
        var strokewidth = +($(line)[0].style['stroke-width'] || '3').replace("px", '');
        if (strokewidth >= 10 && amount > 0)
            amount = 0;

        else if (strokewidth <= 2 && amount < 0)
            amount = 0;

        $(line).css('stroke-width', (strokewidth + amount) + "px");
    };
    $(line).mouseenter(() => {
        // line.addEventListener('mousewheel', line.ChangeWidth);
    });
    $(line).mouseleave(() => {
        // line.removeEventListener('mousewheel', line.ChangeWidth, false);
    });
    $(line).click(() => {
        RemoveLine(line, true);
    });
    $(line).mouseover(() => {
        window.activeElem = line;
    });

    svg_wrapper.append(line);


    elem = elem2;
    let thispos = core.GetMiddleOfElement(elem);

    line.setAttribute('d', SetPathData(line, 'x2', thispos.x, 0, 0));
    line.setAttribute('d', SetPathData(line, 'y2', thispos.y, 0, 0));

    //set mmdata
    line['connected_elems'] = { elem1: elem1, elem2: elem2 };
    elem1.mmdata.connected_elems.push({ elem: elem2, line: line });
    elem2.mmdata.connected_elems.push({ elem: elem1, line: line });

    elem1.mmdata.connected_elems.forEach((item) => {
        elem1.UpdateConnectedLines(item);
    });
    elem2.mmdata.connected_elems.forEach((item) => {
        elem2.UpdateConnectedLines(item);
    });
    globallines.push(line);
    $(line).attr('data-key', key);
    globallinesHashed[key] = line;


    if (strokewidth) {
        $(line).css('stroke-width', strokewidth);
    }

    if (strokecolor) {
        $(line).css('stroke-color', `rgb( ${strokecolor.join()})`);
    }
    saved = false;
}

$(document).ready(() => {

    const key = Math.random().toString(36);
    CreateNewElement(0, key);
    $(document).click(() => {
        $('#color-picker').css('display', 'none');

    });

    $(document).mouseup(() => {
        if (window.currdrag !== undefined) {
            RemoveActiveLine();
        }
        //unbind all mousemove events from the document when the mouse is up.
        $(document).unbind('mousemove.elem-move');
    });

    $('#spawn_elem_btn0').click(() => {
        const key = Math.random().toString(36);
        CreateNewElement(elementType.LARGE, key, true);
    });
    $('#spawn_elem_btn1').click(() => {
        const key = Math.random().toString(36);
        CreateNewElement(elementType.MIDDLE, key, true);
    });
    $('#spawn_elem_btn2').click(() => {
        const key = Math.random().toString(36);
        CreateNewElement(elementType.SMALL, key, true);
    });
    $('#spawn_elem_btn3').click(() => {
        const key = Math.random().toString(36);
        CreateNewElement(elementType.IMAGE, key, true);
    });
    $('#color-picker').click((e) => {
        e.stopPropagation();
    });
    var colorpicker = document.getElementById('color-picker');
    colorpicker.GetColor = (activeElement) => {
        return core.GetColor($(activeElement).css('background-color').toString());
    }
    colorpicker.GetColorHex = (activeElement) => {
        let colors = colorpicker.GetColor(activeElement);
        return core.rgbToHex(colors);
    }



    colorpicker.AssignColorSlider = (hex_or_colorvalue) => {
        //if window.activeElem is not defined or null. return.
        if (!window.activeElem)
            return;

        let red = 255, green = 255, blue = 255;
        if (hex_or_colorvalue.trim().startsWith('#') == false) {
            //the argument is not a hex value.
            red = parseInt($('#color-picker').children('#red').val(), 10);
            green = parseInt($('#color-picker').children('#green').val(), 10);
            blue = parseInt($('#color-picker').children('#blue').val(), 10);

            $('#color-picker').children('#hex').val(core.rgbToHex([red, green, blue]));
        }
        else if (/^#([\da-z]{6})$/i.test(hex_or_colorvalue.trim()) == true) {
            //this is a valid hex value
            let hex = hex_or_colorvalue.trim().match(/^#([\da-z]{6})$/i)[1];
            red = parseInt(hex.slice(0, 2), 16);
            green = parseInt(hex.slice(2, 4), 16);
            blue = parseInt(hex.slice(4, 6), 16);

            $('#color-picker').children('#red').val(red);
            $('#color-picker').children('#green').val(green);
            $('#color-picker').children('#blue').val(blue);
        }
        else {
            throw Error("the function is unclear about this argument: " + hex_or_colorvalue);
        }
        if ($(window.activeElem).css('box-shadow') != 'none') {
            var boxshadow = $(window.activeElem).css('box-shadow');
            if (!window.activeElem.shadowOffset) {
                var prevcolors = colorpicker.GetColor(window.activeElem);
                //in this case it is safe to pass the whole box shadow css element into the 'GetColor' function. 
                //Because the function only uses argument between paranteses. ie: rgb(121,220,102) 2px 2px 5px 1px, becomes: 121,220,102;
                var boxshadowcol = core.GetColor(boxshadow);
                var offset = [(boxshadowcol[0] - prevcolors[0]), (boxshadowcol[1] - prevcolors[1]), (boxshadowcol[2] - prevcolors[2])];
                window.activeElem["shadowOffset"] = offset;
            }
            //get shadow-to-background-color offset to preserve the elements initial style.
            offset = window.activeElem.shadowOffset;
            boxshadowcol = [red + offset[0], green + offset[1], blue + offset[2]];
            $(window.activeElem).css('box-shadow', boxshadow.replace(/\(.+\)/, `(${boxshadowcol.join()})`)); //create a new css element from the old boxhadow css element.
        }
        $(window.activeElem).css('background-color', `rgb(${[red, green, blue].join()})`);
    }

    colorpicker.childNodes.forEach((item) => {
        //return if window.activeElem is null or undefined.
        item.oninput = () => {
            if (!window.activeElem)
                return;
            colorpicker.AssignColorSlider($(item).val());
        }
    });
});

function RemoveActiveLine() {
    window.currdrag['diddrag'] = false;
    var line = window.currdrag['line'];
    // RemoveLine(line);
    $(line).remove();
    window.currdrag = undefined;
};
/**
 * Function rhat is responsible for creating new elements.
 * param {int} type - The type of element, 0 = main, 1 = heading, 2 = note
 */

function CreateNewElement(type, key, emit = false) {

    let htmltype;

    switch (type) {
        case 0:
            //This is a main element.
            htmltype = `
            <div class="mmelem mmmain">
            <input class="mm_title" type="text" name="title" value="new title">
            <button class="mmclose" type="button"></button>            
            </div>`;
            break;
        case 1:
            //This is a header element.
            htmltype = `
            <div class="mmelem mmheader">
            <input class="mm_title" type="text" name="title" value="new title">
            <button class="mmclose" type="button"></button>            
            </div>`;
            break;
        case 2:
            //This a note element the least important one.
            htmltype = `
            <div class="mmelem mmnote">
            <textarea name="textarea" style:"width:100px;height:60px;" class="mmcontent"></textarea>
            <button class="mmclose" type="button"></button>            
            </div>`;
            break;
        case 3:
            htmltype = `<div class="mmelem mmimage">
            <img alt="Mindviewer media node" src="https://via.placeholder.com/150">
            <button class="mmclose" type="button"></button>            
            </div>`;
            break;
        default:
            //This is a safeguard case.
            htmltype = `
            <div class="mmelem mmheader">
            <input class="mm_title" type="text" name="title" value="new title">
            <button class="mmclose" type="button"></button>            
            </div>`;
            //throw Error("No valid type was selected: "+type);
            break;
    }

    let field = document.getElementById('field');
    field.insertAdjacentHTML('beforeend', htmltype);
    let newelem = field.lastChild;
    let elem = $(newelem);
    newelem['jqeurydata'] = elem;

    $(elem).attr('data-key', key);
    $(elem).find('textarea').on('click', e => e.stopPropagation());
    globalelems.push(elem);
    globalelemnsHashed[key] = elem;

    newelem.childNodes.forEach(function (item) {
        item.onmousedown = ((e) => { mousedown = true; e.stopPropagation(); })

        //prevent textarea scrolling. when scroling the mousewheel.
        if ($(item).is('textarea')) { item.onwheel = function () { return false; } }
    }, this);

    $(elem).css("top", 80 + Math.floor(Math.random() * 20) + 'px');
    $(elem).css("left", 80 + Math.floor(Math.random() * 20) + 'px');


    elem['mmdata'] = {
        name: "newelem",
        connected_elems: [],
        containsElem: function (item) {
            for (let i = 0; i < elem['mmdata'].connected_elems.length; i++) {
                if (elem['mmdata'].connected_elems[i].elem == item)
                    return true;
            }
            /*else*/return false;

        }
    };



    elem.mousedown((_e) => {

        // console.log(window.currdrag);

        _e.stopPropagation();
        window.activeElem = elem;

        //did we drag a line from another elem to this elem?
        if (window.currdrag !== undefined) {

            //did we drop the line on the same element as we started from. in that case remove the line;
            window.currdrag;

            if (window.currdrag == elem) {
                console.log('dragged a line to itself');
                $(window).mouseup();
                RemoveActiveLine();
                return;
            }

            if (window.currdrag.mmdata.containsElem(elem) || elem.mmdata.containsElem(window.currdrag)) {
                console.log('already dragged a line between these nodes');
                $(window).mouseup();
                RemoveActiveLine();
                return;
            }

            let thisline = window.currdrag['line'];
            thisline.setAttribute('class', "genline");
            let thispos = core.GetMiddleOfElement(elem);

            thisline.setAttribute('d', SetPathData(thisline, 'x2', thispos.x, 0, 0));
            thisline.setAttribute('d', SetPathData(thisline, 'y2', thispos.y, 0, 0));

            //set mmdata
            thisline['connected_elems'] = { elem1: elem, elem2: window.currdrag };
            window.currdrag.mmdata.connected_elems.push({ elem: elem, line: thisline });
            elem.mmdata.connected_elems.push({ elem: window.currdrag, line: window.currdrag['line'] });

            window.currdrag.mmdata.connected_elems.forEach((item) => {
                window.currdrag.UpdateConnectedLines(item);
            });
            elem.mmdata.connected_elems.forEach((item) => {
                elem.UpdateConnectedLines(item);
            });
            globallines.push(thisline);
            const key = Math.random().toString(36);
            $(thisline).attr('data-key', key);
            globallinesHashed[key] = thisline;

            fieldEmitThrottled('line_created', {
                strokewidth: $(thisline).css('strokeWidth'),
                strokecolor: $(thisline).css('strokeColor'),
                key1: $(elem).attr('data-key'),
                key2: $(window.currdrag).attr('data-key'),
                key
            });

            window.currdrag = undefined;

            //update how the line looks
            return;
        }


        let offsetX = elem.css("left").replace('px', "") - _e.pageX;
        let offsetY = elem.css("top").replace('px', "") - _e.pageY;

        elem['diddrag'] = false;
        $(document).on('mousemove.elem-move', (e) => {
            var x = e.pageX + offsetX,
                y = e.pageY + offsetY;

            elem.css("top", y);
            elem.css("left", x);

            elem.mmdata.connected_elems.forEach((item) => {
                elem.UpdateConnectedLines(item);
            });

            const key = $(elem).attr('data-key');

            fieldEmitThrottled('elem_modified', { leftpos: x, toppos: y, key });

            if (Math.abs(_e.pageX - e.pageX) > 5 || Math.abs(_e.pageY - e.pageY) > 5) {
                elem['diddrag'] = true;
            }
        });
    });
    elem.UpdateAllConnectedLines = () => {
        elem.mmdata.connected_elems.forEach((item) => {
            elem.UpdateConnectedLines(item);
        });
    }

    elem.UpdateConnectedLines = (item) => {
        var line = item.line;
        var elem1 = item.line.connected_elems.elem1;
        var elem2 = item.line.connected_elems.elem2;


        if (elem1 === elem) {
            let despos = GetDesiredPosition(elem1, item.elem);
            let bezieroffset = GetBezierOffset(elem1, item.elem, 400);
            line.setAttribute('d', SetPathData(line, 'x2', despos.x, bezieroffset.x, bezieroffset.y));
            line.setAttribute('d', SetPathData(line, 'y2', despos.y, bezieroffset.x, bezieroffset.y));

            despos = GetDesiredPosition(item.elem, elem1);
            bezieroffset = GetBezierOffset(item.elem, elem1, 400);
            line.setAttribute('d', SetPathData(line, 'x1', despos.x, bezieroffset.x, bezieroffset.y));
            line.setAttribute('d', SetPathData(line, 'y1', despos.y, bezieroffset.x, bezieroffset.y));
        }
        else if (elem2 === elem) {
            let despos = GetDesiredPosition(elem2, item.elem);
            let bezieroffset = GetBezierOffset(elem2, item.elem, 400);
            line.setAttribute('d', SetPathData(line, 'x1', despos.x, bezieroffset.x, bezieroffset.y));
            line.setAttribute('d', SetPathData(line, 'y1', despos.y, bezieroffset.x, bezieroffset.y));

            despos = GetDesiredPosition(item.elem, elem2);
            bezieroffset = GetBezierOffset(item.elem, elem2, 400);
            line.setAttribute('d', SetPathData(line, 'x2', despos.x, bezieroffset.x, bezieroffset.y));
            line.setAttribute('d', SetPathData(line, 'y2', despos.y, bezieroffset.x, bezieroffset.y));
        }
        else {
            throw Error("element contains a line which doesnt hold a reference to that line.")
        }
    };
    elem.click((e) => {
        // console.log('click');
        e.stopPropagation();
        //check if a line was dragged to this element,
        //and if the line dragged from that element was not the current element.
        //else
        if (elem['diddrag'] == false) {
            //draw line to next click

            //get line startposition
            var pos = core.GetMiddleOfElement(elem);

            //create new line and add that the reference this element.
            var svg_wrapper = $('#svg_wrapper');


            var line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            line.setAttribute('d', "M282,143 C151,140 395,421 271,415");
            line.setAttribute('d', SetPathData(line, 'x1', pos.x, 0, 0));
            line.setAttribute('d', SetPathData(line, 'y1', pos.y, 0, 0));
            line.setAttribute('d', SetPathData(line, 'x2', pos.x, 0, 0));
            line.setAttribute('d', SetPathData(line, 'y2', pos.y, 0, 0));

            line.setAttribute('class', "pregenline");

            line.ChangeWidth = (e) => {
                var amount = e.wheelDelta;
                amount = (amount / Math.abs(amount));
                var strokewidth = parseInt($(line).css('stroke-width').replace("px", ''), 10);
                if (strokewidth >= 10 && amount > 0)
                    amount = 0;

                else if (strokewidth <= 2 && amount < 0)
                    amount = 0;

                $(line).css('stroke-width', (strokewidth + amount) + "px");
            };
            $(line).mouseenter(() => {
                // line.addEventListener('mousewheel', line.ChangeWidth);
            });
            $(line).mouseleave(() => {
                // line.removeEventListener('mousewheel', line.ChangeWidth, false);
            });
            $(line).click(() => {
                RemoveLine(line, true);
            });
            $(line).mouseover(() => {
                window.activeElem = line;
            });

            svg_wrapper.append(line);
            elem['line'] = line;

            window.currdrag = elem;

            $(document).on('mousemove.elem-move', (e) => {

                var x = e.pageX + field.scrollLeft,
                    y = e.pageY + field.scrollTop;

                //set endpoint positions
                line.setAttribute('d', SetPathData(line, 'x2', x, 0, 0));
                line.setAttribute('d', SetPathData(line, 'y2', y, 0, 0));

                elem['diddrag'] = true;
            });
        }
    });
    $(elem).on('click', 'img', function(e) {
        nodeImageModal.open($(elem).get(0));
    });
    //Close this element
    elem.RemoveThis = (emit = false) => {
        while (elem.mmdata.connected_elems.length > 0) {
            RemoveLine(elem.mmdata.connected_elems[elem.mmdata.connected_elems.length - 1].line);
        }
        globalelems.splice(globalelems.indexOf(elem), 1);
        const key = $(elem).attr('data-key');
        delete globalelemnsHashed[key];
        $(elem).remove();
        if (emit) {
            fieldEmitThrottled('elem_removed', {
                key
            });
        }
    };
    //User presses the close button.
    $(elem).children('.mmclose').click(() => {
        elem.RemoveThis(true);
    });
    //ChangeSize the element. this is fired when someone is hovering over the element and scrolls.
    elem.ChangeSize = (amount) => {
        let prevwidth = parseFloat($(elem).outerWidth());
        let prevheight = parseFloat($(elem).outerHeight());

        amount = (amount / Math.abs(amount)) * 8;

        var fontsize;

        switch (type) {
            case elementType.LARGE:
                //This is a main element.
                fontsize = parseFloat($(elem).children('.mm_title').css("font-size").replace("em", ''));
                if (fontsize < 10 && amount < 0)
                    amount = 0;
                else if (fontsize > 200 && amount > 0)
                    amount = 0;
                $(elem).children('.mm_title').css("font-size", fontsize + amount / 4);

                break;
            case elementType.IMAGE:
                const $img = $(elem).find('img');
                $img.attr('width', $img.width() * (1 + amount / 40));
                break;
            case elementType.MIDDLE:
                //This is a header element.
                fontsize = parseFloat($(elem).children('.mm_title').css("font-size").replace("em", ''));
                if (fontsize < 10 && amount < 0)
                    amount = 0;
                else if (fontsize > 140 && amount > 0)
                    amount = 0;
                $(elem).children('.mm_title').css("font-size", fontsize + amount / 4);
                break;
            case elementType.SMALL:
                //This a note element the least important one.
                let prevtextwidth = $(elem).children('textarea').css('width')
                let prevtextheight = $(elem).children('textarea').css('height')
                fontsize = parseFloat($(elem).children('textarea').css("font-size").replace("em", ''));
                if (fontsize < 10 && amount < 0)
                    amount = 0;
                else if (fontsize > 80 && amount > 0)
                    amount = 0;
                $(elem).children('textarea').css("font-size", fontsize + amount / 4);
                $(elem).children('textarea').css('width', prevtextwidth)
                $(elem).children('textarea').css('height', prevtextheight)

                break;
            default:
                //Resize the actual element itself:

                let cwidth = parseInt($(elem).css("width").replace("px", ""), 10);
                let cheight = parseInt($(elem).css("height").replace("px", ""), 10);

                $(elem).css('width', (cwidth + amount) + "px");
                $(elem).css('height', (cheight + amount) + "px");

                break;
        }
        let cleft = +$(elem).css("left").replace("px", "");
        let ctop = +$(elem).css("top").replace("px", "");

        let currwidth = parseFloat($(elem).outerWidth());
        let currheight = parseFloat($(elem).outerHeight());
        let Xoffset = (prevwidth - currwidth) / 2;
        let Yoffset = (prevheight - currheight) / 2;

        $(elem).css("left", cleft + Xoffset + "px");
        $(elem).css("top", ctop + Yoffset + "px");
        elem.UpdateAllConnectedLines();

        const id = globalelems.map(x => x[0]).indexOf(elem[0]);
        const key = $(elem).attr('data-key');
        fieldEmitThrottled('elem_modified', { key, 'font-size': fontsize, leftpos: cleft + Xoffset, toppos: ctop + Yoffset });
    }
    //This function is binded to the window scroll event when the user hovers over the element. It gets removed once curser leaves the element.
    elem.onElemScroll = (e) => {
        elem.ChangeSize(e.wheelDelta);
    };
    //This event binds the window scroll event the elements 'elem.onElemScroll' eventhandler.
    $(elem).mouseenter(() => {
        window.addEventListener('mousewheel', elem.onElemScroll);
    });
    //This event unbinds the window scroll event the elements 'elem.onElemScroll' eventhandler.
    $(elem).mouseleave(() => {
        //unbingding all scroll events on the window.
        window.removeEventListener('mousewheel', elem.onElemScroll, false);
    });
    elem.UpdateMMdata = (elem) => {
        elem.mmdata.connected_elems.push({ elem: window.currdrag, line: window.currdrag['line'] });
    }

    const left = +$(elem).css("left").replace("px", "");
    const top = +$(elem).css("top").replace("px", "");

    if (emit) {
        fieldEmitThrottled('elem_created', {
            key,
            leftpos: left,
            toppos: top,
            type: type,
            key,
            content: elem.find('input, textarea').val()
        });
    }

    saved = false;

    return { "elem": elem, "updatemmdata": elem.UpdateMMdata };
}

function GetDesiredPosition(refelem, otherelem) {
    let leftpos = core.GetLeftMiddle(refelem);
    let rightpos = core.GetRightMidle(refelem);

    let otherleftpos = core.GetLeftMiddle(otherelem);
    let otherrightpos = core.GetRightMidle(otherelem);

    if (leftpos.x > otherrightpos.x) {
        return leftpos;
    }
    else if (rightpos.x < otherleftpos.x) {
        return rightpos;
    }
    else {
        return core.GetMiddleOfElement(refelem);
    }
}
function GetBezierOffset(refelem, otherelem, offsetvalue) {
    let midpos = core.GetMiddleOfElement(refelem);
    let leftpos = core.GetLeftMiddle(refelem);
    let rightpos = core.GetRightMidle(refelem);

    let othermidpos = core.GetMiddleOfElement(otherelem);
    let otherleftpos = core.GetLeftMiddle(otherelem);
    let otherrightpos = core.GetRightMidle(otherelem);

    //determine the bezier position to return, also based on the distance from eachother
    if (leftpos.x > otherrightpos.x) {
        return {
            x: -(GetDistance(leftpos, otherrightpos) < offsetvalue
                ? GetDistance(leftpos, otherrightpos)
                : offsetvalue) / 3,
            y: 0
        };
    }
    else if (rightpos.x < otherleftpos.x) {
        return {
            x: (GetDistance(rightpos, otherleftpos) < offsetvalue
                ? GetDistance(rightpos, otherleftpos)
                : offsetvalue) / 3,
            y: 0
        };
    }
    else if (leftpos.y < otherleftpos.y) {
        return {
            x: 0,
            y: (GetDistance(midpos, othermidpos) < offsetvalue
                ? GetDistance(midpos, othermidpos)
                : offsetvalue) / 3
        };
    }
    else {
        return {
            x: 0,
            y: -(GetDistance(othermidpos, midpos) < offsetvalue
                ? GetDistance(othermidpos, midpos)
                : offsetvalue) / 3
        };
    }
};
function GetDistance(pos1, pos2) {
    return Math.sqrt(
        Math.pow(Math.abs(parseInt(pos1.x) - parseInt(pos2.x, 10)), 2)
        + Math.pow(Math.abs(parseInt(pos1.y) - parseInt(pos2.y, 10)), 2)
    );
}

function SetPathData(path, attrname, value, xboffset, yboffset) {
    var data = path.getAttribute('d');
    var splitted_data = data.split(/\s+/);
    var newPathData;

    if (attrname == 'x1') {
        let datacoords = splitted_data[0].split(/,\s?/);
        datacoords[0] = parseInt(datacoords[0].replace(/[MC]/i, ''), 10);
        datacoords[1] = parseInt(datacoords[1], 10);
        splitted_data[0] = `M${value},${datacoords[1]}`;
        splitted_data[1] = `C${value + xboffset},${datacoords[1] + yboffset}`;
        newPathData = splitted_data.join(' ');
    }
    else if (attrname == 'y1') {
        let datacoords = splitted_data[0].split(/,\s?/);
        datacoords[0] = parseInt(datacoords[0].replace(/[MC]/i, ''), 10);
        datacoords[1] = parseInt(datacoords[1], 10);
        splitted_data[0] = `M${datacoords[0]},${value}`;
        splitted_data[1] = `C${datacoords[0] + xboffset},${value + yboffset}`;
        newPathData = splitted_data.join(' ');
    }
    else if (attrname == 'x2') {
        let datacoords = splitted_data[3].split(/,\s?/);
        datacoords[0] = parseInt(datacoords[0], 10);
        datacoords[1] = parseInt(datacoords[1], 10);
        splitted_data[3] = `${value},${datacoords[1]}`;
        splitted_data[2] = `${value + xboffset},${datacoords[1] + yboffset}`;
        newPathData = splitted_data.join(' ');

    }
    else if (attrname == 'y2') {

        let datacoords = splitted_data[3].split(/,\s?/);
        datacoords[0] = parseInt(datacoords[0], 10);
        datacoords[1] = parseInt(datacoords[1], 10);
        splitted_data[3] = `${datacoords[0]},${value}`;
        splitted_data[2] = `${datacoords[0] + xboffset},${value + yboffset}`;
        newPathData = splitted_data.join(' ');

    }
    return newPathData;
}

exports.removeLine = key => {
    RemoveLine(globallinesHashed[key]);
}

function RemoveLine(line, emit = false) {

    //remove references;
    if (line.connected_elems != null || line.connected_elems != undefined) {
        var elem1connectedelems = line.connected_elems.elem1.mmdata.connected_elems;

        for (let i = 0; i < elem1connectedelems.length; i++) {
            if (elem1connectedelems[i].line === line) {
                //remove reference from element.
                elem1connectedelems.splice(i, 1);

                break;
                //we found what we were looking for.
            }
        }
        var elem2connectedelems = line.connected_elems.elem2.mmdata.connected_elems;
        for (let i = 0; i < elem2connectedelems.length; i++) {
            if (elem2connectedelems[i].line === line) {
                //remove reference from element.
                elem2connectedelems.splice(i, 1);
                break;
                //we found what we were looking for.
            }
        }
    }

    globallines.splice(globallines.indexOf(line), 1);
    delete globallinesHashed[$(line).attr('data-key')];
    $(line).remove();
    console.log('remove line', line);

    if (emit) {
        fieldEmitThrottled('line_removed', {
            key: $(line).attr('data-key')
        });
    }
    saved = false;
}


