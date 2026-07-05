const NodeCache = require('@cacheable/node-cache')

class Spam {
  constructor() {
    this.cache = new NodeCache({
      stdTTL: 10,
      checkperiod: 5,
      useClones: false,
    })
    this.maxMessages = 5
    this.windowMs = 10000
  }

  setMaxMessages(max) {
    this.maxMessages = max
  }

  setWindow(ms) {
    this.windowMs = ms
    this.cache = new NodeCache({
      stdTTL: Math.ceil(ms / 1000),
      checkperiod: Math.ceil(ms / 2000),
      useClones: false,
    })
  }

  isSpam(jid) {
    const count = this.cache.get(jid) || 0
    return count >= this.maxMessages
  }

  add(jid) {
    const count = this.cache.get(jid) || 0
    this.cache.set(jid, count + 1)
    return count + 1
  }

  getCount(jid) {
    return this.cache.get(jid) || 0
  }

  reset(jid) {
    this.cache.del(jid)
  }

  clear() {
    this.cache.flushAll()
  }
}

const spam = new Spam()

module.exports = Spam
module.exports.default = Spam
module.exports.spam = spam
