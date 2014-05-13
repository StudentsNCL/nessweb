var gulp = require('gulp'),
    clean = require('gulp-clean'),
    less = require('gulp-less'),
    minify = require('gulp-minify-css'),
    rename = require('gulp-rename'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify');

// work out te package version
var ver = require('./package.json').version;

// Define the directories of stuff
// This may look overly complicated at the moment but is super scalable in the future when things get complex
var dirs = {
  less: 'app/web/less/',
  css: 'app/public/css/',
  js: {
    src: 'app/web/js/',
    dest: 'app/public/js/'
  }
};

// Remove old (by version number) js
gulp.task('clean-js', function() {
  var redundant = dirs.js.dest + '**/' + 'main-!(' + ver + ').min.js';
  return gulp.src(redundant, {read: false})
      .pipe(clean());
});

// Remove old (by version number) css
gulp.task('clean-css', function() {
  var redundant = dirs.css + '**/' + 'main-!(' + ver + ').min.css';
  return gulp.src(redundant, {read: false})
      .pipe(clean());
});

// less
gulp.task('less', ['clean-css'], function() {
  var src = dirs.less + 'build.less';
  var out = 'main-'+ ver + '.min.css';
    return gulp.src(src)
      .pipe(less())
      .pipe(minify())
      .pipe(rename(out))
      .pipe(gulp.dest(dirs.css));
});

// javascript
gulp.task('js', ['clean-js'], function() {
  var dir = dirs.js.src;
  var src = [
    dir + 'plugins.js',
    dir + '*.js'
  ];
  var out = 'main-'+ ver + '.min.js';
  return gulp.src(src)
      .pipe(concat(out))
      .pipe(uglify())
      .pipe(gulp.dest(dirs.js.dest));
});

// Define the watch task
gulp.task('watch', function() {
  gulp.watch(dirs.less + '**/' + '*.less', ['less']);
  gulp.watch(dirs.js.src + '**/' + '*.js', ['js']);
});

// Define the default and helper gulp tasks
gulp.task('default', ['less', 'js']);