var ness = require('nessjs'),
    session = require('express-session');

exports.login_get = function(req, res) {
    var failed_login = req.session.failed_login;
    req.session.failed_login = false;
    res.render('login', {layout: 'login', failed: failed_login});
};

exports.login_post = function(req, res) {
    var user = {
        id: req.body.id,
        pass: req.body.pass
    };

    req.session.user = user;
    console.log('Logging in with:' + req.session.user.id);

    ness.getName(user, function(err, name) {
        if (err) {
            req.session.failed_login = true;
            return res.redirect('/login');
        }
        req.session.user.name = name;
        res.redirect('/');
    });
};

exports.modules = function(req, res) {
    ness.getModules('attendance', req.session.user, function(err, modules) {
        if (err) {
            req.session.failed_login = true;
            return logout(req, res);
        }
        res.render('modules', {modules: modules});
    });
};

exports.logout = function (req, res) {
    logout(req, res);
};

var logout = function (req, res) {
    var id = req.session.user.id;
    req.session.user = null;
    res.redirect('/login');
};