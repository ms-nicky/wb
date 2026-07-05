const PhoneNumber = require('awesome-phonenumber')

class JID {
  static isGroup(jid) {
    return /@g\.us$/.test(jid)
  }

  static isStatus(jid) {
    return /@broadcast$/.test(jid) || /status@broadcast$/.test(jid)
  }

  static isNewsletter(jid) {
    return /@newsletter$/.test(jid)
  }

  static isLID(jid) {
    return /@lid$/.test(jid)
  }

  static isUser(jid) {
    return /@s\.whatsapp\.net$/.test(jid)
  }

  static normalize(jid) {
    if (!jid) return ''
    if (typeof jid !== 'string') return ''
    jid = jid.replace(/[^0-9@.\-_]/g, '')
    if (/:\d+@/.test(jid)) {
      jid = jid.replace(/:\d+@/, '@')
    }
    return jid
  }

  static decode(jid) {
    if (!jid) return { user: '', server: '', lid: null }
    const parts = jid.split('@')
    return {
      user: parts[0] || '',
      server: parts[1] || '',
      lid: parts[0] && parts[0].includes(':') ? parts[0] : null,
    }
  }

  static encode(user, server = 's.whatsapp.net') {
    return `${user}@${server}`
  }

  static getSuffix(jid) {
    if (!jid) return ''
    const match = jid.match(/@(.+)$/)
    return match ? match[1] : ''
  }

  static toNumber(jid) {
    if (!jid) return ''
    return jid.replace(/@.+$/, '').replace(/[^0-9]/g, '')
  }

  static formatPhone(jid, format = 'international') {
    const number = this.toNumber(jid)
    const phone = new PhoneNumber(number, 'ID')
    if (format === 'international') return phone.getNumber('international')
    if (format === 'national') return phone.getNumber('national')
    if (format === 'e164') return phone.getNumber('e164')
    return number
  }

  static isOnWhatsApp(jid, sock) {
    if (!sock?.onWhatsApp) return Promise.resolve({ exists: false })
    return sock.onWhatsApp(jid)
  }

  static lidToJid(lid, server = 's.whatsapp.net') {
    if (!lid) return ''
    const user = lid.replace(/@lid$/, '').replace(/@.+$/, '')
    return `${user}@${server}`
  }

  static jidToLid(jid) {
    if (!jid) return ''
    const user = jid.replace(/@.+$/, '')
    return `${user}@lid`
  }

  static groupMetadataToJid(metadata) {
    return metadata?.id || ''
  }

  static extractJid(participant) {
    if (!participant) return ''
    if (typeof participant === 'string') return this.normalize(participant)
    if (participant.jid) return this.normalize(participant.jid)
    if (participant.id) return this.normalize(participant.id)
    return ''
  }

  static compare(jid1, jid2) {
    return this.normalize(jid1) === this.normalize(jid2)
  }

  static cleanJid(jid) {
    if (!jid) return ''
    jid = this.normalize(jid)
    if (jid.endsWith('@s.whatsapp.net')) return jid
    if (jid.endsWith('@g.us')) return jid
    if (jid.endsWith('@broadcast')) return jid
    const number = this.toNumber(jid)
    return `${number}@s.whatsapp.net`
  }
}

module.exports = JID
module.exports.default = JID
