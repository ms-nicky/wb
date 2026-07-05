function handler(client, sock) {
  sock.ev.on('groups.upsert', (groups) => {
    try {
      if (!groups || groups.length === 0) return
      client.emit('groups.upsert', groups)
    } catch (e) {
      console.error('[Listener] groups-upsert error:', e.message)
    }
  })

  sock.ev.on('groups.update', (updates) => {
    try {
      if (!updates || updates.length === 0) return
      client.emit('groups.update', updates)
    } catch (e) {
      console.error('[Listener] groups-update error:', e.message)
    }
  })
}

module.exports = { handler, name: 'groups-update' }
