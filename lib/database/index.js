const path = require('node:path')
const fs = require('node:fs')

const { saveToLocal } = require('./save-to-local.js')
const { saveToSQLite } = require('./save-to-sqlite.js')
const { saveToMySQL } = require('./save-to-mysql.js')
const { saveToPostgres } = require('./save-to-postgresql.js')
const { saveToMongo } = require('./save-to-mongo.js')
const { saveToRedis } = require('./save-to-redis.js')

const Database = {
  saveToLocal,
  saveToSQLite,
  saveToMySQL,
  saveToPostgres,
  saveToMongo,
  saveToRedis,
}

module.exports = Database
