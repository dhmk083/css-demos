const gulp = require('gulp')
const babel = require('gulp-babel')
const uglify = require('gulp-uglify')
const postcss = require('gulp-postcss')
const sass = require('gulp-sass')
const del = require('del')
const sourcemaps = require('gulp-sourcemaps')

sass.compiler = require('node-sass')

const jsGlob = 'js/**'
const sassGlob = 'sass/*'
const distDir = 'dist'

const js = () =>
  gulp
    .src(jsGlob)
    .pipe(
      babel({
        presets: ['@babel/preset-env'],
      })
    )
    .pipe(sourcemaps.init())
    .pipe(uglify())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(distDir))

const css = () =>
  gulp
    .src(sassGlob)
    .pipe(sourcemaps.init())
    .pipe(sass.sync().on('error', sass.logError))
    .pipe(postcss([require('autoprefixer'), require('cssnano')]))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(distDir))

const clean = () => del(distDir)

gulp.task('build', gulp.series(clean, gulp.parallel(css, js)))

exports.default = () => {
  gulp.watch(sassGlob, css)
  gulp.watch(jsGlob, js)
}
