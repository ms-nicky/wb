class MongoDatabase {
  constructor(options = {}) {
    this.uri = options.uri || options.url || 'mongodb://localhost:27017'
    this.dbName = options.dbName || options.database || 'whatsapp_bot'
    this.connected = false
    this.client = null
    this.db = null
    this._connect()
  }

  async _connect() {
    try {
      const { MongoClient } = require('mongodb')
      this.client = new MongoClient(this.uri)
      await this.client.connect()
      this.db = this.client.db(this.dbName)
      this.connected = true
    } catch (e) {
      console.error('[MongoDB] Connection error:', e.message)
      this.connected = false
    }
  }

  _collection(collection) {
    if (!this.db) throw new Error('MongoDB not connected')
    return this.db.collection(collection)
  }

  async save(collection, data) {
    const col = this._collection(collection)
    const id = data._id
    const entry = { ...data, _created: new Date() }
    if (id) {
      await col.replaceOne({ _id: id }, entry, { upsert: true })
    } else {
      const result = await col.insertOne(entry)
      entry._id = result.insertedId
    }
    return entry
  }

  async get(collection, query = {}) {
    const col = this._collection(collection)
    const mongoQuery = {}
    for (const [k, v] of Object.entries(query)) {
      if (typeof v === 'object' && v?.$regex) {
        mongoQuery[k] = { $regex: v.$regex, $options: v.$options || '' }
      } else {
        mongoQuery[k] = v
      }
    }
    return await col.find(mongoQuery).toArray()
  }

  async getAll(collection) {
    const col = this._collection(collection)
    return await col.find({}).toArray()
  }

  async update(collection, query, data) {
    const col = this._collection(collection)
    const result = await col.updateMany(query, { $set: { ...data, _updated: new Date() } })
    return result.modifiedCount
  }

  async remove(collection, query) {
    const col = this._collection(collection)
    if (Object.keys(query).length === 0) {
      const result = await col.deleteMany({})
      return result.deletedCount
    }
    const result = await col.deleteMany(query)
    return result.deletedCount
  }

  async close() {
    if (this.client) {
      await this.client.close()
      this.client = null
    }
    this.connected = false
  }
}

module.exports = { MongoDatabase }
