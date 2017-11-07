/******************\
|   Hierarchical   |
| Temporal Memory  |
|      System      |
| @author Anthony  |
| @version 0.1     |
| @date 2014/07/12 |
| @edit 2014/12/13 |
\******************/

/**********
 * config */
//usage config
var realtime = true;

//rendering config
var delay = 0; //in ms
var drawEvery = 35; //how often to draw the TP
var tpoRad = 2.5; //radius of a cell in the rendering
var tpoBrdr1 = 2; //column level border
var tpoBrdr2 = 0; //cell level border
var w1, h1, w2, dims; //dimensions of the canvas

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
var SKIP = false; //skip computing the learning activations
var BOTH = true; //compute both active and learning activations

var alphanum = '?'+' '+'0123456789'+
               'abcdefghijklmnopqrstuvwxyz'+
               'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/*********************
 * working variables */
var canvas;
var ctx;
var mousePos;

var brain;

var di; //data increment
var bursts, preds;
var predStr;

/******************
 * work functions */
function initHTM() {
    var start = +new Date();

    //initialize the brain (SP and TP chained together)
    brain = new Layer({
        encoder: 'alphanum',
        encoderCfg: {
            alphanum: {
                n: 200,
                w: 30
            }
        },
        cellsPerCol: 9
    });

    //canvas stuff
    canvas = $s('#canvas');
    w1 = Math.ceil(Math.sqrt(brain.cfg.numCols/0.9707));
    h1 = Math.ceil(brain.cfg.numCols/w1);
    w2 = Math.ceil(Math.sqrt(brain.cfg.cellsPerCol));
    dims = [
        w1*w2*2*tpoRad+(w1-1)*tpoBrdr1+(w2-1)*w1*tpoBrdr2,
        h1*w2*2*tpoRad+(h1-1)*tpoBrdr1+(w2-1)*h1*tpoBrdr2
    ];
    canvas.width = dims[0];
    canvas.height = dims[1];
    ctx = canvas.getContext('2d');

    //mouse location
    mousePos = [0, 0];
    document.addEventListener('mousemove', function(e) {
        mousePos = [e.clientX, e.clientY];
    });

    //misc working vars
    di = 0;
    bursts = [0, 0]; //0 -> # bursts, 1 -> #non-bursts
    preds = [0, 0]; //0 -> # wrong preds, 1 -> # right preds
    predStr = '';

    //learn the pattern
    if (realtime) {
        /*buggy as hell*/

        $s('#user-input').addEventListener('keyup', function(e) {
            //ignore shifts, enters, etc.
            if ([13, 16, 17, 18, 27].indexOf(e.keyCode) !== -1) return;

            //get this iteration's input
            var rawInp = $s('#user-input').innerHTML.charAt(0);
            if ($s('#user-input').innerHTML === '&nbsp;') rawInp = ' ';
            if (alphanum.indexOf(rawInp) === -1) rawInp = '?';

            //clear the input
            $s('#user-input').innerHTML = '';

            //predict this iteration's input
            var predictions = brain.predict();
            if (predictions[0][0] === rawInp) preds[1]++;
            else preds[0]++;

            //add the current input to the string of inputs
            var idx = predictions.length-1;
            for (var ai = 0; ai < predictions.length; ai++) {
                if (predictions[ai][0] === rawInp) {
                    idx = ai;
                    break;
                }
            }

            //find a good color to represent the prediction confidence
            var green = [0, 255, 0];
            var red = [255, 0, 0];
            var colorStr = colorArrToHex(
                getGradient(
                    green, red, predictions[idx][1]
                )
            );
            console.log(
                'Confidence in '+predictions[idx][0]+': '+predictions[idx][1]
            );
            $s('#input').innerHTML = $s('#input').innerHTML+
                '<span style="color: '+colorStr+'">'+
                    rawInp+
                '</span>';

            //report the current iteration
            $s('#time').innerHTML = di;

            var bPct = round(100*bursts[1]/(bursts[0]+bursts[1]), 2);
            $s('#pred-actv-pct').innerHTML = bPct+'%';

            var iPct = round(100*preds[1]/(preds[0]+preds[1]), 2);
            $s('#pred-inp-pct').innerHTML = iPct+'%';

            //HTM
            brain.sense(rawInp);

            //visualize the temporal pooler
            render(brain.TP);

            di++;
        });
    } else {
        //the pattern to learn
/* TODO: content editable div to input the alphanum pattern to learn;
         change the background color of characters after they've been
         processed; use the burst/non-burst ratio to determine the
         color of each character's background to give a visual notice
         of how well a character was predicted. */
        pattern = (
            'if only i had two dogs and i wasnt allergic if only i had two dogs and i wasnt allergic if only i had two dogs and i wasnt allergic if only i had two dogs and i wasnt allergic if only i had two dogs and i wasnt allergic if only i had two dogs and i wasnt allergic if only i had two dogs and i wasnt allergic if only i had two dogs and i wasnt allergic'
        ).split('');
        pattern = (
            'Article I Section 1 All legislative Powers herein granted shall be vested in a Congress of the United States which shall consist of a Senate and House of Representatives Section 2 The House of Representatives shall be composed of Members chosen every second Year by the People of the several States and the Electors in each State shall have the Qualifications requisite for Electors of the most numerous Branch of the State Legislature No Person shall be a Representative who shall not have attained to the Age of twenty five Years and been seven Years a Citizen of the United States and who shall not when elected be an Inhabitant of that State in which he shall be chosen Representatives and direct Taxes shall be apportioned among the several States which may be included within this Union according to their respective Numbers which shall be determined by adding to the whole Number of free Persons including those bound to Service for a Term of Years and excluding Indians not taxed three fifths of all other Persons The actual Enumeration shall be made within three Years after the first Meeting of the Congress of the United States and within every subsequent Term of ten Years in such Manner as they shall by Law direct The Number of Representatives shall not exceed one for every thirty Thousand but each State shall have at Least one Representative and until such enumeration shall be made the State of New Hampshire shall be entitled to chuse three Massachusetts eight Rhode Island and Providence Plantations one Connecticut five New York six New Jersey four Pennsylvania eight Delaware one Maryland six Virginia ten North Carolina five South Carolina five and Georgia three When vacancies happen in the Representation from any State the Executive Authority thereof shall issue Writs of Election to fill such Vacancies The House of Representatives shall chuse their Speaker and other Officers and shall have the sole Power of Impeachment Section 3 The Senate of the United States shall be composed of two Senators from each State chosen by the Legislature thereof for six Years and each Senator shall have one Vote Immediately after they shall be assembled in Consequence of the first Election they shall be divided as equally as may be into three Classes The Seats of the Senators of the first Class shall be vacated at the Expiration of the second Year of the second Class at the Expiration of the fourth Year and of the third Class at the Expiration of the sixth Year so that one third may be chosen every second Year and if Vacancies happen by Resignation or otherwise during the Recess of the Legislature of any State the Executive thereof may make temporary Appointments until the next Meeting of the Legislature which shall then fill such Vacancies No Person shall be a Senator who shall not have attained to the Age of thirty Years and been nine Years a Citizen of the United States and who shall not when elected be an Inhabitant of that State for which he shall be chosen The Vice President of the United States shall be President of the Senate but shall have no Vote unless they be equally divided The Senate shall chuse their other Officers and also a President pro tempore in the Absence of the Vice President or when he shall exercise the Office of President of the United States The Senate shall have the sole Power to try all Impeachments When sitting for that Purpose they shall be on Oath or Affirmation When the President of the United States is tried the Chief Justice shall preside And no Person shall be convicted without the Concurrence of two thirds of the Members present Judgment in Cases of Impeachment shall not extend further than to removal from Office and disqualification to hold and enjoy any Office of honor Trust or Profit under the United States but the Party convicted shall nevertheless be liable and subject to Indictment Trial Judgment and Punishment according to Law Section 4 The Times Places and Manner of holding Elections for Senators and Representatives shall be prescribed in each State by the Legislature thereof but the Congress may at any time by Law make or alter such Regulations except as to the Places of chusing Senators The Congress shall assemble at least once in every Year and such Meeting shall be on the first Monday in December unless they shall by Law appoint a different Day Section 5 Each House shall be the Judge of the Elections Returns and Qualifications of its own Members and a Majority of each shall constitute a Quorum to do Business but a smaller Number may adjourn from day to day and may be authorized to compel the Attendance of absent Members in such Manner and under such Penalties as each House may provide Each House may determine the Rules of its Proceedings punish its Members for disorderly Behaviour and with the Concurrence of two thirds expel a Member Each House shall keep a Journal of its Proceedings and from time to time publish the same excepting such Parts as may in their Judgment require Secrecy and the Yeas and Nays of the Members of either House on any question shall at the Desire of one fifth of those Present be entered on the Journal Neither House during the Session of Congress shall without the Consent of the other adjourn for more than three days nor to any other Place than that in which the two Houses shall be sitting Section 6 The Senators and Representatives shall receive a Compensation for their Services to be ascertained by Law and paid out of the Treasury of the United States They shall in all Cases except Treason Felony and Breach of the Peace be privileged from Arrest during their Attendance at the Session of their respective Houses and in going to and returning from the same and for any Speech or Debate in either House they shall not be questioned in any other Place No Senator or Representative shall during the Time for which he was elected be appointed to any civil Office under the Authority of the United States which shall have been created or the Emoluments whereof shall have been encreased during such time and no Person holding any Office under the United States shall be a Member of either House during his Continuance in Office Section 7 All Bills for raising Revenue shall originate in the House of Representatives but the Senate may propose or concur with Amendments as on other Bills Every Bill which shall have passed the House of Representatives and the Senate shall before it become a Law be presented to the President of the United States If he approve he shall sign it but if not he shall return it with his Objections to that House in which it shall have originated who shall enter the Objections at large on their Journal and proceed to reconsider it If after such Reconsideration two thirds of that House shall agree to pass the Bill it shall be sent together with the Objections to the other House by which it shall likewise be reconsidered and if approved by two thirds of that House it shall become a Law But in all such Cases the Votes of both Houses shall be determined by yeas and Nays and the Names of the Persons voting for and against the Bill shall be entered on the Journal of each House respectively If any Bill shall not be returned by the President within ten Days Sundays excepted after it shall have been presented to him the Same shall be a Law in like Manner as if he had signed it unless the Congress by their Adjournment prevent its Return in which Case it shall not be a Law Every Order Resolution or Vote to which the Concurrence of the Senate and House of Representatives may be necessary except on a question of Adjournment shall be presented to the President of the United States and before the Same shall take Effect shall be approved by him or being disapproved by him shall be repassed by two thirds of the Senate and House of Representatives according to the Rules and Limitations prescribed in the Case of a Bill Section 8 The Congress shall have Power To lay and collect Taxes Duties Imposts and Excises to pay the Debts and provide for the common Defence and general Welfare of the United States but all Duties Imposts and Excises shall be uniform throughout the United States To borrow Money on the credit of the United States To regulate Commerce with foreign Nations and among the several States and with the Indian Tribes To establish an uniform Rule of Naturalization and uniform Laws on the subject of Bankruptcies throughout the United States To coin Money regulate the Value thereof and of foreign Coin and fix the Standard of Weights and Measures To provide for the Punishment of counterfeiting the Securities and current Coin of the United States To establish Post Offices and post Roads To promote the Progress of Science and useful Arts by securing for limited Times to Authors and Inventors the exclusive Right to their respective Writings and Discoveries To constitute Tribunals inferior to the supreme Court To define and punish Piracies and Felonies committed on the high Seas and Offences against the Law of Nations To declare War grant Letters of Marque and Reprisal and make Rules concerning Captures on Land and Water To raise and support Armies but no Appropriation of Money to that Use shall be for a longer Term than two Years To provide and maintain a Navy To make Rules for the Government and Regulation of the land and naval Forces To provide for calling forth the Militia to execute the Laws of the Union suppress Insurrections and repel Invasions To provide for organizing arming and disciplining the Militia and for governing such Part of them as may be employed in the Service of the United States reserving to the States respectively the Appointment of the Officers and the Authority of training the Militia according to the discipline prescribed by Congress To exercise exclusive Legislation in all Cases whatsoever over such District not exceeding ten Miles square as may by Cession of particular States and the Acceptance of Congress become the Seat of the Government of the United States and to exercise like Authority over all Places purchased by the Consent of the Legislature of the State in which the Same shall be for the Erection of Forts Magazines Arsenals dock Yards and other needful Buildings And To make all Laws which shall be necessary and proper for carrying into Execution the foregoing Powers and all other Powers vested by this Constitution in the Government of the United States or in any Department or Officer thereof Section 9 The Migration or Importation of such Persons as any of the States now existing shall think proper to admit shall not be prohibited by the Congress prior to the Year one thousand eight hundred and eight but a Tax or duty may be imposed on such Importation not exceeding ten dollars for each Person The Privilege of the Writ of Habeas Corpus shall not be suspended unless when in Cases of Rebellion or Invasion the public Safety may require it No Bill of Attainder or ex post facto Law shall be passed No Capitation or other direct Tax shall be laid unless in Proportion to the Census or enumeration herein before directed to be taken No Tax or Duty shall be laid on Articles exported from any State No Preference shall be given by any Regulation of Commerce or Revenue to the Ports of one State over those of another nor shall Vessels bound to or from one State be obliged to enter clear or pay Duties in another No Money shall be drawn from the Treasury but in Consequence of Appropriations made by Law and a regular Statement and Account of the Receipts and Expenditures of all public Money shall be published from time to time No Title of Nobility shall be granted by the United States And no Person holding any Office of Profit or Trust under them shall without the Consent of the Congress accept of any present Emolument Office or Title of any kind whatever from any King Prince or foreign State Section 10 No State shall enter into any Treaty Alliance or Confederation grant Letters of Marque and Reprisal coin Money emit Bills of Credit make any Thing but gold and silver Coin a Tender in Payment of Debts pass any Bill of Attainder ex post facto Law or Law impairing the Obligation of Contracts or grant any Title of Nobility No State shall without the Consent of the Congress lay any Imposts or Duties on Imports or Exports except what may be absolutely necessary for executing it s inspection Laws and the net Produce of all Duties and Imposts laid by any State on Imports or Exports shall be for the Use of the Treasury of the United States and all such Laws shall be subject to the Revision and Controul of the Congress No State shall without the Consent of Congress lay any Duty of Tonnage keep Troops or Ships of War in time of Peace enter into any Agreement or Compact with another State or with a foreign Power or engage in War unless actually invaded or in such imminent Danger as will not admit of delay'
        ).split(''); //Article 1 of US constitution
        pattern = (
            'ABCDEFGHIJKLMNOPWRSTUBVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNO PQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIKLLET ME TYPE IN A SENTENCE LET ME TYPE IN A SENTENCE LET ME TEYYPE IN A SENTENCE LET ME TYPE IN A SENTENCE LET ME TYPE IN A SENTENCE LET ME TYPE IN A SENTENCE LET ME TYPE IN A SENTENCE LET ME TYPE IN A SENTENCE LET ME TYPE IN A SENTENCE LET ME TYPE IN A SENTENCE LET ME TYPE IN A SENTENCE LT ME TYPE IN A SENTENCE LET ME TYPE IN A SENTENCE SENTENCE SENTENCE SENTENCE SENTENCE SENTENCE SENTENCE SENTENCE SENTENCE SENTENCE SENTENCE SENTENCE SENTENCE SENTENCE SENTENCE SENTENCE SENTENCE SENTENCE SENTENCE SENTENCE SENTENCE SENTENCEABABABABABABABABABABABABABABABABABABABABABABABABABABABABABABABABABABABABABABABABABABABABABABABAB ABABABABABABABABABABABABABABABABABABABABABABABABABABABABABABABABABABABABABABABABAB ABABABABABABABABABABABABABABABABABABABABABABABABABAB'
        ).split('');

        var start = +new Date();
        var asyncLoopData = function(callback) {
            //predict this iteration's input
            var pred = brain.predict()[0][0];
            predStr += pred;
            if (pred === pattern[di]) preds[1]++;
            else preds[0]++;

            //report the current iteration
            $s('#time').innerHTML = di;

            if ($s('#input').innerHTML.length >= 12) {
                $s('#input').innerHTML = $s('#input').innerHTML.substring(1);
            }
            $s('#input').innerHTML = $s('#input').innerHTML+pattern[di];

            if ($s('#pred').innerHTML.length >= 12) {
                $s('#pred').innerHTML = $s('#pred').innerHTML.substring(1);
            }
            $s('#pred').innerHTML = $s('#pred').innerHTML+pred;

            var bPct = round(100*bursts[1]/(bursts[0]+bursts[1]), 2);
            $s('#pred-actv-pct').innerHTML = bPct+'%';

            var iPct = round(100*preds[1]/(preds[0]+preds[1]), 2);
            $s('#pred-inp-pct').innerHTML = iPct+'%';

            //HTM
            brain.sense(pattern[di]);

            //visualize the temporal pooler
            if (di%drawEvery === 0) render(brain.TP);

            //increment and call the next iteration
            di++;
            setTimeout(function() { callback(true); }, delay);
        };
        asyncLoop(
            pattern.length, //how many times to loop
            //1000*1000, //how many times to loop
            function(loop) {
                asyncLoopData(function(keepGoing) {
                    if (keepGoing) loop.next();
                    else loop.break();
                });
            },
            function() { //loop finished
                //report the correct-activation-prediction rate
                console.log(
                    bursts[1]+'/'+(bursts[0]+bursts[1])+' = '+
                    round(100*(bursts[1])/(bursts[0]+bursts[1]), 2)+
                    '% of activations predicted.'
                );
                //report the correct-input-prediction rate
                console.log(
                    preds[1]+'/'+(preds[0]+preds[1])+' = '+
                    round(100*(preds[1])/(preds[0]+preds[1]), 2)+
                    '% of inputs predicted.'
                );
                //the string of predictions
                console.log(predStr);
                //report out how long it took
                var duration = +new Date() - start;
                console.log('That input took '+duration+'ms.');
            }
        );
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
            //else color = '#EFEFEF'; //nothing

            if (color) drawPoint(ctx, x+xo, y+yo, tpoRad, color);
        }
    }
}

/***********
 * objects */
function Layer(settings) {
    settings = settings || {};

    //default configuration
    this.cfg = {
        //the type of input stream (which encoder to use)
        encoder: settings.encoder || 'alphanum',
        //parameters that affect the encoder
        encoderCfg: settings.encoderCfg || {
            scalar: {
                n: 121,
                w: 61,
                min: 40,
                max: 140
            },
            alphanum: {
                n: 200,
                w: 30,
            },
            coordinate: {
                n: 160,
                w: 32,
                dim: 2,
                res: 6,
                radius: 7
            }
        },
        //how many columns total
        numCols: settings.numCols || 2048,
        //fraction of columns that are active
        sparsity: settings.sparsity || 41/2048,

        //with how many bits can SP cols form synapses?
        numPotSyn: settings.numPotSyn || 48,
        //the largest boost value the algorithm can dole out
        maxBoost: settings.maxBoost || 3,
        //min tolerable activity is this fraction times the max activity seen
        minMaxActvRatio: settings.minMaxActvRatio || 0.01,
        //# of active synapses for an SP col to be considered
        minOverlap: settings.minOverlap || 4,
        //how long ago does the alg look into activity history?
        historyFog: settings.historyFog || 20,
        //initial permanence
        initPerm: settings.initPerm || 0.20,
        //permanences are initialized to initPerm +/- permSpread
        permSpread : settings.permSpread || 0.08,
        //determines whether or not a synapse is connected
        permThresh: settings.permThresh || 0.20,
        //how much permanences are incremented
        permInc: settings.permInc || 0.04,
        //"" decremented
        permDec: settings.permDec || 0.03,

        //number of cells in each column
        cellsPerCol: settings.cellsPerCol || 16,
        //controls how many synapses are added
        numNewSyn: settings.numNewSyn || 14,
        //# active synapses for a segment to be active
        actvThresh: settings.actvThresh || 10,
        //min num active synapses for learning selection
        minSynThresh: settings.minSynThresh || 7,
        //how far into the past the pred routine considers
        predictionFog: settings.predictionFog || 40
    };

    this.encodeFn = function(type, cfg, value) {
        var p = cfg[type];
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
                function randCycle(num, range) {
                    var a = 71693, b = 4549;
                    return (a*num+b)%range;
                }

                var categoryIdx = alphanum.indexOf(value);
                if (categoryIdx < 0) categoryIdx = 0; //unknowns are '?'

                var curr = randCycle(categoryIdx, 1000*p.n);
                var out = [];
                for (var ai = 0; ai < p.n; ai++) out.push(false);
                for (var ai = 0; ai < p.w; ai++) {
                    out[curr%p.n] = true;
                    curr = randCycle(curr, 24499);
                }

                return out; //guaranteed to have <= w "trues" guaranteed
            case 'coordinate':
                function getOrders(d, bds, ret, currLoc, cd) {
                    if (arguments.length < 4) {
                        currLoc = [];
                        cd = d;
                    }
                    if (cd === 0) {
                        var randNumGen = new RNG(currLoc+'orders');
                        ret.push([currLoc, randNumGen.uniform()]);
                    } else {
                        for (var ai = bds[cd-1][0]; ai <= bds[cd-1][1]; ai++) {
                            var loc = [ai].concat(currLoc);
                            getOrders(d, bds, ret, loc, cd-1);
                        }
                    }
                }

                var boundaries = [];
                for (var ai = 0; ai < p.dim; ai++) {
                    var left = Math.floor(value[ai]/p.res);
                    var right = left + 2*p.radius;
                    boundaries.push([left, right]);
                }

                var orders = [];
                getOrders(p.dim, boundaries, orders);
                orders.sort(function(a, b) {
                    return b[1] - a[1];
                });

                var idxs = [];
                for (var ai = 0; ai < p.w; ai++) {
                    var randNumGen = new RNG(orders[ai][0]+'indices');
                    var idx = Math.floor(randNumGen.uniform()*p.n);
                    idxs.push(idx);
                }

                var out = [];
                for (var ai = 0; ai < p.n; ai++) out.push(false);
                for (var ai = 0; ai < idxs.length; ai++) {
                    out[idxs[ai]] = true;
                }

                return out;
            default:
                var out = [false];
                return out;
        }
    };

    this.SP = new SpatialPooler(this.cfg, this.encodeFn);
    this.TP = new TemporalPooler(this.cfg);
}
Layer.prototype.sense = function(rawInp) {
/* TODO: this is javascript! Make this whole program event based! Emitting
         an input event should trigger the SP which should trigger each
         active column which should... etc. How much faster would this be?
         Overhead? */
    this.TP.process(
        this.SP.process(rawInp), rawInp
    );
};
Layer.prototype.predict = function() {
    return this.TP.predictFFInp();
};

function TemporalPooler(cfg) {
    this.cfg = cfg;
    this.synapseBank = [];

    this.synActv = {};
    this.wereActiveCells = [];
    this.activeCells = [];
    this.wereLearningCells = [];
    this.learningCells = [];
    this.predictedSegs = {};

    this.cols = [];
    for (var ai = 0; ai < this.cfg.numCols; ai++) {
        this.cols.push({});
        this.cols[ai].cells = [];
        for (var bi = 0; bi < this.cfg.cellsPerCol; bi++) {
            this.cols[ai].cells.push(new Cell(
                ai, bi, //column id and cell id
                this.cfg.numNewSyn, this.cfg.initPerm,
                this.cfg.permInc, this.cfg.permDec,
                this.cfg.predictionFog
            ));
        }
    }
}
TemporalPooler.prototype.process = function(SDR, rawInp) {
    this.getAllSynActvs(BE4, 0, SKIP); //active only!
    this.activateCells(SDR, rawInp);
    this.getAllSynActvs(NOW, this.cfg.permThresh, BOTH); //active + learning
    this.predictAndLearn();
    this.applyAllSynChanges(); //only where applicable
    this.timeTravel(); //advance to the next time step

/* TODO: return something relevant */

};
TemporalPooler.prototype.getAllSynActvs = function(t, thresh, cmpLrn) {
    //defaults to t === BE4
    var arrs = [this.wereActiveCells, this.wereLearningCells], idx = 0;
    if (t === NOW) {
        arrs[0] = this.activeCells;
        arrs[1] = this.learningCells;
        idx = 1;
    }
    for (var ai = 0; ai < arrs.length; ai++) {
        if (!cmpLrn && ai === 1) break; //skip learning activations

        for (var li = 0; li < arrs[ai].length; li++) {
            var cellLoc = arrs[ai][li];
            var cell = this.cols[cellLoc[0]].cells[cellLoc[1]];
            var synOrigins = Object.keys(cell.incomingSyns);
            for (var oi = 0; oi < synOrigins.length; oi++) {
                var synOrigin = synOrigins[oi];

                if (cell.incomingSyns[synOrigin] < thresh) continue;
                var synIdnt = synOrigin+':'+thresh;
                if (!this.synActv.hasOwnProperty(synIdnt)) {
                    //[wereActive, active, wereLearn, learn]
                    this.synActv[synIdnt] = [0, 0, 0, 0];
                }
                //the learning actvs are offset by 2 and they're index at 1
                this.synActv[synIdnt][idx+2*ai] += 1;

                //if the current activity being probed is the kind that
                //leads to predictions...
                if (ai === 0 && t === NOW &&
                    thresh === this.cfg.permThresh) {
                    //then check to see if the cell would be predicted
                    if (this.synActv[synIdnt][1] >= this.cfg.actvThresh) {
                        var info = synIdnt.split(':');
                        this.predictedSegs[
                            info[0]+':'+info[1]+':'+info[2]
                        ] = true;
                    }
                }
            }
        }
    }
    var n = Object.keys(this.synActv).length;
    console.log(n+''+((n>20*10*9*2048*0.02)?' !!!':''));
};
TemporalPooler.prototype.predictFFInp = function() {
    var probs = {};
    for (var ai = 0; ai < alphanum.length; ai++) {
        probs[alphanum.charAt(ai)] = 0;
    }
    for (var ki = 0; ki < this.cfg.numCols; ki++) {
        for (var ci = 0; ci < this.cfg.cellsPerCol; ci++) {
            var cell = this.cols[ki].cells[ci];
            if (cell.predicted) {
                var dps = Object.keys(cell.lookup);
                for (var di = 0; di < dps.length; di++) {
                    var dp = dps[di];
                    probs[dp] += cell.lookup[dp][0];
                }
            }
        }
    }

    //order the probabilities
    var ret = [];
    var sum = 0;
    var dps = Object.keys(probs);
    for (var di = 0; di < dps.length; di++) {
        var dp = dps[di];
        ret.push([dp, probs[dp]]);
        sum += probs[dp];
    }
    ret.sort(function(a, b) {
        return b[1]-a[1];
    });

    //normalize them
    for (var di = 0; di < ret.length; di++) {
        if (sum > 0) ret[di][1] /= sum;
        else {
            ret[di][1] = 1/ret.length;
        }
    }

    //sorted list of each datapoint and its likelihood
    return ret;
};
TemporalPooler.prototype.activateCells = function(SDR, rawInp) {
    for (var kId = 0; kId < SDR.length; kId++) {
        if (!SDR[kId]) continue; //this is only for active columns

        //given an active column, activate predicted cells
        var activatedCell = false;
        var choseLearning = false;
        for (var ci = 0; ci < this.cols[kId].cells.length; ci++) {
            var cell = this.cols[kId].cells[ci];
            if (cell.wasPredicted) {
                cell.active = true;
                this.activeCells.push([kId, ci]);
                activatedCell = true;
                cell.observe(rawInp);

                if (cell.predictingSegWasLearn) {
                    cell.learning = true;
                    this.learningCells.push([kId, ci]);
                    choseLearning = true;
                }
            }
        }

        //if no cells were predicted, burst
        if (!activatedCell) {
            //bursting means activating all of the cells in a column
            for (var ci = 0; ci < this.cols[kId].cells.length; ci++) {
                var cell = this.cols[kId].cells[ci];
                cell.active = true;
                this.activeCells.push([kId, ci]);
                cell.observe(rawInp);
            }

            bursts[0]++;
        } else bursts[1]++;

        //the TP is always learning, so if there aren't any perfect cells
        //to teach, find one that's well suited to training
        if (!choseLearning) this.teachAPromisingCell(kId);
    }
};
TemporalPooler.prototype.predictAndLearn = function() {
    //clear old predictions
    for (var ki = 0; ki < this.cols.length; ki++) {
        for (var ci = 0; ci < this.cols[ki].cells.length; ci++) {
            var cell = this.cols[ki].cells[ci];
            cell.predicted = false; //not yet it isn't!
            cell.predictingSegWasLearn = false; //don't know yet
        }
    }

    //go through the cells you know are predicted
    var segs = Object.keys(this.predictedSegs);
    for (var pi = 0; pi < segs.length; pi++) {
        var info = segs[pi].split(':');
        var cell = this.cols[info[0]].cells[info[1]];
        var segment = cell.distalDendrites[info[2]];
        var activity = this.getSynActivity(
            cell, info[2], NOW, this.cfg.permThresh
        );

        //if the number of active synapses on this segment
        //exceeds the activity ratio, then the segment is
        //active -> predict the column
        if (activity[0] >= this.cfg.actvThresh) {
            this.predictCell(cell, activity, info[2]);
        }
    }
};
TemporalPooler.prototype.proposeSynChanges = function(
    cell, t, segId, synBank, addSyns
) {
    if (segId < 0) return false;

    var seg = cell.distalDendrites[segId];
    var activeSynLocs = [];
    for (var si = 0; si < seg.length; si++) { //iterate synapses
        var connCol = this.cols[seg[si][0]];
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

/* TODO: protection against not enough? */

    if (addSyns && t === BE4) {
        var numSyns = this.cfg.numNewSyn - activeSynLocs.length;
        var newSynIds = getRandPerm(synBank.length, numSyns);
        for (var si = 0; si < newSynIds.length; si++) {
            var sb = synBank[newSynIds[si]];
            cell.synChanges.push([
                NEW, segId, sb[0], sb[1]
            ]);
        }
    }
};
TemporalPooler.prototype.applyAllSynChanges = function() {
    for (var ki = 0; ki < this.cols.length; ki++) {
        for (var ci = 0; ci < this.cols[ki].cells.length; ci++) {
            var cell = this.cols[ki].cells[ci];
            if (cell.learning) {
                this.applySynChanges(cell, PRNF);
            } else if (cell.wasPredicted && !cell.predicted) {
                this.applySynChanges(cell, NRNF);
            }
        }
    }
};
TemporalPooler.prototype.timeTravel = function() {
    this.synapseBank = []; //clean up the old potential synapse list
    this.wereActiveCells = this.activeCells;
    this.activeCells = []; //no cells are active now
    this.wereLearningCells = this.learningCells;
    this.learningCells = []; //no cells are learning too
    this.synActv = {}; //get rid of all the old activities
    this.predictedSegs = {}; //get rid of the old predicted cells
    //clean up the dendrite segment activities list too!!!
    for (var ki = 0; ki < this.cols.length; ki++) {
        for (var ci = 0; ci < this.cols[ki].cells.length; ci++) {
            //move all the cells forward in time
            var cell = this.cols[ki].cells[ci];
            cell.wasActive = cell.active;
            cell.wasLearning = cell.learning;
            cell.wasPredicted = cell.predicted;

            //see if this cell should be in the synapse bank
            if (cell.wasActive && cell.wasLearning) {
                //synapses have a destination and a permanence
                var synapse = [ki, ci, this.cfg.initPerm];
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
    this.learningCells.push([colId, learningIds[0]]);

    if (learningIds[1] === -1) { //no good segments? grow one.
        this.growDistalDendrite(lCell, this.synapseBank);
    } else { //a kinda good match? reinforce it.
        this.proposeSynChanges(
            lCell, BE4, learningIds[1], this.synapseBank, GROW
        );
    }
};
TemporalPooler.prototype.growDistalDendrite = function(cell, synBank) {
    var dendrite = [];
    var numSyns = this.cfg.numNewSyn;
    var newSynIds = getRandPerm(synBank.length, numSyns);

/* TODO: why are some dendrites so empty? */

    if (newSynIds.length === 0) return;
    for (var si = 0; si < newSynIds.length; si++) {
        var sb = synBank[newSynIds[si]];
        dendrite.push([
            sb[0], sb[1]
        ]);

        var connCell = this.cols[sb[0]].cells[sb[1]];
        connCell.incomingSyns[
            cell.colId+':'+cell.cellId+':'+cell.distalDendrites.length
        ] = this.cfg.initPerm;
    }
    cell.distalDendrites.push(dendrite);
};
TemporalPooler.prototype.applySynChanges = function(cell, posReinforce) {
    for (var ci = 0; ci < cell.synChanges.length; ci++) {
        var change = cell.synChanges[ci];
        var seg = cell.distalDendrites[change[1]];
        var synOrigin = cell.colId+':'+cell.cellId+':'+change[1];
        switch (change[0]) {
            case ACTV:
                var syn = seg[change[2]];
                var connCell = this.cols[syn[0]].cells[syn[1]];
                if (posReinforce) {
                    connCell.incomingSyns[synOrigin] += this.cfg.permInc;
                } else {
                    connCell.incomingSyns[synOrigin] -= this.cfg.permDec;
                }
                break;
            case INAC:
                var syn = seg[change[2]];
                var connCell = this.cols[syn[0]].cells[syn[1]];
                if (posReinforce) {
                    connCell.incomingSyns[synOrigin] -= this.cfg.permDec;
                }
                break;
            case NEW: //add synapses to this seg
                seg.push([
                    change[2], change[3]
                ]);
                var connCell = this.cols[change[2]].cells[change[3]];
                connCell.incomingSyns[synOrigin] = this.initPerm;
                break;
        }
    }
    cell.synChanges = []; //changes applied so empty queue
};
TemporalPooler.prototype.getSynActivity = function(cell, gId, t, conThresh) {
    var synIdnt = cell.colId+':'+cell.cellId+':'+gId+':'+conThresh;
    if (this.synActv.hasOwnProperty(synIdnt)) {
        var actv = this.synActv[synIdnt];
        if (t === BE4) return [actv[0], actv[2]];
        else if (t === NOW) return [actv[1], actv[3]];
    } else {
        return [0, 0];
    }
};
TemporalPooler.prototype.predictCell = function(cell, cellsActivity, seg) {
    cell.predicted = true;

    //figure out if this segment (this cell's predicting
    //segment) would be activated by learning cells
    var learningActivity = cellsActivity[1];
    if (learningActivity >= this.cfg.actvThresh) {
        cell.predictingSegWasLearn = true;
    }

    //train the cell's synapses
    this.proposeSynChanges(
        cell, NOW, seg, this.synapseBank, MNTN
    ); //reinforce the synapses that predicted this; don't grow new ones

    var pastSeg = this.getBestMatchingSeg(cell, BE4);
    this.proposeSynChanges(
        cell, BE4, pastSeg[0], this.synapseBank, MNTN
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

    if (mostActivity > this.cfg.minSynThresh) { //has to be > thresh
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

/* TODO: figure out why occasionally, there's only 1/2025 active columns */

function SpatialPooler(cfg, encodeFn) {
    this.cfg = cfg;
    this.encodeFn = encodeFn;
    this.columns = [];

    var s = cfg.encoderCfg[cfg.encoder].n; //len of input in bits
    for (var ai = 0; ai < this.cfg.numCols; ai++) {
        this.columns.push(new Column(
            ai, s, cfg.numPotSyn,
            cfg.initPerm, cfg.permSpread,
            cfg.permThresh, cfg.minOverlap
        ));
    }
}
SpatialPooler.prototype.process = function(inp) {
    var inpSDR = this.encodeFn(this.cfg.encoder, this.cfg.encoderCfg, inp);
    var sdr = [];

    //activate the correct columns and collect data about it
    var overlaps = this.getOverlaps(inpSDR);
    var thresh = this.getOvlpThreshold(overlaps);
    var maxActv = 0;
    for (var ai = 0; ai < overlaps.length; ai++) {
        var col = this.columns[ai];
        if (overlaps[ai] > 0 && overlaps[ai] > thresh) {
            col.state = 1; //active

            //adjust the permanences because it's active
            for (var bi = 0; bi < col.bitIndices.length; bi++) {
                if (col.permanences[bi] >= this.cfg.permThresh) { //connected
                    if (inpSDR[col.bitIndices[bi]]) { //& input bit is true?
                        //strengthen the conn
                        col.permanences[bi] += this.cfg.permInc;
                        if (col.permanences[bi] > 1) col.permanences[bi] = 1;
                    } else { //connected and false?
                        //weaken the conn
                        col.permanences[bi] -= this.cfg.permDec;
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
        if (col.actvHistory.length > this.cfg.historyFog) {
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
        if (col.ovlpHistory.length > this.cfg.historyFog) {
            col.ovlpTotal -= col.ovlpHistory[0];
            col.ovlpHistory.shift();
        }

        sdr.push(col.state === 1 ? true : false);
    }

    //boost columns based on activity
    var minActv = this.cfg.minMaxActvRatio*maxActv;
    var boostSlope = (1 - this.cfg.maxBoost)/minActv;
    for (var ai = 0; ai < this.columns.length; ai++) {
        var col = this.columns[ai];
        if (col.actvTotal >= minActv) col.boost = 1;
        else col.boost = boostSlope*col.actvTotal + this.cfg.maxBoost;
    }

    //boost connections based on overlap
    for (var ai = 0; ai < this.columns.length; ai++) {
        var col = this.columns[ai];
        if (col.ovlpTotal < minActv) col.dopePermanences(this.cfg.permInc);
    }

    return sdr;
};
SpatialPooler.prototype.getSDR = function(rawInp) {
    var inpSDR = this.encodeFn(this.cfg.encoder, this.cfg.encoderCfg, rawInp);
    var sdr = [];
    var overlaps = this.getOverlaps(inpSDR);
    var thresh = this.getOvlpThreshold(overlaps);
    for (var ai = 0; ai < overlaps.length; ai++) {
        if (overlaps[ai] > thresh) sdr.push(true);
        else sdr.push(false);
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
    //how many to allow through
    var goalNum = Math.round(this.cfg.sparsity*this.cfg.numCols);
    var bkp = overlaps.slice();
    bkp.sort(function(a, b) { return b - a; });

    var k = bkp[goalNum]; //good estimate of the best
    var lowestError = bkp.filter(function(a){return a > k;}).length-goalNum;

    for (var ai = k; ai > this.cfg.minOverlap; ai--) {
        var error = bkp.filter(function(a){return a > ai;}).length-goalNum;
        if (error <= lowestError && error < 0) {
            lowestError = error;
            k = ai;
        } else { //error is less than zero
            //if the most recent error is better OR if the previous error
            //hardly includes any columns
            if (Math.abs(error) < Math.abs(lowestError) ||
                -lowestError > 0.5*goalNum) {
                return ai;
            } else {
                return k;
            }
        }
    }

    return k;
};

function Column(
    pos, s, numPotSyn, initPerm, permSpread, permThresh, minOverlap
) {
    //s is the length of the transformed inputs in bits
    this.bitIndices = [];
    this.permanences = [];
    this.permThresh = permThresh;
    this.minOverlap = minOverlap;
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
        this.permanences.push(
            grf(initPerm-permSpread, initPerm+permSpread)
        );
    }
}
Column.prototype.getOverlap = function(inp) {
    var matching = 0;
    for (var ai = 0; ai < this.bitIndices.length; ai++) {
        if (this.permanences[ai] >= this.permThresh) {
            if (inp[this.bitIndices[ai]]) matching++;
        }
    }

    if (matching < this.minOverlap) return 0;
    else return matching*this.boost;
};
Column.prototype.dopePermanences = function(amt) {
    for (var ai = 0; ai < this.permanences.length; ai++) {
        this.permanences[ai] += amt;
        this.permanences[ai] = Math.max(this.permanences[ai], 1);
    }
};

function Cell(
    colId, cellId, numNewSyn, initPerm, permInc, permDec, predictionFog
) {
    this.colId = colId;
    this.cellId = cellId;
    this.active = false;
    this.learning = false;
    this.predicted = false;
    this.wasActive = false;
    this.wasLearning = false;
    this.wasPredicted = false;
    this.predictingSegWasLearn = false;
    this.distalDendrites = []; //keeps track of its own
    this.incomingSyns = {};
    this.synChanges = [];
    this.numNewSyn = numNewSyn;
    this.initPerm = initPerm;
    this.permInc = permInc;
    this.permDec = permDec;
    this.predictionFog = predictionFog;

    this.lookup = {};
    for (var ai = 0; ai < alphanum.length; ai++) {
        this.lookup[alphanum.charAt(ai)] = [
            0, //moving average of
            [] //activity history
        ];
    }
}
Cell.prototype.observe = function(rawInp) {
    //modifies the entire lookup table
    var dps = Object.keys(this.lookup);
    for (var di = 0; di < dps.length; di++) {
        var dp = dps[di];
        var val = (dp === rawInp) ? 1 : 0;
        var table = this.lookup[dp];
        var n = table[1].length;
        if (n < this.predictionFog) { //still hasn't cleared the fog
            table[0] = (n*table[0]+val)/(n+1);
            table[1].push(val);
        } else { //table is filled up, conveyer belt now
            table[0] -= table[1][0]/n;
            table[0] += val/n;
            table[1].shift();
            table[1].push(val);
        }
    }
};

/********************
 * helper functions */
function colorArrToHex(a) {
    var ret = '#';
    for (var ai = 0; ai < a.length; ai++) {
        var chunk = Math.floor(a[ai]).toString(16);
        while (chunk.length < 2) chunk = '0'+chunk;
        ret += chunk;
    }
    return ret;
}
function getGradient(a, b, f) {
    var ret = [];
    for (var ci = 0; ci < a.length; ci++) ret.push(a[ci]*f + b[ci]*(1-f));
    return ret;
}
function drawPoint(theCtx, x, y, r, color) {
	r = r || 2
	color = color || 'rgba(0, 0, 0, 1)'

	theCtx.fillStyle = color;
	theCtx.beginPath();
	theCtx.arc(x, y, r, 0, 2*Math.PI, true);
	theCtx.closePath();
	theCtx.fill();
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
