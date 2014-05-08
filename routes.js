var ness = require('nessjs'),
    session = require('express-session');

exports.index = function(req, res) {
    ness.getName(function(err, name) {
        res.render('index', {name: name});
    });
};

exports.login_get = function(req, res) {
    res.render('login');
};

exports.login_post = function(req, res) {
    req.session.user = req.body.user;
    req.session.pass = req.body.pass;
    res.redirect('/');
};

exports.modules = function(req, res) {
    ness.getModules('attendance', function(err, modules) {
        res.render('modules', {modules: modules});
    });
};