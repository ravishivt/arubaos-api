const path = require('path');
const { fork } = require('child_process');
const colors = require('colors');

const { readFileSync, writeFileSync } = require('fs');
const pkg = JSON.parse(readFileSync(path.resolve(__dirname, '..', 'package.json')));

pkg.scripts.prepush = 'npm run test:prod && npm run build';
pkg.scripts.commitmsg = 'commitlint -E HUSKY_GIT_PARAMS';

writeFileSync(path.resolve(__dirname, '..', 'package.json'), JSON.stringify(pkg, null, 2));

// Call husky to set up the hooks
fork(path.resolve(__dirname, '..', 'node_modules', 'husky', 'lib', 'installer', 'bin'), [
  'install',
]);

console.debug();
console.debug(colors.green('Done!!'));
console.debug();

if (pkg.repository.url.trim()) {
  console.debug(colors.cyan('Now run:'));
  console.debug(colors.cyan('  npm install -g semantic-release-cli'));
  console.debug(colors.cyan('  semantic-release-cli setup'));
  console.debug();
  console.debug(colors.cyan('Important! Answer NO to "Generate travis.yml" question'));
  console.debug();
  console.debug(
    colors.gray('Note: Make sure "repository.url" in your package.json is correct before'),
  );
} else {
  console.debug(colors.red('First you need to set the "repository.url" property in package.json'));
  console.debug(colors.cyan('Then run:'));
  console.debug(colors.cyan('  npm install -g semantic-release-cli'));
  console.debug(colors.cyan('  semantic-release-cli setup'));
  console.debug();
  console.debug(colors.cyan('Important! Answer NO to "Generate travis.yml" question'));
}

console.debug();
