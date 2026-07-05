const path = require('node:path')
const fs = require('node:fs')
const crypto = require('node:crypto')

function applyMessageMethods(client) {
  if (!client || !client.sock) return

  const sock = client.sock

  client.reply = async (jid, text, quoted, options = {}) => {
    try {
      const mentions = options.mentions || []
      const message = { text }
      if (mentions.length > 0) message.mentions = mentions

      const opts = {}
      if (quoted?.key) opts.quoted = quoted
      if (quoted?.quoted?.key) opts.quoted = quoted

      return sock.sendMessage(jid, message, { ...opts, ...options })
    } catch (e) {
      console.error('[Message] reply error:', e.message)
      return null
    }
  }

  client.sendReact = async (jid, emoji, key) => {
    try {
      return sock.sendMessage(jid, {
        react: { text: emoji, key }
      })
    } catch (e) {
      console.error('[Message] sendReact error:', e.message)
      return null
    }
  }

  client.sendFile = async (jid, buffer, filename, caption, quoted, options = {}) => {
    try {
      const { getFile } = require('../utils/functions.js')
      const file = await getFile(buffer, filename)
      if (!file.status) {
        return sock.sendMessage(jid, { text: `Error: ${file.error}` }, { quoted })
      }
      let type = 'document'
      const mime = file.mime || ''
      if (/image/.test(mime)) {
        type = 'image'
      } else if (/video/.test(mime)) {
        type = 'video'
      } else if (/audio/.test(mime)) {
        type = 'audio'
      } else if (/webp/.test(mime)) {
        type = 'sticker'
      }
      const msg = {
        [type]: file.data,
        mimetype: mime,
      }
      if (caption && (type === 'image' || type === 'video')) {
        msg.caption = caption
      }
      if (type === 'document') {
        msg.fileName = filename || file.filename || 'file'
      }
      if (options.ptt && type === 'audio') {
        msg.ptt = true
      }
      if (options.APIC) {
        msg.jpegThumbnail = options.APIC
      }
      const opts = {}
      if (quoted?.key) opts.quoted = quoted
      return sock.sendMessage(jid, msg, { ...opts, ...options })
    } catch (e) {
      console.error('[Message] sendFile error:', e.message)
      return sock.sendMessage(jid, { text: `Error: ${e.message}` }, { quoted })
    }
  }

  client.sendSticker = async (jid, buffer, quoted, options = {}) => {
    try {
      const { getFile } = require('../utils/functions.js')
      const file = await getFile(buffer)
      if (!file.status) {
        return sock.sendMessage(jid, { text: `Error: ${file.error}` }, { quoted })
      }
      let stickerBuffer = file.data
      if (options.meta || options.lock || options.premium) {
        const Exif = require('../utils/exif.js')
        const exif = new Exif({
          packname: options.packname || 'Sticker by',
          author: options.author || '@neoxr.js',
        })
        stickerBuffer = await exif.create(stickerBuffer)
      }
      const msg = {
        sticker: stickerBuffer,
      }
      const opts = {}
      if (quoted?.key) opts.quoted = quoted
      return sock.sendMessage(jid, msg, { ...opts, ...options })
    } catch (e) {
      console.error('[Message] sendSticker error:', e.message)
      return null
    }
  }

  client.sendContact = async (jid, contacts, quoted, options = {}) => {
    try {
      const vcardContacts = contacts.map(c => {
        const vcard = [
          'BEGIN:VCARD',
          'VERSION:3.0',
          `FN:${c.name || ''}`,
          `TEL;type=CELL;type=VOICE;waid=${c.number.replace(/[^0-9]/g, '')}:+${c.number.replace(/[^0-9]/g, '')}`,
          `ORG:${options.org || ''}`,
          `URL:${options.website || ''}`,
          `EMAIL:${options.email || ''}`,
          'END:VCARD',
        ].join('\n')
        return {
          displayName: c.name || c.number,
          vcard,
        }
      })
      const msg = {
        contacts: {
          displayName: vcardContacts.map(c => c.displayName).join(', '),
          contacts: vcardContacts,
        },
      }
      const opts = {}
      if (quoted?.key) opts.quoted = quoted
      return sock.sendMessage(jid, msg, { ...opts, ...options })
    } catch (e) {
      console.error('[Message] sendContact error:', e.message)
      return null
    }
  }

  client.sendPoll = async (jid, question, options = {}) => {
    try {
      const opts = options.options || []
      const msg = {
        pollCreationMessage: {
          name: question || 'Question',
          options: opts.map(o => ({
            optionName: typeof o === 'string' ? o : o.name || o.optionName || String(o),
          })),
          selectableOptionsCount: options.multiselect ? 0 : 1,
        },
      }
      return sock.relayMessage(jid, msg, {})
    } catch (e) {
      console.error('[Message] sendPoll error:', e.message)
      return null
    }
  }

  client.sendMessageModify = async (jid, text, quoted, opts = {}) => {
    try {
      if (opts.type === 'preview-link') {
        const msg = {
          text,
          contextInfo: {
            externalAdReply: {
              title: opts.title || '',
              body: text,
              thumbnail: opts.thumbnail || undefined,
              sourceUrl: opts.url || '',
              mediaType: 1,
              renderLargerThumbnail: !!opts.largeThumb,
              showAdAttribution: !!opts.ads,
            },
          },
        }
        const options = {}
        if (quoted?.key) options.quoted = quoted
        return sock.sendMessage(jid, msg, options)
      }
      const key = {}
      if (quoted?.key) key.quoted = quoted

      if (opts.thumbnail && opts.url) {
        const { getFile } = require('../utils/functions.js')
        let thumbBuffer
        if (Buffer.isBuffer(opts.thumbnail)) {
          thumbBuffer = opts.thumbnail
        } else if (typeof opts.thumbnail === 'string') {
          const file = await getFile(opts.thumbnail)
          if (file.status) thumbBuffer = file.data
        }
        if (thumbBuffer) {
          const msg = {
            text,
            contextInfo: {
              externalAdReply: {
                title: opts.title || '',
                body: text,
                thumbnail: thumbBuffer,
                sourceUrl: opts.url || '',
                mediaType: 1,
                renderLargerThumbnail: !!opts.largeThumb,
                showAdAttribution: !!opts.ads,
              },
            },
          }
          return sock.sendMessage(jid, msg, key)
        }
      }
      return sock.sendMessage(jid, { text }, key)
    } catch (e) {
      console.error('[Message] sendMessageModify error:', e.message)
      return null
    }
  }

  client.sendMessageModifyV2 = async (jid, text, quoted, opts = {}) => {
    try {
      const fakeQuoted = quoted?.key ? quoted : null
      if (opts.type === 'preview-link') {
        const { getFile } = require('../utils/functions.js')
        let thumbBuffer
        if (opts.thumbnail) {
          const file = await getFile(opts.thumbnail)
          if (file.status) thumbBuffer = file.data
        }
        const msg = {
          text,
          contextInfo: {
            externalAdReply: {
              title: opts.title || '',
              body: text,
              thumbnail: thumbBuffer || undefined,
              sourceUrl: opts.url || '',
              mediaType: 1,
              renderLargerThumbnail: !!opts.largeThumb,
              showAdAttribution: !!opts.ads,
            },
          },
        }
        const sendOpts = {}
        if (fakeQuoted) sendOpts.quoted = fakeQuoted
        return sock.sendMessage(jid, msg, sendOpts)
      }
      const { getFile } = require('../utils/functions.js')
      let thumbBuffer
      if (opts.thumbnail) {
        const file = await getFile(opts.thumbnail)
        if (file.status) thumbBuffer = file.data
      }
      const msg = {
        text,
        contextInfo: {
          externalAdReply: {
            title: opts.title || '',
            body: text,
            thumbnail: thumbBuffer || undefined,
            sourceUrl: opts.url || '',
            mediaType: 1,
            renderLargerThumbnail: !!opts.largeThumb,
            showAdAttribution: !!opts.ads,
          },
        },
      }
      const sendOpts = {}
      if (fakeQuoted) sendOpts.quoted = fakeQuoted
      return sock.sendMessage(jid, msg, sendOpts)
    } catch (e) {
      console.error('[Message] sendMessageModifyV2 error:', e.message)
      return null
    }
  }

  client.sendMessageVerify = async (jid, text, title, quoted) => {
    try {
      const fakeKey = quoted?.key || null
      const msg = {
        text,
        contextInfo: {
          externalAdReply: {
            title: title || '',
            body: text,
            mediaType: 1,
            renderLargerThumbnail: false,
          },
        },
      }
      const opts = {}
      if (fakeKey) opts.quoted = { key: fakeKey }
      return sock.sendMessage(jid, msg, opts)
    } catch (e) {
      console.error('[Message] sendMessageVerify error:', e.message)
      return null
    }
  }

  client.copyNForward = async (jid, message, options = {}) => {
    try {
      return sock.sendMessage(jid, {
        forward: {
          key: message.key || message,
          message: message.message || message,
        },
      }, options)
    } catch (e) {
      console.error('[Message] copyNForward error:', e.message)
      return null
    }
  }

  client.sendProgress = async (jid, text, quoted, options = {}) => {
    try {
      const stages = ['▰▱▱▱▱▱▱▱▱▱', '▰▰▱▱▱▱▱▱▱▱', '▰▰▰▱▱▱▱▱▱▱', '▰▰▰▰▱▱▱▱▱▱']
      for (const stage of stages) {
        await sock.sendMessage(jid, {
          text: `${stage}\n\n${text}`,
          edit: quoted?.key,
        })
        await new Promise(r => setTimeout(r, 500))
      }
      return sock.sendMessage(jid, { text }, { quoted })
    } catch (e) {
      return sock.sendMessage(jid, { text }, { quoted })
    }
  }

  client.sendPtv = async (jid, buffer, quoted) => {
    try {
      const { getFile } = require('../utils/functions.js')
      let videoBuffer
      if (Buffer.isBuffer(buffer)) {
        videoBuffer = buffer
      } else if (typeof buffer === 'string') {
        const file = await getFile(buffer)
        if (file.status) videoBuffer = file.data
        else throw new Error(file.error)
      } else {
        throw new Error('Invalid buffer type')
      }
      const msg = {
        video: videoBuffer,
        ptv: true,
        mimetype: 'video/mp4',
      }
      const opts = {}
      if (quoted?.key) opts.quoted = quoted
      return sock.sendMessage(jid, msg, opts)
    } catch (e) {
      console.error('[Message] sendPtv error:', e.message)
      return null
    }
  }

  client.sendFromAI = async (jid, text, quoted) => {
    try {
      const msg = {
        text,
        contextInfo: {
          isForwarded: true,
          forwardingScore: 1,
          externalAdReply: {
            title: 'AI',
            body: '',
            mediaType: 1,
            renderLargerThumbnail: false,
          },
        },
      }
      const opts = {}
      if (quoted?.key) opts.quoted = quoted
      return sock.sendMessage(jid, msg, opts)
    } catch (e) {
      return sock.sendMessage(jid, { text }, { quoted })
    }
  }

  client.sendIAMessage = async (jid, buttons, quoted, opts = {}) => {
    try {
      const nativeFlowButtons = buttons.map(b => {
        const params = typeof b.buttonParamsJson === 'string'
          ? JSON.parse(b.buttonParamsJson)
          : b.buttonParamsJson || {}
        return {
          name: b.name || 'quick_reply',
          buttonParamsJson: JSON.stringify(params),
        }
      })

      let mediaBuffer
      if (opts.media) {
        const { getFile } = require('../utils/functions.js')
        const file = await getFile(opts.media)
        if (file.status) {
          if (/image/.test(file.mime)) {
            mediaBuffer = { imageMessage: file.data }
          } else if (/video/.test(file.mime)) {
            mediaBuffer = { videoMessage: file.data }
          }
        }
      }

      const msg = {
        interactiveMessage: {
          header: mediaBuffer ? {
            hasMediaAttachment: true,
            ...mediaBuffer,
          } : opts.header ? { title: opts.header, hasMediaAttachment: false } : undefined,
          body: { text: opts.content || '' },
          footer: opts.footer ? { text: opts.footer } : undefined,
          nativeFlowMessage: {
            buttons: nativeFlowButtons,
          },
        },
      }
      return sock.relayMessage(jid, { viewOnceMessageV2: { message: msg } }, {})
    } catch (e) {
      console.error('[Message] sendIAMessage error:', e.message)
      return sock.sendMessage(jid, { text: opts.content || '' }, { quoted })
    }
  }

  client.sendCarousel = async (jid, cards, quoted, opts = {}) => {
    try {
      const msg = {
        interactiveMessage: {
          body: { text: opts.content || '' },
          carouselMessage: {
            cards: cards.map(card => ({
              header: card.header || undefined,
              body: card.body || undefined,
              nativeFlowMessage: card.nativeFlowMessage || undefined,
            })),
          },
        },
      }
      return sock.relayMessage(jid, { viewOnceMessageV2: { message: msg } }, {})
    } catch (e) {
      console.error('[Message] sendCarousel error:', e.message)
      return null
    }
  }

  client.replyButton = async (jid, buttons, quoted, opts = {}) => {
    try {
      const nativeFlow = buttons.filter(b => b.name)
      if (nativeFlow.length > 0) {
        const buttonList = nativeFlow.map(b => {
          const params = typeof b.buttonParamsJson === 'string'
            ? JSON.parse(b.buttonParamsJson)
            : b.buttonParamsJson || {}
          if (b.name === 'single_select' && b.params) {
            return {
              name: 'single_select',
              buttonParamsJson: JSON.stringify(b.params),
            }
          }
          return {
            name: b.name,
            buttonParamsJson: JSON.stringify(params),
          }
        })
        let mediaPart
        if (opts.media) {
          const { getFile } = require('../utils/functions.js')
          const file = await getFile(opts.media)
          if (file.status) {
            if (/image/.test(file.mime)) {
              mediaPart = { imageMessage: file.data, hasMediaAttachment: true }
            } else if (/video/.test(file.mime)) {
              mediaPart = { videoMessage: file.data, hasMediaAttachment: true }
            }
          }
        } else if (opts.document) {
          mediaPart = { hasDocumentAttachment: true }
        } else if (opts.location) {
          mediaPart = { hasLocation: true }
        }
        const msg = {
          interactiveMessage: {
            header: mediaPart || undefined,
            body: { text: opts.text || '' },
            footer: opts.footer ? { text: opts.footer } : undefined,
            nativeFlowMessage: {
              buttons: buttonList,
            },
          },
        }
        const relayOpts = {}
        if (quoted?.key) relayOpts.quoted = quoted
        return sock.relayMessage(jid, { viewOnceMessageV2: { message: msg } }, relayOpts)
      }
      const buttonsList = buttons.filter(b => b.text)
      if (buttonsList.length > 0) {
        const msg = {
          text: opts.text || '',
          footer: opts.footer || '',
          buttons: buttonsList.map(b => ({
            buttonId: b.command || b.id || '',
            buttonText: { displayText: b.text || '' },
            type: 1,
          })),
          viewOnce: true,
        }
        if (opts.media || opts.location || opts.document) {
          msg.headerType = 1
        }
        const sendOpts = {}
        if (quoted?.key) sendOpts.quoted = quoted
        try {
          return sock.sendMessage(jid, msg, sendOpts)
        } catch (e) {
          const { getFile } = require('../utils/functions.js')
          const file = opts.media ? await getFile(opts.media) : null
          if (file?.status) {
            msg.image = file.data
          }
          return sock.sendMessage(jid, msg, sendOpts)
        }
      }
    } catch (e) {
      console.error('[Message] replyButton error:', e.message)
      return sock.sendMessage(jid, { text: opts.text || '' }, { quoted })
    }
  }

  client.sendAlbumMessage = async (jid, mediaItems, quoted) => {
    try {
      const { getFile } = require('../utils/functions.js')
      const messages = []
      for (const item of mediaItems) {
        const file = await getFile(item.url || item.buffer)
        if (!file.status) continue
        const type = item.type || (file.mime?.startsWith('image') ? 'image' : 'video')
        const msg = {
          [type]: file.data,
          caption: item.caption || '',
          mimetype: file.mime || (type === 'image' ? 'image/jpeg' : 'video/mp4'),
        }
        messages.push(msg)
      }
      if (messages.length === 1) {
        const opts = {}
        if (quoted?.key) opts.quoted = quoted
        return sock.sendMessage(jid, messages[0], opts)
      }
      if (messages.length > 1) {
        for (const msg of messages) {
          await sock.sendMessage(jid, msg, { quoted })
          await new Promise(r => setTimeout(r, 500))
        }
      }
    } catch (e) {
      console.error('[Message] sendAlbumMessage error:', e.message)
      return null
    }
  }

  client.groupStatus = async (jid, content, options = {}) => {
    try {
      if (!content) return
      if (content.media && (Buffer.isBuffer(content.media) || typeof content.media === 'string')) {
        const { getFile } = require('../utils/functions.js')
        const file = await getFile(content.media)
        if (file.status) {
          const type = /video/.test(file.mime) ? 'video' : 'image'
          const msg = {
            [type]: file.data,
            caption: content.caption || '',
          }
          return sock.sendMessage(jid, msg, {
            backgroundColor: content.background || undefined,
            font: content.font || undefined,
            statusJidList: [jid],
          })
        }
      }
      if (content.text) {
        return sock.sendMessage(jid, {
          text: content.text,
          backgroundColor: content.background || '#FF0000',
          textColor: content.color || '#222222',
          font: content.font || undefined,
          statusJidList: [jid],
        })
      }
    } catch (e) {
      console.error('[Message] groupStatus error:', e.message)
      return null
    }
  }

  client.sendMetaMsg = async (jid, blocks, quoted, opts = {}) => {
    try {
      let text = ''
      for (const block of blocks) {
        if (block.text) {
          text += block.text + '\n'
        } else if (block.code) {
          text += '```' + block.code.language + '\n' + block.code.code + '```\n'
        } else if (block.table) {
          const headers = (block.table.headers || []).join(' | ')
          const separator = (block.table.headers || []).map(() => '---').join(' | ')
          const rows = (block.table.rows || []).map(r => r.join(' | ')).join('\n')
          text += (block.table.title ? block.table.title + '\n' : '') + headers + '\n' + separator + '\n' + rows + '\n'
        } else if (block.muted) {
          text += block.muted + '\n'
        } else if (block.suggestions) {
          text += block.suggestions.join(', ') + '\n'
        } else if (block.sources) {
          text += (block.sources || []).map(s => `- ${s.icon ? '🖼️ ' : ''}[${s.title}](${s.url})`).join('\n') + '\n'
        } else if (block.reels) {
          text += (block.reels || []).map(r => `- ${r.creator || ''}: ${r.url || ''}`).join('\n') + '\n'
        } else if (block.posts) {
          text += (block.posts || []).map(p => `- ${p.caption || ''} (${p.source || ''})`).join('\n') + '\n'
        } else if (block.products) {
          const products = Array.isArray(block.products) ? block.products : [block.products]
          text += products.map(p => `- ${p.title}: ${p.sale_price || p.price || ''}`).join('\n') + '\n'
        }
      }
      const msg = {
        text: text.trim(),
      }
      if (opts.title) {
        msg.contextInfo = {
          externalAdReply: {
            title: opts.title,
            body: opts.title,
            mediaType: 1,
            renderLargerThumbnail: false,
          },
        }
      }
      if (opts.mentions) msg.mentions = opts.mentions
      const sendOpts = {}
      if (quoted?.key) sendOpts.quoted = quoted
      return sock.sendMessage(jid, msg, sendOpts)
    } catch (e) {
      console.error('[Message] sendMetaMsg error:', e.message)
      return sock.sendMessage(jid, { text: 'Error sending meta message' }, { quoted })
    }
  }

  client.pollResult = async (jid, poll, quoted) => {
    try {
      const msg = {
        pollCreationMessage: {
          name: poll.name || 'Poll Result',
          options: (poll.votes || []).map(v => ({
            optionName: v.name || '',
            optionVoters: v.count || 0,
          })),
          selectableOptionsCount: 1,
        },
      }
      return sock.relayMessage(jid, msg, {})
    } catch (e) {
      console.error('[Message] pollResult error:', e.message)
      return null
    }
  }

  client.decodeJid = (jid) => {
    if (!jid) return ''
    return jid.replace(/:\d+@/, '@')
  }

  client.getAdmin = async (jid) => {
    try {
      const group = await sock.groupMetadata(jid)
      return group.participants
        .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
        .map(p => p.id)
    } catch (e) {
      return []
    }
  }

  client.lidParser = (participants = []) => {
    return participants.map(p => {
      if (typeof p === 'string') return p
      if (p.id) return p.id
      if (p.jid) return p.jid
      return p
    })
  }

  client.resolveGroupMetadata = async (jid) => {
    try {
      return await sock.groupMetadata(jid)
    } catch (e) {
      return null
    }
  }

  client.fetchBlocklist = async () => {
    try {
      return await sock.fetchBlocklist()
    } catch (e) {
      return []
    }
  }

  client.sendPresenceUpdate = (type, jid) => {
    try {
      sock.sendPresenceUpdate(type || 'available', jid)
    } catch (e) {}
  }

  client.readMessages = (keys) => {
    try {
      sock.readMessages(keys)
    } catch (e) {}
  }

  client.updateBlockStatus = async (jid, action) => {
    try {
      return await sock.updateBlockStatus(jid, action)
    } catch (e) {
      return null
    }
  }
}

module.exports = { applyMessageMethods }
