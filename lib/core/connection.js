const { EventEmitter } = require('node:events')
const fs = require('node:fs')
const path = require('node:path')
const pino = require('pino')
const qrcode = require('qrcode-terminal')
const { applyMessageMethods } = require('./message.js')
const { scanPlugins, watchPlugins } = require('../utils/loader.js')

class Client extends EventEmitter {
  constructor(options = {}, baileysOptions = {}) {
    super()

    this.options = {
      plugsdir: options.plugsdir || 'plugins',
      presence: options.presence ?? true,
      online: options.online ?? true,
      bypass_disappearing: options.bypass_disappearing ?? true,
      server: options.server ?? false,
      bot: options.bot || null,
      stealth: options.stealth || null,
      custom_id: options.custom_id || 'neoxr',
      pairing: options.pairing || { state: false, number: '' },
      multiple: options.multiple ?? false,
      create_session: options.create_session || null,
      setting: options.setting || null,
      engines: options.engines || [],
      debug: options.debug ?? false,
    }

    this.baileysOptions = baileysOptions
    this.sock = null
    this.store = null
    this.authState = null
    this.plugins = []
    this.commands = []
    this._events = {}
    this._startTime = Date.now()
    this._reconnectAttempts = 0
    this.logger = pino({
      level: this.options.debug ? 'debug' : 'warn',
      transport: {
        target: 'pino/file',
        options: { destination: path.join(process.cwd(), '.cache', 'wb.log') },
      },
    })

    if (this.options.debug) {
      console.log('[Client] Initialized with options:', JSON.stringify(this.options, null, 2))
    }

    this._init()
  }

  async _init() {
    try {
      this.emit('connect', { status: 'connecting' })

      const { default: makeWASocket, DisconnectReason, fetchLatestBaileysVersion, useMultiFileAuthState }
        = await this._loadBaileys()

      const { version, isLatest } = await fetchLatestBaileysVersion()
      if (this.options.debug) {
        console.log('[Client] Baileys version:', version, 'isLatest:', isLatest)
      }

      let authState
      if (this.options.create_session) {
        authState = await this._createAuthState(this.options.create_session)
      } else {
        const sessionDir = path.join(process.cwd(), 'session')
        if (!fs.existsSync(sessionDir)) {
          fs.mkdirSync(sessionDir, { recursive: true })
        }
        authState = await useMultiFileAuthState(sessionDir)
        this.authState = authState
      }

      const socketConfig = {
        version,
        auth: authState.state,
        logger: this.logger,
        printQRInTerminal: !this.options.pairing?.state,
        browser: baileysOptions.browser || ['Ubuntu', 'Firefox', '20.0.00'],
        ...(this.baileysOptions || {}),
      }

      if (this.options.pairing?.state && this.options.pairing?.number) {
        socketConfig.pairingCodeNumber = this.options.pairing.number
        socketConfig.pairingCode = this.options.pairing.code || undefined
      }

      const sock = makeWASocket(socketConfig)
      this.sock = sock
      this.store = sock.store || null

      if (this.options.pairing?.state && this.options.pairing?.number && sock.user?.id) {
        await this._pairDevice(sock)
      }

      applyMessageMethods(this)

      if (this.options.debug) {
        console.log('[Client] Message methods applied')
      }

      if (this.options.plugsdir) {
        await this._loadPlugins()
      }

      this._registerListeners(sock)

      this.emit('ready', { user: sock.user })

    } catch (error) {
      console.error('[Client] Initialization error:', error.message)
      this.emit('error', error)
    }
  }

  async _loadBaileys() {
    const engines = this.options.engines
    if (engines && engines.length > 0) {
      const baileys = engines[0]
      if (baileys?.default) return baileys.default
      return baileys
    }
    try {
      return require('baileys')
    } catch (e) {
      throw new Error('Baileys engine not found. Install baileys or pass it via engines option.')
    }
  }

  async _createAuthState(sessionConfig) {
    const { type, session, config, number, owner } = sessionConfig
    const baileys = await this._loadBaileys()
    try {
      switch (type) {
        case 'mongo': {
          if (baileys.useMongoDBAuthState) {
            return await baileys.useMongoDBAuthState(config || session)
          }
          const { useAuthMongo } = require('../adapter/index.js')
          return await useAuthMongo(config || session)
        }
        case 'postgres': {
          if (baileys.usePostgresAuthState) {
            return await baileys.usePostgresAuthState(config || session)
          }
          const { useAuthPostgres } = require('../adapter/index.js')
          return await useAuthPostgres(config || session)
        }
        case 'mysql': {
          const { useAuthMySQL } = require('../adapter/index.js')
          return await useAuthMySQL(config || session)
        }
        case 'sqlite': {
          if (baileys.useSQLiteAuthState) {
            return await baileys.useSQLiteAuthState(config || session)
          }
          const { useAuthSQLite } = require('../adapter/index.js')
          return await useAuthSQLite(config || session)
        }
        case 'redis': {
          if (baileys.useRedisAuthState) {
            return await baileys.useRedisAuthState(config || session)
          }
          const { useAuthRedis } = require('../adapter/index.js')
          return await useAuthRedis(config || session)
        }
        case 'local':
        default: {
          const { useMultiFileAuthState } = baileys
          return await useMultiFileAuthState(session || 'session')
        }
      }
    } catch (e) {
      console.warn('[Client] Auth state fallback to local:', e.message)
      const { useMultiFileAuthState } = baileys
      return await useMultiFileAuthState(session || 'session')
    }
  }

  async _pairDevice(sock) {
    try {
      if (!sock?.user?.id) {
        await new Promise(resolve => {
          const check = setInterval(() => {
            if (sock?.user?.id) {
              clearInterval(check)
              resolve()
            }
          }, 1000)
        })
      }
    } catch (e) {
      console.error('[Client] Pairing error:', e.message)
    }
  }

  async _loadPlugins() {
    const plugsDir = path.resolve(this.options.plugsdir)
    if (!fs.existsSync(plugsDir)) {
      console.warn(`[Client] Plugin directory not found: ${plugsDir}`)
      return
    }
    try {
      const result = await scanPlugins(plugsDir, this)
      this.plugins = result.plugins || []
      this.commands = result.commands || []
      if (this.options.debug) {
        console.log(`[Client] Loaded ${this.plugins.length} plugins, ${this.commands.length} commands`)
      }
    } catch (e) {
      console.error('[Client] Plugin loading error:', e.message)
      this.plugins = []
      this.commands = []
    }
  }

  _registerListeners(sock) {
    const { DisconnectReason } = require('baileys')

    sock.ev.on('messages.upsert', async (update) => {
      try {
        const { messages } = update
        if (!messages || messages.length === 0) return

        for (const msg of messages) {
          if (!msg.message || msg.key?.fromMe) continue

          const { smsg } = require('./serialize.js')
          const m = smsg(this.sock, msg)
          if (!m) continue

          const { defaultPrefixes } = require('../types/index.js')
          const prefixes = [...defaultPrefixes, ...(this.options.custom_id ? [this.options.custom_id + ' '] : [])]
          const body = m.body || m.text || ''
          let prefix = ''
          let command = ''
          let text = body
          let args = []

          for (const p of prefixes) {
            if (p && body.startsWith(p)) {
              prefix = p
              const rest = body.slice(p.length).trim()
              const parts = rest.split(/[\s\n]+/)
              command = parts[0] || ''
              args = parts.slice(1)
              text = parts.slice(1).join(' ')
              break
            }
          }

          const ctx = {
            m,
            store: this.store,
            body,
            prefix,
            plugins: this.plugins,
            commands: this.commands,
            args,
            command,
            text,
            prefixes,
            core: { prefix, command },
            system: null,
          }

          this.emit('message', ctx)

          if (command) {
            this.emit('command', ctx)
          }
        }
      } catch (e) {
        console.error('[Client] messages.upsert error:', e.message)
      }
    })

    sock.ev.on('messages.update', (updates) => {
      try {
        this.emit('message.update', updates)
      } catch (e) {}
    })

    sock.ev.on('messages.reaction', (reactions) => {
      try {
        this.emit('message.reaction', reactions)
      } catch (e) {}
    })

    sock.ev.on('message-receipt.update', (updates) => {
      try {
        this.emit('message.receipt', updates)
      } catch (e) {}
    })

    sock.ev.on('contacts.upsert', (contacts) => {
      try {
        this.emit('contacts.upsert', contacts)
      } catch (e) {}
    })

    sock.ev.on('contacts.update', (updates) => {
      try {
        this.emit('contacts.update', updates)
      } catch (e) {}
    })

    sock.ev.on('groups.upsert', (groups) => {
      try {
        this.emit('groups.upsert', groups)
      } catch (e) {}
    })

    sock.ev.on('groups.update', (updates) => {
      try {
        this.emit('groups.update', updates)
      } catch (e) {}
    })

    sock.ev.on('group-participants.update', (update) => {
      try {
        const { id, participants, action } = update
        if (action === 'add') {
          this.emit('group.add', { id, participants, action })
        } else if (action === 'remove') {
          this.emit('group.remove', { id, participants, action })
        } else if (action === 'promote') {
          this.emit('group.promote', { id, participants, action })
        } else if (action === 'demote') {
          this.emit('group.demote', { id, participants, action })
        }
        this.emit('group-participants.update', update)
      } catch (e) {}
    })

    sock.ev.on('group.join-request', (requests) => {
      try {
        this.emit('group.request', requests)
      } catch (e) {}
    })

    sock.ev.on('presence.update', (update) => {
      try {
        this.emit('presence.update', update)
      } catch (e) {}
    })

    sock.ev.on('chats.update', (updates) => {
      try {
        this.emit('chats.update', updates)
      } catch (e) {}
    })

    sock.ev.on('call', (calls) => {
      try {
        this.emit('caller', calls)
      } catch (e) {}
    })

    sock.ev.on('stories', (stories) => {
      try {
        this.emit('stories', stories || [])
      } catch (e) {}
    })

    sock.ev.on('lid-mapping.update', (updates) => {
      try {
        this.emit('lid-mapping', updates)
      } catch (e) {}
    })

    sock.ev.on('messaging-history.set', (update) => {
      try {
        this.emit('messaging-history.set', update)
      } catch (e) {}
    })

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect } = update
      if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
        if (shouldReconnect) {
          this._reconnectAttempts++
          const delay = Math.min(1000 * Math.pow(2, this._reconnectAttempts), 30000)
          if (this.options.debug) {
            console.log(`[Client] Reconnecting in ${delay}ms (attempt ${this._reconnectAttempts})`)
          }
          setTimeout(() => this._init(), delay)
        } else {
          this.emit('disconnect', { reason: 'logged_out' })
        }
      } else if (connection === 'open') {
        this._reconnectAttempts = 0
        this.emit('connect', { status: 'connected', user: sock.user })
      }
    })

    if (this.options.online !== false) {
      sock.sendPresenceUpdate('available')
    }
  }

  get updatePlugin() {
    return (plugin) => {
      if (!plugin) return
      if (!plugin.run) return

      const run = plugin.run
      const tags = Array.isArray(run.tags) ? run.tags : []
      const usage = Array.isArray(run.usage) ? run.usage : (run.command ? [run.command] : [])
      const category = run.category || 'general'
      const filename = plugin.path || ''

      const pluginData = {
        path: plugin.path || '',
        fullPath: plugin.fullPath || '',
        run,
        type: plugin.type || 'module',
        tags,
        usage,
        category,
        filename,
      }

      const existingIndex = this.plugins.findIndex(p => p.path === pluginData.path)
      if (existingIndex >= 0) {
        this.plugins[existingIndex] = pluginData
      } else {
        this.plugins.push(pluginData)
      }

      if (usage.length > 0) {
        for (const cmd of usage) {
          if (cmd && !this.commands.includes(cmd)) {
            this.commands.push(cmd)
          }
        }
      }

      return pluginData
    }
  }

  set updatePlugin(value) {
    throw new Error('updatePlugin is a read-only property')
  }

  get runtime() {
    return Date.now() - this._startTime
  }

  async reconnect() {
    await this._init()
  }

  async usePlugin(pluginPath) {
    try {
      const fullPath = path.resolve(pluginPath)
      const mod = await require(fullPath)
      if (!mod?.run) throw new Error('Plugin does not export a run function')
      const plugin = {
        path: path.relative(this.options.plugsdir || '', fullPath).replace(/\.js$/, ''),
        fullPath,
        run: mod.run,
        type: 'require',
      }
      this.updatePlugin(plugin)
      return plugin
    } catch (e) {
      console.error(`[Client] usePlugin error:`, e.message)
      return null
    }
  }

  async removePlugin(pluginPath) {
    this.plugins = this.plugins.filter(p => p.path !== pluginPath)
    const plugin = this.plugins.find(p => p.path === pluginPath)
    if (plugin) {
      for (const cmd of plugin.usage) {
        this.commands = this.commands.filter(c => c !== cmd)
      }
    }
  }
}

module.exports = Client
