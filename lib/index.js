require('dotenv/config')

const fs = require('node:fs')
const path = require('node:path')

const CACHE_DIR = path.join(process.cwd(), '.cache')
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true })
}

const CryptoKey = require('./utils/cryptokey.js')
const Chiper = require('./utils/chiper.js')
const Client = require('./core/connection.js')
const Cooldown = require('./utils/cooldown.js')
const Converter = require('./utils/converter.js')
const Database = require('./database/index.js')
const Proxy = require('./proxy/index.js')
const Adapter = require('./adapter/index.js')
const Memory = require('./memory/index.js')
const Instance = require('./core/instance.js')
const JID = require('./utils/jid-helper.js')
const Scraper = require('./utils/scraper.js')
const Spam = require('./utils/spam.js')
const Exif = require('./utils/exif.js')
const Functions = require('./utils/functions.js')
const Node = require('./core/node.js')
const { pkg } = require('./types/index.js')

let Config = {}
const configPath = './config.json'
if (fs.existsSync(configPath)) {
  try {
    Config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
  } catch (e) {
    Config = {}
  }
}

let NeoxrApi
try {
  NeoxrApi = require('@neoxr/api')
  if (NeoxrApi?.default) NeoxrApi = NeoxrApi.default
} catch (e) {
  NeoxrApi = null
}

const Version = pkg?.version || '0.0.0'
const Utils = { ...Functions }

module.exports = {
  Client,
  Database,
  Proxy,
  Adapter,
  Memory,
  Config,
  Cooldown,
  Converter,
  Instance,
  JID,
  Scraper,
  Spam,
  Chiper,
  CryptoKey,
  Exif,
  Node,
  NeoxrApi,
  Utils,
  Version,
  Collection: null,
  Create: null,
  Loader: null,
}
