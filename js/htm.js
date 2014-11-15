/******************\
|   Hierarchical   |
| Temporal Memory  |
|      System      |
| @author Anthony  |
| @version 0.1     |
| @date 2014/07/12 |
| @edit 2014/11/14 |
\******************/

/**********
 * config */
//HTM config
var numCols = 3;
var cellsPerCol = 2;

//rendering config
var drawEvery = 1;
var tpoRad = 12; //radius of a cell in the rendering
var tpoBrdr1 = 30; //column level border
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

/******************
 * work functions */
function initHTM() {
    var start = +new Date();

    //canvas stuff
    canvas = $s('#canvas');
    canvas.width = dims[0];
    canvas.height = dims[1];
    ctx = canvas.getContext('2d');

    render([
        [[0, 1], [1, 0]],
        [[0, 0], [0, 1]],
        [[1, 0], [0, 0]]
    ]);
}

function render(tpo) {
    //dampen old activations
    ctx.fillStyle = 'rgba(255, 255, 255, 1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    //draw new ones
    var tpoIncrFactor = 2*w2*tpoRad+tpoBrdr1+tpoBrdr2*(w2-1);
    for (var ai = 0; ai < tpo.length; ai++) { //for each column
        var y = Math.floor(ai/w1);
            y = tpoIncrFactor*y + tpoRad;
        var x = ai%w1;
            x = tpoIncrFactor*x + tpoRad;
        for (var bi = 0; bi < tpo[ai].length; bi++) { //for each cell
            var yo = (2*tpoRad+tpoBrdr2)*Math.floor(bi/w2);
            var xo = (2*tpoRad+tpoBrdr2)*(bi%w2);

            var color = false;
            if (tpo[ai][bi][0] === 1) color = '#B1E66C'; //active
            else if (tpo[ai][bi][1] === 1) color = '#EBF08D'; //predicted
            else color = '#EFEFEF'; //nothing

            if (color) drawPoint(x+xo, y+yo, tpoRad, color);
        }
    }
}

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

