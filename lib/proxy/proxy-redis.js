class RedisProxy {
  constructor(options = {}) {
    this.prefix = options.prefix || 'proxy:'
    this.config = {
      host: options.host || 'localhost',
      port: options.port || 6379,
      password: options.password || undefined,
      db: options.db || 0,
      ...options,
    }
    this.client = null
    this._connect()
  }

  async _connect() {
    const Redis = require('redis')
    this.client = Redis.createClient(this.config)
    await this.client.connect()
  }

  async get(key) {
    const value = await this.client.get(this.prefix + key)
    if (value === null) return undefined
    try { return JSON.parse(value) } catch (e) { return value }
  }

  async set(key, value) {
    const str = typeof value === 'string' ? value : JSON.stringify(value)
    await this.client.set(this.prefix + key, str)
  }

  async has(key) {
    const exists = await this.client.exists(this.prefix + key)
    return exists === 1
  }

  async delete(key) {
    await this.client.del(this.prefix + key)
  }

  async getAll() {
    const keys = await this.client.keys(this.prefix + '*')
    const result = {}
    for (const fullKey of keys) {
      const key = fullKey.replace(this.prefix, '')
      const value = await this.client.get(fullKey)
      try { result[key] = JSON.parse(value) } catch (e) { result[key] = value }
    }
    return result
  }

  async clear() {
    const keys = await this.client.keys(this.prefix + '*')
    if (keys.length > 0) await this.client.del(keys)
  }

  async keys() {
    const keys = await this.client.keys(this.prefix + '*')
    return keys.map(k => k.replace(this.prefix, ''))
  }
}

module.exports = RedisProxy
