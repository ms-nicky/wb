class PostgresDatabase {
  constructor(options = {}) {
    this.config = {
      host: options.host || 'localhost',
      port: options.port || 5432,
      user: options.user || options.username || 'postgres',
      password: options.password || '',
      database: options.database || 'whatsapp_bot',
      ...options,
    }
    this.connected = false
    this.pool = null
    this._connect()
  }

  _connect() {
    try {
      const { Pool } = require('pg')
      this.pool = new Pool(this.config)
      this.pool.on('error', (err) => {
        console.error('[PostgresDB] Pool error:', err.message)
        this.connected = false
      })
      this.connected = true
    } catch (e) {
      console.error('[PostgresDB] Connection error:', e.message)
      this.connected = false
    }
  }

  async _query(sql, params = []) {
    if (!this.pool) throw new Error('PostgreSQL not connected')
    const client = await this.pool.connect()
    try {
      const result = await client.query(sql, params)
      return result.rows
    } finally {
      client.release()
    }
  }

  async _ensureTable(collection) {
    const safeName = collection.replace(/[^a-zA-Z0-9_]/g, '_')
    await this._query(
      `CREATE TABLE IF NOT EXISTS "${safeName}" (id VARCHAR(100) PRIMARY KEY, data JSONB, created TIMESTAMP DEFAULT NOW(), updated TIMESTAMP DEFAULT NOW())`
    )
    return safeName
  }

  async save(collection, data) {
    const safeName = await this._ensureTable(collection)
    const id = data._id || Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
    const entry = { ...data, _id: id }
    await this._query(
      `INSERT INTO "${safeName}" (id, data) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET data = $2, updated = NOW()`,
      [id, JSON.stringify(entry)]
    )
    return entry
  }

  async get(collection, query = {}) {
    const safeName = await this._ensureTable(collection)
    const rows = await this._query(`SELECT data FROM "${safeName}"`)
    const entries = rows.map(r => r.data)
    if (Object.keys(query).length === 0) return entries
    return entries.filter(e => Object.keys(query).every(k => e[k] === query[k]))
  }

  async getAll(collection) {
    return this.get(collection)
  }

  async update(collection, query, data) {
    const safeName = await this._ensureTable(collection)
    const rows = await this._query(`SELECT id, data FROM "${safeName}"`)
    let count = 0
    for (const row of rows) {
      const entry = row.data
      const match = Object.keys(query).every(k => entry[k] === query[k])
      if (match) {
        const updated = { ...entry, ...data, _updated: Date.now() }
        await this._query(`UPDATE "${safeName}" SET data = $1, updated = NOW() WHERE id = $2`, [JSON.stringify(updated), row.id])
        count++
      }
    }
    return count
  }

  async remove(collection, query) {
    const safeName = await this._ensureTable(collection)
    if (Object.keys(query).length === 0) {
      const result = await this._query(`DELETE FROM "${safeName}" RETURNING id`)
      return result.length
    }
    const rows = await this._query(`SELECT id, data FROM "${safeName}"`)
    let count = 0
    for (const row of rows) {
      const entry = row.data
      const match = Object.keys(query).every(k => entry[k] === query[k])
      if (match) {
        await this._query(`DELETE FROM "${safeName}" WHERE id = $1`, [row.id])
        count++
      }
    }
    return count
  }

  async close() {
    if (this.pool) {
      await this.pool.end()
      this.pool = null
    }
    this.connected = false
  }
}

module.exports = { PostgresDatabase }
