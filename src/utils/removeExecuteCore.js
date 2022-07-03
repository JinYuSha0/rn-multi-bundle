const path = require('path');

function removeExecuteCore(moduleIdMap, bundle) {
  const corePath = path
    .normalize('/node_modules/react-native/Libraries/Core/InitializeCore.js')
    .replace(new RegExp(`\\${path.sep}`, 'g'), `${path.sep}`);
  if (moduleIdMap[corePath]) {
    const { id } = moduleIdMap[corePath];
    bundle.code = bundle.code.replace(`__r(${id});\n`, '');
  }
  return bundle;
}

module.exports = removeExecuteCore;
