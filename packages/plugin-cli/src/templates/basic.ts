import fs from 'fs-extra'
import path from 'path'

interface PluginConfig {
  id: string
  name: string
  description: string
  author: string
  version: string
}

export async function generateBasicPlugin(pluginDir: string, config: PluginConfig) {
  // 创建目录结构
  await fs.ensureDir(path.join(pluginDir, 'src', 'main'))
  await fs.ensureDir(path.join(pluginDir, 'src', 'renderer', 'views'))
  await fs.ensureDir(path.join(pluginDir, 'src', 'renderer', 'components'))

  // 生成 package.json
  const packageJson = {
    name: `@runixo/plugin-${config.id}`,
    version: config.version,
    description: config.description,
    main: 'dist/main/index.js',
    scripts: {
      build: 'tsc',
      watch: 'tsc --watch',
      dev: 'runixo-plugin dev'
    },
    dependencies: {
      'runixo-plugin-sdk': '^1.0.0'
    },
    devDependencies: {
      'runixo-plugin-cli': '^1.0.0',
      'typescript': '^5.3.0'
    }
  }
  await fs.writeJSON(path.join(pluginDir, 'package.json'), packageJson, { spaces: 2 })

  // 生成 plugin.json
  const pluginJson = {
    id: config.id,
    name: config.name,
    version: config.version,
    description: config.description,
    author: config.author,
    icon: '🔌',
    main: 'dist/main/index.js',
    renderer: 'dist/renderer/index.js',
    permissions: [
      'menu:register',
      'route:register',
      'tool:register'
    ],
    capabilities: {
      menus: [
        {
          id: `${config.id}-main`,
          label: config.name,
          icon: 'Grid',
          route: `/plugin/${config.id}`,
          position: 'sidebar',
          order: 100
        }
      ],
      routes: [
        {
          path: `/plugin/${config.id}`,
          name: `${config.id}Plugin`,
          component: 'views/Main.vue'
        }
      ]
    }
  }
  await fs.writeJSON(path.join(pluginDir, 'plugin.json'), pluginJson, { spaces: 2 })

  // 生成 tsconfig.json
  const tsconfig = {
    compilerOptions: {
      target: 'ES2020',
      module: 'commonjs',
      outDir: './dist',
      rootDir: './src',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true
    },
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist']
  }
  await fs.writeJSON(path.join(pluginDir, 'tsconfig.json'), tsconfig, { spaces: 2 })

  // 生成主入口文件
  const mainIndex = `import { Plugin, PluginContext } from 'runixo-plugin-sdk'

export default class ${toPascalCase(config.id)}Plugin extends Plugin {
  constructor(context: PluginContext) {
    super(context)
  }

  async onLoad() {
    this.log.info('${config.name} plugin loaded')
    
    // 注册工具
    this.registerTool({
      name: '${config.id}_hello',
      displayName: 'Hello World',
      description: 'A simple hello world tool',
      category: 'example',
      dangerous: false,
      parameters: {
        name: {
          type: 'string',
          description: 'Your name',
          required: true
        }
      },
      handler: async (params) => {
        return { message: \`Hello, \${params.name}!\` }
      }
    })
  }

  async onEnable() {
    this.log.info('${config.name} plugin enabled')
    this.context.ui.showNotification('${config.name} enabled', 'success')
  }

  async onDisable() {
    this.log.info('${config.name} plugin disabled')
  }
}
`
  await fs.writeFile(path.join(pluginDir, 'src', 'main', 'index.ts'), mainIndex)

  // 生成 Vue 组件
  const mainVue = `<template>
  <div class="plugin-page">
    <div class="page-header">
      <h1>${config.name}</h1>
      <p class="subtitle">${config.description}</p>
    </div>

    <el-card>
      <template #header>
        <span>Welcome</span>
      </template>
      <p>This is a basic plugin template.</p>
      <p>Edit <code>src/renderer/views/Main.vue</code> to customize this page.</p>
    </el-card>

    <el-card style="margin-top: 20px">
      <template #header>
        <span>Example Tool</span>
      </template>
      <el-form @submit.prevent="callTool">
        <el-form-item label="Your Name">
          <el-input v-model="name" placeholder="Enter your name" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" native-type="submit">Say Hello</el-button>
        </el-form-item>
      </el-form>
      <div v-if="result" class="result">
        <el-alert type="success" :closable="false">
          {{ result }}
        </el-alert>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const name = ref('')
const result = ref('')

async function callTool() {
  if (!name.value) {
    ElMessage.warning('Please enter your name')
    return
  }

  try {
    const response = await window.electronAPI.plugin.call(
      '${config.id}',
      '${config.id}_hello',
      { name: name.value }
    )
    result.value = response.message
  } catch (error) {
    ElMessage.error('Failed to call tool: ' + error.message)
  }
}
</script>

<style scoped>
.plugin-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 8px;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 14px;
}

.result {
  margin-top: 16px;
}

code {
  background: var(--bg-secondary);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
}
</style>
`
  await fs.writeFile(path.join(pluginDir, 'src', 'renderer', 'views', 'Main.vue'), mainVue)

  // 生成 README.md
  const readme = `# ${config.name}

${config.description}

## Installation

\`\`\`bash
npm install
\`\`\`

## Development

\`\`\`bash
npm run dev
\`\`\`

## Build

\`\`\`bash
npm run build
\`\`\`

## Usage

1. Copy the plugin to Runixo plugins directory
2. Restart Runixo
3. Enable the plugin in Settings > Plugins

## License

MIT
`
  await fs.writeFile(path.join(pluginDir, 'README.md'), readme)

  // 生成 .gitignore
  const gitignore = `node_modules/
dist/
*.log
.DS_Store
`
  await fs.writeFile(path.join(pluginDir, '.gitignore'), gitignore)
}

function toPascalCase(str: string): string {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
}
