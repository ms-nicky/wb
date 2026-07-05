function handler(client, sock) {
  sock.ev.on('messages.update', (updates) => {
    try {
      if (!updates || updates.length === 0) return
      client.emit('messages.update', updates)

      const deletedMessages = updates.filter(u => u.update?.messageStubType === 2)
      if (deletedMessages.length > 0) {
        client.emit('message.delete', deletedMessages)
      }
    } catch (e) {
      console.error('[Listener] messages-update error:', e.message)
    }
  })
}

module.exports = { handler, name: 'messages-update' }
