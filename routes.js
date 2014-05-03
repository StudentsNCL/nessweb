var ness = require('nessjs'),
    mu = require('mu2');

mu.root = __dirname + '/templates';

exports.index = function(req, res) {
    ness.getName(function(err, name) {
        var stream = mu.compileAndRender('index.html', {
                        name: name
                });
        stream.pipe(res);
    });
};

exports.login_get = function(req, res) {
    var stream = mu.compileAndRender('login.html', {});
    stream.pipe(res);
};

exports.login_post = function(req, res) {
    req.session.user = req.body.user;
    req.session.pass = req.body.pass;
    res.redirect('/');
};