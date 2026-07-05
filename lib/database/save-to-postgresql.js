let data = { users: [], groups: [], chats: [], setting: {}, top: [], res: [], expired: {}, premium: {} }

async function saveToPostgres(options) {
  const config = typeof options === 'string' ? { connectionString: options } : (options || {})
  const { Pool } = require('pg')
  const pool = new Pool({
    host: config.host || 'localhost',
    port: config.port || 5432,
    user: config.user || config.username || 'postgres',
    password: config.password || '',
    database: config.database || 'whatsapp_bot',
    ...config,
  })

  const client = await pool.connect()
  try {
    await client.query(
      'CREATE TABLE IF NOT EXISTS database_data ("key" VARCHAR(255) PRIMARY KEY, "value" JSONB)'
    )
    const result = await client.query('SELECT "key", "value" FROM database_data')
    for (const row of result.rows) {
      if (row.key in data) {
        if (Array.isArray(row.value)) data[row.key] = row.value
        else if (typeof row.value === 'object' && row.value !== null) data[row.key] = row.value
      }
    }
  } finally {
    client.release()
  }

  data.__persist = async () => {
    const c = await pool.connect()
    try {
      for (const [key, val] of Object.entries(data)) {
        if (key === '__persist') continue
        await c.query(
          'INSERT INTO database_data ("key", "value") VALUES ($1, $2) ON CONFLICT ("key") DO UPDATE SET "value" = $2',
          [key, JSON.stringify(val)]
        )
      }
    } finally {
      c.release()
    }
  }

  return data
}

module.exports = { saveToPostgres }
