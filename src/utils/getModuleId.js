/**
 * 生成模块id
 * @param {*} path
 * @param {*} isBussines
 * @returns
 */
module.exports = function (isBussines, startId = 0) {
  let id = startId;
  const commonModuleMap = new Map();
  const bussinesModuleMap = new Map();
  return path => {
    const targetMap = !isBussines ? commonModuleMap : bussinesModuleMap;
    if (targetMap.has(path)) {
      return targetMap.get(path);
    } else {
      targetMap.set(path, id);
      return id++;
    }
  };
};
