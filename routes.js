var ness = require('nessjs'),
    session = require('express-session');

exports.index = function(req, res) {
    ness.getName(function(err, name) {
        if (err) {
            req.session.failed_login = true;
            return res.redirect('/login');
        }
        res.render('index', {name: name});
    });
};

exports.login_get = function(req, res) {
    var failed_login = req.session.failed_login;
    req.session.failed_login = null;
    res.render('login', {
        user: req.session.user,
        failed: failed_login,
        layout: 'login'
    });
};

exports.login_post = function(req, res) {
    req.session.user = req.body.user;
    req.session.pass = req.body.pass;
    res.redirect('/');
};

exports.modules = function(req, res) {
    ness.getModules('attendance', function(err, modules) {
        if (err) {
            req.session.failed_login = true;
            return res.redirect('/login');
        }
        res.render('modules', {modules: modules});
    });
};