module.exports = function (rootPah) {
  return function (path) {
    return path.replace(rootPah, '');
  };
};
