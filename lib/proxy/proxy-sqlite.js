const path = require('node:path')

class SQLiteProxy {
  constructor(options = {}) {
    this.dbPath = path.resolve(options.path || options.file || 'proxy.db')
    this.db = null
    this._connect()
  }

  _connect() {
    const Database = require('better-sqlite3')
    this.db = new Database(this.dbPath)
    this.db.exec('CREATE TABLE IF NOT EXISTS proxy (key TEXT PRIMARY KEY, value TEXT)')
  }

  get(key) {
    const row = this.db.prepare('SELECT value FROM proxy WHERE key = ?').get(key)
    if (!row) return undefined
    try { return JSON.parse(row.value) } catch (e) { return row.value }
  }

  set(key, value) {
    const str = typeof value === 'string' ? value : JSON.stringify(value)
    this.db.prepare('INSERT OR REPLACE INTO proxy (key, value) VALUES (?, ?)').run(key, str)
  }

  has(key) {
    const row = this.db.prepare('SELECT 1 FROM proxy WHERE key = ?').get(key)
    return !!row
  }

  delete(key) {
    this.db.prepare('DELETE FROM proxy WHERE key = ?').run(key)
  }

  getAll() {
    const rows = this.db.prepare('SELECT key, value FROM proxy').all()
    const result = {}
    for (const row of rows) {
      try { result[row.key] = JSON.parse(row.value) } catch (e) { result[row.key] = row.value }
    }
    return result
  }

  clear() {
    this.db.exec('DELETE FROM proxy')
  }

  keys() {
    return this.db.prepare('SELECT key FROM proxy').all().map(r => r.key)
  }
}

module.exports = SQLiteProxy
