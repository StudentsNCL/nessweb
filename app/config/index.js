var express = require('express'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    bodyParser = require('body-parser');
var app = express();

app.locals = require('./locals');

app.use(express.static('app/public'));
app.use(cookieParser())
app.use(session({secret: 'winter is coming', key: 'nessweb_sid',
    // by default, the session will expire after 20 minutes
    cookie: {maxAge: 20 * 60 * 1000} })
);
app.use(bodyParser());

require('./handlebars')(app);

require('./routes')(app);

module.exports = app;