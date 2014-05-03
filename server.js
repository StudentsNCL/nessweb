var http = require('http'),
    express = require('express'),
    mu = require('mu2'),
    ness = require('nessjs'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    connect = require('connect');
    
var app = express();

app.use(express.static(__dirname, '/public'));
app.use(cookieParser())
app.use(session({secret: 'winter is coming' }));
app.use(connect.bodyParser());

mu.root = __dirname + '/templates';

app.get('/', function(req, res) {
console.log(req.session.user);
    if(req.session.user == null || req.session.pass == null){
        res.redirect('/login');
        console.log("redirect");
        return;
    }
    ness.user(req.session.user);
    ness.pass(req.session.pass);
    ness.getName(function(err, name) {
        var stream = mu.compileAndRender('index.html', {
                        name: name
                });
        stream.pipe(res);
    });
});

app.get('/login', function(req, res) {
    var stream = mu.compileAndRender('login.html', {});
    stream.pipe(res);
});

app.post('/login', function(req, res) {
    req.session.user = req.body.user;
    req.session.pass = req.body.pass;
    res.redirect('/');
});

app.listen(8080);