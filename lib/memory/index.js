const { NodeCache } = require('@cacheable/node-cache')

class Memory {
  constructor() {
    this.cache = new NodeCache({
      stdTTL: 300,
      checkperiod: 60,
      useClones: false,
    })
  }

  set(key, value, ttl) {
    if (ttl) return this.cache.set(key, value, ttl)
    return this.cache.set(key, value)
  }

  get(key) {
    return this.cache.get(key)
  }

  has(key) {
    return this.cache.has(key)
  }

  delete(key) {
    return this.cache.del(key) > 0
  }

  clear() {
    this.cache.flushAll()
  }

  get keys() {
    return this.cache.keys()
  }

  get stats() {
    return this.cache.getStats()
  }

  getTtl(key) {
    return this.cache.getTtl(key)
  }

  mget(keys) {
    return this.cache.mget(keys)
  }

  mset(keyValuePairs, ttl) {
    return this.cache.mset(keyValuePairs.map(([k, v]) => ({ key: k, val: v, ttl })))
  }
}

const GlobalMemory = new Memory()

module.exports = { Memory, GlobalMemory }
