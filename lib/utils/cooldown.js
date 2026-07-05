const { NodeCache } = require('@cacheable/node-cache')

class Cooldown {
  constructor(ttlSeconds = 5) {
    this.cache = new NodeCache({
      stdTTL: ttlSeconds,
      checkperiod: ttlSeconds,
      useClones: false,
    })
  }

  add(key, ttl) {
    if (ttl) {
      this.cache.set(key, true, ttl)
    } else {
      this.cache.set(key, true)
    }
    return true
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

  getTTL(key) {
    return this.cache.getTtl(key)
  }

  get(key) {
    return this.cache.get(key)
  }
}

const cooldown = new Cooldown()

module.exports = Cooldown
module.exports.default = Cooldown
module.exports.cooldown = cooldown
