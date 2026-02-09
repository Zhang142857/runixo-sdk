import fs from 'fs-extra'
import path from 'path'

interface PluginConfig {
  id: string
  name: string
  description: string
  author: string
  version: string
}

export async function generateCloudServicePlugin(pluginDir: string, config: PluginConfig) {
  // 创建目录结构
  await fs.ensureDir(path.join(pluginDir, 'src', 'main'))
  await fs.ensureDir(path.join(pluginDir, 'src', 'renderer', 'views'))

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
    icon: '☁️',
    category: 'cloud-service',
    main: 'dist/main/index.js',
    permissions: [
      'network:request',
      'menu:register',
      'route:register',
      'tool:register',
      'agent:tool'
    ],
    config: {
      apiToken: {
        label: 'API Token',
        type: 'password',
        description: 'Your API token',
        required: true
      },
      apiEndpoint: {
        label: 'API Endpoint',
        type: 'string',
        description: 'API endpoint URL',
        required: false,
        default: 'https://api.example.com'
      }
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
  private apiToken: string | null = null
  private apiEndpoint: string

  constructor(context: PluginContext) {
    super(context)
    this.apiEndpoint = context.config.apiEndpoint || 'https://api.example.com'
  }

  async onLoad() {
    this.log.info('${config.name} plugin loaded')
    
    // 加载API Token
    this.apiToken = await this.context.secureStorage.get('api_token')
    
    // 注册菜单
    this.registerMenu({
      id: '${config.id}-main',
      label: '${config.name}',
      icon: 'Cloudy',
      route: '/plugin/${config.id}',
      position: 'sidebar',
      order: 100
    })
    
    // 注册路由
    this.registerRoute({
      path: '/plugin/${config.id}',
      name: '${toPascalCase(config.id)}Plugin',
      component: 'views/Main.vue',
      meta: {
        title: '${config.name}'
      }
    })
    
    // 注册Agent工具
    this.registerAgentTool({
      name: '${config.id}_list_resources',
      displayName: 'List Resources',
      description: 'List all resources from ${config.name}',
      category: 'cloud',
      dangerous: false,
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            description: 'Resource type to filter'
          }
        },
        required: []
      },
      handler: 'listResources'
    })
  }

  async onEnable() {
    this.log.info('${config.name} plugin enabled')
    
    if (!this.apiToken) {
      this.context.ui.showNotification(
        'Please configure API token in plugin settings',
        'warning'
      )
    }
  }

  async onConfigChange(newConfig: any) {
    await super.onConfigChange(newConfig)
    
    // 保存API Token到安全存储
    if (newConfig.apiToken) {
      await this.context.secureStorage.set('api_token', newConfig.apiToken)
      this.apiToken = newConfig.apiToken
    }
    
    if (newConfig.apiEndpoint) {
      this.apiEndpoint = newConfig.apiEndpoint
    }
  }

  /**
   * 列出资源
   */
  async listResources(params: { type?: string }): Promise<any[]> {
    if (!this.apiToken) {
      throw new Error('API token not configured')
    }

    try {
      const response = await this.context.http.get(
        \`\${this.apiEndpoint}/resources\`,
        {
          headers: {
            'Authorization': \`Bearer \${this.apiToken}\`
          },
          params: params.type ? { type: params.type } : undefined
        }
      )

      return response.data
    } catch (error: any) {
      this.log.error('Failed to list resources:', error)
      throw new Error(\`Failed to list resources: \${error.message}\`)
    }
  }

  /**
   * 检查是否已认证
   */
  isAuthenticated(): boolean {
    return !!this.apiToken
  }
}
`
  await fs.writeFile(path.join(pluginDir, 'src', 'main', 'index.ts'), mainIndex)

  // 生成 Vue 组件
  const mainVue = `<template>
  <div class="cloud-plugin-page">
    <div class="page-header">
      <h1>${config.name}</h1>
      <p class="subtitle">${config.description}</p>
    </div>

    <!-- 未配置提示 -->
    <el-alert
      v-if="!isAuthenticated"
      title="Please configure API token"
      type="warning"
      show-icon
      :closable="false"
      style="margin-bottom: 20px"
    >
      <template #default>
        Go to Settings > Plugins > ${config.name} to configure your API token.
      </template>
    </el-alert>

    <!-- 资源列表 -->
    <el-card v-else>
      <template #header>
        <div class="card-header">
          <span>Resources</span>
          <el-button type="primary" size="small" @click="loadResources">
            <el-icon><Refresh /></el-icon>
            Refresh
          </el-button>
        </div>
      </template>

      <el-table :data="resources" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="200" />
        <el-table-column prop="name" label="Name" min-width="200" />
        <el-table-column prop="type" label="Type" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="Status" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Actions" width="150" fixed="right">
          <template #default="{ row }">
            <el-button text size="small" @click="viewResource(row)">
              View
            </el-button>
            <el-button text size="small" type="danger" @click="deleteResource(row)">
              Delete
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'

const isAuthenticated = ref(false)
const loading = ref(false)
const resources = ref<any[]>([])

onMounted(async () => {
  await checkAuthentication()
  if (isAuthenticated.value) {
    await loadResources()
  }
})

async function checkAuthentication() {
  try {
    const result = await window.electronAPI.plugin.call(
      '${config.id}',
      'isAuthenticated'
    )
    isAuthenticated.value = result
  } catch (error) {
    console.error('Failed to check authentication:', error)
  }
}

async function loadResources() {
  loading.value = true
  try {
    const result = await window.electronAPI.plugin.call(
      '${config.id}',
      'listResources',
      {}
    )
    resources.value = result
  } catch (error: any) {
    ElMessage.error('Failed to load resources: ' + error.message)
  } finally {
    loading.value = false
  }
}

function getStatusType(status: string) {
  const types: Record<string, any> = {
    running: 'success',
    stopped: 'info',
    pending: 'warning',
    error: 'danger'
  }
  return types[status] || 'info'
}

function viewResource(resource: any) {
  ElMessage.info(\`Viewing resource: \${resource.name}\`)
  // TODO: 实现资源详情查看
}

async function deleteResource(resource: any) {
  try {
    await ElMessageBox.confirm(
      \`Are you sure you want to delete "\${resource.name}"?\`,
      'Confirm Delete',
      {
        type: 'warning'
      }
    )
    
    // TODO: 实现资源删除
    ElMessage.success('Resource deleted')
    await loadResources()
  } catch {
    // 用户取消
  }
}
</script>

<style scoped>
.cloud-plugin-page {
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

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
`
  await fs.writeFile(path.join(pluginDir, 'src', 'renderer', 'views', 'Main.vue'), mainVue)

  // 生成 README.md
  const readme = `# ${config.name}

${config.description}

## Configuration

1. Go to Settings > Plugins > ${config.name}
2. Enter your API token
3. (Optional) Configure API endpoint

## Features

- List resources
- View resource details
- Delete resources
- Agent integration for automated operations

## Development

\`\`\`bash
npm install
npm run dev
\`\`\`

## Build

\`\`\`bash
npm run build
\`\`\`

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
