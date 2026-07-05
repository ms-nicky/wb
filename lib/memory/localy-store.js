const fs = require('node:fs')
const path = require('node:path')

class LocalStore {
  constructor(options = {}) {
    this.dir = path.resolve(options.dir || path.join(process.cwd(), '.store'))
    this._loaded = false
    this._data = {}
    if (!fs.existsSync(this.dir)) {
      fs.mkdirSync(this.dir, { recursive: true })
    }
    this._load()
  }

  _filePath(key) {
    const safe = key.replace(/[^a-zA-Z0-9_-]/g, '_')
    return path.join(this.dir, `${safe}.json`)
  }

  _load() {
    try {
      const files = fs.readdirSync(this.dir)
      for (const file of files) {
        if (file.endsWith('.json')) {
          const key = file.replace('.json', '')
          const content = fs.readFileSync(path.join(this.dir, file), 'utf-8')
          this._data[key] = JSON.parse(content)
        }
      }
      this._loaded = true
    } catch (e) {
      console.error('[LocalStore] Load error:', e.message)
    }
  }

  _persist(key) {
    try {
      const file = this._filePath(key)
      fs.writeFileSync(file, JSON.stringify(this._data[key]), 'utf-8')
    } catch (e) {
      console.error('[LocalStore] Persist error:', e.message)
    }
  }

  set(key, value) {
    this._data[key] = value
    this._persist(key)
  }

  get(key) {
    return this._data[key]
  }

  has(key) {
    return key in this._data
  }

  delete(key) {
    delete this._data[key]
    try {
      const file = this._filePath(key)
      if (fs.existsSync(file)) fs.unlinkSync(file)
    } catch (e) {}
  }

  clear() {
    this._data = {}
    try {
      const files = fs.readdirSync(this.dir)
      for (const file of files) {
        if (file.endsWith('.json')) {
          fs.unlinkSync(path.join(this.dir, file))
        }
      }
    } catch (e) {}
  }

  keys() {
    return Object.keys(this._data)
  }

  getAll() {
    return { ...this._data }
  }

  toJSON() {
    return this._data
  }
}

module.exports = LocalStore
