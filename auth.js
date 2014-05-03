var ness = require('nessjs');
module.exports = function (req, res, next) {
    if(req.session.user == null || req.session.pass == null){
        res.redirect('/login');
        return;
    }
    ness.user(req.session.user);
    ness.pass(req.session.pass);
    next();
}