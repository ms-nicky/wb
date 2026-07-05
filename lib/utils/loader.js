const fs = require('node:fs')
const path = require('node:path')
const { pathToFileURL } = require('node:url')

async function scanPlugins(dir, client) {
  const absoluteDir = path.resolve(dir)
  const plugins = []
  const commands = []

  if (!fs.existsSync(absoluteDir)) {
    console.warn(`[Loader] Plugin directory not found: ${absoluteDir}`)
    return { plugins, commands }
  }

  const entries = fs.readdirSync(absoluteDir, { withFileTypes: true })
  const files = entries.filter(e => e.isFile() && e.name.endsWith('.js'))
                          .map(e => path.join(absoluteDir, e.name))

  if (files.length === 0) {
    console.warn(`[Loader] No .js files found in ${absoluteDir}`)
    return { plugins, commands }
  }

  for (const file of files) {
    try {
      const mod = await import(pathToFileURL(file).href)
      if (!mod || !mod.run) {
        continue
      }
      const pluginPath = path.relative(absoluteDir, file).replace(/\.js$/, '')
      const plugin = {
        path: pluginPath,
        fullPath: file,
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
      if (Array.isArray(usage)) {
        commands.push(...usage)
      }
    } catch (e) {
      const fileName = path.basename(file)
      console.warn(`[Loader] Skipping ${fileName}: ${e.message}`)
    }
  }

  return { plugins, commands }
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
