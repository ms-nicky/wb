class PostgresProxy {
  constructor(options = {}) {
    this.table = options.table || 'proxy'
    this.config = {
      host: options.host || 'localhost',
      port: options.port || 5432,
      user: options.user || 'postgres',
      password: options.password || '',
      database: options.database || 'whatsapp_bot',
      ...options,
    }
    this.pool = null
    this._connect()
  }

  _connect() {
    const { Pool } = require('pg')
    this.pool = new Pool(this.config)
    this._ensure()
  }

  async _query(sql, params = []) {
    const client = await this.pool.connect()
    try {
      return await client.query(sql, params)
    } finally {
      client.release()
    }
  }

  async _ensure() {
    await this._query(
      `CREATE TABLE IF NOT EXISTS "${this.table}" ("key" VARCHAR(255) PRIMARY KEY, "value" JSONB)`
    )
  }

  async get(key) {
    const result = await this._query(`SELECT value FROM "${this.table}" WHERE "key" = $1`, [key])
    if (result.rows.length === 0) return undefined
    return result.rows[0].value
  }

  async set(key, value) {
    await this._query(
      `INSERT INTO "${this.table}" ("key", "value") VALUES ($1, $2) ON CONFLICT ("key") DO UPDATE SET "value" = $2`,
      [key, JSON.stringify(value)]
    )
  }

  async has(key) {
    const result = await this._query(`SELECT 1 FROM "${this.table}" WHERE "key" = $1`, [key])
    return result.rows.length > 0
  }

  async delete(key) {
    await this._query(`DELETE FROM "${this.table}" WHERE "key" = $1`, [key])
  }

  async getAll() {
    const result = await this._query(`SELECT "key", "value" FROM "${this.table}"`)
    const entries = {}
    for (const row of result.rows) entries[row.key] = row.value
    return entries
  }

  async clear() {
    await this._query(`DELETE FROM "${this.table}"`)
  }

  async keys() {
    const result = await this._query(`SELECT "key" FROM "${this.table}"`)
    return result.rows.map(r => r.key)
  }
}

module.exports = PostgresProxy
