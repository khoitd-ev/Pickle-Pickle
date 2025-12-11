// scripts/pin-versions.js
const fs = require('fs');
const path = require('path');
const pkgPath = path.resolve('package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']
  .forEach(section => {
    if (!pkg[section]) return;
    for (const k of Object.keys(pkg[section])) {
      // bỏ ^ hoặc ~ ở đầu version
      pkg[section][k] = String(pkg[section][k]).replace(/^[\^~](?=\d)/, '');
    }
  });

// (tuỳ chọn) pin engine node
pkg.engines = Object.assign({}, pkg.engines, { node: '>=20.9' });

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log('Pinned versions in package.json');
