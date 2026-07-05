function handler(client, sock) {
  sock.ev.on('group-participants.update', (update) => {
    try {
      if (!update) return
      const { id, participants, action } = update
      client.emit('group-participants.update', update)
      if (action === 'add') {
        client.emit('group.add', { id, participants, action })
      } else if (action === 'remove') {
        client.emit('group.remove', { id, participants, action })
      } else if (action === 'promote') {
        client.emit('group.promote', { id, participants, action })
      } else if (action === 'demote') {
        client.emit('group.demote', { id, participants, action })
      }
    } catch (e) {
      console.error('[Listener] group-participants-update error:', e.message)
    }
  })
}

module.exports = { handler, name: 'group-participants-update' }
