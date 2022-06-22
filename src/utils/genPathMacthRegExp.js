const path = require('path');
const fs = require('fs');
const sep = path.sep;

module.exports = function genPathMacthRegExp(pathList) {
  if (!pathList || pathList.length === 0) return /\s/;
  const startsWithRegExp = pathList
    .map((pathname) => {
      let isDir = false;
      try {
        const stat = fs.lstatSync(pathname);
        isDir = stat.isDirectory();
      } catch {}
      return [pathname, isDir];
    })
    .map(([pathname, isDir]) => [
      path.normalize(pathname).replace(new RegExp(`\\${sep}`, 'g'), `\\${sep}`),
      isDir,
    ])
    .map(([pathname, isDir]) => {
      return `\\${sep}?${pathname}${isDir ? `\\${sep}.*` : ''}`;
    })
    .join('|');
  return new RegExp(`\^(${startsWithRegExp})\\${sep}?([^\\${sep}]*)$`);
};
