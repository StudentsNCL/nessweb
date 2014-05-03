var ness = require('nessjs'),
    mu = require('mu2'),
    http = require('http'),
    express = require('express'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    connect = require('connect'),
    routes = require('./routes'),
    auth = require('./auth');

mu.root = __dirname + '/templates';

exports.index = function(req, res) {
    ness.getName(function(err, name) {
        var stream = mu.compileAndRender('index.html', {
                        name: name
                });
        stream.pipe(res);
    });
};

exports.login_get = function(req, res) {
    var stream = mu.compileAndRender('login.html', {});
    stream.pipe(res);
};

exports.login_post = function(req, res) {
    req.session.user = req.body.user;
    req.session.pass = req.body.pass;
    res.redirect('/');
};

exports.modules = function(req, res) {
    ness.getModules('attendance', function(err, modules) {
        var stream = mu.compileAndRender('modules.html', {
                        modules: modules
                });
        stream.pipe(res);
    });
};