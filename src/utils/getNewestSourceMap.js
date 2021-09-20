const path = require('path');
const fs = require('fs');

/**
 * 获取最新的sourceMap文件
 * @returns
 */
module.exports = function () {
  const sourceMapDirPath = path.resolve(process.cwd(), './multiBundle/sourceMap');
  let result = null,
    ctimeMax = 0;
  if (fs.existsSync(sourceMapDirPath)) {
    const dirs = fs.readdirSync(sourceMapDirPath);
    if (dirs.length > 0) {
      for (let i = 0; i < dirs.length; i++) {
        const myPath = path.resolve(sourceMapDirPath, dirs[i]);
        const stat = fs.statSync(myPath);
        if (stat.ctimeMs > ctimeMax) {
          ctimeMax = stat.ctimeMs;
          result = myPath;
        }
      }
      return result;
    }
  }
  return null;
};
