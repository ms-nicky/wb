const fs = require('node:fs')
const path = require('node:path')

const pkgPath = path.join(__dirname, '../../package.json')
let pkg = { version: '0.0.0' }
try {
  pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
} catch (e) {
  pkg = { version: '0.0.0' }
}

const Config = (() => {
  const configPath = path.join(process.cwd(), 'config.json')
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    }
  } catch (e) {}
  return {}
})()

const Constants = {
  DEFAULT_PREFIXES: ['.', '#', '!', '/'],
  VERSION: pkg.version,
  PACKAGE_NAME: pkg.name || '@neoxr/wb',
  evaluate_chars: Config.evaluate_chars || ['>', '=>', '$'],
}

module.exports = {
  pkg,
  Config,
  Constants,
  defaultPrefixes: Constants.DEFAULT_PREFIXES,
}
