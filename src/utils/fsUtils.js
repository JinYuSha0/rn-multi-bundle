const fs = require('fs');
const path = require('path');

/**
 * 删除文件夹和文件夹下的所有目录
 * @param {*} path
 */
function delDir(path) {
  let files = [];
  if (fs.existsSync(path)) {
    files = fs.readdirSync(path);
    files.forEach((file, index) => {
      let curPath = path + '/' + file;
      if (fs.statSync(curPath).isDirectory()) {
        delDir(curPath); //递归删除文件夹
      } else {
        fs.unlinkSync(curPath); //删除文件
      }
    });
    fs.rmdirSync(path);
  }
}

/**
 * 递归创建文件夹
 * @param {*} dirname
 * @returns
 */
function createDirIfNotExists(dirname) {
  function mkdirsSync(dirname) {
    if (fs.existsSync(dirname)) {
      return true;
    } else {
      if (mkdirsSync(path.dirname(dirname))) {
        fs.mkdirSync(dirname);
        return true;
      }
    }
  }
  mkdirsSync(dirname);
  return dirname;
}

module.exports = {
  delDir,
  createDirIfNotExists,
};
