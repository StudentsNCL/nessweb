var http = require('http'),
    express = require('express'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    bodyParser = require('body-parser'),
    routes = require('./routes'),
    auth = require('./auth'),
    handlebars = require('express3-handlebars');
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
    },
}));

app.set('view engine', '.hbs');
app.set('views', 'views/');

app.get('/', function(req, res){
    res.redirect('/attendance');
});
app.get('/login', routes.login_get);
app.get('/logout', routes.logout);
app.post('/login', routes.login_post);
app.get('/modules', auth, routes.modules);
app.get('/coursework', auth, routes.coursework);
app.get('/attendance', auth, routes.attendance);

app.listen(80);