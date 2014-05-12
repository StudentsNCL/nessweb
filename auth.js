var ness = require('nessjs');
module.exports = function (req, res, next) {
    if (!req.session.user || !req.session.user.name) {
        res.redirect('/login');
        req.session.referer = req.originalUrl;
        return;
    }

    res.locals.user = req.session.user;

    next();
}

module.exports.login = function (req, res, onError) {
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
}

module.exports.logout = function (forced, req, res) {
    req.session.failed_login = forced;
    var id = req.session.user.id;
    req.session.user = {id: id};
    res.redirect('/login');
}

module.exports.isLoggedIn = function (req) {
    return req.session.user && req.session.user.name;
}