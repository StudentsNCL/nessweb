var http = require('http'),
    express = require('express'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    bodyParser = require('body-parser'),
    routes = require('./routes'),
    auth = require('./auth'),
    handlebars = require('express3-handlebars');
var app = express();

app.use(express.static(__dirname, '/public'));
app.use(cookieParser())
app.use(session({secret: 'winter is coming' }));
app.use(bodyParser());

app.engine('.hbs', handlebars({
    defaultLayout: 'main',
    layoutsDir: 'views/layouts/',
    extname: '.hbs',
    helpers: {
    },
}));

app.set('view engine', '.hbs');
app.set('views', 'views/');

app.get('/', auth, routes.index);
app.get('/login', routes.login_get);
app.post('/login', routes.login_post);
app.get('/modules', auth, routes.modules);

app.listen(80);