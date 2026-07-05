function handler(client, sock) {
  sock.ev.on('messages.upsert', async ({ messages }) => {
    try {
      if (!messages || messages.length === 0) return
      for (const msg of messages) {
        if (!msg.message) continue
        if (msg.key?.fromMe && !msg.key?.participant) continue
        client.emit('messages.upsert', { messages: [msg] })
      }
    } catch (e) {
      console.error('[Listener] messages-upsert error:', e.message)
    }
  })
}

module.exports = { handler, name: 'messages-upsert' }
