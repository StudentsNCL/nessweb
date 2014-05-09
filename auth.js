var ness = require('nessjs');
module.exports = function (req, res, next) {
    if (!req.session.user || !req.session.user.name) {
        res.redirect('/login');
        return;
    }

    var path = req.path.toLowerCase().trim();
    // remove trailing slashes
    while(path.substr(-1) == '/') {
        path = path.substr(0, path.length - 1);
    }
    // remove leading slashes
    while(path.charAt(0) == '/') {
        path = path.substr(1, path.length);
    }

    var last = path.lastIndexOf('/');
    if (last >= 0) {
       path = path.substr(0, last);
    }

    res.locals = {
      user: req.session.user,
      section: path
    };

    next();
}