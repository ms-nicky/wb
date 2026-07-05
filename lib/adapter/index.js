module.exports = {
  useAuthRedis: async (options) => {
    const { RedisAuth } = require('./use-auth-redis.js')
    return RedisAuth.create(options)
  },
  useAuthSQLite: async (options) => {
    const { SQLiteAuth } = require('./use-auth-sqlite.js')
    return SQLiteAuth.create(options)
  },
  useAuthMySQL: async (options) => {
    const { MySQLAuth } = require('./use-auth-mysql.js')
    return MySQLAuth.create(options)
  },
  useAuthMongo: async (options) => {
    const { MongoAuth } = require('./use-auth-mongo.js')
    return MongoAuth.create(options)
  },
  useAuthPostgres: async (options) => {
    const { PostgresAuth } = require('./use-auth-postgresql.js')
    return PostgresAuth.create(options)
  },
}
