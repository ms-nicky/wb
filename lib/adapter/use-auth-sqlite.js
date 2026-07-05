const path = require('node:path')

const SQLiteAuth = {
  async create(options = {}) {
    const dbPath = path.resolve(options.path || options.file || 'auth.db')
    const Database = require('better-sqlite3')
    const db = new Database(dbPath)
    db.exec('CREATE TABLE IF NOT EXISTS auth (key TEXT PRIMARY KEY, value TEXT)')
    return {
      state: {
        creds: null,
        keys: {},
        async save() {
          if (this.creds) {
            db.prepare('INSERT OR REPLACE INTO auth (key, value) VALUES (?, ?)').run('creds', JSON.stringify(this.creds))
          }
          if (Object.keys(this.keys).length > 0) {
            db.prepare('INSERT OR REPLACE INTO auth (key, value) VALUES (?, ?)').run('keys', JSON.stringify(this.keys))
          }
        },
        async load() {
          const credsRow = db.prepare('SELECT value FROM auth WHERE key = ?').get('creds')
          const keysRow = db.prepare('SELECT value FROM auth WHERE key = ?').get('keys')
          if (credsRow) this.creds = JSON.parse(credsRow.value)
          if (keysRow) this.keys = JSON.parse(keysRow.value)
        },
      },
      saveCreds: async () => {},
    }
  },
}

module.exports = { SQLiteAuth }
