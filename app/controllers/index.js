var ness = require('nessjs'),
    session = require('express-session'),
    auth = require('./auth'),
    moment = require('moment'),
    fs = require('fs'),
    checksum = require('checksum'),
    exams = require('examsjs'),
    ncl = require('ncl-connect'),
    request = require('request'),
    async = require('async'),
    db = require('./db');

// Save cookies for requests by default
var request = request.defaults({jar: true});

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
    // If posting to update
    if (req.body.stage1) {
        var stages = [];
        for (var i = 1; req.body['stage' + i]; i++) {
            stages.push({
                stage: i,
                percent: req.body['stage' + i]
            });
        }
        db.addStages(req.session.user.fullid, stages);
    }

    /* Get stages and calculate predicted, min & max marks
    */
    ness.getStages({}, req.session.user, function(err, stages) {
        if (err) {
            return auth.logout(true, req, res);
        }

        async.waterfall([
            function(callback) {
                db.getAllMarks(req.session.user.fullid, callback);
            },
            function(marks, callback) {
                // Hide attempt & attempt mark if they are the same
                for(var i = 0; i < stages.length; i++)(function(i){
                    var stotal = 0;
                    var stotalMin = 0;
                    var stotalMax = 0;
                    var totalCredits = 0;
                    for(var j = 0; j < stages[i].modules.length; j++)(function(j){
                        // If the year isnt complete then populate with predicted marks from db
                        if(!stages[i].mark) {
                            var total = 0;
                            var totalMin = 0;
                            var totalMax = 0;
                            marks.forEach(function(mark) {
                                if(mark.module != stages[i].modules[j].code)
                                    return;
                                total += mark.percent * mark.mark;
                                // If it is an official mark then add to min mark
                                if(mark.actual) {
                                    totalMin += mark.percent * mark.mark;
                                    totalMax += mark.percent * mark.mark;
                                }
                                else { //add 100% to max mark if no actual mark
                                    totalMax += mark.percent * 100;
                                    //Set min to be 40% as this is pass rate
                                    totalMin += mark.percent * 40;
                                }
                            });
                            stotal += total / 100 * stages[i].modules[j].credits;
                            stotalMin += totalMin / 100 * stages[i].modules[j].credits;
                            stotalMax += totalMax / 100 * stages[i].modules[j].credits;
                            totalCredits += stages[i].modules[j].credits;
                            stages[i].modules[j].predicted = total / 100;
                            stages[i].modules[j].min = totalMin / 100;
                            stages[i].modules[j].max = totalMax / 100;
                            if(totalCredits == 120) {
                                stages[i].predicted = Math.round(stotal / totalCredits * 10) / 10;
                                stages[i].min = Math.round(stotalMin / totalCredits * 10) / 10;
                                stages[i].max = Math.round(stotalMax / totalCredits * 10) / 10;
                            }
                        }
                        if(stages[i].modules[j].attempt && stages[i].modules[j].attempt != '1'){
                            stages[i].modules[j].showAttempt = true;
                            //break;
                        }
                    })(j);
                })(i);
                callback(null);
            },
            function(callback) {

                var markSoFar = 0;
                var predictedMark = 0;
                var minimumMark = 0;
                var maximumMark = 0;
                // Get stage percentages from db
                db.getStages(req.session.user.fullid, function(err, dbstages) {
                    dbstages.forEach(function(dbstage) {
                        stages.forEach(function(stage, i) {
                            if(dbstage.stage == stage.stage) {
                                stages[i].percent = dbstage.percent;
                                if(stage.mark && !isNaN(stage.mark)) {
                                    markSoFar += stage.mark * dbstage.percent / 100;
                                }
                                else {
                                    predictedMark += stage.predicted * dbstage.percent / 100;
                                    minimumMark += stage.min * dbstage.percent / 100;
                                    maximumMark += stage.max * dbstage.percent / 100;
                                }
                                return;
                            }
                        });
                    });
                    predictedMark += markSoFar;
                    minimumMark += markSoFar;
                    maximumMark += markSoFar;
                    var mark = {
                        predicted: predictedMark,
                        min: minimumMark,
                        max: maximumMark
                    };
                    callback(null, mark);
                });
            }
        ],
        function(err, mark){
            res.render('modules/modules', {stages: stages, mark: mark});
        })
    });
};

exports.modules.module = function(req, res) {
    ness.getStages({id: req.params.id, year: req.params.year, stage: req.params.stage}, req.session.user, function(err, module) {
        if (err) {
            return auth.logout(true, req, res);
        }

        var form = {
            module: module.code,
            cookie: req.session.user.cookie
        }

        db.getMarks(req.session.user.fullid, module.code, function(error, marks) {
            if (!error) {
                var actualMarks = [];
                var defaultMark = 40;
                // Populate coursework
                if(module.coursework){
                    module.coursework.forEach(function(coursework, i){
                        // If just a title and no coursework
                        if(module.coursework[i].coursework.length == 0){
                            module.coursework[i].userMark = defaultMark;
                            var found = false;
                            marks.forEach(function(mark){
                                if(mark.work === module.coursework[i].name){
                                    found = true;
                                    module.coursework[i].userMark = mark.mark;
                                }
                            });
                            if (!found) {
                                actualMarks.push({
                                    work: coursework.name,
                                    mark: defaultMark,
                                    percent: coursework.percentage,
                                    actual: 0
                                });
                            }
                        }
                        else {
                            module.coursework[i].coursework.forEach(function(cw, j){
                                if(cw.mark) {
                                    actualMarks.push({
                                        work: cw.name,
                                        mark: cw.mark.percent,
                                        percent: cw.percentage,
                                        actual: 1
                                    });
                                }
                                else {
                                    module.coursework[i].coursework[j].userMark = defaultMark;
                                    var found = false;
                                    marks.forEach(function(mark){
                                        if(mark.work === cw.name){
                                            found = true;
                                            module.coursework[i].coursework[j].userMark = mark.mark;
                                        }
                                    });
                                    if (!found) {
                                        actualMarks.push({
                                            work: cw.name,
                                            mark: defaultMark,
                                            percent: cw.percentage,
                                            actual: 0
                                        });
                                    }
                                }
                            });
                        }
                    });
                }
                // Populate exams
                if(module.exams){
                    module.exams.forEach(function(exam, i){
                        // Add actual mark to db
                        if(exam.mark) {
                            // Temp fix to make sure mark is numeric (the one we want)
                            if (!isNaN(parseFloat(exam.mark)) && isFinite(exam.mark)) {
                                actualMarks.push({
                                    work: exam.name,
                                    mark: exam.mark,
                                    percent: exam.percentage,
                                    actual: 1
                                });
                            }
                        }
                        else {
                            module.exams[i].userMark = defaultMark;
                            var found = false;
                            marks.forEach(function(mark){
                                if(mark.work === exam.name){
                                    found = true;
                                    module.exams[i].userMark = mark.mark;
                                }
                            });
                            if (!found) {
                                actualMarks.push({
                                work: exam.name,
                                mark: defaultMark,
                                percent: exam.percentage,
                                actual: 0
                            });
                            }
                        }
                    });
                }
            }
            db.addMarks(req.session.user.fullid, module.code, actualMarks);
            res.render('modules/module', {
                module: module,
                nesspersist: true
            });
        });

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
                if(moment().diff(result[i].coursework[j].due) < 0 && !result[i].coursework[j].submitted)
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

exports.exams = function(req, res) {

    if(req.session.examUser !== undefined) {
        getTimetable();
    } else {
        ncl.login('http://crypt.ncl.ac.uk/exam-timetable', {
            id: req.session.user.id,
            pass: req.session.user.pass,
        }, function(error, cookie, $) {
            req.session.examUser = { cookie: cookie };
            getTimetable();
        });
    }

    function getTimetable() {
        exams.getTimetable(req.session.examUser, function(err, exams) {
            if (err) {
                return auth.logout(true, req, res);
            }
            res.render('exams', {exams: exams});
        });
    }
}

exports.getSubmit = function(req, res) {
    ness.getSubmit({did: req.params.did, name: req.params.name}, req.session.user, function(err, result) {
        if (err) {
            if(typeof err === 'string')
                return res.render('coursework/submit', {error: err});
            else
                return auth.logout(true, req, res);
        }
        result.filesizemb = result.filesize / 1048576;
        result.dropzone = true;
        result.safeTitle = req.params.name;
        res.render('coursework/submit', result);
    });
}

exports.submit = {
    submit: function(req, res) {
        var details = {
            did: req.body.did,
            exid: req.body.exid,
            depid: req.body.depid,
            dir: 'uploads/',
            uniq: req.body.uniq,
            year: req.body.year,
            email: req.body.email,
            files: req.session.files || [],
            filesize: req.body.filesize
        }
        if(details.files.length == 0) {
            return res.render('coursework/submit', {error: 'You have to submit at least 1 file'});
        }
        delete req.session.files;
        ness.submit(details, req.session.user, function(err, result) {
            if(err){
                res.render('coursework/submitted', {error: 'An unknown error occured'});
            }
            else{
                // Check that the checksums match
                for(var i = 0; i < result.files.length; i++)(function(i) {
                    checksum.file('uploads/' + req.body.uniq + '/' + result.files[i].name, function (err, cs) {
                        if (cs === result.files[i].checksum) {
                            result.files[i].checksumMatch = true;
                        }
                        else{
                            result.warning = 'One or more of the files you submitted have mismatched checksums with NESS, you should check your submission';
                        }
                        if(i == result.files.length - 1){
                            deleteFolder(req.body.uniq);
                            return res.render('coursework/submitted', result);
                        }
                    });
                })(i);
            }
            delete req.session.uniq;
        });

    },
    upload: function(req, res) {
        // If the uniq is different then clean up old files
        if(req.session.uniq && req.session.uniq != req.params.uniq) {
            req.session.files = [];
            deleteFolder(req.session.uniq);
        }
        req.session.uniq = req.params.uniq;
        if(!req.session.files)
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
    },
    deleteFile: function(req, res) {
        fs.unlinkSync('uploads/' + req.params.uniq + '/' + req.body.file);
        var pos = req.session.files.indexOf(req.body.file);
        if(pos > -1)
            req.session.files.splice(pos, 1);
        res.send('done');
    }
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
                    });
                }
            }
            res.send(json);
        });
    }
}

exports.ajax = {
    mark: function(req, res) {
        if (!req.body.module || !req.body.coursework || !req.body.mark) {
            return res.sendStatus(400);
        }
        db.addMark(req.session.user.fullid, req.body.module, req.body.coursework, req.body.mark, req.body.percent);
        res.sendStatus(200);
    }
}

function deleteFolder(uniq) {
    var path = 'uploads/' + uniq + '/';
    fs.readdir(path, function(err, files) {
        if(files){
            files.forEach(function(file) {
                fs.unlinkSync(path + file);
            });
        }
        fs.rmdirSync(path);
    });
}
