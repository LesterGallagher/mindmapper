const $ = require('jquery');

exports.ContainsItem = (array, item) => {
    for (let i = 0; i < array.length; i++) {
        if (array[i] === item)
            return true;
        //else

        for (var property in array[i]) {
            if (array[i].hasOwnProperty(property)) {
                if (property === item);
                return true;
            }
        }
    }
    return false;
};

exports.GetMiddleOfElement = (elem) => {

    var width = $(elem).outerWidth();
    var height = $(elem).outerHeight();

    var x = $(elem).get(0).offsetLeft;
    var y = $(elem).get(0).offsetTop;

    //console.log(`get middle of element: x = ${x} y= ${y} width ${width} height = ${height}`);

    return ({
        'x': (parseInt(x + width / 2)),
        'y': (parseInt(y + height / 2))
    });
};

exports.GetLeftMiddle = (elem) => {
    var width = $(elem).outerWidth();
    var height = $(elem).outerHeight();

    var x = $(elem).get(0).offsetLeft;
    var y = $(elem).get(0).offsetTop;

    //console.log(`get middle of element: x = ${x} y= ${y} width ${width} height = ${height}`);

    return ({
        'x': (parseInt(x)),
        'y': (parseInt(y + height / 2))
    });
};

exports.GetRightMidle = (elem) => {
    var width = $(elem).outerWidth();
    var height = $(elem).outerHeight();

    var x = $(elem).get(0).offsetLeft;
    var y = $(elem).get(0).offsetTop;

    //console.log(`get middle of element: x = ${x} y= ${y} width ${width} height = ${height}`);

    return ({
        'x': (parseInt(x + width)),
        'y': (parseInt(y + height / 2))
    });
}

exports.GetColor = (color_rgb_paran) => {
    let color = color_rgb_paran.toString().match(/\((.+)\)/)[1];
    let red = parseInt(color.split(',')[0].trim());
    let green = parseInt(color.split(',')[1].trim());
    let blue = parseInt(color.split(',')[2].trim());
    return [red, green, blue];
}

exports.rgbToHex = (rgb_array) => {
    if (typeof rgb_array[0] != 'number')
        throw Error('input of rgbToHex function must be an array of integers')
    return '#' + (rgb_array[0].toString(16)
        + rgb_array[1].toString(16)
        + rgb_array[2].toString(16))
        .toUpperCase();
}

exports.GetColorOrUndefined = (color_rgb_paran) => {
    return !color_rgb_paran ? undefined : this.GetColor(color_rgb_paran);
}

exports.debounce = function debounce(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};

// Returns a function, that, as long as it continues to be invoked, will only
// trigger every N milliseconds. If <code>immediate</code> is passed, trigger the 
// function on the leading edge, instead of the trailing.
exports.throttle = function throttle(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		if ( !timeout ) timeout = setTimeout( later, wait );
		if (callNow) func.apply(context, args);
	};
};