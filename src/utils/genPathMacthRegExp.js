const path = require('path');
const sep = path.sep;

module.exports = function genPathMacthRegExp(pathList) {
  if (!pathList || pathList.length === 0) return /\s/;
  const startsWithRegExp = pathList
    .map((pathname) =>
      path.normalize(pathname).replace(new RegExp(`\\${sep}`, 'g'), `\\${sep}`)
    )
    .map((pathname) => `\\${sep}?${pathname}`)
    .join('|');
  return new RegExp(`\^(${startsWithRegExp})\\${sep}?([^\\${sep}]*)$`);
};
