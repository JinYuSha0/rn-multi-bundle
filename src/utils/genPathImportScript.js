const types = require('@babel/types');
const generate = require('@babel/generator').default;

function genBuildImportDeclaration(t, specifiers, source) {
  return t.importDeclaration(specifiers, t.stringLiteral(`${source}`));
}

function genPathImportScript(scriptlist) {
  const ast = {
    type: 'Program',
    body: [],
  };
  scriptlist.forEach((script) =>
    ast.body.push(genBuildImportDeclaration(types, [], script))
  );
  const { code } = generate(ast);
  return code;
}

module.exports = genPathImportScript;
