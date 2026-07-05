const Listener = {
  handlers: new Map(),

  add(name, handler) {
    this.handlers.set(name, handler)
  },

  get(name) {
    return this.handlers.get(name)
  },

  has(name) {
    return this.handlers.has(name)
  },

  remove(name) {
    return this.handlers.delete(name)
  },

  clear() {
    this.handlers.clear()
  },

  getAll() {
    return Array.from(this.handlers.entries())
  },

  register(client) {
    for (const [name, handler] of this.handlers) {
      client.register(name, handler)
    }
  },
}

module.exports = Listener
