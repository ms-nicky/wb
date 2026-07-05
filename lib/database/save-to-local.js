const fs = require('node:fs')
const path = require('node:path')

let data = { users: [], groups: [], chats: [], setting: {}, top: [], res: [], expired: {}, premium: {} }

async function saveToLocal(dir) {
  const file = path.join(path.resolve(dir || 'database'), 'database.json')

  try {
    if (!fs.existsSync(path.dirname(file))) {
      fs.mkdirSync(path.dirname(file), { recursive: true })
    }
    if (fs.existsSync(file)) {
      const parsed = JSON.parse(fs.readFileSync(file, 'utf-8'))
      data = { ...data, ...parsed }
    }
  } catch (e) {
    console.error('[Database] saveToLocal error:', e.message)
  }

  data.__persist = () => {
    try {
      fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8')
    } catch (e) {
      console.error('[Database] persist error:', e.message)
    }
  }

  return data
}

module.exports = { saveToLocal }
