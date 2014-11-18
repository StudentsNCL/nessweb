var ness = require('nessjs'),
    session = require('express-session'),
    auth = require('./auth'),
    moment = require('moment'),
    fs = require('fs');

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
    var referer = req.session.referer;
    req.session.referer = null;
    auth.login(req, res, function(err){
        if(err)
            res.redirect('/login');
        else
            res.redirect(referer || '/');
    });
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
                        code: result[i].code,
                        module: result[i].title,
                        did: result[i].did,
                        safeTitle: result[i].coursework[j].safeTitle,
                        due: result[i].coursework[j].due,
                        url: result[i].coursework[j].url,
                        spec: result[i].coursework[j].spec
                    });
            }
        }
        json.result.sort(function(a, b) {
            return a.due < b.due ? -1 : 1;
        });
        // keep only first 5 bits of coursework
        json.result = json.result.slice(0, 5);
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
            return auth.logout(true, req, res);
        }
        res.render('coursework/feedback', { layout: false, feedback: result});
    });
}

exports.feedback.personal = function(req, res) {
    ness.getFeedback({ personal: req.params.id }, req.session.user, function(err, result) {
    if (err) {
        return auth.logout(true, req, res);
    }
    res.render('coursework/feedback', { layout: false, feedback: result});
    });
}

exports.getSubmit = function(req, res) {
    ness.getSubmit({did: req.params.did, name: req.params.name}, req.session.user, function(err, result) {
        if(err) {
            if(typeof err === 'string')
                return res.render('coursework/submit', {error: err});
            else
                return auth.logout(true, req, res);
        }
        result.filesizemb = result.filesize / 1048576;
        result.dropzone = true;
        res.render('coursework/submit', result);
    });
}

exports.submit = function(req, res) {
    var details = {
        did: req.body.did,
        exid: req.params.exid,
        depid: req.body.depid,
        dir: 'uploads/',
        uniq: req.body.uniq,
        year: req.body.year,
        email: req.body.email,
        files: req.session.files || [],
        filesize: req.body.filesize
    }
    if(details.files.length == 0) {
        return res.redirect('coursework/submit/' + details.exid);
    }
    delete req.session.files;
    ness.submit(details, req.session.user, function(err, result) {
        res.render('coursework/submitted', result);
        delete req.session.uniq;
    });
}

exports.deleteFile = function(req, res) {
    fs.unlinkSync('uploads/' + req.params.uniq + '/' + req.body.file);
    res.send('done');
}

exports.submit.upload = function(req, res) {
    // If the uniq is different then clean up old files
    if(req.session.uniq && req.session.uniq != req.params.uniq) {
        deleteFolder(req.session.uniq);
    }
    req.session.uniq = req.params.uniq;
    req.session.files = [];
    req.busboy.on('file', function(fieldname, file, filename) {
        if(!fs.existsSync('uploads/' + req.params.uniq))
            fs.mkdirSync('uploads/' + req.params.uniq);
        file.pipe(fs.createWriteStream('uploads/' + req.params.uniq + '/' + filename));
        req.session.files.push(filename);
    });
    req.busboy.on('finish', function() {
        res.send('');
    });

    req.pipe(req.busboy);
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
                        title: result[i].code + " - " + result[i].coursework[j].title,
                        module: result[i].title,
                        url: result[i].coursework[j].spec ? "/coursework/specification/" + result[i].coursework[j].spec : result[i].coursework[j].url,
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

function deleteFolder(uniq) {
    var path = 'uploads/' + uniq + '/';
    fs.readdir(path, function(err, files) {
        if(files.length > 0){
            files.forEach(function(file) {
                fs.unlinkSync(path + file);
            });
        }
        fs.rmdir(path);
    });
}
