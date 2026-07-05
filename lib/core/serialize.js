const {
  getContentType,
  jidToNumber,
  extractMessage,
  extractText,
} = require('../types/baileys.js')

function serialize(baileysMessage, sock) {
  if (!baileysMessage) return null
  const m = { ...baileysMessage }
  const { key, pushName } = m

  m.id = key?.id || ''
  m.chat = key?.remoteJid || ''
  m.fromMe = key?.fromMe || false
  m.isGroup = m.chat.endsWith('@g.us')
  m.sender = m.fromMe ? (sock?.user?.id || m.chat) : (key?.participant || key?.remoteJid || '')
  m.sender = m.sender?.replace(/:\d+@/, '@') || ''
  m.pushName = pushName || ''
  m.isBot = !key?.fromMe && (key?.id?.startsWith('3EB0') || key?.id?.startsWith('BAE') || /-/.test(key?.id || ''))
  m.mentionedJid = m.message?.messageContextInfo?.mentionedJid || m.mentionedJid || []
  m.broadcast = m.broadcast || false

  const msgType = getContentType(m.message)
  m.type = msgType || ''
  m.msg = msgType ? m.message[msgType] : m.message

  if (m.msg?.contextInfo) {
    m.quoted = extractQuotedMessage(m.msg.contextInfo)
  } else {
    m.quoted = null
  }

  m.body = extractText(m.message)
  m.text = m.body

  m.reply = async (text, options = {}) => {
    if (!sock) return
    const message = { text }
    if (options.mentions) {
      message.mentions = options.mentions
    }
    return sock.sendMessage(m.chat, message, { quoted: m, ...options })
  }

  m.react = async (emoji) => {
    if (!sock) return
    return sock.sendMessage(m.chat, {
      react: { text: emoji, key: m.key }
    })
  }

  m.forward = async (jid, options = {}) => {
    if (!sock) return
    return sock.sendMessage(jid, {
      forward: { key: m.key, message: m.message, contextInfo: null }
    }, options)
  }

  m.copyMessage = () => ({
    key: { ...m.key },
    message: { ...m.message },
    pushName: m.pushName,
  })

  m.download = async () => {
    if (!sock) return null
    try {
      if (m.msg) {
        const type = getContentType(m.message)
        if (type && m.message[type]) {
          const stream = await sock.downloadMediaMessage(m)
          const chunks = []
          for await (const chunk of stream) {
            chunks.push(chunk)
          }
          return Buffer.concat(chunks)
        }
      }
    } catch (e) {
      return null
    }
  }

  return m
}

function extractQuotedMessage(contextInfo) {
  if (!contextInfo) return null
  const quoted = contextInfo.quotedMessage || contextInfo.participant
  if (!quoted) return null
  const quotedObj = {
    key: {
      remoteJid: contextInfo.remoteJid || '',
      fromMe: contextInfo.participant ? false : true,
      id: contextInfo.stanzaId || '',
      participant: contextInfo.participant || '',
    },
    message: quoted,
    pushName: contextInfo.quotedParticipant || '',
  }
  const msgType = getContentType(quoted)
  quotedObj.type = msgType || ''
  quotedObj.msg = msgType ? quoted[msgType] : quoted
  quotedObj.text = extractText(quoted)
  quotedObj.sender = contextInfo.participant || ''
  quotedObj.isGroup = /@g\.us$/.test(contextInfo.remoteJid || '')
  const quotedContext = quotedObj.msg?.contextInfo
  quotedObj.mentionedJid = quotedContext?.mentionedJid || []
  quotedObj.quoted = quotedContext ? extractQuotedMessage(quotedContext) : null
  return quotedObj
}

function smsg(conn, baileysMessage) {
  return serialize(baileysMessage, conn)
}

module.exports = {
  serialize,
  smsg,
  extractQuotedMessage,
}
