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
var numCols = 2304; //48*48
var cellsPerCol = 1;
var numPotSyn = 67;
var permThreshold = 0.2;
var incPerm = 0.1;
var decPerm = 0.06;
var minOverlap = 11;
var slidingWidth = 1000;

var sdrRad = 5;
var sdrBrdr = 4;
var dim = Math.sqrt(numCols);
var dims = [dim*2*sdrRad+(dim-1)*sdrBrdr, dim*2*sdrRad+(dim-1)*sdrBrdr];

/*************
 * constants */

/*********************
 * working variables */
var canvas;
var ctx;

var data;
var inpSize;
var brain;

/******************
 * work functions */
function initHTM() {
    var start = +new Date();

    //canvas stuff
    canvas = $s('#canvas');
    canvas.width = dims[0];
    canvas.height = dims[1];
    ctx = canvas.getContext('2d');

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

    //get the SDRs of the inputs and render them to the canvas
    var ai = 0;
    var asyncLoopDataPts = function(callback) {
        //inner loop work
        var sdr = brain.sense(data.encodedPoints[ai]);
        renderSDR(sdr);
        $s('#time').innerHTML = ai;

        //increment and call the next iteration
        ai += 1;
        setTimeout(function() { callback(true); }, 6); 
    };
    asyncLoop(data.points.length,
        function(loop) {
            asyncLoopDataPts(function(keepGoing) {
                if (keepGoing) loop.next();
                else loop.break();
            })
        }, 
        function() { /* inner loop finished */ }
    );

    var duration = +new Date() - start;
    console.log(
        'Completed in '+duration+'ms. (not accurate to to asynchronicity)'
    );
}

function encode(type, value) {
    switch (type) {
        case 'scalar':
            var p = encoderParams[type];
            var buckets = 1 + (p.n - p.w);
            var bucket = Math.floor(buckets*(value-p.min)/(p.max-p.min));
            bucket = Math.min(Math.max(0, bucket), buckets-1);

            var out = [];
            for (var ai = 0; ai < bucket; ai++) out.push(false);
            for (var ai = 0; ai < p.w; ai++) out.push(true);
            for (var ai = 0; ai < p.n-(bucket+p.w); ai++) out.push(false);

            return out;
        default:
            var out = [false];
            return out;
    }
}

function renderSDR(sdr) {
    //dampen old activations
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    //draw new ones
    var sdrIncrFactor = (2*sdrRad+sdrBrdr);
    for (var ai = 0; ai < sdr.length; ai++) {
        var y = Math.floor(ai/dim);
            y = sdrIncrFactor*y + sdrRad;
        var x = ai%dim;
            x = sdrIncrFactor*x + sdrRad;
        if (sdr[ai]) drawPoint(x, y, sdrRad, '#B1E66C');
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
    var sdr = [];

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
                    if (inp[col.bitIndices[ai]]) { //and input bit is true?
                        col.permanences[ai] += incPerm; //strengthen the conn.
                        if (col.permanences[ai] > 1) col.permanences[ai] = 1;
                    } else { //connected and false?
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

        sdr.push(col.state === 1 ? true : false);
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
            if (inp[this.bitIndices[ai]]) matching++; 
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
function drawPoint(x, y, r, color) {
	r = r || 2
	color = color || 'rgba(0, 0, 0, 1)'
	
	ctx.fillStyle = color;
	ctx.beginPath();
	ctx.arc(x, y, r, 0, 2*Math.PI, true);
	ctx.closePath();
	ctx.fill();
}
//stolen from http://stackoverflow.com/questions/4288759/asynchronous-for-cycle-in-javascript
function asyncLoop(iterations, func, callback) {
    var index = 0;
    var done = false;
    var loop = {
        next: function() {
            if (done) return;
            if (index < iterations) {
                index += 1;
                func(loop);
            } else {
                done = true;
                if (callback) callback();
            }
        },
        iteration: function() {
            return index - 1;
        },
        break: function() {
            done = true;
            if (callback) callback();
        }
    };
    loop.next();
    return loop;
}
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












