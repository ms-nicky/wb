const fs = require('node:fs')
const path = require('node:path')

function useProxy(type = 'json', options = {}) {
  let ProxyClass
  switch (type) {
    case 'json': ProxyClass = require('./proxy-json.js'); break
    case 'sqlite': ProxyClass = require('./proxy-sqlite.js'); break
    case 'mysql': ProxyClass = require('./proxy-mysql.js'); break
    case 'postgres':
    case 'postgresql': ProxyClass = require('./proxy-postgresql.js'); break
    case 'mongo':
    case 'mongodb': ProxyClass = require('./proxy-mongo.js'); break
    case 'redis': ProxyClass = require('./proxy-redis.js'); break
    default: ProxyClass = require('./proxy-json.js')
  }
  return new ProxyClass(options)
}

module.exports = { useProxy }
