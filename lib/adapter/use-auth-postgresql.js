const PostgresAuth = {
  async create(options = {}) {
    const { Pool } = require('pg')
    const pool = new Pool({
      host: options.host || 'localhost',
      port: options.port || 5432,
      user: options.user || 'postgres',
      password: options.password || '',
      database: options.database || 'whatsapp_bot',
      ...options,
    })
    const client = await pool.connect()
    try {
      await client.query('CREATE TABLE IF NOT EXISTS auth ("key" VARCHAR(255) PRIMARY KEY, "value" JSONB)')
    } finally {
      client.release()
    }
    return {
      state: {
        creds: null,
        keys: {},
        async save() {
          const c = await pool.connect()
          try {
            if (this.creds) {
              await c.query('INSERT INTO auth ("key", "value") VALUES ($1, $2) ON CONFLICT ("key") DO UPDATE SET "value" = $2', ['creds', JSON.stringify(this.creds)])
            }
            if (Object.keys(this.keys).length > 0) {
              await c.query('INSERT INTO auth ("key", "value") VALUES ($1, $2) ON CONFLICT ("key") DO UPDATE SET "value" = $2', ['keys', JSON.stringify(this.keys)])
            }
          } finally {
            c.release()
          }
        },
        async load() {
          const c = await pool.connect()
          try {
            const credsResult = await c.query('SELECT "value" FROM auth WHERE "key" = $1', ['creds'])
            const keysResult = await c.query('SELECT "value" FROM auth WHERE "key" = $1', ['keys'])
            if (credsResult.rows.length > 0) this.creds = credsResult.rows[0].value
            if (keysResult.rows.length > 0) this.keys = keysResult.rows[0].value
          } finally {
            c.release()
          }
        },
      },
      saveCreds: async () => {},
    }
  },
}

module.exports = { PostgresAuth }
