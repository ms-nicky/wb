class TemporaryStore {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 1000
    this.ttl = options.ttl || 300000
    this._data = new Map()
    this._timestamps = new Map()
    this._cleanupInterval = setInterval(() => this._cleanup(), 60000)
  }

  _cleanup() {
    const now = Date.now()
    for (const [key, timestamp] of this._timestamps) {
      if (now - timestamp > this.ttl) {
        this._data.delete(key)
        this._timestamps.delete(key)
      }
    }
  }

  set(key, value, ttl) {
    if (this._data.size >= this.maxSize) {
      const oldestKey = this._timestamps.keys().next().value
      if (oldestKey) {
        this._data.delete(oldestKey)
        this._timestamps.delete(oldestKey)
      }
    }
    this._data.set(key, value)
    this._timestamps.set(key, Date.now())
    if (ttl) {
      setTimeout(() => {
        this._data.delete(key)
        this._timestamps.delete(key)
      }, ttl)
    }
  }

  get(key) {
    const ts = this._timestamps.get(key)
    if (ts && Date.now() - ts > this.ttl) {
      this._data.delete(key)
      this._timestamps.delete(key)
      return undefined
    }
    return this._data.get(key)
  }

  has(key) {
    if (!this._data.has(key)) return false
    const ts = this._timestamps.get(key)
    if (ts && Date.now() - ts > this.ttl) {
      this._data.delete(key)
      this._timestamps.delete(key)
      return false
    }
    return true
  }

  delete(key) {
    this._data.delete(key)
    this._timestamps.delete(key)
  }

  clear() {
    this._data.clear()
    this._timestamps.clear()
  }

  keys() {
    this._cleanup()
    return Array.from(this._data.keys())
  }

  get size() {
    this._cleanup()
    return this._data.size
  }

  getAll() {
    this._cleanup()
    const result = {}
    for (const [key, value] of this._data) {
      result[key] = value
    }
    return result
  }

  close() {
    clearInterval(this._cleanupInterval)
    this.clear()
  }
}

module.exports = TemporaryStore
