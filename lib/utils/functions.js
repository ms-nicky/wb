const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const axios = require('axios').default || require('axios')

async function getFile(buffer, filename) {
  if (!buffer) return { status: false, error: 'No buffer provided' }
  try {
    let fileData = buffer
    let url = ''
    if (typeof buffer === 'string' && (buffer.startsWith('http://') || buffer.startsWith('https://'))) {
      url = buffer
      const response = await axios.get(buffer, { responseType: 'arraybuffer' })
      fileData = Buffer.from(response.data)
    } else if (typeof buffer === 'string' && buffer.startsWith('data:')) {
      const base64Data = buffer.split(',')[1]
      fileData = Buffer.from(base64Data, 'base64')
    } else if (typeof buffer === 'string') {
      if (fs.existsSync(buffer)) {
        fileData = fs.readFileSync(buffer)
      } else {
        fileData = Buffer.from(buffer, 'utf-8')
      }
    } else if (Buffer.isBuffer(buffer)) {
      fileData = buffer
    } else if (buffer?.pipe && typeof buffer.pipe === 'function') {
      const chunks = []
      for await (const chunk of buffer) {
        chunks.push(chunk)
      }
      fileData = Buffer.concat(chunks)
    } else {
      return { status: false, error: 'Invalid buffer type' }
    }
    const fileType = require('file-type')
    const type = await fileType.fromBuffer(fileData)
    const mime = type?.mime || 'application/octet-stream'
    const ext = type?.ext || (filename ? path.extname(filename).replace('.', '') : 'bin')
    const tmpDir = path.join(process.cwd(), '.cache')
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true })
    }
    const tmpFile = path.join(tmpDir, `${crypto.randomBytes(6).toString('hex')}.${ext}`)
    fs.writeFileSync(tmpFile, fileData)
    return {
      status: true,
      file: tmpFile,
      filename: filename || `${crypto.randomBytes(4).toString('hex')}.${ext}`,
      data: fileData,
      mime,
      ext,
      size: fileData.length,
      url,
      delete: () => {
        try { fs.unlinkSync(tmpFile) } catch (e) {}
      },
    }
  } catch (error) {
    return { status: false, error: error.message }
  }
}

function parseMention(text) {
  if (!text) return []
  const mentions = []
  const regex = /@(\d+)/g
  let match
  while ((match = regex.exec(text)) !== null) {
    mentions.push(`${match[1]}@s.whatsapp.net`)
  }
  return mentions
}

function generateMessageId() {
  return crypto.randomBytes(8).toString('hex').toUpperCase()
}

function formatSize(bytes) {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`
}

function formatDuration(seconds) {
  if (!seconds || seconds === Infinity || isNaN(seconds)) return '∞'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m}:${s.toString().padStart(2, '0')}`
}

function relativeTime(timestamp) {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days} day(s) ago`
  if (hours > 0) return `${hours} hour(s) ago`
  if (minutes > 0) return `${minutes} minute(s) ago`
  return `${seconds} second(s) ago`
}

function extractCommand(body, prefixes) {
  if (!body) return { prefix: '', command: '', args: [], text: '' }
  for (const prefix of prefixes) {
    if (prefix && body.startsWith(prefix)) {
      const rest = body.slice(prefix.length).trim()
      const parts = rest.split(/[\s\n]+/)
      return {
        prefix,
        command: parts[0] || '',
        args: parts.slice(1),
        text: parts.slice(1).join(' '),
      }
    }
  }
  return { prefix: '', command: '', args: [], text: body }
}

function generateByte(length = 6) {
  return crypto.randomBytes(length).toString('hex')
}

function base64ToBuffer(base64) {
  return Buffer.from(base64, 'base64')
}

function bufferToBase64(buffer) {
  return buffer.toString('base64')
}

function jsonParseSafe(str, fallback = {}) {
  try {
    return JSON.parse(str)
  } catch (e) {
    return fallback
  }
}

function msToTime(ms) {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}

function clockString(ms) {
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return [h && `${h}:`, m && `${m.toString().padStart(2, '0')}:`, `${s.toString().padStart(2, '0')}`].filter(Boolean).join('')
}

function isUrl(string) {
  return /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/i.test(string)
}

function removeEmojis(string) {
  return string.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
}

function chunkArray(array, size) {
  const result = []
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size))
  }
  return result
}

function Styles(text) {
  if (!text) return ''
  return text
}

function texted(type, text) {
  if (!text) return ''
  switch (type) {
    case 'bold': return `*${text}*`
    case 'monospace': return '\`' + text + '\`'
    case 'italic': return `_${text}_`
    case 'strikethrough': return `~${text}~`
    default: return text
  }
}

function printError(error) {
  const timestamp = new Date().toISOString()
  const message = error?.message || String(error)
  const stack = error?.stack || ''
  console.error(`[${timestamp}] Error: ${message}`)
  if (stack) console.error(stack)
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchAsBuffer(url) {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' })
    return Buffer.from(response.data)
  } catch (e) {
    throw new Error(`fetchAsBuffer: ${e.message}`)
  }
}

function generateLink(text) {
  if (!text) return []
  const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi
  return text.match(urlRegex) || []
}

const hitstatCounts = {}

function hitstat(command, sender) {
  if (!command) return
  if (!hitstatCounts[command]) {
    hitstatCounts[command] = { count: 0, users: [] }
  }
  hitstatCounts[command].count++
  if (sender && !hitstatCounts[command].users.includes(sender)) {
    hitstatCounts[command].users.push(sender)
  }
}

function toTime(ms) {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const parts = []
  if (days > 0) parts.push(`${days}h`)
  if (hours % 24 > 0) parts.push(`${hours % 24}h`)
  if (minutes % 60 > 0) parts.push(`${minutes % 60}m`)
  if (seconds % 60 > 0) parts.push(`${seconds % 60}s`)
  return parts.join(' ') || '0s'
}

function random(array) {
  if (!Array.isArray(array) || array.length === 0) return undefined
  return array[Math.floor(Math.random() * array.length)]
}

function jsonFormat(obj) {
  return JSON.stringify(obj, null, 2)
}

function matcher(input, candidates) {
  if (!input || !Array.isArray(candidates)) return []
  const results = candidates.map(candidate => {
    const str = String(candidate)
    const inputLower = input.toLowerCase()
    const strLower = str.toLowerCase()
    let accuracy = 0
    if (strLower === inputLower) {
      accuracy = 100
    } else if (strLower.startsWith(inputLower)) {
      accuracy = 90
    } else if (strLower.includes(inputLower)) {
      accuracy = 70
    } else {
      const levenshtein = (a, b) => {
        const matrix = []
        for (let i = 0; i <= b.length; i++) matrix[i] = [i]
        for (let j = 0; j <= a.length; j++) matrix[0][j] = j
        for (let i = 1; i <= b.length; i++) {
          for (let j = 1; j <= a.length; j++) {
            if (b[i - 1] === a[j - 1]) {
              matrix[i][j] = matrix[i - 1][j - 1]
            } else {
              matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
            }
          }
        }
        return matrix[b.length][a.length]
      }
      const dist = levenshtein(inputLower, strLower)
      const maxLen = Math.max(inputLower.length, strLower.length)
      accuracy = maxLen > 0 ? Math.round((1 - dist / maxLen) * 100) : 0
    }
    return { string: str, accuracy }
  })
  return results.filter(v => v.accuracy >= 60).sort((a, b) => b.accuracy - a.accuracy)
}

module.exports = {
  getFile,
  parseMention,
  generateMessageId,
  formatSize,
  formatDuration,
  relativeTime,
  extractCommand,
  generateByte,
  base64ToBuffer,
  bufferToBase64,
  jsonParseSafe,
  msToTime,
  clockString,
  isUrl,
  removeEmojis,
  chunkArray,
  Styles,
  texted,
  printError,
  delay,
  fetchAsBuffer,
  generateLink,
  hitstat,
  toTime,
  random,
  jsonFormat,
  matcher,
}
