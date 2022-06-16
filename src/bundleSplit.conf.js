module.exports = {
  useGestureHandler: true,
  whiteList: Array.from(
    new Set([
      'index.js',
      'src/api',
      'src/components',
      'src/hooks',
      'src/utils',
      'app.json',
    ])
  ),
  blackList: [],
  bootstrap: [],
};
