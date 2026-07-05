# Modifications to `@neoxr/wb` (v6.0.0-rc.66)

## Overview

All files under `lib/` were rewritten from obfuscated (eval + string array + control flow flattening) to clean, readable JavaScript. The rewrite preserves the original API surface while fixing several bugs and adding missing functionality.

---

## Files Rewritten

### Core (`lib/core/`)
| File | Description |
|------|-------------|
| `connection.js` | `Client` class extending `EventEmitter` |
| `instance.js` | Sub-bot / Instance system |
| `message.js` | All Client prototype methods (reply, sendFile, sendSticker, etc.) |
| `node.js` | Node package info |
| `serialize.js` | Message serializer (`smsg`, `serialize`) |

### Utils (`lib/utils/`)
| File | Description |
|------|-------------|
| `chiper.js` | AES-256-CBC cipher with auto-generated key |
| `converter.js` | Media converter (webp, png, jpeg, mp3, mp4, gif) |
| `cooldown.js` | Cooldown system using `@cacheable/node-cache` |
| `cryptokey.js` | AES-256-CBC encrypt/decrypt, hash, HMAC |
| `exif.js` | WebP sticker EXIF metadata |
| `functions.js` | Utility functions (includes 11 Utils methods) |
| `jid-helper.js` | JID normalization, decode, phone formatting |
| `loader.js` | Plugin scanner with bug fixes |
| `logs.js` | Colored logging with levels |
| `queue.js` | Task queue with concurrency control |
| `scraper.js` | HTTP fetch, TikTok/Instagram/YouTube downloaders |
| `session-manager.js` | File-based session persistence |
| `spam.js` | Spam detection with configurable max/window |
| `sticker-pack.js` | Sticker pack collection with JSON persistence |

### Types (`lib/types/`)
| File | Description |
|------|-------------|
| `index.js` | Re-exports and package info |
| `utils.js` | Type constants (message types, content types) |
| `baileys.js` | Baileys type mappings |

### Database (`lib/database/`)
| File | Description |
|------|-------------|
| `index.js` | Static `saveToXxx` exports (plain object pattern) |
| `save-to-local.js` | JSON file — returns `{ users, groups, chats, setting }` |
| `save-to-sqlite.js` | SQLite — returns plain object with `__persist` |
| `save-to-mysql.js` | MySQL — returns plain object with `__persist` |
| `save-to-postgresql.js` | PostgreSQL — returns plain object with `__persist` |
| `save-to-mongo.js` | MongoDB — returns plain object with `__persist` |
| `save-to-redis.js` | Redis — returns plain object with `__persist` |

### Listener (`lib/listener/`)
| File | Description |
|------|-------------|
| `index.js` | Listener registry |
| `messages-upsert.js` | New message handler |
| `messages-upsert-self.js` | Self-message handler |
| `messages-update.js` | Message update handler |
| `message-reaction.js` | Reaction handler |
| `message-receipt-update.js` | Read receipt handler |
| `contacts-upsert.js` | New contact handler |
| `contacts-update.js` | Contact update handler |
| `groups-update.js` | Group metadata update handler |
| `group-participants-update.js` | Group participant change handler |
| `group-join-request.js` | Group join request handler |
| `chats-update.js` | Chat update handler |
| `presence-update.js` | Presence update handler |

### Proxy (`lib/proxy/`)
| File | Description |
|------|-------------|
| `index.js` | Proxy factory |
| `proxy-json.js` | JSON file proxy |
| `proxy-sqlite.js` | SQLite proxy |
| `proxy-mysql.js` | MySQL proxy |
| `proxy-postgresql.js` | PostgreSQL proxy |
| `proxy-mongo.js` | MongoDB proxy |
| `proxy-redis.js` | Redis proxy |

### Adapter (`lib/adapter/`)
| File | Description |
|------|-------------|
| `index.js` | Auth adapter factory |
| `use-auth-redis.js` | Redis auth adapter |
| `use-auth-sqlite.js` | SQLite auth adapter |
| `use-auth-mysql.js` | MySQL auth adapter |
| `use-auth-postgresql.js` | PostgreSQL auth adapter |
| `use-auth-mongo.js` | MongoDB auth adapter |

### Memory (`lib/memory/`)
| File | Description |
|------|-------------|
| `index.js` | In-memory cache (wraps `@cacheable/node-cache`) |
| `localy-store.js` | Persistent file-based key-value store |
| `temporary-store.js` | TTL-based temporary storage |

### Entry
| File | Description |
|------|-------------|
| `lib/index.js` | Public API exports |

---

## Bug Fixes (Round 1)

### 1. Plugin Scanner (`lib/utils/loader.js`)
- **`concat` error**: Scan only `.js` files (filter with `file.endsWith('.js')`)
- **`updatePlugin` null check**: Added `if (plugin && typeof plugin === 'object')` wrapper
- **Import error handling**: Wrapped each `import()` in try/catch so one broken plugin doesn't crash the whole loader
- **Duplicate commands**: Use a Map keyed by command name to prevent duplicates

### 2. `associateSocketWithBot` (`lib/core/connection.js`)
- **Array initialization**: Added `this.plugins = []` and `this.commands = []` default values before plugin loading
- **Getter `updatePlugin`**: Now always returns an array (filtered, unique commands)
- **Plugin event registration**: Events are registered once per loaded plugin

### 3. `sendMessage` raw protobuf (`lib/core/connection.js`)
- **Override `sock.sendMessage`**: Uses `relayMessage` for protocol message types (listMessage, productMessage, interactiveMessage, interactiveResponseMessage) that `generateWAMessageContent` doesn't support
- **Fallback to original**: For standard message types, delegates to the original Baileys `sendMessage`

---

## Bug Fixes (Round 2)

### 4. Database API — Static `saveToXxx` returning plain object (`lib/database/`)
- **Before**: Class-based `useDatabase(type)` factory returning `new XxxDatabase()`
- **After**: Static functions `Database.saveToLocal(dir)`, `Database.saveToMongo(url)`, etc.
- **Return type**: Plain JS object `{ users: [], groups: [], chats: [], setting: {} }` with `__persist()` method
- **Same reference**: Returning the same `data` object so mutations (`global.db.users.push(...)`) persist

### 5. Message methods — Copied to `client.sock` + new methods (`lib/core/message.js`)
- **Method copy**: All 29 methods now copied to `client.sock` via `for (const name of methodNames) sock[name] = client[name]`
- **`getRealJid(sender)`**: Resolves LID to JID via group metadata or `sock.onWhatsApp`
- **`getUserId(jid)`**: Wraps `sock.onWhatsApp(jid)` returns `{ lid, jid }`

### 6. Utils — 11 missing methods (`lib/utils/functions.js`)
| Method | Description |
|--------|-------------|
| `Styles(text)` | Returns formatted/styled text |
| `texted(type, text)` | Wraps text: `bold` → `*text*`, `monospace` → `` `text` ``, `italic` → `_text_` |
| `printError(error)` | Pretty-prints error stack with timestamp |
| `delay(ms)` | `new Promise(r => setTimeout(r, ms))` |
| `fetchAsBuffer(url)` | HTTP GET returning `Buffer` via axios |
| `generateLink(text)` | Extracts all URLs from string, returns array |
| `hitstat(command, sender)` | Tracks command usage counts in memory |
| `toTime(ms)` | Converts ms to `"1h 1m 1s"` format |
| `random(array)` | Returns random element |
| `jsonFormat(obj)` | `JSON.stringify(obj, null, 2)` |
| `matcher(input, candidates)` | Levenshtein-based fuzzy matching, returns `{ string, accuracy }[]` sorted desc |

### 7. Event context fixes (`lib/core/connection.js`)
- **`group.add`/`group.remove`**: Context now includes `{ jid, member: { phoneNumber }, subject, groupMetadata }` with resolved group metadata
- **`message.delete` event**: Detects `protocolMessage.type === 0` in `messages.update`, emits `{ message: { key, sender, isGroup, chat } }`
- **`stories` synthetic event**: Filters `status@broadcast` messages in `messages.upsert`, emits story context
- **`register` alias**: `Client.prototype.register = Client.prototype.on`

### 8. Config fallback (`lib/index.js`)
- **Before**: Only tried `./config.json`
- **After**: Tries `./config.json` first, then falls back to `./config.js` via `require()`

---

## Public API Exports (`lib/index.js`)

```js
module.exports = {
  Client,    // WhatsApp bot client
  Database,  // Static saveToXxx functions
  Proxy,     // Key-value proxy factory
  Adapter,   // Auth adapter factory
  Memory,    // In-memory cache
  Config,    // config.json / config.js contents
  Cooldown,  // Cooldown class
  Converter, // Media converter
  Instance,  // Sub-bot instance manager
  JID,       // JID helper utilities
  Scraper,   // Web scrapers
  Spam,      // Spam detector
  Chiper,    // AES cipher
  CryptoKey, // Crypto utilities
  Exif,      // Sticker EXIF
  Node,      // Node package info
  NeoxrApi,  // @neoxr/api (optional)
  Utils,     // Utility functions (includes 11 new methods)
  Version,   // Package version
}
```

---

## Key Design Decisions

1. **CommonJS**: All modules use `require`/`module.exports` for consistency with `package.json` entry point.
2. **No ESM import in loader**: Uses `import()` for dynamic plugin imports (ESM-compatible).
3. **EventEmitter pattern**: `Client` extends `EventEmitter` for plugin event compatibility.
4. **relayMessage override**: Handles protobuf types not supported by Baileys `generateWAMessageContent`.
5. **Per-file error handling**: Each plugin file is imported independently so failures don't cascade.
6. **Plain object database**: `saveToXxx` returns a plain mutable object (not class instance) so consumers can do `global.db.users.push(...)` directly.
7. **Dual method registration**: Message methods are attached to both `client` and `client.sock` for flexibility.
8. **LID resolution**: `getRealJid` handles the Baileys LID → JID conversion needed for group operations.

---

## Checklist

### Round 1
- [x] All `lib/` files rewritten (no obfuscated code remains)
- [x] Plugin scanner filters `.js` files only
- [x] `updatePlugin` handles null/undefined plugins
- [x] `associateSocketWithBot` initializes arrays before use
- [x] `sendMessage` overridden for list/product/interactive messages
- [x] All database modules implemented (local, sqlite, mysql, postgres, mongo, redis)
- [x] All auth adapters implemented (redis, sqlite, mysql, postgres, mongo)
- [x] All proxy backends implemented (json, sqlite, mysql, postgres, mongo, redis)
- [x] All memory stores implemented (cache, local, temporary)
- [x] All 13 event listeners implemented
- [x] Public API exports complete

### Round 2
- [x] `saveToLocal`, `saveToMongo`, etc. return plain object, not class instance
- [x] `Database` exports static `saveToXxx` functions directly
- [x] All message methods copied to `client.sock`
- [x] `getRealJid` resolves LID to JID
- [x] `getUserId` wraps `onWhatsApp`
- [x] 11 Utils methods: `Styles`, `texted`, `printError`, `delay`, `fetchAsBuffer`, `generateLink`, `hitstat`, `toTime`, `random`, `jsonFormat`, `matcher`
- [x] `group.add`/`remove` context includes `{ jid, member, subject, groupMetadata }`
- [x] `message.delete` event from `messages.update` protocol messages
- [x] `stories` synthetic event from `status@broadcast` upserts
- [x] `register` alias (`Client.prototype.register = Client.prototype.on`)
- [x] Config fallback: `config.json` → `config.js`
