module.exports = function (app, config) {

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

        if (digit_pressed == 1) {
            language = "es"
        }

        var twiml = new twilio.TwimlResponse();
        twiml.enqueue({workflowSid: config.TWILIO_WORKFLOW_SID}, function (node) {
            var arr = {selected_language: language};
            var json = JSON.stringify(arr);
            node.task(json);
        });
        res.writeHead(200, {'Content-Type': 'application/xml'});
        res.write(twiml.toString());
        res.end();

    });

    app.post("/assignment", function (req, res) {
        console.log('assignment callback');
        res.json({
                     "instruction": "dequeue",
                     "post_work_activity_sid": "WAa2e6a5b71d56c874553a8b72a05b8403",
                     "from": "+442033899377"
                 });
    });

};