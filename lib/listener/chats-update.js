function handler(client, sock) {
  sock.ev.on('chats.update', (updates) => {
    try {
      if (!updates || updates.length === 0) return
      client.emit('chats.update', updates)
    } catch (e) {
      console.error('[Listener] chats-update error:', e.message)
    }
  })
}

module.exports = { handler, name: 'chats-update' }
