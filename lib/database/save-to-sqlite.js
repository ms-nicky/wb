const path = require('node:path')

class SQLiteDatabase {
  constructor(options = {}) {
    this.dbPath = path.resolve(options.path || path.join(process.cwd(), 'database.sqlite'))
    this.connected = false
    this.db = null
    this._connect()
  }

  _connect() {
    try {
      const Database = require('better-sqlite3')
      this.db = new Database(this.dbPath)
      this.db.pragma('journal_mode = WAL')
      this.connected = true
    } catch (e) {
      console.error('[SQLiteDB] Connection error:', e.message)
      this.connected = false
    }
  }

  _ensureTable(collection) {
    if (!this.db) return
    this.db.exec(`CREATE TABLE IF NOT EXISTS ${collection} (id TEXT PRIMARY KEY, data TEXT, created TEXT, updated TEXT)`)
  }

  async save(collection, data) {
    this._ensureTable(collection)
    const id = data._id || Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
    const entry = { ...data, _id: id }
    const stmt = this.db.prepare(`INSERT OR REPLACE INTO ${collection} (id, data, created, updated) VALUES (?, ?, ?, ?)`)
    stmt.run(id, JSON.stringify(entry), new Date().toISOString(), new Date().toISOString())
    return entry
  }

  async get(collection, query = {}) {
    this._ensureTable(collection)
    const rows = this.db.prepare(`SELECT data FROM ${collection}`).all()
    const entries = rows.map(r => JSON.parse(r.data))
    if (Object.keys(query).length === 0) return entries
    return entries.filter(e => {
      return Object.keys(query).every(k => {
        if (typeof query[k] === 'object' && query[k]?.$regex) {
          return new RegExp(query[k].$regex, query[k].$options || '').test(String(e[k]))
        }
        return e[k] === query[k]
      })
    })
  }

  async getAll(collection) {
    this._ensureTable(collection)
    const rows = this.db.prepare(`SELECT data FROM ${collection}`).all()
    return rows.map(r => JSON.parse(r.data))
  }

  async update(collection, query, data) {
    this._ensureTable(collection)
    const rows = this.db.prepare(`SELECT id, data FROM ${collection}`).all()
    let count = 0
    const stmt = this.db.prepare(`UPDATE ${collection} SET data = ?, updated = ? WHERE id = ?`)
    for (const row of rows) {
      const entry = JSON.parse(row.data)
      const match = Object.keys(query).every(k => entry[k] === query[k])
      if (match) {
        const updated = { ...entry, ...data, _updated: Date.now() }
        stmt.run(JSON.stringify(updated), new Date().toISOString(), row.id)
        count++
      }
    }
    return count
  }

  async remove(collection, query) {
    this._ensureTable(collection)
    if (Object.keys(query).length === 0) {
      const count = this.db.prepare(`SELECT COUNT(*) as c FROM ${collection}`).get().c
      this.db.prepare(`DELETE FROM ${collection}`).run()
      return count
    }
    const rows = this.db.prepare(`SELECT id, data FROM ${collection}`).all()
    let count = 0
    const stmt = this.db.prepare(`DELETE FROM ${collection} WHERE id = ?`)
    for (const row of rows) {
      const entry = JSON.parse(row.data)
      const match = Object.keys(query).every(k => entry[k] === query[k])
      if (match) {
        stmt.run(row.id)
        count++
      }
    }
    return count
  }

  async close() {
    if (this.db) {
      this.db.close()
      this.db = null
    }
    this.connected = false
  }
}

module.exports = { SQLiteDatabase }
