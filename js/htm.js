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
var cellsPerCol = 4;
var numPotSyn = 67;
var permThreshold = 0.2;
var incPerm = 0.1;
var decPerm = 0.06;
var initialPerm = permThreshold+decPerm; //for dendrite segments
var minOverlap = 11;
var minDsActvThreshold = 5; //don't consider anything below this
var dsActvThreshold = 12; //min # active conns for a dendrite seg. to be active
var newSynapseCount = 16;
var maxNumSynapses = 80;
var slidingWidth = 1000;

var sdrRad = 5;
var sdrBrdr = 1;
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

    //initialize the SP
    brain = new NeocortexLayer(inpSize);

    //get the SDRs of the inputs and render them to the canvas
    var ai = 0;
    var asyncLoopDataPts = function(callback) {
        //inner loop work
        var out = brain.sense(data.encodedPoints[ai]);
        renderSDR(out[0]);       
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

var fuck = [0, 0, 0, 0];

/***********
 * objects */
function NeocortexLayer(s) { //s = len of transformed inputs in bits
    this.SP = new SpatialPooler(s);
    this.TP = new TemporalPooler();
}
NeocortexLayer.prototype.sense = function(inp) {
    var spo = this.SP.process(inp); //spatial pooler output
    var tpo = this.TP.process(spo); //temporal pooler output
    return tpo;
};

function TemporalPooler() {
    this.columns = [];
    this.segmentChangeQueue = [];
    this.learningCells = [];
    this.futureLearningCells = [];

    for (var ai = 0; ai < numCols; ai++) {
        this.columns.push([]);
        this.segmentChangeQueue.push([]);
        for (var bi = 0; bi < cellsPerCol; bi++) {
            this.columns[ai].push(new Neuron());
            this.segmentChangeQueue[ai].push([]);
        }
    }
}
TemporalPooler.prototype.getBestMatchingCellId = function(col) {
    var best = [-1, -1];
    for (var ai = 0; ai < col.length; ai++) {
        var neuron = col[ai];
        var bestSegment = neuron.getBestMatchingSegment();
        if (bestSegment) {
            if (bestSegment.lenientActv > best[0]) {
                best[0] = bestSegment.lenientActv;
                best[1] = ai;
            }
        }
    }

    if (best[1] !== -1) {
        return best[1];
    } else { //cell with fewest number of segments
        var nbest = [Infinity, -1];
        for (var ai = 0; ai < col.length; ai++) {
            var neuron = col[ai];
            if (neuron.dendriteSegments.length < nbest[0]) {
                nbest[0] = neuron.dendriteSegments.length;
                nbest[1] = ai;
            }
        }
        return nbest[1];
    }
};
TemporalPooler.prototype.getBestMatchingCell = function(col) {
    var best = this.getBestMatchingCellId(col);
    return col[best];
};
TemporalPooler.prototype.applyChanges = function(addr, positive) {
    var changes =  this.segmentChangeQueue[addr[0]][addr[1]];
    var neuron = this.columns[addr[0]][addr[1]];
    for (var ai = 0; ai < changes.length; ai++) {
        switch (changes[0]) {
            case 'new':
                neuron.addSegment(
                    this.columns, this.learningCells //always the current ones
                );
                break;
            case 'reinforce': //and possibly grow
                var dsIdx = changes[1][0];
                var ds = neuron.dendriteSegments[dsIdx];
                var future = changes[1][1];
                var growSegment = changes[1][2];

                for (var bi = 0; bi < ds.synapses.length; bi++) {
                    var syn = ds.synapses[bi];
                    var cell = this.columns[syn[0]][syn[1]]; //the dest. cell
                    var rState = future ? cell.futureState : cell.state;
                    if (rState === 1 && positive) {
                        ds.permanences[bi] += incPerm;
                    } else {
                        ds.permanences[bi] -= decPerm;
                    }
                }

                if (growSegment) {
                    ds.grow(
                        this.columns,
                        future,
                        future ? this.futureLearningCells : this.learningCells
                    );
                }
                break;
        }
    }

    this.segmentChangeQueue[addr[0]][addr[1]] = []; //delete the change list
};
TemporalPooler.prototype.process = function(spo) {
    //compute the current activities for all the dendrite segments
    for (var ai = 0; ai < this.columns.length; ai++) {
        var col = this.columns[ai];
        for (var bi = 0; bi < col.length; bi++) {
            var neuron = col[bi];
            for (var ti = 0; ti < neuron.dendriteSegments.length; ti++) {
                var ds = neuron.dendriteSegments[ti];
                ds.updateActivity(this.columns, false);
            }
        }
    }

    //figure out which cells in the active columns are active
    for (var ai = 0; ai < spo.length; ai++) {
        if (spo[ai]) { //for each active column
            var col = this.columns[ai];

            var predictedOne = false;
            var willLearnOne = false;
            for (var bi = 0; bi < cellsPerCol; bi++) {
                var neuron = col[bi];

                //activate predicted cells in that column
                if (neuron.state === 2) {
                    var ds = neuron.getActiveSegment(0);
                    predictedOne = true;
                    neuron.futureState = 1;
                    if (ds.isActive(1, false)) {
                        willLearnOne = true;
                        neuron.futureLearn = 1;
                        this.futureLearningCells.push([ai, bi]);
                    }
                }
            }

            if (!predictedOne) {
                //burst (activate all) if none were predicted
                for (var bi = 0; bi < cellsPerCol; bi++) {
                    var neuron = col[bi];
                    neuron.futureState = 1;
                }
            }

            if (!willLearnOne) {
                var learningCellId = this.getBestMatchingCellId(col);
                var learningCell = col[learningCellId];
                learningCell.futureLearn = 1;
                this.futureLearningCells.push([ai, learningCellId]);
                this.segmentChangeQueue[ai][learningCellId].push(['new']);
            }
        }
    }

    //predict which cells will be active next round
    for (var ai = 0; ai < this.columns.length; ai++) {
        var col = this.columns[ai];
        for (var bi = 0; bi < col.length; bi++) {
            var neuron = col[bi];
            for (var ti = 0; ti < neuron.dendriteSegments.length; ti++) {
                var ds = neuron.dendriteSegments[ti];
                ds.updateActivity(this.columns, true); //future activity
                if (ds.isActive(0, true)) { //future active
                    neuron.futurePred = 2;
                    this.segmentChangeQueue[ai][bi].push(
                        ['reinforce', [ti, true, false]] //future don't grow
                    );
                    var mehSegId = neuron.getBestMatchingSegmentIdx();
                    var mehSeg = neuron.dendriteSegments[mehSegId];
                    var growSeg = mehSeg.synapses.length < maxNumSynapses;
                    this.segmentChangeQueue[ai][bi].push([
                        'reinforce',
                        [mehSegId, false, growSeg]
                    ]); //present grow
                }
            }
        }
    }

    //apply the changes to the segments
    for (var ai = 0; ai < this.columns.length; ai++) {
        var col = this.columns[ai];
        for (var bi = 0; bi < col.length; bi++) {
            var neuron = col[bi];
            if (neuron.futureLearn === 1) {
                this.applyChanges([ai, bi], true); //positive reinforcement
            } else if (neuron.pred === 1 && neuron.futurePred === 0) {
                this.applyChanges([ai, bi], false); //negative reinforcement
            }
        }
    }

    //progress into the future and save the current state
    var tpo = [];
    for (var ai = 0; ai < this.columns.length; ai++) {
        var col = this.columns[ai];
        tpo.push([]);
        for (var bi = 0; bi < col.length; bi++) {
            var neuron = col[bi];
            neuron.timeTravel();
            tpo[ai].push([neuron.state, neuron.pred, neuron.learn]);
        }
    }
    this.learningCells = this.futureLearningCells.slice();
    this.futureLearningCells = [];

    return [spo, tpo];
};

function Neuron() {
    this.dendriteSegments = [];
    this.state = 0; //0 inactive, 1 active
    this.futureState = 0;
    this.learn = 0; //1 means it's learning
    this.futureLearn = 0;
    this.pred = 0; //0 not predicted, 1 predicted
    this.futurePred = 0;
}
Neuron.prototype.getActiveSegment = function (ls) { //learn or active?
    var best = [-1, -1];
    for (var ai = 0; ai < this.dendriteSegments.length; ai++) {
        if (this.dendriteSegments[ai].activity[ls] > best[0]) {
            best[0] = this.dendriteSegments[ai].activity[ls];
            best[1] = ai;
        }
    }
    return this.dendriteSegments[best[1]];
};
Neuron.prototype.getBestMatchingSegmentId = function() {
    var best = [-1, -1];
    for (var ai = 0; ai < this.dendriteSegments.length; ai++) {
        if (this.dendriteSegments[ai].lenientActv > best[0]) {
            best[0] = this.dendriteSegments[ai].lenientActv;
            best[1] = ai;
        }
    }
    if (best[0] >= minDsActvThreshold) {
        return best[1];
    } else return -1;
};
Neuron.prototype.getBestMatchingSegment = function() {
    var best = this.getBestMatchingSegmentId();
    if (best !== -1) return this.dendriteSegments[best];
    else return null;
};
Neuron.prototype.addSegment = function(context, relLearnCells) {
fuck[2]++;
    this.dendriteSegments.push(
        new DendriteSegment(context, relLearnCells)
    );
};
Neuron.prototype.timeTravel = function() {
    this.state = this.futureState;
    this.futureState = 0;
    this.learn = this.futureLearn;
    this.futureLearn = 0;
    this.pred = this.futurePred;
    this.futurePred = 0;
};

function DendriteSegment(context, relLearnCells) {
fuck[0]++;
    //the ctx within which this cell exists; 2d arr of cols/cells
    this.synapses = []; //list of pairs of numbers, [column, cell]
    this.synapsesO = {}; //pairs of numbers, [column, cell], as keys
    this.permanences = [];
    //how many of its valid conns are to active cells
    this.activity = [0, 0]; //first is for active, second is for learn
    this.futureActivity = [0, 0];
    this.lenientActv = 0; //weaker definition of "active"

    //adds new synapses
    var indices = getRandPerm(relLearnCells.length, newSynapseCount);
    for (var ai = 0; ai < indices.length; ai++) {
        this.synapses.push(relLearnCells[indices[ai]]);
        this.synapsesO[relLearnCells[indices[ai]]] = true;
        this.permanences.push(initialPerm);
    }
fuck[1]+=newSynapseCount;
}
DendriteSegment.prototype.updateActivity = function(context, future) {
    //the ctx within which this cell exists; 2d arr of cols/cells
    var numActvConns0 = 0;
    var numActvConns1 = 0;
    var numLenientConns = 0;
    for (var ai = 0; ai < this.synapses.length; ai++) {
        var syn = this.synapses[ai];
        if (this.permanences[ai] >= permThreshold) {
            var neuron = context[syn[0]][[1]];
            if (future) {
                if (neuron.futureState === 1) numActvConns0++;
                if (neuron.futureLearn === 1) numActvConns1++;
            } else {
                if (neuron.state === 1) numActvConns0++;
                if (neuron.learn === 1) numActvConns1++;
            }
        }
        if (neuron.state === 1) numLenientConns++;
    }
    if (future) {
        this.futureActivity = [numActvConns0, numActvConns1];
    } else {
        this.activity = [numActvConns0, numActvConns1];
        this.lenientActv = numLenientConns;
    }
};
DendriteSegment.prototype.isActive = function(ls, future) {
    if (future) return this.futureActivity[ls] >= dsActvThreshold;
    else return this.activity[ls] >= dsActvThreshold;
};
DendriteSegment.prototype.grow = function(context, future, relLearnCells) {
    var numActive = future ? this.activity[0] : this.futureActivity[0];
    var numToAdd = newSynapseCount - numActive;

    //adds numToAdd new synapses or as many as it can
    var indices = getRandPerm(relLearnCells.length), ai = 0;
    while (numToAdd > 0 && ai < indices.length) {
        var cell = relLearnCells[indices[ai]];
        //not already connected to this cell?
        if (!this.synapsesO.hasOwnProperty[cell]) {
            this.synapses.push(cell);
            this.synapsesO[cell] = true;
            this.permanences.push(initialPerm);
            numToAdd--;
        }
        ai++;
    }
fuck[1]+=(newSynapseCount - numActive)-numToAdd;
};

function SpatialPooler(s) { //s = len of transformed inputs in bits
    this.columns = [];
    for (var ai = 0; ai < numCols; ai++) {
        this.columns.push(new Column(ai, s));
    }
}
SpatialPooler.prototype.getOverlaps = function(inp) {
    var overlaps = [];
    for (var ai = 0; ai < this.columns.length; ai++) {
        overlaps.push(
            this.columns[ai].getOverlap(inp)
        );
    }
    return overlaps;
};
SpatialPooler.prototype.getOvlpThreshold = function(overlaps) {
    var bkp = overlaps.slice();
    bkp.sort(function(a, b) { return b - a; });
    var k = Math.round(0.75*sparsity*numCols); //good estimate of the best
    return bkp[k];
};
SpatialPooler.prototype.getSDR = function(inp) {
    var sdr = '';
    var overlaps = this.getOverlaps(inp);
    var bestThresh = this.getOvlpThreshold(overlaps);
    for (var ai = 0; ai < overlaps.length; ai++) {
        if (overlaps[ai] >= bestThresh) sdr += '1';
        else sdr += '0';
    }
    return sdr;
};
SpatialPooler.prototype.process = function(inp) {
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
    var maxBoost = 3;
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
    this.state = 0; //0 inactive, 1 active
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
