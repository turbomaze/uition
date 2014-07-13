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
        n: 121,
        w: 41,
        min: -1,
        max: 1
    }
};

var sparsity = 0.02;
var numCols = 2048;
var cellsPerCol = 1;
var numPotSyn = 60;
var permThreshold = 0.3;
var incPerm = 0.1;
var decPerm = 0.06;
var minOverlap = 10;
var slidingWidth = 1000;

/*************
 * constants */

/*********************
 * working variables */
var data;
var inpSize;
var brain;

/******************
 * work functions */
function initHTM() {
    var start = +new Date();

    //the data that will be streamed to the HCM
    data = {
        type: 'scalar',
        points: [],
        encodedPoints: []
    };
    for (var ai = 0; ai < 1000; ai++) { //sine wave
        data.points.push(Math.sin(ai*Math.PI/(30+Math.E)));
    }

    //encode all the data points
    for (var ai = 0; ai < data.points.length; ai++) {
        var transformation = encode(data.type, data.points[ai]);
        data.encodedPoints.push(transformation);
        inpSize = transformation.length;
    }

    //initialize the layer of cells
    brain = new Layer(inpSize);

    //get the SDRs of the inputs by applying an overlap threshold
    //to each of the columns
    for (var ai = 0; ai < data.points.length; ai++) {
        var sdr = brain.sense(data.encodedPoints[ai]);
        if (ai === 0) console.log('Input 0: '+sdr);
    }

    var duration = +new Date() - start;
    console.log('Completed in '+duration+'ms.');
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

/***********
 * objects */
function Layer(s) { //s is the length of the transformed inputs in bits
    this.columns = [];
    for (var ai = 0; ai < numCols; ai++) {
        this.columns.push(new Column(ai, s));
    }
}
Layer.prototype.getOverlaps = function(inp) {
    var overlaps = [];
    for (var ai = 0; ai < this.columns.length; ai++) {
        overlaps.push(
            this.columns[ai].getOverlap(inp)
        );
    }
    return overlaps;
};
Layer.prototype.getOvlpThreshold = function(overlaps) {
    var bkp = overlaps.slice();
    bkp.sort(function(a, b) { return b - a; });
    var k = Math.round(0.75*sparsity*numCols); //good estimate of the best
    return bkp[k];
};
Layer.prototype.getSDR = function(inp) {
    var sdr = '';
    var overlaps = this.getOverlaps(inp);
    var bestThresh = this.getOvlpThreshold(overlaps);
    for (var ai = 0; ai < overlaps.length; ai++) {
        if (overlaps[ai] >= bestThresh) sdr += '1';
        else sdr += '0';
    }
    return sdr;
};
Layer.prototype.sense = function(inp) {
    var sdr = '';

    //activate the correct columns and collect data about it
    var overlaps = this.getOverlaps(inp);
    var thresh = this.getOvlpThreshold(overlaps);
    var maxActv = 0;
    for (var ai = 0; ai < overlaps.length; ai++) {
        var col = this.columns[ai];
        if (overlaps[ai] > 0 && overlaps[ai] >= thresh) {
            col.state = 1; //active

            //adjust the permanences because it's active
            for (var bi = 0; bi < col.bitIndices.length; bi++) {
                if (col.permanences[ai] >= permThreshold) { //connected
                    if (inp.charAt(col.bitIndices[ai]) === '1') { //and one?
                        col.permanences[ai] += incPerm; //strengthen the conn.
                        if (col.permanences[ai] > 1) col.permanences[ai] = 1;
                    } else { //connected and zero?
                        col.permanences[ai] -= decPerm; //weaken the conn.
                        if (col.permanences[ai] < 0) col.permanences[ai] = 0;
                    }
                }
            }
        } else {
            col.state = 0; //inactive
        }
    
        //take care of the activity history
        var actv = col.state === 1 ? 1 : 0;
        col.actvHistory.push(actv);
        col.actvTotal += actv;
        if (col.actvHistory.length > slidingWidth) {
            col.actvTotal -= col.actvHistory[0];
            col.actvHistory.shift();
        }
        if (col.actvTotal > maxActv) {
            maxActv = col.actvTotal;
        }

        //take care of the overlap history
        var ovlp = overlaps[ai] > 0 ? 1 : 0;
        col.ovlpHistory.push(ovlp);
        col.ovlpTotal += ovlp;
        if (col.ovlpHistory.length > slidingWidth) {
            col.ovlpTotal -= col.ovlpHistory[0];
            col.ovlpHistory.shift();
        }

        sdr += actv;
    }

    //boost columns based on activity
    var minActv = 0.01*maxActv;
    var maxBoost = 2;
    var boostSlope = (1 - maxBoost)/minActv;
    for (var ai = 0; ai < this.columns.length; ai++) {
        var col = this.columns[ai];
        if (col.actvTotal >= minActv) col.boost = 1;
        else col.boost = boostSlope*col.actvTotal + maxBoost;
    }

    //boost connections based on overlap
    if (col.ovlpTotal < minActv) col.dopePermanences(0.1*permThreshold);

    return sdr;
};

function Column(pos, s) { //s is the length of the transformed inputs in bits
    this.bitIndices = [];
    this.permanences = [];
    this.state = 0; //0 inactive, 1 active, 2 predictive
    this.actvHistory = [];
    this.actvTotal = 0;
    this.ovlpHistory = [];
    this.ovlpTotal = 0;
    this.boost = 1;

    //columns then connect to random bits
    this.bitIndices = getRandPerm(s, numPotSyn);
    for (var ai = 0; ai < numPotSyn; ai++) {
        //initialize the permanence value for this connection
        this.permanences.push(grf(permThreshold-0.1, permThreshold+0.1));
    }
}
Column.prototype.getOverlap = function(inp) {
    var matching = 0;
    for (var ai = 0; ai < this.bitIndices.length; ai++) {
        if (this.permanences[ai] >= permThreshold) {
            if (inp.charAt(this.bitIndices[ai]) === '1') matching++; 
        }
    }

    if (matching < minOverlap) return 0;
    else return matching*this.boost;
};
Column.prototype.dopePermanences = function(amt) {
    for (var ai = 0; ai < this.permanences.length; ai++) {
        this.permanences[ai] += amt;
        this.permanences[ai] = Math.max(this.permanences[ai], 1);
    }
};

/********************
 * helper functions */
function $s(id) { //for convenience
    if (id.charAt(0) !== '#') return false;
    return document.getElementById(id.substring(1));
}
function getRandPerm(n, m) { //random permutation of integers in [0, n)
    //take the m first elements
    var ret = [];
    for (var ai = 0; ai < n; ai++) {
        var j = getRandInt(0, ai+1);
        ret[ai] = ret[j];
        ret[j] = ai;
    }
    if (arguments.length === 1) return ret;
    else return ret.slice(n-m);
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












