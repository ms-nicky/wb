function handler(client, sock) {
  sock.ev.on('contacts.upsert', (contacts) => {
    try {
      if (!contacts || contacts.length === 0) return
      client.emit('contacts.upsert', contacts)
    } catch (e) {
      console.error('[Listener] contacts-upsert error:', e.message)
    }
  })
}

module.exports = { handler, name: 'contacts-upsert' }
