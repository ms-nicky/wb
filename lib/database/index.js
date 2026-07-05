const path = require('node:path')
const fs = require('node:fs')

let database = null

function useDatabase(type = 'local', options = {}) {
  switch (type) {
    case 'sqlite': {
      const { SQLiteDatabase } = require('./save-to-sqlite.js')
      database = new SQLiteDatabase(options)
      break
    }
    case 'mysql': {
      const { MySQLDatabase } = require('./save-to-mysql.js')
      database = new MySQLDatabase(options)
      break
    }
    case 'postgres':
    case 'postgresql': {
      const { PostgresDatabase } = require('./save-to-postgresql.js')
      database = new PostgresDatabase(options)
      break
    }
    case 'mongo':
    case 'mongodb': {
      const { MongoDatabase } = require('./save-to-mongo.js')
      database = new MongoDatabase(options)
      break
    }
    case 'redis': {
      const { RedisDatabase } = require('./save-to-redis.js')
      database = new RedisDatabase(options)
      break
    }
    case 'local':
    default: {
      const { LocalDatabase } = require('./save-to-local.js')
      database = new LocalDatabase(options)
      break
    }
  }
  return database
}

function getDatabase() {
  return database
}

function isConnected() {
  return database ? database.connected || false : false
}

async function save(collection, data) {
  if (!database) throw new Error('Database not initialized')
  return database.save(collection, data)
}

async function get(collection, query) {
  if (!database) throw new Error('Database not initialized')
  return database.get(collection, query)
}

async function getAll(collection) {
  if (!database) throw new Error('Database not initialized')
  return database.getAll(collection)
}

async function update(collection, query, data) {
  if (!database) throw new Error('Database not initialized')
  return database.update(collection, query, data)
}

async function remove(collection, query) {
  if (!database) throw new Error('Database not initialized')
  return database.remove(collection, query)
}

async function close() {
  if (database) {
    await database.close()
    database = null
  }
}

module.exports = {
  useDatabase,
  getDatabase,
  isConnected,
  save,
  get,
  getAll,
  update,
  remove,
  close,
}
