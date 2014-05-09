var ness = require('nessjs');
module.exports = function (req, res, next) {
    if (!req.session.user || !req.session.user.name) {
        res.redirect('/login');
        return;
    }
    res.locals.user = req.session.user;
    next();
}