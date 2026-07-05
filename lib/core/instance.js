const { EventEmitter } = require('node:events')
const Client = require('./connection.js')

class Instance extends EventEmitter {
  constructor(name, options = {}, baileysOptions = {}) {
    super()
    this.name = name
    this.options = options
    this.baileysOptions = baileysOptions
    this.client = null
    this.sock = null
    this._running = false
    this._startTime = null
  }

  async start() {
    if (this._running) {
      throw new Error(`Instance "${this.name}" is already running`)
    }
    this._running = true
    this._startTime = Date.now()

    const instanceOptions = {
      ...this.options,
      plugsdir: this.options.plugsdir || undefined,
      custom_id: this.options.custom_id || this.name,
    }

    this.client = new Client(instanceOptions, this.baileysOptions)

    this.client.on('ready', (data) => {
      this.sock = this.client.sock
      this.emit('ready', { instance: this.name, ...data })
    })

    this.client.on('connect', (data) => {
      this.emit('connect', { instance: this.name, ...data })
    })

    this.client.on('error', (error) => {
      this.emit('error', { instance: this.name, error })
    })

    this.client.on('disconnect', (data) => {
      this.emit('disconnect', { instance: this.name, ...data })
    })

    this.client.on('message', (ctx) => {
      this.emit('message', ctx)
    })

    return this.client
  }

  async stop() {
    if (!this._running) return
    this._running = false
    if (this.sock?.ws?.close) {
      try {
        this.sock.ws.close()
      } catch (e) {}
    }
    this.sock = null
    this.client = null
    this.emit('stopped', { instance: this.name })
  }

  get isRunning() {
    return this._running
  }

  get uptime() {
    if (!this._startTime) return 0
    return Date.now() - this._startTime
  }

  toJSON() {
    return {
      name: this.name,
      running: this._running,
      uptime: this.uptime,
      options: this.options,
    }
  }
}

class InstanceManager extends EventEmitter {
  constructor() {
    super()
    this.instances = new Map()
  }

  create(name, options = {}, baileysOptions = {}) {
    if (this.instances.has(name)) {
      throw new Error(`Instance "${name}" already exists`)
    }
    const instance = new Instance(name, options, baileysOptions)
    this.instances.set(name, instance)

    instance.on('ready', (data) => this.emit('instance.ready', data))
    instance.on('error', (data) => this.emit('instance.error', data))
    instance.on('disconnect', (data) => this.emit('instance.disconnect', data))
    instance.on('message', (ctx) => this.emit('instance.message', ctx))

    return instance
  }

  get(name) {
    return this.instances.get(name) || null
  }

  has(name) {
    return this.instances.has(name)
  }

  async delete(name) {
    const instance = this.instances.get(name)
    if (instance) {
      await instance.stop()
      this.instances.delete(name)
    }
  }

  async startAll() {
    const results = []
    for (const [name, instance] of this.instances) {
      try {
        await instance.start()
        results.push({ name, status: 'started' })
      } catch (e) {
        results.push({ name, status: 'error', error: e.message })
      }
    }
    return results
  }

  async stopAll() {
    const results = []
    for (const [name, instance] of this.instances) {
      try {
        await instance.stop()
        results.push({ name, status: 'stopped' })
      } catch (e) {
        results.push({ name, status: 'error', error: e.message })
      }
    }
    return results
  }

  getAll() {
    return Array.from(this.instances.values())
  }

  list() {
    return Array.from(this.instances.keys())
  }

  toJSON() {
    return this.getAll().map(i => i.toJSON())
  }
}

const instanceManager = new InstanceManager()

module.exports = Instance
module.exports.default = Instance
module.exports.InstanceManager = InstanceManager
module.exports.instanceManager = instanceManager
