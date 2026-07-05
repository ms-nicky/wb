const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const { tmpdir } = require('node:os')

class Converter {
  static getTmpFile(extension = '') {
    const name = crypto.randomBytes(6).readUInt32LE(0).toString(36)
    return path.join(tmpdir(), `${name}${extension ? '.' + extension : ''}`)
  }

  static bufferToFile(buffer, filename) {
    const file = filename || this.getTmpFile()
    fs.writeFileSync(file, buffer)
    return file
  }

  static fileToBuffer(filePath) {
    return fs.readFileSync(filePath)
  }

  static async toWebp(buffer, opts = {}) {
    const sharp = require('sharp')
    const tmpFile = this.getTmpFile('webp')
    try {
      await sharp(buffer)
        .webp({ quality: opts.quality || 80 })
        .toFile(tmpFile)
      return fs.readFileSync(tmpFile)
    } finally {
      try { fs.unlinkSync(tmpFile) } catch (e) {}
    }
  }

  static async toPng(buffer) {
    const sharp = require('sharp')
    const tmpFile = this.getTmpFile('png')
    try {
      await sharp(buffer)
        .png()
        .toFile(tmpFile)
      return fs.readFileSync(tmpFile)
    } finally {
      try { fs.unlinkSync(tmpFile) } catch (e) {}
    }
  }

  static async toJpeg(buffer, quality = 80) {
    const sharp = require('sharp')
    const tmpFile = this.getTmpFile('jpg')
    try {
      await sharp(buffer)
        .jpeg({ quality })
        .toFile(tmpFile)
      return fs.readFileSync(tmpFile)
    } finally {
      try { fs.unlinkSync(tmpFile) } catch (e) {}
    }
  }

  static async toMp3(buffer) {
    const ffmpeg = require('fluent-ffmpeg')
    const input = this.getTmpFile('oga')
    const output = this.getTmpFile('mp3')
    fs.writeFileSync(input, buffer)
    return new Promise((resolve, reject) => {
      ffmpeg(input)
        .toFormat('mp3')
        .on('end', () => {
          try {
            const result = fs.readFileSync(output)
            resolve(result)
          } catch (e) {
            reject(e)
          } finally {
            try { fs.unlinkSync(input) } catch (e) {}
            try { fs.unlinkSync(output) } catch (e) {}
          }
        })
        .on('error', (err) => {
          try { fs.unlinkSync(input) } catch (e) {}
          try { fs.unlinkSync(output) } catch (e) {}
          reject(err)
        })
        .save(output)
    })
  }

  static async toMp4(buffer) {
    const ffmpeg = require('fluent-ffmpeg')
    const input = this.getTmpFile('webm')
    const output = this.getTmpFile('mp4')
    fs.writeFileSync(input, buffer)
    return new Promise((resolve, reject) => {
      ffmpeg(input)
        .toFormat('mp4')
        .on('end', () => {
          try {
            const result = fs.readFileSync(output)
            resolve(result)
          } catch (e) {
            reject(e)
          } finally {
            try { fs.unlinkSync(input) } catch (e) {}
            try { fs.unlinkSync(output) } catch (e) {}
          }
        })
        .on('error', (err) => {
          try { fs.unlinkSync(input) } catch (e) {}
          try { fs.unlinkSync(output) } catch (e) {}
          reject(err)
        })
        .save(output)
    })
  }

  static async toGif(buffer) {
    const ffmpeg = require('fluent-ffmpeg')
    const input = this.getTmpFile('mp4')
    const output = this.getTmpFile('gif')
    fs.writeFileSync(input, buffer)
    return new Promise((resolve, reject) => {
      ffmpeg(input)
        .toFormat('gif')
        .on('end', () => {
          try {
            const result = fs.readFileSync(output)
            resolve(result)
          } catch (e) {
            reject(e)
          } finally {
            try { fs.unlinkSync(input) } catch (e) {}
            try { fs.unlinkSync(output) } catch (e) {}
          }
        })
        .on('error', (err) => {
          try { fs.unlinkSync(input) } catch (e) {}
          try { fs.unlinkSync(output) } catch (e) {}
          reject(err)
        })
        .save(output)
    })
  }

  static async compressImage(buffer, quality = 50) {
    return this.toJpeg(buffer, quality)
  }

  static async resize(buffer, width, height) {
    const sharp = require('sharp')
    return sharp(buffer).resize(width, height).toBuffer()
  }

  static async getMetadata(buffer) {
    const sharp = require('sharp')
    return sharp(buffer).metadata()
  }
}

module.exports = Converter
module.exports.default = Converter
