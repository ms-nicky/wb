function handler(client, sock) {
  sock.ev.on('messages.reaction', (reactions) => {
    try {
      if (!reactions || reactions.length === 0) return
      client.emit('message.reaction', reactions)
    } catch (e) {
      console.error('[Listener] message-reaction error:', e.message)
    }
  })
}

module.exports = { handler, name: 'message-reaction' }
