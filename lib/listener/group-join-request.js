function handler(client, sock) {
  sock.ev.on('group.join-request', (requests) => {
    try {
      if (!requests || requests.length === 0) return
      client.emit('group.request', requests)
    } catch (e) {
      console.error('[Listener] group-join-request error:', e.message)
    }
  })
}

module.exports = { handler, name: 'group-join-request' }
