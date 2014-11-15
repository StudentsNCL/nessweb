var express = require('express'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    bodyParser = require('body-parser'),
    busboy = require('connect-busboy'),
    fs = require('fs');
var app = express();

app.locals = require('./locals');

app.use(express.static('app/public'));
app.use(cookieParser());
app.use(busboy());
if(!process.env.SESSION_SECRET)
    console.warn('WARN: Set environment variable "SESSION_SECRET"');
app.use(session({
                    secret: process.env.SESSION_SECRET || 'winter is coming',
                    key: 'nessweb_sid',
                    saveUninitialized: true,
                    resave: true,
                    // by default, the session will expire after 20 minutes
                    cookie: {maxAge: 20 * 60 * 1000}
                })
);
app.use(bodyParser());
// Create uploads folder if it doesnt exist
if(!fs.existsSync('uploads'))
    fs.mkdirSync('uploads');

require('./handlebars')(app);

require('./routes')(app);

module.exports = app;
