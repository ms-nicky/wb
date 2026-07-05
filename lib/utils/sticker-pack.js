const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')

class StickerPack {
  constructor(options = {}) {
    this.name = options.name || 'Sticker Pack'
    this.author = options.author || '@neoxr.js'
    this.stickers = []
    this.metadata = {
      created: Date.now(),
      count: 0,
    }
  }

  add(sticker) {
    const entry = {
      id: crypto.randomBytes(8).toString('hex'),
      data: Buffer.isBuffer(sticker) ? sticker : Buffer.from(sticker),
      added: Date.now(),
    }
    this.stickers.push(entry)
    this.metadata.count = this.stickers.length
    return entry.id
  }

  remove(id) {
    const index = this.stickers.findIndex(s => s.id === id)
    if (index >= 0) {
      this.stickers.splice(index, 1)
      this.metadata.count = this.stickers.length
      return true
    }
    return false
  }

  get(id) {
    return this.stickers.find(s => s.id === id) || null
  }

  getAll() {
    return this.stickers
  }

  count() {
    return this.stickers.length
  }

  clear() {
    this.stickers = []
    this.metadata.count = 0
  }

  toJSON() {
    return {
      name: this.name,
      author: this.author,
      metadata: this.metadata,
      stickers: this.stickers.map(s => ({
        id: s.id,
        data: s.data.toString('base64'),
        added: s.added,
      })),
    }
  }

  static fromJSON(json) {
    const pack = new StickerPack({ name: json.name, author: json.author })
    pack.metadata = json.metadata || { created: Date.now(), count: 0 }
    if (json.stickers) {
      json.stickers.forEach(s => {
        pack.stickers.push({
          id: s.id,
          data: Buffer.from(s.data, 'base64'),
          added: s.added,
        })
      })
    }
    pack.metadata.count = pack.stickers.length
    return pack
  }

  static saveToFile(pack, filePath) {
    const json = JSON.stringify(pack.toJSON(), null, 2)
    fs.writeFileSync(filePath, json, 'utf-8')
  }

  static loadFromFile(filePath) {
    if (!fs.existsSync(filePath)) return null
    const json = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    return StickerPack.fromJSON(json)
  }
}

module.exports = StickerPack
module.exports.default = StickerPack
