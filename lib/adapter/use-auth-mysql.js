const MySQLAuth = {
  async create(options = {}) {
    const mysql = require('mysql2/promise')
    const conn = await mysql.createConnection({
      host: options.host || 'localhost',
      port: options.port || 3306,
      user: options.user || 'root',
      password: options.password || '',
      database: options.database || 'whatsapp_bot',
      ...options,
    })
    await conn.execute('CREATE TABLE IF NOT EXISTS auth (`key` VARCHAR(255) PRIMARY KEY, `value` JSON)')
    return {
      state: {
        creds: null,
        keys: {},
        async save() {
          if (this.creds) {
            await conn.execute('INSERT INTO auth (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?', ['creds', JSON.stringify(this.creds), JSON.stringify(this.creds)])
          }
          if (Object.keys(this.keys).length > 0) {
            await conn.execute('INSERT INTO auth (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?', ['keys', JSON.stringify(this.keys), JSON.stringify(this.keys)])
          }
        },
        async load() {
          const [credsRows] = await conn.execute('SELECT `value` FROM auth WHERE `key` = ?', ['creds'])
          const [keysRows] = await conn.execute('SELECT `value` FROM auth WHERE `key` = ?', ['keys'])
          if (credsRows.length > 0) this.creds = credsRows[0].value
          if (keysRows.length > 0) this.keys = keysRows[0].value
        },
      },
      saveCreds: async () => {},
    }
  },
}

module.exports = { MySQLAuth }
