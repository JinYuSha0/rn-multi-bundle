module.exports = function genPathMacthRegExp(pathList) {
  if (!pathList || pathList.length === 0) return /\s/;
  const startsWithRegExp = pathList.map((reg) => `\\/?${reg}`).join('|');
  return new RegExp(`\^(${startsWithRegExp})\/?([^\/]*)$`);
};
