function handler(client, sock) {
  sock.ev.on('contacts.update', (updates) => {
    try {
      if (!updates || updates.length === 0) return
      client.emit('contacts.update', updates)
    } catch (e) {
      console.error('[Listener] contacts-update error:', e.message)
    }
  })
}

module.exports = { handler, name: 'contacts-update' }
