class Queue {
  constructor(options = {}) {
    this.maxConcurrent = options.maxConcurrent || 5
    this.queue = []
    this.active = new Set()
    this.completed = []
    this.errors = []
    this._running = false
    this._handlers = new Map()
  }

  enqueue(task, priority = 0) {
    return new Promise((resolve, reject) => {
      const item = {
        task: typeof task === 'function' ? task : () => Promise.resolve(task),
        priority,
        resolve,
        reject,
        id: Date.now() + Math.random().toString(36).slice(2, 8),
        added: Date.now(),
      }
      this.queue.push(item)
      this.queue.sort((a, b) => b.priority - a.priority)
      if (!this._running) {
        this._running = true
        this._process()
      }
    })
  }

  async _process() {
    while (this.queue.length > 0 && this.active.size < this.maxConcurrent) {
      const item = this.queue.shift()
      this.active.add(item)
      this._runTask(item)
    }
    if (this.active.size === 0 && this.queue.length === 0) {
      this._running = false
    }
  }

  async _runTask(item) {
    try {
      const result = await item.task()
      this.completed.push({ id: item.id, result, completed: Date.now() })
      item.resolve(result)
    } catch (error) {
      this.errors.push({ id: item.id, error, time: Date.now() })
      item.reject(error)
    } finally {
      this.active.delete(item)
      this._process()
    }
  }

  get length() {
    return this.queue.length
  }

  get activeCount() {
    return this.active.size
  }

  get pending() {
    return this.queue.length
  }

  clear() {
    this.queue = []
    this.completed = []
    this.errors = []
  }

  on(event, handler) {
    if (!this._handlers.has(event)) {
      this._handlers.set(event, [])
    }
    this._handlers.get(event).push(handler)
  }

  _emit(event, data) {
    const handlers = this._handlers.get(event)
    if (handlers) {
      handlers.forEach(h => h(data))
    }
  }

  pause() {
    this._running = false
  }

  resume() {
    if (!this._running) {
      this._running = true
      this._process()
    }
  }
}

module.exports = Queue
module.exports.default = Queue
