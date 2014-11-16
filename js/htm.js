/******************\
|   Hierarchical   |
| Temporal Memory  |
|      System      |
| @author Anthony  |
| @version 0.1     |
| @date 2014/07/12 |
| @edit 2014/11/16 |
\******************/

/**********
 * config */
//HTM config
var numCols = 100; //how many columns total
var sparsity = 10/100;
var cellsPerCol = 9; //number of cells in each column

//spatial pooler
var encoderParams = {
    scalar: {
        n: 121,
        w: 61,
        min: -1,
        max: 1
    },
    alphanum: {
        n: 180
    }
};
var numPotSyn = 60;
var minOverlap = 1;
var historyFog = 500; //how far can the alg look into the past?

//temporal learning
var initPerm = 0.26; //initial permanence
var permInc = 0.05; //how much permanences are incremented
var permDec = 0.015; //"" decremented
var minSynThresh = 1; //min num active synapses for learning selection
var activityRatio = 0.75; //this % of synapses active -> active dendrite
var activityThresh = 9; //# active synapses for a segment to be active
var permThresh = 0.2;
var numNewSyn = 10;

//rendering config
var delay = 250; //in ms
var drawEvery = 1;
var tpoRad = 6; //radius of a cell in the rendering
var tpoBrdr1 = 10; //column level border
var tpoBrdr2 = 1; //cell level border
var w1 = Math.ceil(Math.sqrt(numCols));
var w2 = Math.ceil(Math.sqrt(cellsPerCol));
var dims = [
    w1*w2*2*tpoRad+(w1-1)*tpoBrdr1+(w2-1)*w1*tpoBrdr2,
    w1*w2*2*tpoRad+(w1-1)*tpoBrdr1+(w2-1)*w1*tpoBrdr2
];

/*************
 * constants */
var NOW = 408; //current timestep
var BE4 = 834; //previous timestep
var GROW = true; //grow new synapses
var MNTN = false; //maintain the current synapses; i.e. don't grow
var ACTV = 4677; //signals that a synapse was active
var INAC = 1446; //"" inactive
var NEW = 438; //indicates that a synChange is for a new synapse
var PRNF = true; //positive reinforcement
var NRNF = false; //negative reinforcement

/*********************
 * working variables */
var canvas;
var ctx;

var brain;
var SP;
var numBursts;
var numNonBursts;

/******************
 * work functions */
function initHTM() {
    var start = +new Date();

    //canvas stuff
    canvas = $s('#canvas');
    canvas.width = dims[0];
    canvas.height = dims[1];
    ctx = canvas.getContext('2d');

    //misc working vars
    numBursts = 0;
    numNonBursts = 0;

    //the pattern to learn
    /* sinusoid
    var patternType = 'scalar';
    var pattern = [];
    for (var ai = 0; ai < 2000; ai++) {
        pattern.push(Math.sin(ai*Math.PI/10));
    }
    */
    var patternType = 'alphanum';
    var pattern = 'abababababababababab'.split('');

    //initialize the brain
    var start = +new Date();
    SP = new SpatialPooler(
        encoderParams[patternType].n, patternType
    );
    brain = {};
    brain.cols = [];
    for (var ai = 0; ai < numCols; ai++) {
        brain.cols.push({});
        brain.cols[ai].cells = [];
        for (var bi = 0; bi < cellsPerCol; bi++) {
            brain.cols[ai].cells.push({
                active: false,
                learning: false,
                predicted: false,
                wasActive: false,
                wasLearning: false,
                wasPredicted: false,
                predictingSegWasLearn: false,
                distalDendrites: [],
                synChanges: [],
                applySynChanges: function(cell, posReinforce) {
                    for (var ci = 0; ci < cell.synChanges; ci++) {
                        var change = cell.synChanges[ci];
                        var seg = cell.distalDendrites[change[1]];
                        switch (change[0]) {
                            case ACTV:
                                if (posReinforce) {
                                    seg[change[2]][2] += permInc;
                                } else {
                                    seg[change[2]][2] -= permDec;
                                }
                                break;
                            case INAC:
                                if (posReinforce) {
                                    seg[change[2]][2] -= permDec;
                                }
                                break;
                            case NEW:
                                seg.push([
                                    change[2], change[3], initPerm
                                ]);
                                break;
                        }
                    }
                    cell.synChanges = []; //changes applied so empty queue
                },
                proposeSynChanges: function(cell, t, segId, bank, addSyns) {
                    if (segId < 0) return false;

                    var seg = cell.distalDendrites[segId];
                    var activeSynLocs = [];
                    for (var si = 0; si < seg.length; si++) {
                        var connCol = brain.cols[seg[si][0]];
                        var connCell = connCol.cells[seg[si][1]];
                        if (t === NOW && connCell.active ||
                            t === BE4 && connCell.wasActive) {
                            activeSynLocs.push([seg[si][0], seg[si][1]]);
                            cell.synChanges.push([
                                ACTV, segId, si
                            ]);
                        } else {
                            cell.synChanges.push([
                                INAC, segId, si
                            ]);
                        }
                    }

                    if (addSyns && t === BE4) {
/* TODO: protection against not enough? */
                        var numSyns = numNewSyn - activeSynLocs.length;
                        var newSynIds = getRandPerm(bank.length, numSyns);
                        for (var si = 0; si < newSynIds.length; si++) {
                            var sb = bank[newSynIds[si]];
                            cell.synChanges.push([
                                NEW, segId, sb[0], sb[1]
                            ]);
                        }
                    }
                },
                growDistalDendrite: function(cell, bank) {
                    var dendrite = [];
                    var numSyns = numNewSyn;
                    var newSynIds = getRandPerm(bank.length, numSyns);
/* TODO: why are some dendrites so empty? */
                    if (newSynIds.length === 0) return;
                    for (var si = 0; si < newSynIds.length; si++) {
                        var sb = bank[newSynIds[si]];
                        dendrite.push([
                            sb[0], sb[1], initPerm
                        ]);
                    }
                    cell.distalDendrites.push(dendrite);
                }
            });
        }
    }

    //learn the pattern
    var di = 0; //data increment
    var asyncLoopData = function(callback) {
        //report the current iteration
        $s('#time').innerHTML = di;

        //get this input's SDR
        var currSDR = SP.process(pattern[di]);

        //get all the cells that were just active and learning
        var synapseBank = [];
        for (var ki = 0; ki < brain.cols.length; ki++) {
            var col = brain.cols[ki];
            for (var ci = 0; ci < col.cells.length; ci++) {
                var cell = brain.cols[ki].cells[ci];
                if (cell.wasActive && cell.wasLearning) {
                    //synapses have a destination and a permanence
                    var synapse = [ki, ci, initPerm];
                    synapseBank.push(synapse);
                }
            }
        }

        //iterate the active cells
        for (var kId = 0; kId < currSDR.length; kId++) {
            if (!currSDR[kId]) continue; //this is only for active columns

            //given an active column, activate predicted cells
            var activatedCell = false;
            var choseLearning = false;
            for (var ci = 0; ci < brain.cols[kId].cells.length; ci++) {
                //activate predicted cells
                var cell = brain.cols[kId].cells[ci];
                if (cell.wasPredicted) {
                    cell.active = true;
                    activatedCell = true;

                    if (cell.predictingSegWasLearn) {
                        choseLearning = true;
                        cell.learning = true;
                    }
                }
            }

            //if no cells were predicted, burst
            if (!activatedCell) {
                numBursts++;

                //bursting means activating all of the cells in a column
                for (var ci = 0; ci < brain.cols[kId].cells.length; ci++) {
                    var cell = brain.cols[kId].cells[ci];
                    cell.active = true;
                }
            } else numNonBursts++;

            if (!choseLearning) {
                //identify a single cell for learning either by looking at
                //the one that was closest to being predicted
                var lcId = -1;
                var lcSegId = -1;
                var mostActivity = -1;
                for (var ci = 0; ci < brain.cols[kId].cells.length; ci++) {
                    var cell = brain.cols[kId].cells[ci];
                    var bestSeg = getBestMatchingSeg(cell, BE4);
                    if (bestSeg[0] !== -1) {
                        lcId = ci;
                        lcSegId = bestSeg[0];
                        mostActivity = bestSeg[1];
                    }
                }

                //...or by choosing the cell that needs to learn the most
                //(e.g., the one with the least # segments)
                if (lcSegId === -1) {
                    var leastNumSegs = Infinity;
                    var col = brain.cols[kId];
                    for (var ci = 0; ci < col.cells.length; ci++) {
                        var cell = brain.cols[kId].cells[ci];
                        if (cell.distalDendrites.length < leastNumSegs) {
                            leastNumSegs = cell.distalDendrites.length;
                            lcId = ci;
                        }
                    }
                }

                brain.cols[kId].cells[lcId].learning = true;
                choseLearning = true;

                var lCell = brain.cols[kId].cells[lcId];
                if (lcSegId === -1) { //no good match? grow one.
                    lCell.growDistalDendrite(cell, synapseBank);
                } else { //a kinda good match? reinforce it.
                    lCell.proposeSynChanges(
                        lCell, BE4, lcSegId, synapseBank, GROW
                    );
                }
            }
        }

        //make predictions and train distal dendrite segments
        for (var ki = 0; ki < brain.cols.length; ki++) {
            for (var ci = 0; ci < brain.cols[ki].cells.length; ci++) {
                var cell = brain.cols[ki].cells[ci];
                var dendrites = cell.distalDendrites;
                cell.predicted = false; //not yet it isn't!
                cell.predictingSegWasLearn = false; //don't know yet

                //check all the distal dendrite segments
                for (var seg = 0; seg < dendrites.length; seg++) {
                    var segment = dendrites[seg];
                    var activity = getSynActivity(
                        cell, seg, NOW, permThresh
                    );

                    //if the number of active synapses on this segment
                    //exceeds the activity ratio, then the segment is
                    //active -> predict the column
                    var segRatio = activity[0]/(Math.max(1, activity[1]));
                    if (segRatio >= activityRatio ||
                        activity[0] >= activityThresh) {
                        cell.predicted = true;

                        //figure out if this segment (this cell's predicting
                        //segment) would be activated by learning cells
                        var lRat = activity[2]/(Math.max(1, activity[1]));
                        if (lRat >= activityRatio ||
                            activity[2] >= activityThresh) {
                            cell.predictingSegWasLearn = true;
                        }

                        //learning
                        cell.proposeSynChanges(
                            cell, NOW, seg, synapseBank, MNTN
                        ); //reinforce the synapses that predicted this

                        var pastSeg = getBestMatchingSeg(cell, BE4);
                        cell.proposeSynChanges(
                            cell, BE4, pastSeg[0], synapseBank, MNTN
                        );
                    }
                }
            }
        }

        //apply the synapse changes
        for (var ki = 0; ki < brain.cols.length; ki++) {
            for (var ci = 0; ci < brain.cols[ki].cells.length; ci++) {
                var cell = brain.cols[ki].cells[ci];
                if (cell.learning) {
                    cell.applySynChanges(cell, PRNF);
                } else if (cell.wasPredicted && !cell.predicted) {
                    cell.applySynChanges(cell, NRNF);
                }
            }
        }

        //visualize the brain
        if (di%drawEvery === 0) render(brain);

        //advance to the future
        for (var ki = 0; ki < brain.cols.length; ki++) {
            for (var ci = 0; ci < brain.cols[ki].cells.length; ci++) {
                var cell = brain.cols[ki].cells[ci];
                cell.wasActive = cell.active;
                cell.wasLearning = cell.learning;
                cell.wasPredicted = cell.predicted;

                //clean up old state
                cell.active = false;
                cell.learning = false;
            }
        }

        //increment and call the next iteration
        di++;
        setTimeout(function() { callback(true); }, delay); 
    };
    asyncLoop(pattern.length,
        function(loop) {
            asyncLoopData(function(keepGoing) {
                if (keepGoing) loop.next();
                else loop.break();
            });
        }, 
        function() {
            //report the correct-prediction rate
            console.log(
                numNonBursts+'/'+(numBursts+numNonBursts)+' = '+
                round(100*(numNonBursts)/(numBursts+numNonBursts), 2)+
                '% of activations predicted.'
            );
            //report out how long it took
            console.log('That input took '+(+new Date() - start)+'ms.');
        }
    );
}

function getBestMatchingSeg(cell, t) {
    //identify the most nearly active segment (most active synapses)
    var lcSegId = -1;
    var mostActivity = -1;
    var dendrites = cell.distalDendrites;
    for (var seg = 0; seg < dendrites.length; seg++) {
        var activity = getSynActivity(cell, seg, t, 0);
        if (activity > mostActivity) {
            mostActivity = activity;
            lcId = ci;
            lcSegId = seg;
        }
    }
    if (mostActivity > minSynThresh) { //has to be > thresh
        return [lcSegId, mostActivity];
    } else return [-1];
}

function getSynActivity(cell, segId, t, connectionThresh) {
    if (arguments.length < 3) connectionThresh = 0;

    var activeSyns = 0;
    var learningSyns = 0;
    var connectedSyns = 0; //# synapses w/ perm >= connectionThresh
    var segment = cell.distalDendrites[segId];
    for (var syn = 0; syn < segment.length; syn++) {
        var endLoc = segment[syn];
        var connectedCell = brain.cols[endLoc[0]].cells[endLoc[1]];
        if (segment[syn][2] >= connectionThresh) {
            connectedSyns++;
            if (connectedCell.active && t === NOW ||
                connectedCell.wasActive && t === BE4) activeSyns++;
            if (connectedCell.learning && t === NOW ||
                connectedCell.wasLearning && t === BE4) learningSyns++;
        }
    }

    return [activeSyns, connectedSyns, learningSyns];
}

function encode(type, value) {
    var p = encoderParams[type];
    switch (type) {
        case 'scalar':
            var buckets = 1 + (p.n - p.w);
            var bucket = Math.floor(buckets*(value-p.min)/(p.max-p.min));
            bucket = Math.min(Math.max(0, bucket), buckets-1);

            var out = [];
            for (var ai = 0; ai < bucket; ai++) out.push(false);
            for (var ai = 0; ai < p.w; ai++) out.push(true);
            for (var ai = 0; ai < p.n-(bucket+p.w); ai++) out.push(false);

            return out;
        case 'alphanum':
            var AVal = 'A'.charCodeAt(0);
            var numEach = p.n/36;
            var converted = value.toUpperCase().charCodeAt(0) - AVal;
            if (converted < 0) converted += 43; //put digits at the end
            var stpt = numEach*converted; //converted is in [0, 35]

            var out = [];
            for (var ai = 0; ai < stpt; ai++) out.push(false);
            for (var ai = stpt; ai < stpt+numEach; ai++) out.push(true);
            for (var ai = stpt+numEach; ai < p.n; ai++) out.push(false);

            return out;
        default:
            var out = [false];
            return out;
    }
}

function render(b) {
    //dampen old activations
    ctx.fillStyle = 'rgba(255, 255, 255, 1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    //draw new ones
    var tpoIncrFactor = 2*w2*tpoRad+tpoBrdr1+tpoBrdr2*(w2-1);
    for (var ai = 0; ai < b.cols.length; ai++) { //for each column
        var y = Math.floor(ai/w1);
            y = tpoIncrFactor*y + tpoRad;
        var x = ai%w1;
            x = tpoIncrFactor*x + tpoRad;
        for (var bi = 0; bi < b.cols[ai].cells.length; bi++) { //for ea cell
            var yo = (2*tpoRad+tpoBrdr2)*Math.floor(bi/w2);
            var xo = (2*tpoRad+tpoBrdr2)*(bi%w2);

            var color = false; //'#F28D9A';
            if (b.cols[ai].cells[bi].active) color = '#A6E84F';
            else if (b.cols[ai].cells[bi].wasActive) color = '#E2F0D1';
            else if (b.cols[ai].cells[bi].predicted) color = '#EBF08D';
            else color = '#EFEFEF'; //nothing

            if (color) drawPoint(x+xo, y+yo, tpoRad, color);
        }
    }
}

/***********
 * objects */
function SpatialPooler(s, inpType) { //s = len of transformed inputs in bits
    this.inpType = inpType;
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
    var goalNum = Math.round(sparsity*numCols); //how many to allow through
    var bkp = overlaps.slice();
    bkp.sort(function(a, b) { return b - a; });

    var k = bkp[goalNum]; //good estimate of the best
    var lowestError = bkp.filter(function(a){return a >= k;}).length-goalNum;

    for (var ai = k; ai <= bkp[0]; ai++) {
        var error = bkp.filter(function(a){return a >= ai;}).length-goalNum;
        if (error <= lowestError && error >= 0) {
            lowestError = error;
            k = ai;
        } else { //error is less than zero
            if (Math.abs(error) < Math.abs(lowestError)) {
                return ai;
            } else {
                return k;
            }
        }
    }

    return k;
};
SpatialPooler.prototype.getSDR = function(inp) {
    var inpSDR = encode(this.inpType, inp);
    var sdr = '';
    var overlaps = this.getOverlaps(inpSDR);
    var thresh = this.getOvlpThreshold(overlaps);
    for (var ai = 0; ai < overlaps.length; ai++) {
        if (overlaps[ai] >= thresh) sdr += '1';
        else sdr += '0';
    }
    return sdr;
};
SpatialPooler.prototype.process = function(inp) {
    var inpSDR = encode(this.inpType, inp);
    var sdr = [];

    //activate the correct columns and collect data about it
    var overlaps = this.getOverlaps(inpSDR);
    var thresh = this.getOvlpThreshold(overlaps);
    var maxActv = 0;
    for (var ai = 0; ai < overlaps.length; ai++) {
        var col = this.columns[ai];
        if (overlaps[ai] > 0 && overlaps[ai] >= thresh) {
            col.state = 1; //active

            //adjust the permanences because it's active
            for (var bi = 0; bi < col.bitIndices.length; bi++) {
                if (col.permanences[bi] >= permThresh) { //connected
                    if (inpSDR[col.bitIndices[bi]]) { //& input bit is true?
                        col.permanences[bi] += permInc; //strengthen the conn
                        if (col.permanences[bi] > 1) col.permanences[bi] = 1;
                    } else { //connected and false?
                        col.permanences[bi] -= permDec; //weaken the conn.
                        if (col.permanences[bi] < 0) col.permanences[bi] = 0;
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
        if (col.actvHistory.length > historyFog) {
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
        if (col.ovlpHistory.length > historyFog) {
            col.ovlpTotal -= col.ovlpHistory[0];
            col.ovlpHistory.shift();
        }

        sdr.push(col.state === 1 ? true : false);
    }

    //boost columns based on activity
    var minActv = 0.08*maxActv;
    var maxBoost = 3;
    var boostSlope = (1 - maxBoost)/minActv;
    for (var ai = 0; ai < this.columns.length; ai++) {
        var col = this.columns[ai];
        if (col.actvTotal >= minActv) col.boost = 1;
        else col.boost = boostSlope*col.actvTotal + maxBoost;
    }

    //boost connections based on overlap
    if (col.ovlpTotal < minActv) col.dopePermanences(0.1*permThresh);

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
        this.permanences.push(grf(permThresh-0.1, permThresh+0.1));
    }
}
Column.prototype.getOverlap = function(inp) {
    var matching = 0;
    for (var ai = 0; ai < this.bitIndices.length; ai++) {
        if (this.permanences[ai] >= permThresh) {
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

