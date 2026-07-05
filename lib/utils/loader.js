const fs = require('node:fs')
const path = require('node:path')
const { pathToFileURL } = require('node:url')

async function scanDir(dir, baseDir, client) {
  const plugins = []
  const commands = []
  const absoluteDir = path.resolve(dir)

  if (!fs.existsSync(absoluteDir)) return { plugins, commands }

  const entries = fs.readdirSync(absoluteDir, { withFileTypes: true })

  for (const entry of entries) {
    const full = path.join(absoluteDir, entry.name)

    if (entry.isDirectory()) {
      const sub = await scanDir(full, baseDir, client)
      plugins.push(...sub.plugins)
      commands.push(...sub.commands)
      continue
    }

    if (!entry.isFile() || !entry.name.endsWith('.js')) continue

    try {
      const mod = await import(pathToFileURL(full).href)
      if (!mod || !mod.run) continue

      const pluginPath = path.relative(baseDir, full).replace(/\.js$/, '')
      const plugin = {
        path: pluginPath,
        fullPath: full,
        run: mod.run,
        type: 'module',
      }
      plugins.push(plugin)

      if (typeof client?.updatePlugin === 'function') {
        try {
          client.updatePlugin(plugin)
        } catch (e) {
          console.warn(`[Loader] updatePlugin failed for ${pluginPath}: ${e.message}`)
        }
      }

      const usage = extractUsage(mod.run)
      if (Array.isArray(usage)) commands.push(...usage)
    } catch (e) {
      console.warn(`[Loader] Skipping ${entry.name}: ${e.message}`)
    }
  }

  return { plugins, commands }
}

async function scanPlugins(dir, client) {
  const absoluteDir = path.resolve(dir)
  if (!fs.existsSync(absoluteDir)) {
    console.warn(`[Loader] Plugin directory not found: ${absoluteDir}`)
    return { plugins: [], commands: [] }
  }
  return scanDir(absoluteDir, absoluteDir, client)
}

function extractUsage(pluginRun) {
  if (!pluginRun) return []
  const usage = pluginRun.usage || pluginRun.command || pluginRun.name || []
  if (Array.isArray(usage)) return usage
  if (typeof usage === 'string') return [usage]
  return []
}

async function loadPlugins(dir, client) {
  const result = await scanPlugins(dir, client)
  return result
}

function watchPlugins(dir, client) {
  const chokidar = require('chokidar')
  if (!fs.existsSync(dir)) return null
  const watcher = chokidar.watch(dir, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
    ignoreInitial: true,
  })
  watcher.on('add', async (filePath) => {
    if (filePath.endsWith('.js')) {
      try {
        delete require.cache[require.resolve(path.resolve(filePath))]
      } catch (e) {}
      const mod = await import(pathToFileURL(path.resolve(filePath)).href)
      if (mod?.run && typeof client?.updatePlugin === 'function') {
        client.updatePlugin({
          path: path.relative(dir, filePath).replace(/\.js$/, ''),
          fullPath: path.resolve(filePath),
          run: mod.run,
          type: 'module',
        })
      }
    }
  })
  watcher.on('change', async (filePath) => {
    if (filePath.endsWith('.js')) {
      try {
        delete require.cache[require.resolve(path.resolve(filePath))]
      } catch (e) {}
      const mod = await import(pathToFileURL(path.resolve(filePath)).href + '?update=' + Date.now())
      if (mod?.run && typeof client?.updatePlugin === 'function') {
        client.updatePlugin({
          path: path.relative(dir, filePath).replace(/\.js$/, ''),
          fullPath: path.resolve(filePath),
          run: mod.run,
          type: 'module',
        })
      }
    }
  })
  return watcher
}

module.exports = {
  scanPlugins,
  loadPlugins,
  watchPlugins,
  extractUsage,
}
