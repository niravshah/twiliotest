module.exports = function (app, config) {

    var accountSid = config.TWILIO_ACCOUNT_SID;
    var authToken = config.TWILIO_AUTH_TOKEN;
    var workspaceSid = config.TWILIO_WORKSPACE_SID;
    var randomUsername = require('../libs/randos');

    app.get('/token', function (request, response) {
        var identity = randomUsername();
        var capability = new twilio.Capability(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);
        capability.allowClientOutgoing(config.TWILIO_TWIML_APP_SID);
        capability.allowClientIncoming(identity);
        var token = capability.generate();
        response.send({identity: identity, token: token});
    });


    app.get('/agent',function(req,res){
        var worker_sid = req.query.wsid;
        var worker_capability = new twilio.TaskRouterWorkerCapability(accountSid, authToken, workspaceSid, worker_sid);
        worker_capability.allowActivityUpdates();
        worker_capability.allowReservationUpdates();
        var worker_token = worker_capability.generate();
        res.render('agent',{worker_token:worker_token});
    });
};