const { Command } = require('commander');
const path = require('path');
const fs = require('fs');
const common = require('./scripts/common.js');
const package = require('../package.json');

const program = new Command();
program.version(package.version);

function parseFilepath(value, prev) {
  if (!!value && fs.lstatSync(path.join(process.cwd(), value)).isFile()) {
    return path.join(process.cwd(), value);
  } else if (fs.existsSync(prev)) {
    return prev;
  }
}

function parseDirpath(value, prev) {
  if (!!value && fs.lstatSync(path.join(process.cwd(), value)).isDirectory()) {
    return path.join(process.cwd(), value);
  } else if (fs.existsSync(prev)) {
    return prev;
  }
}

program
  .option('-u, --buz', 'Build business bundle')
  .option('-b, --bootstrap', 'Build bootstrap bundle')
  .option('-p, --platform [platform]', 'android or ios')
  .option(
    '-e, --entry [path]',
    'Entry file path',
    parseFilepath,
    path.join(process.cwd(), './index.js')
  )
  .option(
    '-c, --config [path]',
    'Config file path',
    parseFilepath,
    path.join(__dirname, './bundleSplit.conf.js')
  )
  .option('-o, --out [path]', 'Output folder path', parseDirpath, '')
  .option(
    '-a, --assetsOut [path]',
    'Assets folder output path',
    parseDirpath,
    ''
  )
  .option(
    '-s, --sourceOut [path]',
    'Source folder output filepath',
    parseDirpath,
    path.join(process.cwd(), './multiBundle')
  )
  .parse();

const options = program.opts();

if (!options.platform) {
  options.platform = 'android';
}

if (!options.out && !options.buz) {
  if (options.platform === 'android') {
    options.out = path.resolve(process.cwd(), `./android/app/src/main/assets/`);
  } else if (options.platform === 'ios') {
    options.out = path.resolve(process.cwd(), `./ios/bundle/`);
  }
}

if (!options.out && options.buz) {
  options.out = path.join(
    process.cwd(),
    `./multiBundle/buzBundle/${options.platform}`
  );
}

if (!options.assetsOut && !options.buz) {
  if (options.platform === 'android') {
    options.assetsOut = path.resolve(
      process.cwd(),
      `./android/app/src/main/res/`
    );
  } else if (options.platform === 'ios') {
    options.assetsOut = path.resolve(process.cwd(), `./ios/bundle/`);
  }
}

if (!options.assetsOut && options.buz) {
  options.assetsOut = path.join(
    process.cwd(),
    `./multiBundle/buzBundle/${options.platform}`
  );
}

common(options);
