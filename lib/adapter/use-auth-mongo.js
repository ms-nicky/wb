const MongoAuth = {
  async create(options = {}) {
    const { MongoClient } = require('mongodb')
    const uri = options.uri || options.url || 'mongodb://localhost:27017'
    const dbName = options.dbName || options.database || 'whatsapp_bot'
    const client = new MongoClient(uri)
    await client.connect()
    const db = client.db(dbName)
    const col = db.collection('auth')
    await col.createIndex({ key: 1 }, { unique: true })
    return {
      state: {
        creds: null,
        keys: {},
        async save() {
          if (this.creds) {
            await col.replaceOne(
              { key: 'creds' },
              { key: 'creds', value: this.creds, _updated: new Date() },
              { upsert: true }
            )
          }
          if (Object.keys(this.keys).length > 0) {
            await col.replaceOne(
              { key: 'keys' },
              { key: 'keys', value: this.keys, _updated: new Date() },
              { upsert: true }
            )
          }
        },
        async load() {
          const credsDoc = await col.findOne({ key: 'creds' })
          const keysDoc = await col.findOne({ key: 'keys' })
          if (credsDoc) this.creds = credsDoc.value
          if (keysDoc) this.keys = keysDoc.value
        },
      },
      saveCreds: async () => {},
    }
  },
}

module.exports = { MongoAuth }
