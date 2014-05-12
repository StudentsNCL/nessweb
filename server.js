var http = require('http'),
    express = require('express'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    bodyParser = require('body-parser'),
    routes = require('./routes'),
    auth = require('./auth'),
    handlebars = require('express3-handlebars'),
    moment = require('moment');
var app = express();

app.use(express.static('public'));
app.use(cookieParser())
app.use(session({secret: 'winter is coming' }));
app.use(bodyParser());

app.engine('.hbs', handlebars({
    defaultLayout: 'main',
    layoutsDir: 'views/layouts/',
    extname: '.hbs',
    helpers: {
        eq: function (obj1, obj2, options) {
            if (obj1 === obj2) {
                return options.fn(this);
            } else {
                return options.inverse(this);
            }
        },
        dueDate: function(datetime) {
            return moment(datetime).fromNow();
            //return moment(datetime).format("HH:mm");
        },
        formatDate: function(datetime) {
            return moment(datetime).format("dddd DD MMMM YYYY - HH:mm");
        },
        dateAfter: function(datetime, options) {
            if(moment().diff(datetime) > 0)
                return options.fn(this);
            else
                return options.inverse(this);
        },
        getMarkPercentage: function(mark) {
            return Math.round(mark.mark / mark.total * 1000) / 10;
        },
        gte: function(num, comp, options) {
            if (typeof(num) === 'number' && num >= comp) {
                return options.fn(this);
            }
            else {
                return options.inverse(this);
            }
        },
    },
}));

app.set('view engine', '.hbs');
app.set('views', 'views/');

// Before routing, do some global stuff like title setting
app.use(function (req, res, next) {
    var path = req.path.toLowerCase().trim();
    // remove trailing slashes
    while(path.substr(-1) == '/') {
        path = path.substr(0, path.length - 1);
    }
    // remove leading slashes
    while(path.charAt(0) == '/') {
        path = path.substr(1, path.length);
    }

    var section = path;
    var last = path.indexOf('/');
    if (last >= 0) {
       section = path.substr(0, last);
    }

    // replace slashes
    path = path.replace(/\//g, ' &#187; ');

    // uppercase words
    path = path.replace(/\w\S*/g, function(txt){
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    })

    res.locals = {
      section: section,
      title: path || 'NESSweb'
    };

    next();
});

app.get('/', function(req, res){
    res.redirect('/coursework');
});
app.get('/login', routes.login_get);
app.get('/logout', routes.logout);
app.post('/login', routes.login_post);
app.get('/modules', auth, routes.modules);
app.get('/coursework', auth, routes.coursework);
app.get('/coursework/calendar', auth, routes.coursework.calendar);
app.get('/coursework/specification/:id', auth, routes.coursework.specification);
app.get('/attendance', auth, routes.attendance);
app.get('/modules/feedback/:id', auth, routes.feedback);
app.get('/modules/feedback/:id/:stid', auth, routes.feedback.exam);
app.get('/modules/:year/:stage/:id', auth, routes.modules.module);
app.get('/feedback/general/:id', auth, routes.feedback.general);
app.get('/feedback/personal/:id', auth, routes.feedback.personal);

// throw a 404 if we get to here
app.use(function(req, res, next) {
    res.locals.title = '404 - Not Found';
    res.locals.error = 'Could not find this page'
    if (req.session.user && req.session.user.name) {
        res.locals.user = req.session.user;
    }
    else {
        res.locals.layout = 'login';
    }
    res.status(404).render('error');
    return;
});

app.listen(8080);
