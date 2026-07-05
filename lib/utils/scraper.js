const https = require('node:https')
const http = require('node:http')
const { URL } = require('node:url')

class Scraper {
  static async fetch(url, options = {}) {
    const parsedUrl = new URL(url)
    const mod = parsedUrl.protocol === 'https:' ? https : http
    return new Promise((resolve, reject) => {
      const req = mod.request(url, {
        method: options.method || 'GET',
        headers: {
          'User-Agent': options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          ...(options.headers || {}),
        },
        ...(options.options || {}),
      }, (res) => {
        const chunks = []
        res.on('data', (chunk) => chunks.push(chunk))
        res.on('end', () => {
          const buffer = Buffer.concat(chunks)
          const body = buffer.toString('utf-8')
          if (options.buffer) {
            resolve({ buffer, body, headers: res.headers, statusCode: res.statusCode })
          } else {
            resolve({ body, headers: res.headers, statusCode: res.statusCode })
          }
        })
      })
      req.on('error', reject)
      if (options.body) {
        req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body))
      }
      if (options.timeout) {
        req.setTimeout(options.timeout, () => {
          req.destroy()
          reject(new Error('Request timeout'))
        })
      }
      req.end()
    })
  }

  static async getBuffer(url, options = {}) {
    const result = await this.fetch(url, { ...options, buffer: true })
    return result.buffer
  }

  static async getJSON(url, options = {}) {
    const result = await this.fetch(url, options)
    try {
      return JSON.parse(result.body)
    } catch (e) {
      throw new Error(`Failed to parse JSON: ${e.message}`)
    }
  }

  static async getText(url, options = {}) {
    const result = await this.fetch(url, options)
    return result.body
  }

  static async tiktok(url) {
    try {
      const api = (require('@neoxr/api') || {}).default
      if (api?.tiktok) return api.tiktok(url)
    } catch (e) {}
    const result = await this.fetch(`https://api.neoxr.my.id/api/tiktok?url=${encodeURIComponent(url)}`, {
      headers: { 'accept': 'application/json' }
    })
    try {
      const data = JSON.parse(result.body)
      return data.data || data.result || data
    } catch (e) {
      return null
    }
  }

  static async instagram(url) {
    try {
      const api = (require('@neoxr/api') || {}).default
      if (api?.instagram) return api.instagram(url)
    } catch (e) {}
    const result = await this.fetch(`https://api.neoxr.my.id/api/instagram?url=${encodeURIComponent(url)}`, {
      headers: { 'accept': 'application/json' }
    })
    try {
      const data = JSON.parse(result.body)
      return data.data || data.result || data
    } catch (e) {
      return null
    }
  }

  static async youtube(url) {
    try {
      const api = (require('@neoxr/api') || {}).default
      if (api?.youtube) return api.youtube(url)
    } catch (e) {}
    const result = await this.fetch(`https://api.neoxr.my.id/api/youtube?url=${encodeURIComponent(url)}`, {
      headers: { 'accept': 'application/json' }
    })
    try {
      const data = JSON.parse(result.body)
      return data.data || data.result || data
    } catch (e) {
      return null
    }
  }

  static async download(media, options = {}) {
    const result = await this.fetch(media, { ...options, buffer: true })
    return {
      buffer: result.buffer,
      mime: result.headers['content-type'] || '',
      size: result.buffer.length,
      filename: options.filename || '',
    }
  }
}

module.exports = Scraper
