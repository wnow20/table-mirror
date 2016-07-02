var gulp = require('gulp');
var uglyfly = require('gulp-uglyfly');

gulp.task('default', function() {
  gulp.src('TableMirror.js')
    .pipe(uglyfly())
    .pipe(gulp.dest('dist'))
});
