const fs = require('node:fs')
const path = require('node:path')

class SessionManager {
  constructor(sessionDir = 'session') {
    this.sessionDir = path.resolve(sessionDir)
    if (!fs.existsSync(this.sessionDir)) {
      fs.mkdirSync(this.sessionDir, { recursive: true })
    }
    this.sessions = new Map()
  }

  set(key, value) {
    this.sessions.set(key, value)
    this._persist(key, value)
  }

  get(key) {
    if (this.sessions.has(key)) {
      return this.sessions.get(key)
    }
    return this._load(key)
  }

  has(key) {
    return this.sessions.has(key) || this._exists(key)
  }

  delete(key) {
    this.sessions.delete(key)
    const file = this._filePath(key)
    try {
      if (fs.existsSync(file)) fs.unlinkSync(file)
    } catch (e) {}
  }

  clear() {
    this.sessions.clear()
    try {
      const files = fs.readdirSync(this.sessionDir)
      files.forEach(f => {
        if (f.endsWith('.json')) {
          fs.unlinkSync(path.join(this.sessionDir, f))
        }
      })
    } catch (e) {}
  }

  keys() {
    const files = fs.readdirSync(this.sessionDir)
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''))
    const memKeys = Array.from(this.sessions.keys())
    return Array.from(new Set([...memKeys, ...files]))
  }

  getAll() {
    const all = {}
    this.keys().forEach(key => {
      all[key] = this.get(key)
    })
    return all
  }

  _filePath(key) {
    const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '_')
    return path.join(this.sessionDir, `${safeKey}.json`)
  }

  _persist(key, value) {
    try {
      const file = this._filePath(key)
      const dir = path.dirname(file)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      fs.writeFileSync(file, JSON.stringify(value, null, 2), 'utf-8')
    } catch (e) {}
  }

  _load(key) {
    try {
      const file = this._filePath(key)
      if (fs.existsSync(file)) {
        const data = JSON.parse(fs.readFileSync(file, 'utf-8'))
        this.sessions.set(key, data)
        return data
      }
    } catch (e) {}
    return null
  }

  _exists(key) {
    const file = this._filePath(key)
    return fs.existsSync(file)
  }

  getAllSync() {
    return this.keys().map(key => ({
      key,
      data: this.get(key),
    }))
  }
}

module.exports = SessionManager
module.exports.default = SessionManager
