const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const { tmpdir } = require('node:os')

class Exif {
  constructor(options = {}) {
    this.packname = options.packname || 'Sticker by'
    this.author = options.author || '@neoxr.js'
    this.quality = options.quality || 80
  }

  async create(buffer) {
    const WebP = require('node-webpmux')
    const img = new WebP.Image()
    const tmpFile = path.join(tmpdir(), crypto.randomBytes(6).toString('hex') + '.webp')
    fs.writeFileSync(tmpFile, buffer)
    try {
      await img.load(tmpFile)
      const exif = this.createExif()
      img.exif = exif.toString('hex')
      const output = path.join(tmpdir(), crypto.randomBytes(6).toString('hex') + '.webp')
      await img.save(output)
      const result = fs.readFileSync(output)
      try { fs.unlinkSync(output) } catch (e) {}
      return result
    } finally {
      try { fs.unlinkSync(tmpFile) } catch (e) {}
    }
  }

  createExif() {
    const json = {
      'sticker-pack-id': crypto.randomBytes(8).toString('hex'),
      'sticker-pack-name': this.packname,
      'sticker-pack-publisher': this.author,
      'sticker-pack-publisher-email': '',
      'sticker-pack-publisher-website': '',
      'android-app-store-link': '',
      'ios-app-store-link': '',
    }
    const header = Buffer.from([0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00])
    const jsonData = Buffer.from(JSON.stringify(json), 'utf-8')
    const exif = Buffer.concat([header, jsonData])
    return exif
  }

  static async setExif(buffer, packname, author) {
    const exif = new Exif({ packname, author })
    return exif.create(buffer)
  }

  static async getExif(buffer) {
    const WebP = require('node-webpmux')
    const img = new WebP.Image()
    const tmpFile = path.join(tmpdir(), crypto.randomBytes(6).toString('hex') + '.webp')
    fs.writeFileSync(tmpFile, buffer)
    try {
      await img.load(tmpFile)
      if (img.exif) {
        const exifHex = img.exif.toString('hex')
        const exifBuffer = Buffer.from(exifHex, 'hex')
        const jsonStart = exifBuffer.indexOf(0x7b)
        const jsonEnd = exifBuffer.lastIndexOf(0x7d)
        if (jsonStart >= 0 && jsonEnd >= 0) {
          const jsonStr = exifBuffer.slice(jsonStart, jsonEnd + 1).toString('utf-8')
          return JSON.parse(jsonStr)
        }
      }
      return null
    } finally {
      try { fs.unlinkSync(tmpFile) } catch (e) {}
    }
  }
}

module.exports = Exif
module.exports.default = Exif
