import * as path from 'path'
import * as fs from 'fs-extra'
import * as archiver from 'archiver'
import chalk from 'chalk'

export async function packPlugin(opts: { output?: string }) {
  const cwd = process.cwd()
  const manifestPath = path.join(cwd, 'plugin.json')

  if (!fs.existsSync(manifestPath)) {
    console.error(chalk.red('❌ plugin.json not found. Run this in a plugin directory.'))
    process.exit(1)
  }

  const manifest = fs.readJsonSync(manifestPath)
  if (!manifest.id || !manifest.version) {
    console.error(chalk.red('❌ plugin.json must have id and version fields.'))
    process.exit(1)
  }

  // Build first if dist doesn't exist
  const distDir = path.join(cwd, 'dist')
  if (!fs.existsSync(distDir)) {
    console.log(chalk.yellow('⚠ dist/ not found, building first...'))
    const { buildPlugin } = require('./build')
    await buildPlugin({})
  }

  const outDir = opts.output || cwd
  const filename = `${manifest.id}-${manifest.version}.shplugin`
  const outPath = path.join(outDir, filename)

  console.log(chalk.blue(`\n📦 Packaging ${manifest.name} v${manifest.version}...\n`))

  // 路径遍历防护：验证所有被打包的目录都在项目内
  const validateInside = (dir: string, label: string) => {
    const resolved = path.resolve(dir)
    if (!resolved.startsWith(cwd)) {
      console.error(chalk.red(`❌ ${label} (${resolved}) is outside project directory. Aborting.`))
      process.exit(1)
    }
  }

  await new Promise<void>((resolve, reject) => {
    const output = fs.createWriteStream(outPath)
    const archive = archiver.default('zip', { zlib: { level: 9 } })

    output.on('close', () => resolve())
    archive.on('error', reject)
    archive.pipe(output)

    // plugin.json
    archive.file(manifestPath, { name: 'plugin.json' })

    // dist/ (compiled JS)
    if (fs.existsSync(distDir)) {
      validateInside(distDir, 'dist/')
      archive.directory(distDir, 'dist')
    }

    // renderer/ (Vue components if any)
    const rendererDir = path.join(cwd, 'src', 'renderer')
    if (fs.existsSync(rendererDir)) {
      validateInside(rendererDir, 'renderer/')
      archive.directory(rendererDir, 'renderer')
    }

    // agent/ (agent-side scripts if any)
    const agentDir = path.join(cwd, 'agent')
    if (fs.existsSync(agentDir)) {
      validateInside(agentDir, 'agent/')
      archive.directory(agentDir, 'agent')
    }

    // assets
    const assetsDir = path.join(cwd, 'assets')
    if (fs.existsSync(assetsDir)) {
      validateInside(assetsDir, 'assets/')
      archive.directory(assetsDir, 'assets')
    }

    archive.finalize()
  })

  const size = (fs.statSync(outPath).size / 1024).toFixed(1)
  console.log(chalk.green(`✅ ${filename} (${size} KB)`))
  console.log(chalk.gray(`   → ${outPath}`))
  console.log(chalk.cyan('\n💡 Drag this file into Runixo client to install!\n'))
}
