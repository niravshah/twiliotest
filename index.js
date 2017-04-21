var http = require('http');
var path = require('path');
var twilio = require('twilio');
var express = require('express');
var bodyParser = require('body-parser');
var randomUsername = require('./randos');
var config = require('./config');

// Create Express webapp
var app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({extended: false}));

var swig = require('swig');
app.set('views', path.join(__dirname, 'views'));
app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('view cache', false);
swig.setDefaults({ cache: false });

var accountSid = config.TWILIO_ACCOUNT_SID;
var authToken = config.TWILIO_AUTH_TOKEN;
var workspaceSid = config.TWILIO_WORKSPACE_SID;



/*
 Generate a Capability Token for a Twilio Client user - it generates a random
 username for the client requesting a token.
 */
app.get('/token', function (request, response) {
    var identity = randomUsername();
    var capability = new twilio.Capability(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);
    capability.allowClientOutgoing(config.TWILIO_TWIML_APP_SID);
    capability.allowClientIncoming(identity);
    var token = capability.generate();
    response.send({identity: identity, token: token});
});

app.post('/voice', function (req, res) {
    // Create TwiML response
    var twiml = new twilio.TwimlResponse();

    if (req.body.To) {
        twiml.dial({callerId: config.TWILIO_CALLER_ID}, function () {
            // wrap the phone number or client name in the appropriate TwiML verb
            // by checking if the number given has only digits and format symbols
            if (/^[\d\+\-\(\) ]+$/.test(req.body.To)) {
                this.number(req.body.To);
            } else {
                this.client(req.body.To);
            }
        });
    } else {
        twiml.say("Thanks for calling!");
    }

    res.set('Content-Type', 'text/xml');
    res.send(twiml.toString());
});

app.post("/assignment", function (req, res) {
    console.log('assignment callback');

    res.json({"instruction": "dequeue", "post_work_activity_sid":"WAa2e6a5b71d56c874553a8b72a05b8403","from":"+442033899377"});
});

app.get("/task/create", function (req, res) {

    console.log('create task');
    var accountSid = config.TWILIO_ACCOUNT_SID;
    var authToken = config.TWILIO_AUTH_TOKEN;
    var workspaceSid = config.TWILIO_WORKSPACE_SID;
    var workflowSid = config.TWILIO_WORKFLOW_SID;
    var client = new twilio.TaskRouterClient(accountSid, authToken, workspaceSid);

    var workspace = client.workspace;

    //console.log(workspace.tasks.create,workflowSid);
    workspace.tasks.create({
                               workflowSid: workflowSid,
                               attributes: '{"selected_language":"es"}'
                           }, function (err, data) {

        console.log('Error:', err);
        console.log('Data:', data);
        res.json({err: err, data: data});
    });

});

app.get("/task/:tsid/reservation/:rsid/accept", function (req, res) {

    var workspace = new twilio.TaskRouterClient(accountSid, authToken, workspaceSid).workspace;

    workspace.tasks(req.params.tsid)
        .reservations(req.params.rsid)
        .update({
                    reservationStatus: 'accepted'
                }, function (err, reservation) {
            console.log('Error:', err);
            console.log('Data:', reservation);
            res.json({err: err, data: reservation});
        });
});

app.post('/incoming', function (req, res) {
    console.log('incoming');
    var twiml = new twilio.TwimlResponse();
    twiml.say("For Spanish, please hold or press one.");
    twiml.say("For English, please hold or press two.");
    twiml.gather({action: '/enqueue', numDigits: 1, method: 'POST', timeout: 10});
    res.writeHead(200, {'Content-Type': 'text/xml'});
    res.end(twiml.toString());
});

app.post('/enqueue', function (req, res) {

    console.log('enqueue');
    var digit_pressed = req.body.Digits;
    var language = "en";

    if (digit_pressed == 1) {language = "es"}

    var twiml = new twilio.TwimlResponse();
    twiml.enqueue({workflowSid:config.TWILIO_WORKFLOW_SID},function(node){
        var arr = {selected_language:language};
        var json = JSON.stringify(arr);
        node.task(json);
    });
    res.writeHead(200, {'Content-Type': 'application/xml'});
    res.write(twiml.toString());
    res.end();

});

app.get('/agent',function(req,res){
    var worker_sid = req.query.wsid;
    var worker_capability = new twilio.TaskRouterWorkerCapability(accountSid, authToken, workspaceSid, worker_sid);
    worker_capability.allowActivityUpdates();
    worker_capability.allowReservationUpdates();
    var worker_token = worker_capability.generate();
    res.render('agent',{worker_token:worker_token});
});

// Create http server and run it
var server = http.createServer(app);
var port = process.env.PORT || 3000;
server.listen(port, function () {
    console.log('Express server running on *:' + port);
});
