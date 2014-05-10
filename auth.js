var ness = require('nessjs');
module.exports = function (req, res, next) {
    if (!req.session.user || !req.session.user.name) {
        res.redirect('/login');
        req.session.referer = req.originalUrl;
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

    var section = path;
    var last = path.indexOf('/');
    if (last >= 0) {
       section = path.substr(0, last);
    }

    // replace slashes
    path = path.replace(/\//g, ' &#187; ');

    // uppercase words
    path = path.replace(/\w\S*/g, function(txt){
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    })

    res.locals = {
      user: req.session.user,
      section: section,
      title: path || 'NESSweb'
    };

    next();
}