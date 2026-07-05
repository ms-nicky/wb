const { readFileSync, existsSync } = require('node:fs')
const path = require('node:path')

let pkg = {}
const pkgPath = path.join(process.cwd(), 'package.json')
if (existsSync(pkgPath)) {
  try {
    pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
  } catch (e) {
    pkg = {}
  }
}

const Node = {
  modules: new Map(),
  additionalNodes: [],

  add(key, mod) {
    this.modules.set(key, mod)
  },

  get(key) {
    return this.modules.get(key)
  },

  has(key) {
    return this.modules.has(key)
  },

  delete(key) {
    return this.modules.delete(key)
  },

  getAll() {
    return Array.from(this.modules.values())
  },

  addAdditional(node) {
    this.additionalNodes.push(node)
  },

  getAdditional() {
    return this.additionalNodes
  },

  package: pkg,

  version: pkg.version || '0.0.0',

  toJSON() {
    return {
      package: this.package,
      version: this.version,
      modules: Array.from(this.modules.keys()),
      additionalNodes: this.additionalNodes
    }
  }
}

module.exports = Node
