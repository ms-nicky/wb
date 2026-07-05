const RedisAuth = {
  async create(options = {}) {
    const Redis = require('redis')
    const client = Redis.createClient({
      url: options.url || options.uri || 'redis://localhost:6379',
      ...options,
    })
    await client.connect()
    const prefix = options.prefix || 'auth:'
    return {
      state: {
        creds: null,
        keys: {},
        async save() {
          if (this.creds) {
            await client.set(prefix + 'creds', JSON.stringify(this.creds))
          }
          if (Object.keys(this.keys).length > 0) {
            await client.set(prefix + 'keys', JSON.stringify(this.keys))
          }
        },
        async load() {
          const creds = await client.get(prefix + 'creds')
          const keys = await client.get(prefix + 'keys')
          if (creds) this.creds = JSON.parse(creds)
          if (keys) this.keys = JSON.parse(keys)
        },
      },
      saveCreds: async () => {
        const creds = await client.get(prefix + 'creds')
        if (!creds) return
      },
    }
  },
}

module.exports = { RedisAuth }
