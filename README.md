# 使用方法

## 一、安装

```
yarn add rn-multi-bundle -D
npm install rn-multi-bundle -D
```

## 二、修改入口文件模块注册方式

一定要使用`ComponentMap`这个变量名，写法必须一致
cli工具会通过AST去分析拆离每个业务包
```javascript
const ComponentMap = {
  [appName]: Home,
  [ComponentName.Home]: Home,
  [ComponentName.Test]: Test,
};

Object.keys(ComponentMap).forEach(name => {
  AppRegistry.registerComponent(name, () => ComponentMap[name]);
});
```

## 三、CLI工具参数说明

```
Options:
  -V, --version              output the version number
  -u, --buz                  Build business bundle
  -p, --platform [platform]  android or ios
  -e, --entry [path]         Entry file path (default: "/Users/shaojinyu/workplace/MyRN/index.js")
  -c, --config [path]        Config file path (default: "/Users/shaojinyu/workplace/MyRN/node_modules/rn-multi-bundle/src/bundleSplit.conf.js")
  -o, --out [path]           Output folder path (default: "")
  -a, --assetsOut [path]     Assets folder output path (default: "")
  -s, --sourceOut [path]     Source folder output filepath (default: "/Users/shaojinyu/workplace/MyRN/multiBundle")
  -h, --help                 display help for command
```