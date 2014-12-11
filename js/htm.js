/******************\
|   Hierarchical   |
| Temporal Memory  |
|      System      |
| @author Anthony  |
| @version 0.1     |
| @date 2014/07/12 |
| @edit 2014/12/09 |
\******************/

/**********
 * config */
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

var alphanum = 'abcdefghijklmnopqrstuvwxyz0123456789';

/*********************
 * working variables */
var canvas;
var ctx;
var mousePos;

var brain;

var bursts, preds;
var predStr;

/******************
 * work functions */
function initHTM() {
    var start = +new Date();

    //the pattern to learn
/* TODO: content editable div to input the alphanum pattern to learn;
         change the background color of characters after they've been
         processed; use the burst/non-burst ratio to determine the
         color of each character's background to give a visual notice
         of how well a character was predicted. */
    pattern = (
        'Article0I0Section010All0legislative0Powers0herein0granted0shall0be0vested0in0a0Congress0of0the0United0States0which0shall0consist0of0a0Senate0and0House0of0Representatives0Section020The0House0of0Representatives0shall0be0composed0of0Members0chosen0every0second0Year0by0the0People0of0the0several0States0and0the0Electors0in0each0State0shall0have0the0Qualifications0requisite0for0Electors0of0the0most0numerous0Branch0of0the0State0Legislature0No0Person0shall0be0a0Representative0who0shall0not0have0attained0to0the0Age0of0twenty0five0Years0and0been0seven0Years0a0Citizen0of0the0United0States0and0who0shall0not0when0elected0be0an0Inhabitant0of0that0State0in0which0he0shall0be0chosen0Representatives0and0direct0Taxes0shall0be0apportioned0among0the0several0States0which0may0be0included0within0this0Union0according0to0their0respective0Numbers0which0shall0be0determined0by0adding0to0the0whole0Number0of0free0Persons0including0those0bound0to0Service0for0a0Term0of0Years0and0excluding0Indians0not0taxed0three0fifths0of0all0other0Persons0The0actual0Enumeration0shall0be0made0within0three0Years0after0the0first0Meeting0of0the0Congress0of0the0United0States0and0within0every0subsequent0Term0of0ten0Years0in0such0Manner0as0they0shall0by0Law0direct0The0Number0of0Representatives0shall0not0exceed0one0for0every0thirty0Thousand0but0each0State0shall0have0at0Least0one0Representative0and0until0such0enumeration0shall0be0made0the0State0of0New0Hampshire0shall0be0entitled0to0chuse0three0Massachusetts0eight0Rhode0Island0and0Providence0Plantations0one0Connecticut0five0New0York0six0New0Jersey0four0Pennsylvania0eight0Delaware0one0Maryland0six0Virginia0ten0North0Carolina0five0South0Carolina0five0and0Georgia0three0When0vacancies0happen0in0the0Representation0from0any0State0the0Executive0Authority0thereof0shall0issue0Writs0of0Election0to0fill0such0Vacancies0The0House0of0Representatives0shall0chuse0their0Speaker0and0other0Officers0and0shall0have0the0sole0Power0of0Impeachment0Section030The0Senate0of0the0United0States0shall0be0composed0of0two0Senators0from0each0State0chosen0by0the0Legislature0thereof0for0six0Years0and0each0Senator0shall0have0one0Vote0Immediately0after0they0shall0be0assembled0in0Consequence0of0the0first0Election0they0shall0be0divided0as0equally0as0may0be0into0three0Classes0The0Seats0of0the0Senators0of0the0first0Class0shall0be0vacated0at0the0Expiration0of0the0second0Year0of0the0second0Class0at0the0Expiration0of0the0fourth0Year0and0of0the0third0Class0at0the0Expiration0of0the0sixth0Year0so0that0one0third0may0be0chosen0every0second0Year0and0if0Vacancies0happen0by0Resignation0or0otherwise0during0the0Recess0of0the0Legislature0of0any0State0the0Executive0thereof0may0make0temporary0Appointments0until0the0next0Meeting0of0the0Legislature0which0shall0then0fill0such0Vacancies0No0Person0shall0be0a0Senator0who0shall0not0have0attained0to0the0Age0of0thirty0Years0and0been0nine0Years0a0Citizen0of0the0United0States0and0who0shall0not0when0elected0be0an0Inhabitant0of0that0State0for0which0he0shall0be0chosen0The0Vice0President0of0the0United0States0shall0be0President0of0the0Senate0but0shall0have0no0Vote0unless0they0be0equally0divided0The0Senate0shall0chuse0their0other0Officers0and0also0a0President0pro0tempore0in0the0Absence0of0the0Vice0President0or0when0he0shall0exercise0the0Office0of0President0of0the0United0States0The0Senate0shall0have0the0sole0Power0to0try0all0Impeachments0When0sitting0for0that0Purpose0they0shall0be0on0Oath0or0Affirmation0When0the0President0of0the0United0States0is0tried0the0Chief0Justice0shall0preside0And0no0Person0shall0be0convicted0without0the0Concurrence0of0two0thirds0of0the0Members0present0Judgment0in0Cases0of0Impeachment0shall0not0extend0further0than0to0removal0from0Office0and0disqualification0to0hold0and0enjoy0any0Office0of0honor0Trust0or0Profit0under0the0United0States0but0the0Party0convicted0shall0nevertheless0be0liable0and0subject0to0Indictment0Trial0Judgment0and0Punishment0according0to0Law0Section040The0Times0Places0and0Manner0of0holding0Elections0for0Senators0and0Representatives0shall0be0prescribed0in0each0State0by0the0Legislature0thereof0but0the0Congress0may0at0any0time0by0Law0make0or0alter0such0Regulations0except0as0to0the0Places0of0chusing0Senators0The0Congress0shall0assemble0at0least0once0in0every0Year0and0such0Meeting0shall0be0on0the0first0Monday0in0December0unless0they0shall0by0Law0appoint0a0different0Day0Section050Each0House0shall0be0the0Judge0of0the0Elections0Returns0and0Qualifications0of0its0own0Members0and0a0Majority0of0each0shall0constitute0a0Quorum0to0do0Business0but0a0smaller0Number0may0adjourn0from0day0to0day0and0may0be0authorized0to0compel0the0Attendance0of0absent0Members0in0such0Manner0and0under0such0Penalties0as0each0House0may0provide0Each0House0may0determine0the0Rules0of0its0Proceedings0punish0its0Members0for0disorderly0Behaviour0and0with0the0Concurrence0of0two0thirds0expel0a0Member0Each0House0shall0keep0a0Journal0of0its0Proceedings0and0from0time0to0time0publish0the0same0excepting0such0Parts0as0may0in0their0Judgment0require0Secrecy0and0the0Yeas0and0Nays0of0the0Members0of0either0House0on0any0question0shall0at0the0Desire0of0one0fifth0of0those0Present0be0entered0on0the0Journal0Neither0House0during0the0Session0of0Congress0shall0without0the0Consent0of0the0other0adjourn0for0more0than0three0days0nor0to0any0other0Place0than0that0in0which0the0two0Houses0shall0be0sitting0Section060The0Senators0and0Representatives0shall0receive0a0Compensation0for0their0Services0to0be0ascertained0by0Law0and0paid0out0of0the0Treasury0of0the0United0States0They0shall0in0all0Cases0except0Treason0Felony0and0Breach0of0the0Peace0be0privileged0from0Arrest0during0their0Attendance0at0the0Session0of0their0respective0Houses0and0in0going0to0and0returning0from0the0same0and0for0any0Speech0or0Debate0in0either0House0they0shall0not0be0questioned0in0any0other0Place0No0Senator0or0Representative0shall0during0the0Time0for0which0he0was0elected0be0appointed0to0any0civil0Office0under0the0Authority0of0the0United0States0which0shall0have0been0created0or0the0Emoluments0whereof0shall0have0been0encreased0during0such0time0and0no0Person0holding0any0Office0under0the0United0States0shall0be0a0Member0of0either0House0during0his0Continuance0in0Office0Section070All0Bills0for0raising0Revenue0shall0originate0in0the0House0of0Representatives0but0the0Senate0may0propose0or0concur0with0Amendments0as0on0other0Bills0Every0Bill0which0shall0have0passed0the0House0of0Representatives0and0the0Senate0shall0before0it0become0a0Law0be0presented0to0the0President0of0the0United0States0If0he0approve0he0shall0sign0it0but0if0not0he0shall0return0it0with0his0Objections0to0that0House0in0which0it0shall0have0originated0who0shall0enter0the0Objections0at0large0on0their0Journal0and0proceed0to0reconsider0it0If0after0such0Reconsideration0two0thirds0of0that0House0shall0agree0to0pass0the0Bill0it0shall0be0sent0together0with0the0Objections0to0the0other0House0by0which0it0shall0likewise0be0reconsidered0and0if0approved0by0two0thirds0of0that0House0it0shall0become0a0Law0But0in0all0such0Cases0the0Votes0of0both0Houses0shall0be0determined0by0yeas0and0Nays0and0the0Names0of0the0Persons0voting0for0and0against0the0Bill0shall0be0entered0on0the0Journal0of0each0House0respectively0If0any0Bill0shall0not0be0returned0by0the0President0within0ten0Days0Sundays0excepted0after0it0shall0have0been0presented0to0him0the0Same0shall0be0a0Law0in0like0Manner0as0if0he0had0signed0it0unless0the0Congress0by0their0Adjournment0prevent0its0Return0in0which0Case0it0shall0not0be0a0Law0Every0Order0Resolution0or0Vote0to0which0the0Concurrence0of0the0Senate0and0House0of0Representatives0may0be0necessary0except0on0a0question0of0Adjournment0shall0be0presented0to0the0President0of0the0United0States0and0before0the0Same0shall0take0Effect0shall0be0approved0by0him0or0being0disapproved0by0him0shall0be0repassed0by0two0thirds0of0the0Senate0and0House0of0Representatives0according0to0the0Rules0and0Limitations0prescribed0in0the0Case0of0a0Bill0Section080The0Congress0shall0have0Power0To0lay0and0collect0Taxes0Duties0Imposts0and0Excises0to0pay0the0Debts0and0provide0for0the0common0Defence0and0general0Welfare0of0the0United0States0but0all0Duties0Imposts0and0Excises0shall0be0uniform0throughout0the0United0States0To0borrow0Money0on0the0credit0of0the0United0States0To0regulate0Commerce0with0foreign0Nations0and0among0the0several0States0and0with0the0Indian0Tribes0To0establish0an0uniform0Rule0of0Naturalization0and0uniform0Laws0on0the0subject0of0Bankruptcies0throughout0the0United0States0To0coin0Money0regulate0the0Value0thereof0and0of0foreign0Coin0and0fix0the0Standard0of0Weights0and0Measures0To0provide0for0the0Punishment0of0counterfeiting0the0Securities0and0current0Coin0of0the0United0States0To0establish0Post0Offices0and0post0Roads0To0promote0the0Progress0of0Science0and0useful0Arts0by0securing0for0limited0Times0to0Authors0and0Inventors0the0exclusive0Right0to0their0respective0Writings0and0Discoveries0To0constitute0Tribunals0inferior0to0the0supreme0Court0To0define0and0punish0Piracies0and0Felonies0committed0on0the0high0Seas0and0Offences0against0the0Law0of0Nations0To0declare0War0grant0Letters0of0Marque0and0Reprisal0and0make0Rules0concerning0Captures0on0Land0and0Water0To0raise0and0support0Armies0but0no0Appropriation0of0Money0to0that0Use0shall0be0for0a0longer0Term0than0two0Years0To0provide0and0maintain0a0Navy0To0make0Rules0for0the0Government0and0Regulation0of0the0land0and0naval0Forces0To0provide0for0calling0forth0the0Militia0to0execute0the0Laws0of0the0Union0suppress0Insurrections0and0repel0Invasions0To0provide0for0organizing0arming0and0disciplining0the0Militia0and0for0governing0such0Part0of0them0as0may0be0employed0in0the0Service0of0the0United0States0reserving0to0the0States0respectively0the0Appointment0of0the0Officers0and0the0Authority0of0training0the0Militia0according0to0the0discipline0prescribed0by0Congress0To0exercise0exclusive0Legislation0in0all0Cases0whatsoever0over0such0District0not0exceeding0ten0Miles0square0as0may0by0Cession0of0particular0States0and0the0Acceptance0of0Congress0become0the0Seat0of0the0Government0of0the0United0States0and0to0exercise0like0Authority0over0all0Places0purchased0by0the0Consent0of0the0Legislature0of0the0State0in0which0the0Same0shall0be0for0the0Erection0of0Forts0Magazines0Arsenals0dock0Yards0and0other0needful0Buildings0And0To0make0all0Laws0which0shall0be0necessary0and0proper0for0carrying0into0Execution0the0foregoing0Powers0and0all0other0Powers0vested0by0this0Constitution0in0the0Government0of0the0United0States0or0in0any0Department0or0Officer0thereof0Section090The0Migration0or0Importation0of0such0Persons0as0any0of0the0States0now0existing0shall0think0proper0to0admit0shall0not0be0prohibited0by0the0Congress0prior0to0the0Year0one0thousand0eight0hundred0and0eight0but0a0Tax0or0duty0may0be0imposed0on0such0Importation0not0exceeding0ten0dollars0for0each0Person0The0Privilege0of0the0Writ0of0Habeas0Corpus0shall0not0be0suspended0unless0when0in0Cases0of0Rebellion0or0Invasion0the0public0Safety0may0require0it0No0Bill0of0Attainder0or0ex0post0facto0Law0shall0be0passed0No0Capitation0or0other0direct0Tax0shall0be0laid0unless0in0Proportion0to0the0Census0or0enumeration0herein0before0directed0to0be0taken0No0Tax0or0Duty0shall0be0laid0on0Articles0exported0from0any0State0No0Preference0shall0be0given0by0any0Regulation0of0Commerce0or0Revenue0to0the0Ports0of0one0State0over0those0of0another0nor0shall0Vessels0bound0to0or0from0one0State0be0obliged0to0enter0clear0or0pay0Duties0in0another0No0Money0shall0be0drawn0from0the0Treasury0but0in0Consequence0of0Appropriations0made0by0Law0and0a0regular0Statement0and0Account0of0the0Receipts0and0Expenditures0of0all0public0Money0shall0be0published0from0time0to0time0No0Title0of0Nobility0shall0be0granted0by0the0United0States0And0no0Person0holding0any0Office0of0Profit0or0Trust0under0them0shall0without0the0Consent0of0the0Congress0accept0of0any0present0Emolument0Office0or0Title0of0any0kind0whatever0from0any0King0Prince0or0foreign0State0Section0100No0State0shall0enter0into0any0Treaty0Alliance0or0Confederation0grant0Letters0of0Marque0and0Reprisal0coin0Money0emit0Bills0of0Credit0make0any0Thing0but0gold0and0silver0Coin0a0Tender0in0Payment0of0Debts0pass0any0Bill0of0Attainder0ex0post0facto0Law0or0Law0impairing0the0Obligation0of0Contracts0or0grant0any0Title0of0Nobility0No0State0shall0without0the0Consent0of0the0Congress0lay0any0Imposts0or0Duties0on0Imports0or0Exports0except0what0may0be0absolutely0necessary0for0executing0it0s0inspection0Laws0and0the0net0Produce0of0all0Duties0and0Imposts0laid0by0any0State0on0Imports0or0Exports0shall0be0for0the0Use0of0the0Treasury0of0the0United0States0and0all0such0Laws0shall0be0subject0to0the0Revision0and0Controul0of0the0Congress0No0State0shall0without0the0Consent0of0Congress0lay0any0Duty0of0Tonnage0keep0Troops0or0Ships0of0War0in0time0of0Peace0enter0into0any0Agreement0or0Compact0with0another0State0or0with0a0foreign0Power0or0engage0in0War0unless0actually0invaded0or0in0such0imminent0Danger0as0will0not0admit0of0delay0'
    ).split(''); //Article 1 of US constitution
    pattern = (
        'if0only0i0had0two0dogs0and0i0wasnt0allergic0if0only0i0had0two0dogs0and0i0wasnt0allergic0if0only0i0had0two0dogs0and0i0wasnt0allergic0if0only0i0had0two0dogs0and0i0wasnt0allergic0if0only0i0had0two0dogs0and0i0wasnt0allergic0if0only0i0had0two0dogs0and0i0wasnt0allergic0if0only0i0had0two0dogs0and0i0wasnt0allergic0if0only0i0had0two0dogs0and0i0wasnt0allergic0'
    ).split('');

    //initialize the brain (SP and TP chained together)
    brain = new Layer({
        encoder: 'alphanum',
        encoderCfg: {
            alphanum: {
                n: 200,
                w: 30
            }
        }
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
    bursts = [0, 0]; //0 -> # bursts, 1 -> #non-bursts
    preds = [0, 0]; //0 -> # wrong preds, 1 -> # right preds
    predStr = '';

    //learn the pattern
    var start = +new Date();
    var di = 0; //data increment
    var asyncLoopData = function(callback) {
        //predict this iteration's input
        var pred = brain.predict();
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

function encode(type, cfg, value) {
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
            
            var AVal = 'A'.charCodeAt(0);
            var categoryIdx = value.toUpperCase().charCodeAt(0) - AVal;
            if (categoryIdx < 0) categoryIdx += 43; //put digits at the end

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
        cellsPerCol: settings.cellsPerCol || 9,
        //max # distal dendrites per cell
        maxDistDendrites: settings.maxDistDendrites || 8,
        //controls how many synapses are added
        numNewSyn: settings.numNewSyn || 14,
        //# active synapses for a segment to be active
        activityThresh: settings.activityThresh || 9,
        //min num active synapses for learning selection
        minSynThresh: settings.minSynThresh || 6,
        //how far into the past the pred routine considers
        predictionFog: settings.predictionFog || 40
    };

    this.SP = new SpatialPooler(this.cfg);
    this.TP = new TemporalPooler(this.cfg);
}
Layer.prototype.sense = function(rawInp) {
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
    this.cols = [];
    for (var ai = 0; ai < this.cfg.numCols; ai++) {
        this.cols.push({});
        this.cols[ai].cells = [];
        for (var bi = 0; bi < this.cfg.cellsPerCol; bi++) {
            this.cols[ai].cells.push(new Cell(
                this.cfg.numNewSyn, this.cfg.initPerm,
                this.cfg.permInc, this.cfg.permDec,
                this.cfg.predictionFog
            ));
        }
    }
}
TemporalPooler.prototype.process = function(SDR, rawInp) {
    this.activateCells(SDR, rawInp);
    this.predictAndLearn();
    this.applyAllSynChanges(); //only where applicable
    this.timeTravel(); //advance to the next time step

/* TODO: return something relevant */

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
                for (var dp in cell.lookup) {
                    if (cell.lookup.hasOwnProperty(dp)) {
                        probs[dp] += cell.lookup[dp][0];
                    }
                }
            }
        }
    }

    var highestProb = -1;
    var mostLikelyDataPoint = -1;
    for (var dp in probs) {
        if (probs[dp] > highestProb) {
            highestProb = probs[dp];
            mostLikelyDataPoint = dp;
        }
    }

    return mostLikelyDataPoint;
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
                activatedCell = true;
                cell.observe(rawInp);

                if (cell.predictingSegWasLearn) {
                    cell.learning = true;
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
    for (var ki = 0; ki < this.cols.length; ki++) {
        for (var ci = 0; ci < this.cols[ki].cells.length; ci++) {
            var cell = this.cols[ki].cells[ci];
            var dendrites = cell.distalDendrites;
            cell.predicted = false; //not yet it isn't!
            cell.predictingSegWasLearn = false; //don't know yet

            //check all the distal dendrite segments
            for (var seg = 0; seg < dendrites.length; seg++) {
                var segment = dendrites[seg];

/* TODO: reverse this activity model. base it on the ACTIVE columns and
         not on random cells that *may* be active; test to see how much
         more efficient this is. go through each active column and make
         a 2D array that keeps track of the activities of each cell;
         when you add to the array, check to see if the element you're
         adding to surpasses the activity threshold; if so, add it to a
         list of predicted cells; each cell's state includes the current
         activity of each of its active dendrites; ONLY UPDATE THE ACTIVE
         ONES! you don't really care about the others. Question: can this
         revised model still work with learning? Look into this later. */

                var activity = this.getSynActivity(
                    cell, seg, NOW, this.cfg.permThresh
                );

                //if the number of active synapses on this segment
                //exceeds the activity ratio, then the segment is
                //active -> predict the column
                if (activity[0] >= this.cfg.activityThresh) {
                    this.predictCell(cell, activity, seg);
                }
            }
        }
    }
};
TemporalPooler.prototype.proposeSynChanges = function(
    cell, t, segId, synBank, addSyns
) {
    if (segId < 0) return false;

    var seg = cell.distalDendrites[segId];
    var activeSynLocs = [];
    for (var si = 0; si < seg.length; si++) {
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
                cell.applySynChanges(PRNF);
            } else if (cell.wasPredicted && !cell.predicted) {
                cell.applySynChanges(NRNF);
            }
        }
    }
};
TemporalPooler.prototype.timeTravel = function() {
    this.synapseBank = []; //clean up the old potential synapse list
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

    if (learningIds[1] === -1) { //no good segments? grow one.
        lCell.growDistalDendrite(this.synapseBank);
        if (lCell.distalDendrites.length > this.cfg.maxDistDendrites) {
            lCell.distalDendrites.shift();
        }
    } else { //a kinda good match? reinforce it.
        this.proposeSynChanges(
            lCell, BE4, learningIds[1], this.synapseBank, GROW
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
        var connectedCell = this.cols[endLoc[0]].cells[endLoc[1]];
        if (segment[syn][2] >= conThresh) {
            connectedSyns++;
            if (connectedCell.active && t === NOW ||
                connectedCell.wasActive && t === BE4) activeSyns++;
            if (connectedCell.learning && t === NOW ||
                connectedCell.wasLearning && t === BE4) learningSyns++;
        }
    }

/* TODO: currently, this program runs in k*c*g*s where k is # cols, c is
         # cells/col, g is #segments/cell, and s is #synapses/seg. It
         iterates all synapses EVERY SINGLE ITERATION! Yuck. Instead of
         following OUTGOING connections like you currently do, pay
         attention to INCOMING ones. Then, you'll only need to check
         a*g*s synapses per iteration on average. This is kc/a times
         faster, ~= 1000x speed boost! Event driven HTM? Cells emit
         an event when they become active, moving the program along?
         Perfect for Node.js! Test it out. */

    return [activeSyns, connectedSyns, learningSyns];
};
TemporalPooler.prototype.predictCell = function(cell, cellsActivity, seg) {
    cell.predicted = true;

    //figure out if this segment (this cell's predicting
    //segment) would be activated by learning cells
    var learningActivity = cellsActivity[2];
    if (learningActivity >= this.cfg.activityThresh) {
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

function SpatialPooler(cfg) {
    this.cfg = cfg;
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
    var inpSDR = encode(this.cfg.encoder, this.cfg.encoderCfg, inp);
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
    var inpSDR = encode(this.cfg.encoder, this.cfg.encoderCfg, rawInp);
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

function Cell(numNewSyn, initPerm, permInc, permDec, predictionFog) {
    this.active = false;
    this.learning = false;
    this.predicted = false;
    this.wasActive = false;
    this.wasLearning = false;
    this.wasPredicted = false;
    this.predictingSegWasLearn = false;
    this.distalDendrites = [];
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
    for (var dp in this.lookup) {
        if (this.lookup.hasOwnProperty(dp)) {
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
    }
};
Cell.prototype.growDistalDendrite = function(synBank) {
    var dendrite = [];
    var numSyns = this.numNewSyn;
    var newSynIds = getRandPerm(synBank.length, numSyns);

/* TODO: why are some dendrites so empty? */

    if (newSynIds.length === 0) return;
    for (var si = 0; si < newSynIds.length; si++) {
        var sb = synBank[newSynIds[si]];
        dendrite.push([
            sb[0], sb[1], this.initPerm
        ]);
    }
    this.distalDendrites.push(dendrite);
};
Cell.prototype.applySynChanges = function(posReinforce) {
    for (var ci = 0; ci < this.synChanges; ci++) {
        var change = this.synChanges[ci];
        var seg = this.distalDendrites[change[1]];
        switch (change[0]) {
            case ACTV:
                if (posReinforce) {
                    seg[change[2]][2] += this.permInc;
                } else {
                    seg[change[2]][2] -= this.permDec;
                }
                break;
            case INAC:
                if (posReinforce) {
                    seg[change[2]][2] -= this.permDec;
                }
                break;
            case NEW:
                seg.push([
                    change[2], change[3], this.initPerm
                ]);
                break;
        }
    }
    this.synChanges = []; //changes applied so empty queue
};

/********************
 * helper functions */
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
