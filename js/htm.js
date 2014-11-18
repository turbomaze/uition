/******************\
|   Hierarchical   |
| Temporal Memory  |
|      System      |
| @author Anthony  |
| @version 0.1     |
| @date 2014/07/12 |
| @edit 2014/11/17 |
\******************/

/**********
 * config */
//HTM config
var numCols = 2025; //how many columns total
var sparsity = 40/2025;
var cellsPerCol = 9; //number of cells in each column

//spatial pooler
var encoderParams = {
    scalar: {
        n: 121,
        w: 61,
        min: 40,
        max: 140
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
var permInc = 0.03; //how much permanences are incremented
var permDec = 0.03; //"" decremented
var permThresh = 0.2; //determines whether or not a synapse is connected
var numNewSyn = 14; //controls how many synapses are added
var activityThresh = 9; //# active synapses for a segment to be active
var minSynThresh = 6; //min num active synapses for learning selection

//rendering config
var delay = 0; //in ms
var drawEvery = 100;
var tpoRad = 2.75; //radius of a cell in the rendering
var tpoBrdr1 = 2; //column level border
var tpoBrdr2 = 0; //cell level border
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

var SP, TP;
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

/* TODO: content editable div to input the alphanum pattern to learn;
         change the background color of characters after they've been
         processed; use the burst/non-burst ratio to determine the
         color of each character's background to give a visual notice
         of how well a character was predicted. */

    var patternType = 'alphanum';
    var pattern = (
        'sdfkshdflkjhfdalkjhdsfkjhalkgsdhkladjsfadlhjkfhlkjdfhkdjgha'+
        'lkfgjhlakdhflkjasgdflkjhadgkljadsfgadkljghallkajdslhjkafahs'+
        'gkjasdlkjfgalkdjghkgdlkdjhflakdsjagkljadhfllakjsdflajkhdahs'+
        'jasdfghlkaghlkjsdhflkajsdgladhsglkjsdfhljkglaksdjlajksdgasd'+
        'ghdfkjhdflksdflkgjhdfgkljhsdfglkjdsfhgkjsfdakljsdhflkajhgas'+
        'lksjdhflakjdsfhlakjdgdkjhflkadjsggsdfahlkjalajkgdlkajsdasdk'+
        'lkajdhfaksdgfkdjsaglaksdfglsadkjasdlkjfsadllahjksglkajsdalk'+
        'akjsdflgaklajsdhlkasjdglskadjalskdfgaskldjhdlakjhsfkjahdsgk'+
        'gaksjdhlkjfgsalksfjfdfglkjhghasdfkgasdlkgjhlasdhjflajkdhsdf'+
        'lakjdgkajdfhkjfghlaksjdhgsadlksjdhfldasglakslajkhdlahjkgasd'+
        'alksdfkjsahdfkjsdhagkjadsghlkjashlkajfgakjlslajksdflkajdslk'+
        'lakjsdhljkaghdslkjhlasdgalksdjhlkasdgjlkdjslajsdhaljkdgasdf'+
        'lkashgfljkahgdlkjdshfasgdlkjdhflkajsdglaksjdlkajdskjasdlkas'+
        'lkasghljkahdskjaslfdgkjahsdflkgasdlkjshdfadslkajsdlkajdslas'+
        'asdfhkjadhglkdjsflkagdlkadjfhadgskhasldkfhslakdjsglakjdgdfa'+
        'klagjghajlkasdlkjgadskgfdkljadsadsgjkgdsaakjlsdgfadjkalkkld'+
        'adksjlajkdgadsljkahsfjkldfgjasdalsjkdjhlkajsdhjasdksadkfksa'
    ).split('');

    
    //initialize the SP and TP
    SP = new SpatialPooler(patternType);
    TP = new TemporalPooler();

    //give the spatial pooler time to learn about this data type
    var alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
    for (var ai = 0; ai < 500; ai++) {
        SP.process(alphabet.charAt(getRandInt(0, alphabet.length)));
    }

    //learn the pattern
    var start = +new Date();
    var di = 0; //data increment
    var asyncLoopData = function(callback) {
        //report the current iteration
        $s('#time').innerHTML = di;
        $s('#input').innerHTML = pattern[di];

        //HTM
        TP.process(
            SP.process(pattern[di])
        );

        //visualize the temporal pooler
        if (di%drawEvery === 0) render(TP);

        //increment and call the next iteration
        di++;
        setTimeout(function() { callback(true); }, delay); 
    };
    asyncLoop(
        pattern.length, //how many times to loop
        function(loop) {
            asyncLoopData(function(keepGoing) {
                if (keepGoing) loop.next();
                else loop.break();
            });
        }, 
        function() { //loop finished
            //report the correct-prediction rate
            console.log(
                numNonBursts+'/'+(numBursts+numNonBursts)+' = '+
                round(100*(numNonBursts)/(numBursts+numNonBursts), 2)+
                '% of activations predicted.'
            );
            //report out how long it took
            var duration = +new Date() - start;
            console.log('That input took '+duration+'ms.');
        }
    );
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

/* TODO: abstract the render parameters out so you can use it for
         multiple canvases */

/* TODO: render down to the cellular level iff the user clicks on
         the column */

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
            if (b.cols[ai].cells[bi].wasActive) color = '#A6E84F';
            else if (b.cols[ai].cells[bi].wasPredicted) color = '#F2B1C9';
            else color = '#EFEFEF'; //nothing

            if (color) drawPoint(x+xo, y+yo, tpoRad, color);
        }
    }
}

/***********
 * objects */

function TemporalPooler() {
    this.synapseBank = [];
    this.cols = [];
    for (var ai = 0; ai < numCols; ai++) {
        this.cols.push({});
        this.cols[ai].cells = [];
        for (var bi = 0; bi < cellsPerCol; bi++) {
            this.cols[ai].cells.push(new Cell());
        }
    }
}
TemporalPooler.prototype.process = function(SDR) {
    this.activateCells(SDR);
    this.predictAndLearn();
    this.applyAllSynChanges(); //only where applicable
    this.timeTravel(); //advance to the next time step

/* TODO: return something relevant */

};
TemporalPooler.prototype.activateCells = function(SDR) {
    for (var kId = 0; kId < SDR.length; kId++) {
        if (!SDR[kId]) continue; //this is only for active columns

        //given an active column, activate predicted cells
        var activatedCell = false;
        var choseLearning = false;
        for (var ci = 0; ci < TP.cols[kId].cells.length; ci++) {
            var cell = TP.cols[kId].cells[ci];
            if (cell.wasPredicted) {
                cell.active = true;
                activatedCell = true;

                if (cell.predictingSegWasLearn) {
                    cell.learning = true;
                    choseLearning = true;
                }
            }
        }

        //if no cells were predicted, burst
        if (!activatedCell) {
            //bursting means activating all of the cells in a column
            for (var ci = 0; ci < TP.cols[kId].cells.length; ci++) {
                var cell = TP.cols[kId].cells[ci];
                cell.active = true;
            }

            numBursts++;
        } else numNonBursts++;

        //the TP is always learning, so if there aren't any perfect cells
        //to teach, find one that's well suited to training
        if (!choseLearning) this.teachAPromisingCell(kId);
    }
};
TemporalPooler.prototype.predictAndLearn = function() {
    for (var ki = 0; ki < TP.cols.length; ki++) {
        for (var ci = 0; ci < TP.cols[ki].cells.length; ci++) {
            var cell = TP.cols[ki].cells[ci];
            var dendrites = cell.distalDendrites;
            cell.predicted = false; //not yet it isn't!
            cell.predictingSegWasLearn = false; //don't know yet

            //check all the distal dendrite segments
            for (var seg = 0; seg < dendrites.length; seg++) {
                var segment = dendrites[seg];
                var activity = this.getSynActivity(
                    cell, seg, NOW, permThresh
                );

                //if the number of active synapses on this segment
                //exceeds the activity ratio, then the segment is
                //active -> predict the column
                if (activity[0] >= activityThresh) {
                    this.predict(cell, activity, seg);
                }
            }
        }
    }
};
TemporalPooler.prototype.applyAllSynChanges = function() {
    for (var ki = 0; ki < TP.cols.length; ki++) {
        for (var ci = 0; ci < TP.cols[ki].cells.length; ci++) {
            var cell = TP.cols[ki].cells[ci];
            if (cell.learning) {
                cell.applySynChanges(PRNF);
            } else if (cell.wasPredicted && !cell.predicted) {
                cell.applySynChanges(NRNF);
            }
        }
    }
};
TemporalPooler.prototype.timeTravel = function() {
    this.synapseBank = []; //clean up the old potential synapse list
    for (var ki = 0; ki < TP.cols.length; ki++) {
        for (var ci = 0; ci < TP.cols[ki].cells.length; ci++) {
            //move all the cells forward in time
            var cell = TP.cols[ki].cells[ci];
            cell.wasActive = cell.active;
            cell.wasLearning = cell.learning;
            cell.wasPredicted = cell.predicted;

            //see if this cell should be in the synapse bank
            if (cell.wasActive && cell.wasLearning) {
                //synapses have a destination and a permanence
                var synapse = [ki, ci, initPerm];
                this.synapseBank.push(synapse);
            }

            //clean up the old state
            cell.active = false;
            cell.learning = false;
        }
    }
};
TemporalPooler.prototype.teachAPromisingCell = function(colId) {
    var learningIds = this.chooseLearningCell(colId);
    var lCell = this.cols[colId].cells[learningIds[0]];
    lCell.learning = true;

    if (learningIds[1] === -1) { //no good segments? grow one.
        lCell.growDistalDendrite(this.synapseBank);
    } else { //a kinda good match? reinforce it.
        lCell.proposeSynChanges(
            BE4, learningIds[1], this.synapseBank, GROW
        );
    }
};
TemporalPooler.prototype.getSynActivity = function(cell, gId, t, conThresh) {
    var activeSyns = 0;
    var learningSyns = 0;
    var connectedSyns = 0; //# synapses w/ perm >= conThresh
    var segment = cell.distalDendrites[gId];
    for (var syn = 0; syn < segment.length; syn++) {
        var endLoc = segment[syn];
        var connectedCell = TP.cols[endLoc[0]].cells[endLoc[1]];
        if (segment[syn][2] >= conThresh) {
            connectedSyns++;
            if (connectedCell.active && t === NOW ||
                connectedCell.wasActive && t === BE4) activeSyns++;
            if (connectedCell.learning && t === NOW ||
                connectedCell.wasLearning && t === BE4) learningSyns++;
        }
    }

    return [activeSyns, connectedSyns, learningSyns];
};
TemporalPooler.prototype.predict = function(cell, cellsActivity, seg) {
    cell.predicted = true;

    //figure out if this segment (this cell's predicting
    //segment) would be activated by learning cells
    var learningActivity = cellsActivity[2];
    if (learningActivity >= activityThresh) {
        cell.predictingSegWasLearn = true;
    }

    //train the cell's synapses
    cell.proposeSynChanges(
        NOW, seg, this.synapseBank, MNTN
    ); //reinforce the synapses that predicted this; don't grow new ones

    var pastSeg = this.getBestMatchingSeg(cell, BE4);
    cell.proposeSynChanges(
        BE4, pastSeg[0], this.synapseBank, MNTN
    ); //reinforce synapses that could've predicted this; again, don't grow
};
TemporalPooler.prototype.chooseLearningCell = function(colId) {
    //identify a single cell for learning either by looking at
    //the one that was closest to being predicted
    var lcId = -1;
    var lcSegId = -1;
    var mostActivity = -1;
    for (var ci = 0; ci < this.cols[colId].cells.length; ci++) {
        var cell = this.cols[colId].cells[ci];
        var bestSeg = this.getBestMatchingSeg(cell, BE4);
        if (bestSeg[0] !== -1) {
            lcId = ci;
            lcSegId = bestSeg[0];
            mostActivity = bestSeg[1];
        }
    }

    //...or by choosing the cell that needs to learn the most
    //(i.e., the one with the fewest distal dendrite segments)
    if (lcSegId === -1) lcId = this.chooseDumbestCell(colId);

    return [lcId, lcSegId];
};
TemporalPooler.prototype.getBestMatchingSeg = function(cell, t) {
    //identify the most nearly active segment (most active synapses)
    var lcSegId = -1;
    var mostActivity = -1;
    var dendrites = cell.distalDendrites;
    for (var seg = 0; seg < dendrites.length; seg++) {
        var activity = this.getSynActivity(cell, seg, t, 0);
        if (activity[0] > mostActivity) {
            mostActivity = activity[0];
            lcSegId = seg;
        }
    }

    if (mostActivity > minSynThresh) { //has to be > thresh
        return [lcSegId, mostActivity];
    } else return [-1];
};
TemporalPooler.prototype.chooseDumbestCell = function(colId){
    var leastNumSegs = Infinity;
    var lcIds = [];
    for (var ci = 0; ci < this.cols[colId].cells.length; ci++) {
        var cell = this.cols[colId].cells[ci];
        var numSegs = cell.distalDendrites.length;
        if (numSegs < leastNumSegs) {
            leastNumSegs = cell.distalDendrites.length;
            lcIds = [ci];
        } else if (numSegs === leastNumSegs) {
            lcIds.push(ci);
        }
    }

    return lcIds[getRandInt(0, lcIds.length)]; //random to mix things up
};


/* TODO: test the spatial pooler by rendering multiple SDRs of a few
         different inputs SEPARATE from the processing of the SP. As
         in, have 26 canvases each with an SDR each visualizing what
         the SP thinks a letter of the alphabet looks like at that
         point in time. Input a string of letters separately and see
         how the representations change. Have some numerical info like
         the number of active columns beneath each SDR visualization */

/* TODO: figure out why occasionally, there's only 1/2025 active columns */

function SpatialPooler(inpType) {
    this.inpType = inpType;
    this.columns = [];

    var s = encoderParams[inpType].n; //len of input in bits
    for (var ai = 0; ai < numCols; ai++) {
        this.columns.push(new Column(ai, s));
    }
}
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

function Cell() {
    this.active = false;
    this.learning = false;
    this.predicted = false;
    this.wasActive = false;
    this.wasLearning = false;
    this.wasPredicted = false;
    this.predictingSegWasLearn = false;
    this.distalDendrites = [];
    this.synChanges = [];
}
Cell.prototype.growDistalDendrite = function(synBank) {
    var dendrite = [];
    var numSyns = numNewSyn;
    var newSynIds = getRandPerm(synBank.length, numSyns);

/* TODO: why are some dendrites so empty? */

    if (newSynIds.length === 0) return;
    for (var si = 0; si < newSynIds.length; si++) {
        var sb = synBank[newSynIds[si]];
        dendrite.push([
            sb[0], sb[1], initPerm
        ]);
    }
    this.distalDendrites.push(dendrite);
};
Cell.prototype.proposeSynChanges = function(t, segId, synBank, addSyns) {
    if (segId < 0) return false;

    var seg = this.distalDendrites[segId];
    var activeSynLocs = [];
    for (var si = 0; si < seg.length; si++) {
        var connCol = TP.cols[seg[si][0]];
        var connCell = connCol.cells[seg[si][1]];
        if (t === NOW && connCell.active ||
            t === BE4 && connCell.wasActive) {
            activeSynLocs.push([seg[si][0], seg[si][1]]);
            this.synChanges.push([
                ACTV, segId, si
            ]);
        } else {
            this.synChanges.push([
                INAC, segId, si
            ]);
        }
    }

/* TODO: protection against not enough? */

    if (addSyns && t === BE4) {
        var numSyns = numNewSyn - activeSynLocs.length;
        var newSynIds = getRandPerm(synBank.length, numSyns);
        for (var si = 0; si < newSynIds.length; si++) {
            var sb = synBank[newSynIds[si]];
            this.synChanges.push([
                NEW, segId, sb[0], sb[1]
            ]);
        }
    }
};
Cell.prototype.applySynChanges = function(posReinforce) {
    for (var ci = 0; ci < this.synChanges; ci++) {
        var change = this.synChanges[ci];
        var seg = this.distalDendrites[change[1]];
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
    this.synChanges = []; //changes applied so empty queue
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
