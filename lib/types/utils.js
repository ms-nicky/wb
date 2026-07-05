const Utils = {
  isUrl(string) {
    return /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/i.test(string)
  },

  isNumber(string) {
    return /^[0-9]+$/.test(string)
  },

  isJid(string) {
    return /@s\.whatsapp\.net$/.test(string) || /@g\.us$/i.test(string)
  },

  isGroup(string) {
    return /@g\.us$/i.test(string)
  },

  extractCommand(string, prefixes) {
    if (!string) return { prefix: '', command: '', args: '' }
    for (const prefix of prefixes) {
      if (prefix && string.startsWith(prefix)) {
        const afterPrefix = string.slice(prefix.length).trim()
        const parts = afterPrefix.split(/[\s\n]+/)
        return {
          prefix,
          command: parts[0] || '',
          args: parts.slice(1).join(' ').trim(),
          text: afterPrefix
        }
      }
    }
    return { prefix: '', command: '', args: string, text: string }
  },

  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
  },

  formatTime(seconds) {
    if (seconds < 60) return `${Math.floor(seconds)}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
    return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`
  },

  runtime(seconds) {
    const d = Math.floor(seconds / 86400)
    const h = Math.floor((seconds % 86400) / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    return [d && d + 'd', h && h + 'h', m && m + 'm', s + 's'].filter(Boolean).join(' ')
  },

  generateBytes(length = 16) {
    const crypto = require('node:crypto')
    return crypto.randomBytes(length)
  },

  generateId(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  },

  formatNumber(number) {
    return new Intl.NumberFormat('id-ID').format(number)
  },

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  },

  clockString(duration) {
    if (duration >= 3600000) {
      return `${Math.floor(duration / 3600000)}:${Math.floor((duration % 3600000) / 60000)}:${Math.floor((duration % 60000) / 1000)}`
    }
    return `${Math.floor(duration / 60000)}:${Math.floor((duration % 60000) / 1000)}`
  },

  ucword(string) {
    return string ? string.charAt(0).toUpperCase() + string.slice(1).toLowerCase() : ''
  }
}

module.exports = Utils
