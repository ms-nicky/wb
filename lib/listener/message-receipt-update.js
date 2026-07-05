function handler(client, sock) {
  sock.ev.on('message-receipt.update', (updates) => {
    try {
      if (!updates || updates.length === 0) return
      client.emit('message.receipt', updates)
    } catch (e) {
      console.error('[Listener] message-receipt-update error:', e.message)
    }
  })
}

module.exports = { handler, name: 'message-receipt-update' }
