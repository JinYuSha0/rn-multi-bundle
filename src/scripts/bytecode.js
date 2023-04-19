const Path = require('path');
const fs = require('fs');
const process = require('process');
const deffered = require('../utils/deffered');
const { exec } = require('child_process');

function osDetect() {
  switch (process.platform) {
    case 'win32':
      return ['win64-bin', 'hermesc.exe'];
    case 'darwin':
      return ['osx-bin', 'hermesc'];
    case 'linux':
      return ['linux64-bin', 'hermesc'];
  }
}

function bytecode(filepath) {
  const [promise, resolve, reject] = deffered();
  const nodeModulesPath = Path.resolve(__dirname, '../../../');
  const [dirname, execname] = osDetect();
  const hermescPath = Path.join(
    nodeModulesPath,
    './react-native/sdks/hermesc/',
    dirname,
    execname
  );
  const outPath = filepath.replace(/(.*\/)(.*?).bundle/, function (_, $1, $2) {
    return $1 + $2 + '.hbc';
  });
  const command = `${hermescPath} -emit-binary -out ${outPath} ${filepath}`;
  exec(command, (error) => {
    if (!error) {
      fs.unlinkSync(filepath);
      fs.renameSync(outPath, filepath);
      resolve(filepath);
    } else {
      reject(error);
    }
  });
  return promise;
}

module.exports = bytecode;
