/**
 * 生成外部resolve的promise
 * @returns
 */
module.exports = function () {
  let p, resolve, rejeft;
  p = new Promise((_res, _rej) => {
    resolve = _res;
    rejeft = _rej;
  });
  return [p, resolve, rejeft];
};
