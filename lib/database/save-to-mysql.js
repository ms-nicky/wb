let data = { users: [], groups: [], chats: [], setting: {}, top: [], res: [], expired: {}, premium: {} }

async function saveToMySQL(options) {
  const config = typeof options === 'string' ? { url: options } : (options || {})
  const mysql = require('mysql2/promise')
  const conn = await mysql.createConnection({
    host: config.host || 'localhost',
    port: config.port || 3306,
    user: config.user || config.username || 'root',
    password: config.password || '',
    database: config.database || 'whatsapp_bot',
    ...config,
  })

  await conn.execute(
    'CREATE TABLE IF NOT EXISTS database_data (`key` VARCHAR(255) PRIMARY KEY, `value` JSON)'
  )

  const [rows] = await conn.execute('SELECT `key`, `value` FROM database_data')
  for (const row of rows) {
    const val = typeof row.value === 'string' ? JSON.parse(row.value) : row.value
    if (row.key in data) {
      if (Array.isArray(val)) data[row.key] = val
      else if (typeof val === 'object' && val !== null) data[row.key] = val
    }
  }

  data.__persist = async () => {
    for (const [key, val] of Object.entries(data)) {
      if (key === '__persist') continue
      await conn.execute(
        'INSERT INTO database_data (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?',
        [key, JSON.stringify(val), JSON.stringify(val)]
      )
    }
  }

  return data
}

module.exports = { saveToMySQL }
