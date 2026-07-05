class MongoProxy {
  constructor(options = {}) {
    this.collection = options.collection || 'proxy'
    this.uri = options.uri || options.url || 'mongodb://localhost:27017'
    this.dbName = options.dbName || options.database || 'whatsapp_bot'
    this.client = null
    this.db = null
    this.col = null
    this._connect()
  }

  async _connect() {
    const { MongoClient } = require('mongodb')
    this.client = new MongoClient(this.uri)
    await this.client.connect()
    this.db = this.client.db(this.dbName)
    this.col = this.db.collection(this.collection)
  }

  async get(key) {
    const doc = await this.col.findOne({ _id: key })
    return doc ? doc.value : undefined
  }

  async set(key, value) {
    await this.col.replaceOne(
      { _id: key },
      { _id: key, value, _updated: new Date() },
      { upsert: true }
    )
  }

  async has(key) {
    const doc = await this.col.findOne({ _id: key }, { projection: { _id: 1 } })
    return !!doc
  }

  async delete(key) {
    await this.col.deleteOne({ _id: key })
  }

  async getAll() {
    const docs = await this.col.find({}).toArray()
    const result = {}
    for (const doc of docs) result[doc._id] = doc.value
    return result
  }

  async clear() {
    await this.col.deleteMany({})
  }

  async keys() {
    const docs = await this.col.find({}, { projection: { _id: 1 } }).toArray()
    return docs.map(d => d._id)
  }
}

module.exports = MongoProxy
