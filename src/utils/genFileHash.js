const crypto = require('crypto');
const fs = require('fs');

/**
 * 生成文件hash值
 * @param {*} path
 * @returns
 */
module.exports = function (path) {
  if (!fs.existsSync(path)) return '';
  const buffer = fs.readFileSync(path);
  const fsHash = crypto.createHash('md5');
  fsHash.update(buffer);
  return fsHash.digest('hex');
};
