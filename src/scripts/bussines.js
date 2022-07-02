const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const compressing = require('compressing');
const Server = require('metro/src/Server');
const output = require('metro/src/shared/output/bundle');
const loadConfig =
  require('@react-native-community/cli/build/tools/config/index').default;
const loadMetroConfig =
  require('@react-native-community/cli/build/tools/loadMetroConfig').default;
const saveAssets =
  require('@react-native-community/cli/build/commands/bundle/saveAssets').default;
const { createDirIfNotExists, delDir } = require('../utils/fsUtils');
const getNewestSourceMap = require('../utils/getNewestSourceMap');
const genPathFactory = require('../utils/genPathFactory');
const genFileHash = require('../utils/genFileHash');

const ctx = loadConfig();
const rootPath = ctx.root;
const genPath = genPathFactory(rootPath);

const bunele = async (platform, component, entryFile, startId, config) => {
  const getModuleId = require('../utils/getModuleId')(true, startId);
  const bundlePath = config.buz
    ? path.join(config.out, `./${component}`)
    : config.out;
  const assetsPath = config.buz
    ? path.join(config.assetsOut, `./${component}`)
    : config.assetsOut;
  if (config.buz) {
    delDir(bundlePath);
    delDir(assetsPath);
  }
  const bundleOutputPath = createDirIfNotExists(bundlePath);
  const assetsOutPuthPath = createDirIfNotExists(assetsPath);
  const fileName = `${String(component).toLocaleLowerCase()}.buz.${String(
    platform
  ).toLocaleLowerCase()}.bundle`;
  const bundleOutputFilePath = path.resolve(
    createDirIfNotExists(bundleOutputPath),
    fileName
  );
  const metroConfig = await loadMetroConfig(ctx);
  const moduleIdMap = require(getNewestSourceMap(platform));
  const commonHash = Object.keys(moduleIdMap)
    .map((key) => moduleIdMap[key])
    .find((o) => o.id === -1).hash;
  metroConfig.resetCache = config.resetCache ?? false;
  metroConfig.serializer.processModuleFilter = function (module) {
    const { path } = module;
    if (
      path.indexOf('polyfills') >= 0 ||
      path.indexOf('__prelude__') >= 0 ||
      path.indexOf('source-map') >= 0
    ) {
      return false;
    }
    const filePath = genPath(path);
    const moduleInfo = moduleIdMap[filePath];
    if (moduleInfo && moduleInfo.hash === genFileHash(path)) {
      return false;
    }
    return true;
  };
  metroConfig.serializer.createModuleIdFactory = function () {
    return (path) => {
      path = genPath(path);
      const commonModule = moduleIdMap[path];
      if (commonModule) {
        return commonModule.id;
      }
      const id = getModuleId(path, true);
      return id;
    };
  };
  const commonRequestOpts = {
    entryFile,
    dev: false,
    minify: config.minify ?? true,
    platform,
  };
  const server = new Server(metroConfig);
  try {
    const bundle = await output.build(server, commonRequestOpts);
    const hash = crypto.createHash('md5').update(bundle.code).digest('hex');
    if (config.buz) {
      bundle.code = bundle.code.replace(
        /registerAsset\({(.*?)}\)/g,
        `registerAsset({$1,package:"${component}/${hash}/"})`
      );
    }
    output.save(
      bundle,
      {
        bundleOutput: bundleOutputFilePath,
        encoding: 'utf-8',
      },
      console.log
    );
    const outputAssets = await server.getAssets({
      ...Server.DEFAULT_BUNDLE_OPTIONS,
      ...commonRequestOpts,
      bundleType: 'todo',
    });
    await saveAssets(
      outputAssets,
      platform,
      createDirIfNotExists(assetsOutPuthPath)
    );
    if (config.buz) {
      fs.writeFileSync(
        path.join(bundleOutputPath, 'setting.json'),
        JSON.stringify(
          {
            platform,
            hash,
            commonHash,
            bundleName: fileName,
            componentName: component,
            componentType: 2,
            timestamp: +new Date(),
          },
          undefined,
          2
        )
      );
      await compressing.zip.compressDir(
        bundleOutputPath,
        path.join(bundleOutputPath, '../', `${component}-${hash}.zip`),
        {
          relativePath: hash,
          ignoreBase: true,
        }
      );
    }
    return {
      [fileName]: {
        hash,
        componentName: component,
        componentType: 2,
      },
    };
  } finally {
    server.end();
  }
};

module.exports = bunele;
