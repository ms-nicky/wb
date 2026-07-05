const fs = require('node:fs')
const path = require('node:path')

class LocalDatabase {
  constructor(options = {}) {
    this.dataDir = path.resolve(options.dir || path.join(process.cwd(), 'database'))
    this.cache = {}
    this.connected = false
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true })
    }
    this._loadAll()
    this.connected = true
  }

  _filePath(collection) {
    const safe = collection.replace(/[^a-zA-Z0-9_-]/g, '_')
    return path.join(this.dataDir, `${safe}.json`)
  }

  _loadAll() {
    try {
      const files = fs.readdirSync(this.dataDir)
      for (const file of files) {
        if (file.endsWith('.json')) {
          const collection = file.replace('.json', '')
          const data = JSON.parse(fs.readFileSync(path.join(this.dataDir, file), 'utf-8'))
          this.cache[collection] = data
        }
      }
    } catch (e) {
      console.error('[LocalDB] Error loading data:', e.message)
    }
  }

  _persist(collection) {
    try {
      const file = this._filePath(collection)
      fs.writeFileSync(file, JSON.stringify(this.cache[collection] || [], null, 2), 'utf-8')
    } catch (e) {
      console.error('[LocalDB] Error persisting data:', e.message)
    }
  }

  _ensureCollection(collection) {
    if (!this.cache[collection]) {
      this.cache[collection] = []
    }
  }

  async save(collection, data) {
    this._ensureCollection(collection)
    const entry = { ...data, _id: data._id || Date.now().toString(36) + Math.random().toString(36).slice(2, 8), _created: Date.now() }
    this.cache[collection].push(entry)
    this._persist(collection)
    return entry
  }

  async get(collection, query = {}) {
    this._ensureCollection(collection)
    const entries = this.cache[collection]
    if (Object.keys(query).length === 0) return entries
    return entries.filter(e => {
      return Object.keys(query).every(k => {
        if (typeof query[k] === 'object' && query[k]?.$regex) {
          return new RegExp(query[k].$regex, query[k].$options || '').test(e[k])
        }
        return e[k] === query[k]
      })
    })
  }

  async getAll(collection) {
    this._ensureCollection(collection)
    return [...this.cache[collection]]
  }

  async update(collection, query, data) {
    this._ensureCollection(collection)
    let count = 0
    this.cache[collection] = this.cache[collection].map(e => {
      const match = Object.keys(query).every(k => e[k] === query[k])
      if (match) {
        count++
        return { ...e, ...data, _updated: Date.now() }
      }
      return e
    })
    if (count > 0) this._persist(collection)
    return count
  }

  async remove(collection, query) {
    this._ensureCollection(collection)
    const before = this.cache[collection].length
    this.cache[collection] = this.cache[collection].filter(e => {
      return !Object.keys(query).every(k => e[k] === query[k])
    })
    const count = before - this.cache[collection].length
    if (count > 0) this._persist(collection)
    return count
  }

  async close() {
    for (const collection of Object.keys(this.cache)) {
      this._persist(collection)
    }
    this.connected = false
  }
}

module.exports = { LocalDatabase }
