const paths = require('./gulp.json');
const vendors = require('../vendors.json');
const { name, version, dependencies } = require('../package.json');

const isIterableArray = array => Array.isArray(array) && !!array.length;
const isProd = process.env.MODE === 'PROD';
const baseDir = isProd ? paths.dir.prod : paths.dir.dev;

// Only load browser-sync in development mode
let browserSync = null;
if (!isProd) {
  try {
    browserSync = require('browser-sync').create();
  } catch (error) {
    console.warn('browser-sync not available, continuing without live reload');
  }
}

module.exports = {
  name,
  version: `v${version}`,
  dependencies,
  paths,
  vendors,
  isIterableArray,
  baseDir,
  browserSync,
  isProd
};
