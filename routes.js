var ness = require('nessjs'),
    session = require('express-session');

exports.login_get = function(req, res) {
    var failed_login = req.session.failed_login;
    req.session.failed_login = false;
    res.render('login', {layout: 'login', failed: failed_login, user: req.session.user});
};

exports.login_post = function(req, res) {
    var user = {
        id: req.body.id,
        pass: req.body.pass
    };

    req.session.user = user;

    ness.getName(user, function(err, name) {
        if (err) {
            req.session.failed_login = true;
            return res.redirect('/login');
        }
        req.session.user.name = name;
        var referer = req.session.referer;
        req.session.referer = null;
        res.redirect(referer || '/');
    });
};

exports.logout = function (req, res) {
    logout(req, res);
};

exports.attendance = function(req, res) {
    ness.getModules('attendance', req.session.user, function(err, modules) {
        if (err) {
            req.session.failed_login = true;
            return logout(req, res);
        }
        res.render('attendance', {modules: modules});
    });
};

exports.modules = function(req, res) {
    res.render('modules');
};

exports.coursework = function(req, res) {
    res.render('coursework/overview');
}

exports.coursework.calendar = function(req, res) {
    res.render('coursework/calendar');
}

var logout = function (req, res) {
    var id = req.session.user.id;
    req.session.user = {id: id};
    res.redirect('/login');
};