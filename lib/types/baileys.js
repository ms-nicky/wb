const Baileys = {
  MediaTypes: [
    'imageMessage',
    'videoMessage',
    'audioMessage',
    'stickerMessage',
    'documentMessage',
    'documentWithCaptionMessage',
  ],

  MessageTypes: [
    'conversation',
    'extendedTextMessage',
    'protocolMessage',
    'reactionMessage',
    'pollCreationMessage',
    'pollUpdateMessage',
    'listMessage',
    'productMessage',
    'orderMessage',
    'buttonsMessage',
    'buttonsResponseMessage',
    'templateMessage',
    'interactiveMessage',
    'interactiveResponseMessage',
    'callLogMessage',
    'eventMessage',
    'keepInChatMessage',
    'senderKeyDistributionMessage',
    'stickerSyncRmrMessage',
    'pnForLidMessage',
    'encReactionMessage',
    'editableMessage',
    'viewOnceMessage',
    'viewOnceMessageV2',
    'messageContextInfo',
    'listResponseMessage',
  ],

  GroupStatus: {
    ANNOUNCEMENT: 'announcement',
    NOT_ANNOUNCEMENT: 'not_announcement',
    LOCKED: 'locked',
    UNLOCKED: 'unlocked',
  },

  Presence: {
    AVAILABLE: 'available',
    UNAVAILABLE: 'unavailable',
    COMPOSING: 'composing',
    RECORDING: 'recording',
    PAUSED: 'paused',
  },

  getContentType(message) {
    if (!message) return null
    for (const type of this.MessageTypes) {
      if (message[type]) return type
    }
    return null
  },

  isMediaMessage(message) {
    const type = this.getContentType(message)
    return type ? this.MediaTypes.includes(type) : false
  },

  extractMessage(message) {
    if (!message) return null
    let msg = message
    if (msg.viewOnceMessageV2) msg = msg.viewOnceMessageV2.message
    else if (msg.viewOnceMessage) msg = msg.viewOnceMessage.message
    if (msg.editableMessage) msg = msg.editableMessage.text || msg.editableMessage
    return msg
  },

  extractText(message) {
    if (!message) return ''
    const msg = this.extractMessage(message)
    if (!msg) return ''
    if (typeof msg === 'string') return msg
    const type = this.getContentType(msg)
    if (!type) return ''
    if (type === 'conversation') return msg.conversation || ''
    if (type === 'extendedTextMessage') return msg.extendedTextMessage?.text || ''
    if (type === 'listResponseMessage') return msg.listResponseMessage?.singleSelectReply?.selectedRowId || ''
    if (type === 'buttonsResponseMessage') return msg.buttonsResponseMessage?.selectedButtonId || ''
    if (msg[type]?.text) return msg[type].text
    if (msg[type]?.caption) return msg[type].caption
    return ''
  },

  jidToNumber(jid) {
    if (!jid) return ''
    return jid.replace(/@.+$/, '')
  },

  extractJid(participant) {
    if (typeof participant === 'string') return participant
    if (participant?.jid) return participant.jid
    if (participant?.id) return participant.id
    return ''
  }
}

module.exports = Baileys
