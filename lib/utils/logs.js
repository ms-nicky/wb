const chalk = require('chalk')

const LogLevels = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
}

class Logs {
  constructor(options = {}) {
    this.level = options.level !== undefined ? options.level : LogLevels.INFO
    this.prefix = options.prefix || ''
    this.useColors = options.colors !== false
    this.timestamp = options.timestamp !== false
  }

  setLevel(level) {
    this.level = level
  }

  formatMessage(level, message, ...args) {
    const ts = this.timestamp ? `[${new Date().toISOString()}] ` : ''
    const prefix = this.prefix ? `[${this.prefix}] ` : ''
    const levelStr = this.getLevelString(level)
    let msg = message
    if (args.length > 0) {
      try {
        msg = message.replace(/%[sdifoO]/g, () => {
          const arg = args.shift()
          if (arg === undefined) return 'undefined'
          if (arg === null) return 'null'
          if (typeof arg === 'object') {
            try { return JSON.stringify(arg, null, 2) } catch (e) { return String(arg) }
          }
          return String(arg)
        })
      } catch (e) {
        msg = message + ' ' + args.map(a => {
          try { return typeof a === 'object' ? JSON.stringify(a) : String(a) } catch (e) { return String(a) }
        }).join(' ')
      }
    }
    return `${ts}${prefix}${levelStr} ${msg}`
  }

  getLevelString(level) {
    switch (level) {
      case LogLevels.ERROR: return this.useColors ? chalk.red('[ERROR]') : '[ERROR]'
      case LogLevels.WARN: return this.useColors ? chalk.yellow('[WARN]') : '[WARN]'
      case LogLevels.INFO: return this.useColors ? chalk.cyan('[INFO]') : '[INFO]'
      case LogLevels.DEBUG: return this.useColors ? chalk.gray('[DEBUG]') : '[DEBUG]'
      default: return '[LOG]'
    }
  }

  error(message, ...args) {
    if (this.level >= LogLevels.ERROR) {
      console.error(this.formatMessage(LogLevels.ERROR, message, ...args))
    }
  }

  warn(message, ...args) {
    if (this.level >= LogLevels.WARN) {
      console.warn(this.formatMessage(LogLevels.WARN, message, ...args))
    }
  }

  info(message, ...args) {
    if (this.level >= LogLevels.INFO) {
      console.log(this.formatMessage(LogLevels.INFO, message, ...args))
    }
  }

  debug(message, ...args) {
    if (this.level >= LogLevels.DEBUG) {
      console.log(this.formatMessage(LogLevels.DEBUG, message, ...args))
    }
  }

  static create(prefix, level) {
    return new Logs({ prefix, level })
  }
}

const defaultLogger = new Logs({ prefix: 'WB', level: LogLevels.INFO })

module.exports = Logs
module.exports.default = Logs
module.exports.LogLevels = LogLevels
module.exports.logger = defaultLogger
