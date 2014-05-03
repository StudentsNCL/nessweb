var http = require('http'),
    express = require('express'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    connect = require('connect'),
    routes = require('./routes'),
    auth = require('./auth');
    
var app = express();

app.use(express.static(__dirname, '/public'));
app.use(cookieParser())
app.use(session({secret: 'winter is coming' }));
app.use(connect.bodyParser());

app.get('/', auth, routes.index);
app.get('/login', routes.login_get);
app.post('/login', routes.login_post);

app.listen(8080);