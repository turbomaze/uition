/******************\
|   Hierarchical   |
| Temporal Memory  |
|      System      |
| @author Anthony  |
| @version 0.1     |
| @date 2014/07/12 |
| @edit 2014/07/12 |
\******************/

/**********
 * config */
var params = {
    scalar: {
        n: 23,
        w: 3,
        min: 0,
        max: 150
    }
};

/*************
 * constants */

/*********************
 * working variables */

/******************
 * work functions */
function initHTM() {
    var data = {
        type: 'scalar',
        points: [-40, 2, 9, 14, 27, 36, 99, 124, 800]
    };

    for (var ai = 0; ai < data.points.length; ai++) {
        console.log(
            getSDR(data.type, data.points[ai]) + 
            ' <---> ' + 
            data.points[ai]
        );
    }
}

function getSDR(type, value) {
    switch (type) {
        case 'scalar':
            var p = params[type];
            var buckets = 1 + (p.n - p.w);
            var bucket = Math.floor(buckets*(value-p.min)/(p.max-p.min));
            bucket = Math.min(Math.max(0, bucket), buckets-1);

            var sdr = '';
            for (var ai = 0; ai < bucket; ai++) sdr += '0';
            for (var ai = 0; ai < p.w; ai++) sdr += '1';
            for (var ai = 0; ai < p.n-(bucket+p.w); ai++) sdr += '0';

            return sdr;
    }
}

/********************
 * helper functions */
function $s(id) { //for convenience
    if (id.charAt(0) !== '#') return false;
    return document.getElementById(id.substring(1));
}

function getRandInt(low, high) { //output is in [low, high)
    return Math.floor(low + Math.random()*(high-low));
}

function round(n, places) {
    var mult = Math.pow(10, places);
    return Math.round(mult*n)/mult;
}

/***********
 * objects */

window.addEventListener('load', initHTM);