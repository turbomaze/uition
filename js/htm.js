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
var encoderParams = {
    scalar: {
        n: 11,
        w: 6,
        min: 0,
        max: 150
    }
};
var numCols = 64;
var potRadius = 2;
var potPct = 0.5;
var permThreshold = 0.3;
var sparsity = 0.05;

/*************
 * constants */

/*********************
 * working variables */
var inpSize;
var columns;

/******************
 * work functions */
function initHTM() {
    //the data that will be streamed to the HCM
    var data = {
        type: 'scalar',
        points: [10, 55, 31, 101, 79, 146, 92, 140, 58, 42, 112, 3, 68],
        //cont.  53, 30, 122, 89, 129
        encodedPoints: []
    };

    //encode all the data points
    for (var ai = 0; ai < data.points.length; ai++) {
        var transformation = encode(data.type, data.points[ai]);
        data.encodedPoints.push(transformation);
        inpSize = transformation.length;
        console.log(transformation+' <---> '+data.points[ai]);
    }

    //initialize the columns
    columns = [];
    for (var ai = 0; ai < numCols; ai++) {
        columns.push(new Column(ai, inpSize));
    }

    //get the SDRs of the inputs by applying an overlap threshold
    //to each of the columns
    for (var ai = 0; ai < data.points.length; ai++) {
        var sdr = getSDR(data.encodedPoints[ai]);
        console.log(sdr+' <---> '+data.encodedPoints[ai]);
    }
}

function encode(type, value) {
    switch (type) {
        case 'scalar':
            var p = encoderParams[type];
            var buckets = 1 + (p.n - p.w);
            var bucket = Math.floor(buckets*(value-p.min)/(p.max-p.min));
            bucket = Math.min(Math.max(0, bucket), buckets-1);

            var out = '';
            for (var ai = 0; ai < bucket; ai++) out += '0';
            for (var ai = 0; ai < p.w; ai++) out += '1';
            for (var ai = 0; ai < p.n-(bucket+p.w); ai++) out += '0';

            return out;
        default:
            var out = '0';
            return out;
    }
}

function getOverlaps(inp) {
    var overlaps = [];
    for (var ai = 0; ai < columns.length; ai++) {
        overlaps.push(
            columns[ai].getOverlap(inp)
        );
    }
    return overlaps;
}

function getBestThreshold(overlaps) {
    var desNumSelections = Math.round(sparsity*numCols);
    var bestErr = Infinity;
    var bestThresh = 0;
    for (var ti = 1; ti < 1+2*potRadius; ti++) {
        var numPassing = overlaps.filter(function(o) {
            return o >= ti;
        }).length;
        var err = Math.abs((numPassing-desNumSelections)/desNumSelections);
        if (err < bestErr) {
            bestErr = err;
            bestThresh = ti;
        }
    }
    return bestThresh;
}

function getSDR(inp) {
    var sdr = '';
    var overlaps = getOverlaps(inp);
    var bestThresh = getBestThreshold(overlaps);
    for (var ai = 0; ai < overlaps.length; ai++) {
        if (overlaps[ai] >= bestThresh) sdr += '1';
        else sdr += '0';
    }
    return sdr;
}

/***********
 * objects */
function Column(pos, s) { //s is the length of the transformed inputs in bits
    this.bitIndices = [];
    this.permanances = [];

    //treat the column list and the input bit list as one dimensional entities
    var posFraction = pos/numCols;
    var center = Math.floor(s*posFraction);
    //columns then connect to similarly positioned bits
    for (var ai = center-potRadius; ai <= center+potRadius; ai++) {
        var idx = ai < 0 ? (ai-ai*s)%s : (ai >= s ? ai%s : ai); //loops around
        this.bitIndices.push(idx); //add it to the potential connections list
        
        //initialize the permanance value for this connection
        if (Math.random() < potPct) {
            this.permanances.push(grf(permThreshold, 1));
        } else {
            this.permanances.push(grf(0, permThreshold));
        }
    }
}
Column.prototype.getOverlap = function(inp) {
    var matching = 0;
    for (var ai = 0; ai < this.bitIndices.length; ai++) {
        if (this.permanances[ai] >= permThreshold) {
            if (inp.charAt(this.bitIndices[ai]) === '1') matching++; 
        }
    }
    return matching;
};

/********************
 * helper functions */
function $s(id) { //for convenience
    if (id.charAt(0) !== '#') return false;
    return document.getElementById(id.substring(1));
}

function getRandInt(low, high) { //output is in [low, high)
    return Math.floor(grf(low, high));
}

function grf(low, high) { //get a random float in [low, high)
    return low + Math.random()*(high-low);
}

function round(n, places) {
    var mult = Math.pow(10, places);
    return Math.round(mult*n)/mult;
}

window.addEventListener('load', initHTM);