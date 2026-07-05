class MySQLDatabase {
  constructor(options = {}) {
    this.config = options
    this.connected = false
    this.pool = null
    this._connect()
  }

  _connect() {
    try {
      const mysql = require('mysql2')
      this.pool = mysql.createPool({
        host: this.config.host || 'localhost',
        port: this.config.port || 3306,
        user: this.config.user || this.config.username || 'root',
        password: this.config.password || '',
        database: this.config.database || 'whatsapp_bot',
        waitForConnections: true,
        connectionLimit: this.config.connectionLimit || 10,
        ...this.config,
      })
      this.pool.getConnection((err) => {
        if (err) {
          console.error('[MySQLDB] Connection error:', err.message)
          this.connected = false
        } else {
          this.connected = true
        }
      })
    } catch (e) {
      console.error('[MySQLDB] Init error:', e.message)
      this.connected = false
    }
  }

  async _query(sql, params = []) {
    if (!this.pool) throw new Error('MySQL not connected')
    return new Promise((resolve, reject) => {
      this.pool.execute(sql, params, (err, results) => {
        if (err) reject(err)
        else resolve(results)
      })
    })
  }

  async _ensureTable(collection) {
    await this._query(
      `CREATE TABLE IF NOT EXISTS \`${collection}\` (id VARCHAR(100) PRIMARY KEY, data JSON, created DATETIME DEFAULT CURRENT_TIMESTAMP, updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`
    )
  }

  async save(collection, data) {
    await this._ensureTable(collection)
    const id = data._id || Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
    const entry = { ...data, _id: id }
    await this._query(
      `INSERT INTO \`${collection}\` (id, data) VALUES (?, ?) ON DUPLICATE KEY UPDATE data = ?`,
      [id, JSON.stringify(entry), JSON.stringify(entry)]
    )
    return entry
  }

  async get(collection, query = {}) {
    await this._ensureTable(collection)
    const rows = await this._query(`SELECT data FROM \`${collection}\``)
    const entries = rows.map(r => typeof r.data === 'string' ? JSON.parse(r.data) : r.data)
    if (Object.keys(query).length === 0) return entries
    return entries.filter(e => Object.keys(query).every(k => e[k] === query[k]))
  }

  async getAll(collection) {
    return this.get(collection)
  }

  async update(collection, query, data) {
    await this._ensureTable(collection)
    const rows = await this._query(`SELECT id, data FROM \`${collection}\``)
    let count = 0
    for (const row of rows) {
      const entry = typeof row.data === 'string' ? JSON.parse(row.data) : row.data
      const match = Object.keys(query).every(k => entry[k] === query[k])
      if (match) {
        const updated = { ...entry, ...data, _updated: Date.now() }
        await this._query(`UPDATE \`${collection}\` SET data = ? WHERE id = ?`, [JSON.stringify(updated), row.id])
        count++
      }
    }
    return count
  }

  async remove(collection, query) {
    await this._ensureTable(collection)
    if (Object.keys(query).length === 0) {
      const result = await this._query(`DELETE FROM \`${collection}\``)
      return result.affectedRows || 0
    }
    const rows = await this._query(`SELECT id, data FROM \`${collection}\``)
    let count = 0
    for (const row of rows) {
      const entry = typeof row.data === 'string' ? JSON.parse(row.data) : row.data
      const match = Object.keys(query).every(k => entry[k] === query[k])
      if (match) {
        await this._query(`DELETE FROM \`${collection}\` WHERE id = ?`, [row.id])
        count++
      }
    }
    return count
  }

  async close() {
    if (this.pool) {
      await new Promise((resolve) => this.pool.end(resolve))
      this.pool = null
    }
    this.connected = false
  }
}

module.exports = { MySQLDatabase }
