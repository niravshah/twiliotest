module.exports = function (app, config) {
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
};