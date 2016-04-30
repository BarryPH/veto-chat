var gulp = require('gulp');
var sass = require('gulp-sass');
var browserSync = require('browser-sync');

gulp.task('browserSync', function() {
	browserSync({
		open: false,
		proxy: 'localhost:3000'
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

gulp.task('watch', ['browserSync', 'sass'], function() {
	gulp.watch('public/scss/**/*.scss', ['sass']);
	gulp.watch('views/**/*.ejs', browserSync.reload);
	gulp.watch('public/js/**/*.js', browserSync.reload);
});
