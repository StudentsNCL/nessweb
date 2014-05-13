module.exports = function (app) {
    // Before routing, do some global stuff like title setting
    app.use(function (req, res, next) {
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
          section: section,
          title: path || 'NESSweb'
        };

        next();
    });

    // defined routes
    require('../routes')(app);

    // throw a 404 if we get to here
    app.use(function(req, res, next) {
        res.locals.title = '404 - Not Found';
        res.locals.error = 'Could not find this page'
        if (req.session.user && req.session.user.name) {
            res.locals.user = req.session.user;
        }
        else {
            res.locals.layout = 'login';
        }
        res.status(404).render('error');
        return;
    });
}