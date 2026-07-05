class RedisDatabase {
  constructor(options = {}) {
    this.config = {
      host: options.host || 'localhost',
      port: options.port || 6379,
      password: options.password || undefined,
      db: options.db || 0,
      ...options,
    }
    this.connected = false
    this.client = null
    this.prefix = options.prefix || 'wb:'
    this._connect()
  }

  async _connect() {
    try {
      const Redis = require('redis')
      this.client = Redis.createClient(this.config)
      await this.client.connect()
      this.connected = true
    } catch (e) {
      console.error('[RedisDB] Connection error:', e.message)
      this.connected = false
    }
  }

  _key(collection, id) {
    return `${this.prefix}${collection}:${id}`
  }

  _collectionKey(collection) {
    return `${this.prefix}${collection}:ids`
  }

  async save(collection, data) {
    if (!this.client) throw new Error('Redis not connected')
    const id = data._id || Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
    const entry = { ...data, _id: id }
    await this.client.set(this._key(collection, id), JSON.stringify(entry))
    await this.client.sAdd(this._collectionKey(collection), id)
    return entry
  }

  async get(collection, query = {}) {
    if (!this.client) throw new Error('Redis not connected')
    const ids = await this.client.sMembers(this._collectionKey(collection))
    const entries = []
    for (const id of ids) {
      const data = await this.client.get(this._key(collection, id))
      if (data) entries.push(JSON.parse(data))
    }
    if (Object.keys(query).length === 0) return entries
    return entries.filter(e => Object.keys(query).every(k => e[k] === query[k]))
  }

  async getAll(collection) {
    return this.get(collection)
  }

  async update(collection, query, data) {
    if (!this.client) throw new Error('Redis not connected')
    const entries = await this.get(collection)
    let count = 0
    for (const entry of entries) {
      const match = Object.keys(query).every(k => entry[k] === query[k])
      if (match) {
        const updated = { ...entry, ...data, _updated: Date.now() }
        await this.client.set(this._key(collection, entry._id), JSON.stringify(updated))
        count++
      }
    }
    return count
  }

  async remove(collection, query) {
    if (!this.client) throw new Error('Redis not connected')
    if (Object.keys(query).length === 0) {
      const ids = await this.client.sMembers(this._collectionKey(collection))
      for (const id of ids) {
        await this.client.del(this._key(collection, id))
      }
      await this.client.del(this._collectionKey(collection))
      return ids.length
    }
    const entries = await this.get(collection)
    let count = 0
    for (const entry of entries) {
      const match = Object.keys(query).every(k => entry[k] === query[k])
      if (match) {
        await this.client.del(this._key(collection, entry._id))
        await this.client.sRem(this._collectionKey(collection), entry._id)
        count++
      }
    }
    return count
  }

  async close() {
    if (this.client) {
      await this.client.quit()
      this.client = null
    }
    this.connected = false
  }
}

module.exports = { RedisDatabase }
