const gulp = require('gulp');
const { rimraf } = require('rimraf');

const { paths, baseDir, version } = require('./utils.js');

/*=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
|  Clean
=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-*/
gulp.task('clean', () =>
  rimraf([
    `${baseDir}/${paths.style.dest}/**/*.*`,
    `${baseDir}/${paths.script.dest}/**/*.*`,
    `${baseDir}/**/*.html`
  ])
);
gulp.task('clean:build', () => rimraf(paths.dir.prod));
gulp.task('clean:live', () => rimraf(`live/${version}`));
