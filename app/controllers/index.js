var ness = require('nessjs'),
    session = require('express-session'),
    auth = require('./auth'),
    moment = require('moment');

exports.login_get = function(req, res) {
    if (auth.isLoggedIn(req)) {
        return res.redirect('/');
    }
    var failed_login = req.session.failed_login;
    req.session.failed_login = false;
    var failed_id = req.session.failed_id;
    req.session.failed_id = '';
    var id = failed_login ? failed_id : req.cookies.ness_id;

    res.render('login', {layout: 'login', failed: failed_login, ness_id: id});
};

exports.login_post = function(req, res) {
    auth.login(req, res);
};

exports.logout = function (req, res) {
    if (!auth.isLoggedIn(req)) {
        return res.redirect('/');
    }
    auth.logout(false, req, res);
};

exports.attendance = function(req, res) {
    ness.getModules('attendance', req.session.user, function(err, modules) {
        if (err) {
            return auth.logout(true, req, res);
        }
        res.render('attendance', {modules: modules});
    });
};

exports.modules = function(req, res) {
     ness.getStages({}, req.session.user, function(err, stages) {
        if (err) {
            return auth.logout(true, req, res);
        }
        res.render('modules/modules', {stages: stages});
    });
};

exports.modules.module = function(req, res) {
     ness.getStages({id: req.params.id, year: req.params.year, stage: req.params.stage}, req.session.user, function(err, module) {
        if (err) {
            return auth.logout(true, req, res);
        }
        res.render('modules/module', {module: module});
    });
};

exports.coursework = function(req, res) {
    ness.getModules('coursework', req.session.user, function(err, result) {
        if (err) {
            return auth.logout(true, req, res);
        }
        res.render('coursework/overview', {coursework: result});
    });
}

exports.calendar = function(req, res) {
    ness.getModules('coursework', req.session.user, function(err, result) {
        if (err) {
            return auth.logout(true, req, res);
        }
        var json = {
            result: []
        };
        // loop through each course
        for(var i = 0; i < result.length; i++) {
            for(var j = 0; j < result[i].coursework.length; j++) {
                if(moment().diff(result[i].coursework[j].due) < 0)
                    json.result.push({
                        title: result[i].coursework[j].title,
                        start: moment(result[i].coursework[j].due)
                    })
            }
        }
        if(json.result.length == 0)
            json.empty = 1;
        res.render('calendar', {coursework: json});
    });
}

exports.coursework.specification = function(req, res) {
    ness.getSpec(req.params.id, req.session.user, function(err, result) {
        if (err) {
            return auth.logout(true, req, res);
        }
        res.render('coursework/specification', {coursework: result});
    });
}

exports.feedback = function(req, res) {
    ness.getFeedback({ exid: req.params.id }, req.session.user, function(err, result) {
    if (err) {
        return auth.logout(true, req, res);
    }
    res.render('modules/feedback', { layout: false, feedback: result});
    });
}

exports.feedback.exam = function(req, res) {
    ness.getFeedback({ paperId: req.params.id, stid: req.params.stid }, req.session.user, function(err, result) {
    if (err) {
        return auth.logout(true, req, res);
    }
    res.render('modules/feedback', { layout: false, feedback: result});
    });
}

exports.feedback.general = function(req, res) {
    ness.getFeedback({ general: req.params.id }, req.session.user, function(err, result) {
    if (err) {
        return auth.logout(true, eq, res);
    }
    res.render('coursework/feedback', { layout: false, feedback: result});
    })
}

exports.feedback.personal = function(req, res) {
    ness.getFeedback({ personal: req.params.id }, req.session.user, function(err, result) {
    if (err) {
        return auth.logout(true, req, res);
    }
    res.render('coursework/feedback', { layout: false, feedback: result});
    })
}

exports.json = {
    calendar: function(req, res) {
        ness.getModules('coursework', req.session.user, function(err, result) {
            if (err) {
                return auth.logout(true, req, res);
            }
            var json = {
                success: 1,
                result: []
            }
            // loop through each course
            for(var i = 0; i < result.length; i++) {
                for(var j = 0; j < result[i].coursework.length; j++) {
                    json.result.push({
                        id: parseInt(''+i+j),
                        title: result[i].coursework[j].title,
                        url: 'http://example.com',
                        class: "event-important",
                        start: parseInt(moment(result[i].coursework[j].due).format('X')+'000'),
                        end: parseInt(moment(result[i].coursework[j].due).format('X')+'000')
                    })
                }
            }
            res.send(json);
        });
    }
}