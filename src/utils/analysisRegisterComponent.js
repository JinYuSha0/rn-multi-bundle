const babel = require('babel-core');
const path = require('path');
const fs = require('fs');
const babelConfig = require('../babel.config.js');
const deffered = require('../utils/deffered');
const types = require('@babel/types');
const generate = require('@babel/generator').default;

function genBuildImportDeclaration(t, specifiers, source) {
  return t.importDeclaration(specifiers, t.stringLiteral(`${source}`));
}

/**
 * 分析rn注册的模块
 */
function analysisRegisterComponent() {
  const indexPath = path.resolve(process.cwd(), 'index.js');
  const rootPath = process.cwd();
  const code = fs.readFileSync(indexPath);
  const [p, resolve] = deffered();
  babel.transform(code, {
    babelrc: false,
    configFile: false,
    plugins: [
      ...babelConfig.plugins,
      {
        pre(state) {
          this.component = new Map();
          this.source = new Map();
          this.import = new Map();
        },
        visitor: {
          ImportDeclaration(path) {
            const source = path.node.source.value;
            if (source.includes('src/registry/')) {
              this.source.set(path.node.specifiers[0].local.name, {
                node: path.node,
                source,
              });
            } else {
              const specifiers = path.node.specifiers[0];
              if (specifiers) {
                this.import.set(specifiers.local.name, path.node);
              }
            }
          },
          VariableDeclaration(path) {
            if (path.node.declarations[0].id.name === 'ComponentMap') {
              const properties = path.node.declarations[0].init.properties;
              for (let i = 0; i < properties.length; i++) {
                let nameNode;
                if (properties[i].key.type === 'MemberExpression') {
                  nameNode = properties[i].key;
                } else {
                  nameNode = properties[i].key;
                }
                const valueNode = properties[i].value;
                if (!this.component.has(valueNode.name)) {
                  this.component.set(valueNode.name, new Set([nameNode]));
                } else {
                  this.component.get(valueNode.name).add(nameNode);
                }
              }
            }
          },
        },
        post(state) {
          const result = new Map();
          for (let component of this.component.keys()) {
            const ast = {
              type: 'Program',
              body: [],
            };
            const {
              node: { specifiers },
              source,
            } = this.source.get(component);
            ast.body.push(
              genBuildImportDeclaration(
                types,
                [
                  types.importSpecifier(
                    types.identifier('AppRegistry'),
                    types.identifier('AppRegistry'),
                  ),
                ],
                'react-native',
              ),
            );
            ast.body.push(
              genBuildImportDeclaration(
                types,
                specifiers,
                path.resolve(rootPath, source),
              ),
            );
            const register = [];
            Array.from(this.component.get(component)).forEach(node => {
              let name, importNode;
              if (types.isMemberExpression(node)) {
                name = node.object.name;
              } else if (types.isIdentifier(node)) {
                name = node.name;
              }

              if (this.import.has(name)) {
                importNode = this.import.get(name);
              } else if (this.source.has(name)) {
                importNode = this.source.get(name).node;
              }

              importNode.source.value = path.resolve(
                rootPath,
                importNode.source.value,
              );
              ast.body.push(importNode);

              register.push(
                types.callExpression(
                  types.memberExpression(
                    types.identifier('AppRegistry'),
                    types.identifier('registerComponent'),
                    false,
                    false,
                  ),
                  [
                    node,
                    types.arrowFunctionExpression(
                      [],
                      types.identifier(component),
                      false,
                    ),
                  ],
                ),
              );
            });

            ast.body.push(...register);

            const { code } = generate(ast);
            result.set(component, Buffer.from(code));
          }
          resolve(result);
        },
      },
    ],
  });
  return p;
}

analysisRegisterComponent();

module.exports = analysisRegisterComponent;
