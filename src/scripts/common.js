const fs = require('fs');
const path = require('path');
const Server = require('metro/src/Server');
const output = require('metro/src/shared/output/bundle');
const loadConfig =
  require('@react-native-community/cli/build/tools/config/index').default;
const loadMetroConfig =
  require('@react-native-community/cli/build/tools/loadMetroConfig').default;
const saveAssets =
  require('@react-native-community/cli/build/commands/bundle/saveAssets').default;
const genFileHash = require('../utils/genFileHash');
const genPathFactory = require('../utils/genPathFactory');
const getModuleId = require('../utils/getModuleId')(false, 0);
const deffered = require('../utils/deffered');
const { delDir, createDirIfNotExists } = require('../utils/fsUtils');
const analysisRegisterComponent = require('../utils/analysisRegisterComponent');
const bundleBuz = require('./bussines');
const getNewestSourceMap = require('../utils/getNewestSourceMap');
const genPathMacthRegExp = require('../utils/genPathMacthRegExp');

function common(config) {
  const ctx = loadConfig();
  const rootPath = ctx.root;
  const genPath = genPathFactory(rootPath);
  const bundleSplitConfig = require(config.config);

  let moduleIdMap = Object.create(null);
  const platform = config['platform'] || 'android';
  const entryFile = config.entry;
  const bundleOutputPath = createDirIfNotExists(config.out);
  const assetsOutPuthPath = createDirIfNotExists(config.assetsOut);
  const outputBundleFileName = `common.${platform}.bundle`;
  const bundleOutputFilePath = path.resolve(
    createDirIfNotExists(bundleOutputPath),
    outputBundleFileName
  );
  const sourceMapPath = path.join(config.sourceOut, './sourceMap', platform);
  const nodeModulePath = path.join(process.cwd(), 'node_modules');
  const codeDirPath = path.join(config.sourceOut, './temp');
  const [p, resolve] = deffered();
  const whiteListRegExp = genPathMacthRegExp(
    bundleSplitConfig.whiteList.map((i) => path.join(process.cwd(), i))
  );
  const blackListRegExp = genPathMacthRegExp(
    bundleSplitConfig.blackList.map((i) => path.join(process.cwd(), i))
  );
  const detectFilter = (path) => {
    try {
      // 过滤自带的require polyfills实现不重启app更新模块
      if (path.includes(nodeModulePath)) {
        if (path.indexOf('metro-runtime/src/polyfills/require.js') > -1) {
          return false;
        }
        // 外部依赖
        return true;
      } else {
        if (blackListRegExp.test(path)) return false;
        if (whiteListRegExp.test(path)) return true;
      }
    } catch {}
    return false;
  };
  const bundle = async (platform) => {
    const config = await loadMetroConfig(ctx);
    const originGetPolyfills = config.serializer.getPolyfills;
    config.serializer.getPolyfills = function () {
      return [
        path.join(__dirname, '../polyfills/require.js'),
        ...originGetPolyfills(),
      ];
    };
    config.serializer.processModuleFilter = function (module) {
      const { path } = module;
      return detectFilter(path);
    };
    config.serializer.createModuleIdFactory = function () {
      return function (path) {
        if (detectFilter(path)) {
          const id = getModuleId(genPath(path));
          moduleIdMap[genPath(path)] = {
            id,
            hash: genFileHash(path),
          };
          return id;
        }
        return null;
      };
    };
    const server = new Server(config);
    try {
      const commonRequestOpts = {
        entryFile,
        dev: false,
        minify: true,
        platform,
      };
      const bundle = await output.build(server, commonRequestOpts);
      bundle.code =
        `var __BUNDLE_START_TIME__=this.nativePerformanceNow?nativePerformanceNow():Date.now(),__DEV__=false,process=this.process||{},__METRO_GLOBAL_PREFIX__='';process.env=process.env||{};process.env.NODE_ENV=process.env.NODE_ENV||"production";\r` +
        bundle.code;
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
      fs.writeFileSync(
        path.resolve(
          createDirIfNotExists(sourceMapPath),
          `moduleIdMap-${+new Date()}.json`
        ),
        JSON.stringify(
          Object.assign({
            [bundleOutputFilePath]: {
              id: -1,
              hash: genFileHash(bundleOutputFilePath),
            },
            ...moduleIdMap,
          }),
          null,
          2
        )
      );
    } finally {
      server.end();
      resolve();
    }
  };

  if (!config.buz) {
    bundle(platform);
  } else {
    resolve(true);
  }

  p.then((isBuz) => {
    const pAll = [];
    let startId = Object.keys(moduleIdMap).length;
    if (isBuz) {
      startId = Object.keys(require(getNewestSourceMap(platform))).length;
    }
    delDir(codeDirPath);
    analysisRegisterComponent().then((res) => {
      for (let i = 0; i < Array.from(res.keys()).length; i++) {
        const component = Array.from(res.keys())[i];
        const entryFilePath = path.resolve(
          createDirIfNotExists(codeDirPath),
          `${component}.${Math.random().toString(36).split('.')[1]}.js`
        );
        fs.writeFileSync(entryFilePath, res.get(component));
        pAll.push(
          bundleBuz(
            platform,
            component,
            entryFilePath,
            startId + i * 100000,
            config
          )
        );
      }
      Promise.all(pAll)
        .then((childComponents) => {
          if (!isBuz) {
            const components = {
              [outputBundleFileName]: {
                hash: genFileHash(bundleOutputFilePath),
              },
            };
            childComponents.forEach((componentHash) => {
              Object.assign(components, componentHash);
            });
            fs.writeFileSync(
              path.resolve(bundleOutputPath, 'appSetting.json'),
              JSON.stringify(
                { components, timestamp: +new Date() },
                undefined,
                2
              )
            );
          }
        })
        .then(() => {
          console.log('end');
          delDir(codeDirPath);
        });
    });
  });
}

module.exports = common;
