var http = require('http');
var path = require('path');
var twilio = require('twilio');
var express = require('express');
var bodyParser = require('body-parser');

var config = require('./config');

var app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({extended: false}));

var swig = require('swig');
app.set('views', path.join(__dirname, 'views'));
app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('view cache', false);
swig.setDefaults({ cache: false });

require('./routes/calls')(app,config);
require('./routes/agent-ui')(app,config);

var server = http.createServer(app);
var port = process.env.PORT || 3000;
server.listen(port, function () {
    console.log('Express server running on *:' + port);
});
