const crypto = require('node:crypto')

class Chiper {
  constructor(secretKey) {
    this.algorithm = 'aes-256-cbc'
    if (secretKey) {
      this.key = crypto.createHash('sha256').update(secretKey).digest()
    } else {
      this.key = crypto.randomBytes(32)
    }
  }

  encrypt(text) {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv)
    let encrypted = cipher.update(text, 'utf-8', 'hex')
    encrypted += cipher.final('hex')
    return iv.toString('hex') + ':' + encrypted
  }

  decrypt(encryptedText) {
    const parts = encryptedText.split(':')
    const iv = Buffer.from(parts.shift(), 'hex')
    const encrypted = parts.join(':')
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv)
    let decrypted = decipher.update(encrypted, 'hex', 'utf-8')
    decrypted += decipher.final('utf-8')
    return decrypted
  }

  static encryptWithKey(text, key) {
    const chiper = new Chiper(key)
    return chiper.encrypt(text)
  }

  static decryptWithKey(encryptedText, key) {
    const chiper = new Chiper(key)
    return chiper.decrypt(encryptedText)
  }
}

module.exports = Chiper
module.exports.default = Chiper
