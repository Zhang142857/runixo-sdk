import * as path from 'path'
import * as fs from 'fs-extra'
import chalk from 'chalk'
import inquirer from 'inquirer'

export async function createPlugin(name?: string, opts?: { template?: string }) {
  if (!name) {
    const ans = await inquirer.prompt([{ type: 'input', name: 'name', message: 'Plugin name:', validate: (v: string) => !!v.trim() }])
    name = ans.name
  }

  const dir = path.join(process.cwd(), name!)
  if (fs.existsSync(dir)) { console.error(chalk.red(`❌ Directory ${name} already exists`)); process.exit(1) }

  console.log(chalk.blue(`\n🚀 Creating plugin: ${name}\n`))
  fs.mkdirpSync(path.join(dir, 'src', 'main'))

  // plugin.json
  fs.writeJsonSync(path.join(dir, 'plugin.json'), {
    id: name, name: name, version: '1.0.0', description: `${name} plugin for Runixo`,
    author: 'You', icon: '🧩', main: 'dist/main/index.js',
    permissions: ['tool:register', 'menu:register', 'route:register'],
    capabilities: {
      menus: [{ id: `${name}-main`, label: name, icon: 'Cpu', route: `/plugin/${name}`, position: 'sidebar', order: 100 }],
      routes: [{ path: `/plugin/${name}`, name: `${name}Plugin`, component: 'views/Main.vue' }]
    },
    config: {}
  }, { spaces: 2 })

  // package.json
  fs.writeJsonSync(path.join(dir, 'package.json'), {
    name: `runixo-plugin-${name}`, version: '1.0.0', private: true,
    scripts: { build: 'runixo-plugin build', pack: 'runixo-plugin pack' },
    devDependencies: { 'runixo-sdk': '^1.0.0', typescript: '^5.3.0' }
  }, { spaces: 2 })

  // tsconfig.json
  fs.writeJsonSync(path.join(dir, 'tsconfig.json'), {
    compilerOptions: {
      target: 'ES2020', module: 'commonjs', outDir: './dist', rootDir: './src',
      declaration: true, strict: true, esModuleInterop: true, skipLibCheck: true,
      experimentalDecorators: true, emitDecoratorMetadata: true
    },
    include: ['src/**/*']
  }, { spaces: 2 })

  // Main entry
  fs.writeFileSync(path.join(dir, 'src', 'main', 'index.ts'),
`import { Plugin, Tool } from 'runixo-sdk'

export default class ${toPascal(name!)}Plugin extends Plugin {
  async onEnable() {
    this.log.info('${name} plugin enabled!')
  }

  @Tool({ name: '${name}_status', description: 'Get ${name} status', category: 'tools' })
  async getStatus() {
    return { status: 'ok', timestamp: new Date().toISOString() }
  }
}
`)

  // Renderer view
  fs.mkdirpSync(path.join(dir, 'src', 'renderer', 'views'))
  fs.writeFileSync(path.join(dir, 'src', 'renderer', 'views', 'Main.vue'),
`<template>
  <div class="plugin-page">
    <h2>${name}</h2>
    <p>Plugin is running!</p>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.plugin-page { padding: 20px; }
</style>
`)

  console.log(chalk.green(`✅ Plugin created at ./${name}/`))
  console.log(chalk.cyan(`\n  cd ${name}`))
  console.log(chalk.cyan('  npm install'))
  console.log(chalk.cyan('  npm run build'))
  console.log(chalk.cyan('  npm run pack\n'))
}

function toPascal(s: string) { return s.replace(/(^|[-_])(\w)/g, (_, __, c) => c.toUpperCase()) }
