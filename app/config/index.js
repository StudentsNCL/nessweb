var express = require('express'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    bodyParser = require('body-parser'),
    busboy = require('connect-busboy'),
    fs = require('fs');
var app = express();

app.locals = require('./locals');

/* Load config file */
if (fs.existsSync('config.json')) {
    var config = fs.readFileSync('config.json');
    app.locals.config = JSON.parse(config);
}
else {
    console.warn('No config file found');
    app.locals.config = {
        http_port: process.env.HTTP_PORT,
        session_secret: process.env.SESSION_SECRET,
        ness_persist_location: process.env.NESS_PERSIST_LOCATION
    }
}

app.use(express.static('app/public'));
app.use(cookieParser());
app.use(busboy());
if(!app.locals.config.session_secret)
    console.warn('WARN: Set config/environment variable "SESSION_SECRET"');
app.use(session({
                    secret: app.locals.config.session_secret || 'winter is coming',
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
