const os = require('os');
const platform = os.platform();

function getMetroOptions() {
  if (platform === 'win32') {
    return {
      resetCache: true,
      maxWorkers: os.cpus().length,
    };
  }
  return {};
}

module.exports = getMetroOptions;
