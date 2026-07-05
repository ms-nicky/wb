function handler(client, sock) {
  sock.ev.on('messages.upsert', async ({ messages }) => {
    try {
      if (!messages || messages.length === 0) return
      for (const msg of messages) {
        if (!msg.message) continue
        if (!msg.key?.fromMe) continue
        if (msg.key?.participant) continue
        client.emit('messages.upsert.self', { messages: [msg] })
      }
    } catch (e) {
      console.error('[Listener] messages-upsert-self error:', e.message)
    }
  })
}

module.exports = { handler, name: 'messages-upsert-self' }
