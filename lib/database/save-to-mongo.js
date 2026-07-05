let data = { users: [], groups: [], chats: [], setting: {}, top: [], res: [], expired: {}, premium: {} }

async function saveToMongo(options) {
  const config = typeof options === 'string' ? { uri: options } : (options || {})
  const { MongoClient } = require('mongodb')
  const uri = config.uri || config.url || 'mongodb://localhost:27017'
  const dbName = config.dbName || config.database || 'whatsapp_bot'
  const client = new MongoClient(uri)
  await client.connect()
  const db = client.db(dbName)
  const col = db.collection('database_data')

  const doc = await col.findOne({ _id: 'main' })
  if (doc && doc.data) {
    for (const [key, val] of Object.entries(doc.data)) {
      if (key in data) data[key] = val
    }
  }

  data.__persist = async () => {
    const persistData = {}
    for (const [key, val] of Object.entries(data)) {
      if (key === '__persist') continue
      persistData[key] = val
    }
    await col.replaceOne(
      { _id: 'main' },
      { _id: 'main', data: persistData, _updated: new Date() },
      { upsert: true }
    )
  }

  return data
}

module.exports = { saveToMongo }
