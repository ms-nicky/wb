function handler(client, sock) {
  sock.ev.on('presence.update', (update) => {
    try {
      if (!update) return
      client.emit('presence.update', update)
    } catch (e) {
      console.error('[Listener] presence-update error:', e.message)
    }
  })
}

module.exports = { handler, name: 'presence-update' }
