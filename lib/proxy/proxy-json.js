const fs = require('node:fs')
const path = require('node:path')

class JSONProxy {
  constructor(options = {}) {
    this.filePath = path.resolve(options.file || options.path || 'proxy.json')
    this._ensure()
  }

  _ensure() {
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, '{}', 'utf-8')
    }
  }

  _read() {
    try {
      return JSON.parse(fs.readFileSync(this.filePath, 'utf-8'))
    } catch (e) {
      return {}
    }
  }

  _write(data) {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8')
  }

  get(key) {
    const data = this._read()
    return data[key]
  }

  set(key, value) {
    const data = this._read()
    data[key] = value
    this._write(data)
  }

  has(key) {
    const data = this._read()
    return key in data
  }

  delete(key) {
    const data = this._read()
    delete data[key]
    this._write(data)
  }

  getAll() {
    return this._read()
  }

  clear() {
    this._write({})
  }

  keys() {
    return Object.keys(this._read())
  }
}

module.exports = JSONProxy
