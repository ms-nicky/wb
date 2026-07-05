const path = require('node:path')

let data = { users: [], groups: [], chats: [], setting: {}, top: [], res: [], expired: {}, premium: {} }

async function saveToSQLite(options) {
  const dbPath = path.resolve(typeof options === 'string' ? options : (options?.path || 'database.sqlite'))
  const Database = require('better-sqlite3')
  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.exec('CREATE TABLE IF NOT EXISTS database_data (id INTEGER PRIMARY KEY, key TEXT UNIQUE, value TEXT)')

  function loadAll() {
    const rows = db.prepare('SELECT key, value FROM database_data').all()
    for (const row of rows) {
      try {
        const val = JSON.parse(row.value)
        if (Array.isArray(val)) {
          const key = row.key
          if (key in data) data[key] = val
        } else if (typeof val === 'object' && val !== null) {
          const key = row.key
          if (key in data) data[key] = val
        }
      } catch (e) {}
    }
  }

  loadAll()

  data.__persist = () => {
    const stmt = db.prepare('INSERT OR REPLACE INTO database_data (key, value) VALUES (?, ?)')
    for (const [key, val] of Object.entries(data)) {
      if (key === '__persist') continue
      stmt.run(key, JSON.stringify(val))
    }
  }

  return data
}

module.exports = { saveToSQLite }
