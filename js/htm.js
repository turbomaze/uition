/******************\
|   Hierarchical   |
| Temporal Memory  |
|      System      |
| @author Anthony  |
| @version 0.1     |
| @date 2014/07/12 |
| @edit 2014/11/15 |
\******************/

/**********
 * config */
//HTM config
var numCols = 36; //how many columns total
var cellsPerCol = 9; //number of cells in each column

//temporal learning
var initPerm = 0.3; //initial permanance
var permInc = 0.05; //how much permanances are incremented
var permDec = 0.01; //"" decremented
var minSynThresh = 1; //min num active synapses for learning selection
var activityRatio = 0.75; //75% of synapses active -> active dendrite
var permThresh = 0.2;

//rendering config
var delay = 35; //in ms
var tpoRad = 10; //radius of a cell in the rendering
var tpoBrdr1 = 25; //column level border
var tpoBrdr2 = 3; //cell level border
var w1 = Math.ceil(Math.sqrt(numCols));
var w2 = Math.ceil(Math.sqrt(cellsPerCol));
var dims = [
    w1*w2*2*tpoRad+(w1-1)*tpoBrdr1+(w2-1)*w1*tpoBrdr2,
    w1*w2*2*tpoRad+(w1-1)*tpoBrdr1+(w2-1)*w1*tpoBrdr2
];

/*************
 * constants */

/*********************
 * working variables */
var canvas;
var ctx;

var brain;
var numBursts;

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

    //the pattern to learn
    var pattern = (
        'abcabababcabababcabababcabababcabababcabababcabababcabab'
    ).split('');

    //initialize the brain
    brain = {};
    brain.cols = [];
    for (var ai = 0; ai < numCols; ai++) {
        brain.cols.push({});
        brain.cols[ai].idOfNextLearningCell = 0;
        brain.cols[ai].cells = [];
        for (var bi = 0; bi < cellsPerCol; bi++) {
            brain.cols[ai].cells.push({
                active: false,
                learning: false,
                predicted: false,
                wasActive: false,
                wasLearning: false,
                wasPredicted: false,
                distalDendrites: [],
                synChanges: [],
                applySynChanges: function(cell) {
                    //apply all the changes to its synapses
                    for (var sci = 0; sci < cell.synChanges.length; sci++) {
                        var seg = cell.synChanges[sci][0];
                        var syn = cell.synChanges[sci][1];
                        var permChange = cell.synChanges[sci][2];
                        cell.distalDendrites[seg][syn][2] += permChange;
                    }
                    cell.synChanges = []; //changes applied so empty queue
                }
            });
        }
    }

    //learn the pattern
    var di = 0; //data increment
    var start = +new Date();
    var asyncLoopData = function(callback) {
        //figure out which column to activate
        var kId = charToColId(pattern[di]); //column id

        //given an active column, activate predicted cells
        var activatedCell = false;
        for (var ci = 0; ci < brain.cols[kId].cells.length; ci++) {
            //activate predicted cells
            var cell = brain.cols[kId].cells[ci];
            if (cell.predicted) {
                cell.active = true;
                cell.learning = true;
                activatedCell = true;
                if (!cell.wasActive) cell.applySynChanges(cell);
            }
        }

        //if no cells were predicted, burst
        if (!activatedCell) {
            numBursts++;

            //bursting means activating all of the cells in a column
            for (var ci = 0; ci < brain.cols[kId].cells.length; ci++) {
                var cell = brain.cols[kId].cells[ci];
                cell.active = true;
                if (!cell.wasActive) cell.applySynChanges(cell);
            }

            //identify a single cell for learning either by looking at the
            //one that was closest to being predicted
            var lcId = -1;
            var mostActivity = -1;
            for (var ci = 0; ci < brain.cols[kId].cells.length; ci++) {
                var cell = brain.cols[kId].cells[ci];
                var dendrites = cell.distalDendrites;
                for (var seg = 0; seg < dendrites.length; seg++) {
                    var activity = getSynActivity([kId, ci], seg, 0);
                    if (activity > mostActivity) {
                        mostActivity = activity;
                        lcId = ci;
                    }
                }
            }
            if (mostActivity > minSynThresh) { //has to be above the thresh
                brain.cols[kId].cells[lcId].learning = true;
            } //otherwise you need to try the next method

            //...or by choosing the cell that needs to learn the most
            //(e.g., the one with the least # segments)
            else {
                var leastNumSegs = Infinity;
                for (var ci = 0; ci < brain.cols[kId].cells.length; ci++) {
                    var cell = brain.cols[kId].cells[ci];
                    if (cell.distalDendrites.length < leastNumSegs) {
                        leastNumSegs = cell.distalDendrites.length;
                        lcId = ci;
                    }
                }
                brain.cols[kId].cells[lcId].learning = true;
            }

            //now that you've chosen a cell, grow a new distal dendrite
            //segment with synapses to all cells that were just active and
            //learning
            var dendrite = [];

/* TODO: subsampling; see the random permutation function you wrote */

            //form synapses to the previously active & learning cells
            for (var ki = 0; ki < brain.cols.length; ki++) {
                for (var ci = 0; ci < brain.cols[ki].cells.length; ci++) {
                    var cell = brain.cols[ki].cells[ci];
                    if (cell.wasActive && cell.wasLearning) {
                        //synapses have a destination and a permanence
                        var synapse = [ki, ci, initPerm];
                        dendrite.push(synapse);
                    }
                }
            }

            //add the distal dendrite
            brain.cols[kId].cells[lcId].distalDendrites.push(dendrite);
        }

        //get rid of stale synapse changes
        for (var ki = 0; ki < brain.cols.length; ki++) {
            for (var ci = 0; ci < brain.cols[ki].cells.length; ci++) {
                var cell = brain.cols[ki].cells[ci];
                if ((cell.predicted || cell.wasActive) && !cell.active) {
                    cell.synChanges = [];
                }
            }
        }

        //make predictions and train distal dendrite segments
        for (var ki = 0; ki < brain.cols.length; ki++) {
            for (var ci = 0; ci < brain.cols[ki].cells.length; ci++) {
                var cell = brain.cols[ki].cells[ci];
                var dendrites = cell.distalDendrites;

                //check all the distal dendrite segments
                var OrOfSegments = false;
                for (var seg = 0; seg < dendrites.length; seg++) {
                    var segment = dendrites[seg];
                    var activity = getSynActivity([ki, ci], seg, permThresh);

                    //if the number of active synapses on this segment
                    //exceeds the activity ratio, then the segment is
                    //active -> predict the column

                    var segRatio = activity[0]/(Math.max(1, activity[1]));
                    if (segRatio >= activityRatio) {
                        OrOfSegments = true;

                        //train all the synapses
                        for (var syn = 0; syn < segment.length; syn++) {
                            var endLoc = segment[syn];
                            var connCol = brain.cols[endLoc[0]];
                            var connCell = connCol.cells[endLoc[1]];
                            //these changes will only occur if the 
                            //prediction was correct
                            if (connCell.wasActive) {
                                cell.synChanges.push([
                                    seg, syn, permInc
                                ]);
                            } else {
                                cell.synChanges.push([
                                    seg, syn, -permDec
                                ]);
                            }

/* TODO: train the segments that match the previous previous timestep? */

                        }
                    }
                }

                if (OrOfSegments && !cell.active) cell.predicted = true;
                else cell.predicted = false;
            }
        }

        //visualize the brain
        render(brain);

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
                (pattern.length-numBursts)+'/'+pattern.length+' = '+
                round(100*(pattern.length-numBursts)/pattern.length, 2)+
                '% of inputs predicted.'
            );
            //report out how long it took
            console.log('That input took '+(+new Date() - start)+'ms.');
        }
    );
}

function getSynActivity(loc, segId, connectionThresh) {
    if (arguments.length < 3) connectionThresh = 0;

    var activeSyns = 0;
    var connectedSyns = 0; //# synapses w/ perm >= connectionThresh
    var segment = brain.cols[loc[0]].cells[loc[1]].distalDendrites[segId];
    for (var syn = 0; syn < segment.length; syn++) {
        var endLoc = segment[syn];
        var connectedCell = brain.cols[endLoc[0]].cells[endLoc[1]];
        if (segment[syn][2] >= connectionThresh) {
            connectedSyns++;
            if (connectedCell.active) activeSyns++;
        }
    }

    return [activeSyns, connectedSyns];
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

function charToColId(c) {
    //extremely basic for testing purposes
    var pre = c.toUpperCase().charCodeAt(0)-'0'.charCodeAt(0);
    if (pre > 9) return pre - 7;
    else return pre;
}

/***********
 * objects */


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

