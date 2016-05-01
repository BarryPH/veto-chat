'use strict';

var gulp = require('gulp');
var browserSync = require('browser-sync');
var sass = require('gulp-sass');
var mocha = require('gulp-spawn-mocha');
var jshint = require('gulp-jshint');
var jshintReporter = require('jshint-stylish');

gulp.task('browserSync', function() {
	browserSync({
		open: false,
		notify: false,
		proxy: 'localhost:3000',
		port: 3001,
	});
});

gulp.task('sass', function() {
	return gulp.src('public/scss/**/*.scss')
		.pipe(sass())
		.pipe(gulp.dest('public/css'))
		.pipe(browserSync.reload({
			stream: true
		}));
});

gulp.task('test', function() {
	return gulp.src('tests/**/*.js')
		.pipe(mocha());
});

gulp.task('lint', ['test'], function() {
	return gulp.src(['**/*.js', '!node_modules/**/*.js'])
		.pipe(jshint())
		.pipe(jshint.reporter(jshintReporter));
});

gulp.task('watch', ['browserSync', 'sass', 'lint'], function() {
	gulp.watch('public/scss/**/*.scss', ['sass']);
	gulp.watch('views/**/*.ejs', browserSync.reload);
	gulp.watch('public/js/**/*.js', browserSync.reload);
	gulp.watch(['**/*.js', '!node_modules/**/*.js'], ['lint']);
});
