let data = { users: [], groups: [], chats: [], setting: {}, top: [], res: [], expired: {}, premium: {} }

async function saveToRedis(options) {
  const config = typeof options === 'string' ? { url: options } : (options || {})
  const Redis = require('redis')
  const client = Redis.createClient({
    url: config.url || `redis://${config.host || 'localhost'}:${config.port || 6379}`,
    password: config.password || undefined,
    database: config.db || 0,
    ...config,
  })
  await client.connect()
  const key = 'wb:database'

  const raw = await client.get(key)
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      for (const [k, v] of Object.entries(parsed)) {
        if (k in data) data[k] = v
      }
    } catch (e) {}
  }

  data.__persist = async () => {
    const persistData = {}
    for (const [keyName, val] of Object.entries(data)) {
      if (keyName === '__persist') continue
      persistData[keyName] = val
    }
    await client.set(key, JSON.stringify(persistData))
  }

  return data
}

module.exports = { saveToRedis }
