const crypto = require('node:crypto')

class CryptoKey {
  static generateKey(length = 32) {
    return crypto.randomBytes(length).toString('hex')
  }

  static generateIV(length = 16) {
    return crypto.randomBytes(length).toString('hex')
  }

  static encrypt(text, key, iv) {
    const keyBuffer = Buffer.from(key, 'hex')
    const ivBuffer = Buffer.from(iv, 'hex')
    const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, ivBuffer)
    let encrypted = cipher.update(text, 'utf-8', 'hex')
    encrypted += cipher.final('hex')
    return encrypted
  }

  static decrypt(encrypted, key, iv) {
    const keyBuffer = Buffer.from(key, 'hex')
    const ivBuffer = Buffer.from(iv, 'hex')
    const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, ivBuffer)
    let decrypted = decipher.update(encrypted, 'hex', 'utf-8')
    decrypted += decipher.final('utf-8')
    return decrypted
  }

  static hash(text, algorithm = 'sha256') {
    return crypto.createHash(algorithm).update(text).digest('hex')
  }

  static hmac(text, secret, algorithm = 'sha256') {
    return crypto.createHmac(algorithm, secret).update(text).digest('hex')
  }

  static randomString(length = 16) {
    return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length)
  }
}

module.exports = CryptoKey
module.exports.default = CryptoKey
