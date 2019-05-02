const Hogan = require('hogan.js');
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'templates');
const buildDir = path.join(__dirname, 'templates-build');

fs.readdirSync(srcDir).forEach(function (file) {
  const source = fs.readFileSync(path.join(srcDir, file), { encoding: 'utf8' });
  const jsName = file.replace('.html', '.js');

  const js = 'var H = require("hogan.js");\n' +
             'module.exports = function() { ' +
             'var T = new H.Template(' +
              Hogan.compile(source, { asString: true }) +
             ');' + 'return T; }();';


  const buildPath = path.join(buildDir, jsName);

  fs.writeFileSync(buildPath, js);

  console.log('Compiled ' + buildPath);

});

console.log('Complete');
