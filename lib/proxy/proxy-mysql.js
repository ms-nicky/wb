class MySQLProxy {
  constructor(options = {}) {
    this.table = options.table || 'proxy'
    this.config = {
      host: options.host || 'localhost',
      port: options.port || 3306,
      user: options.user || 'root',
      password: options.password || '',
      database: options.database || 'whatsapp_bot',
      ...options,
    }
    this.pool = null
    this._connect()
  }

  _connect() {
    const mysql = require('mysql2')
    this.pool = mysql.createPool(this.config).promise()
    this._ensure()
  }

  async _ensure() {
    await this.pool.execute(
      `CREATE TABLE IF NOT EXISTS \`${this.table}\` (\`key\` VARCHAR(255) PRIMARY KEY, \`value\` JSON)`
    )
  }

  async get(key) {
    const [rows] = await this.pool.execute(`SELECT value FROM \`${this.table}\` WHERE \`key\` = ?`, [key])
    if (rows.length === 0) return undefined
    return rows[0].value
  }

  async set(key, value) {
    await this.pool.execute(
      `INSERT INTO \`${this.table}\` (\`key\`, \`value\`) VALUES (?, ?) ON DUPLICATE KEY UPDATE \`value\` = ?`,
      [key, JSON.stringify(value), JSON.stringify(value)]
    )
  }

  async has(key) {
    const [rows] = await this.pool.execute(`SELECT 1 FROM \`${this.table}\` WHERE \`key\` = ?`, [key])
    return rows.length > 0
  }

  async delete(key) {
    await this.pool.execute(`DELETE FROM \`${this.table}\` WHERE \`key\` = ?`, [key])
  }

  async getAll() {
    const [rows] = await this.pool.execute(`SELECT \`key\`, \`value\` FROM \`${this.table}\``)
    const result = {}
    for (const row of rows) result[row.key] = row.value
    return result
  }

  async clear() {
    await this.pool.execute(`DELETE FROM \`${this.table}\``)
  }

  async keys() {
    const [rows] = await this.pool.execute(`SELECT \`key\` FROM \`${this.table}\``)
    return rows.map(r => r.key)
  }
}

module.exports = MySQLProxy
