var http = require('http'),
    express = require('express'),
    mu = require('mu2'),
    ness = require('nessjs');
    
var app = express();

app.use(express.static(__dirname, '/public'));
mu.root = __dirname + '/templates';

app.get('/', function(req, res)
{
    ness.user(req.query.user);
    ness.pass(req.query.pass);
    ness.getName(function(err, name) {
        var stream = mu.compileAndRender('index.html', {
                        name: name
                });
        stream.pipe(res);
    });
});

app.listen(80);