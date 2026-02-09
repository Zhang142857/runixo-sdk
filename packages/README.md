# Runixo Plugin SDK

完整的插件开发工具包，用于构建 Runixo 插件。

## 📦 包结构

```
packages/
├── plugin-types/          # TypeScript 类型定义
├── plugin-sdk/            # 核心 SDK
└── plugin-cli/            # CLI 开发工具
```

## 🚀 快速开始

### 安装 CLI 工具

```bash
npm install -g runixo-plugin-cli
```

### 创建新插件

```bash
runixo-plugin create my-plugin
```

选择模板：
- **Basic Plugin** - 基础插件模板
- **Cloud Service Plugin** - 云服务插件模板
- **Monitoring Plugin** - 监控插件模板

### 开发插件

```bash
cd my-plugin
npm install
npm run dev
```

### 构建插件

```bash
npm run build
```

## 📝 插件结构

```
my-plugin/
├── src/
│   ├── main/
│   │   └── index.ts          # 主进程代码
│   └── renderer/
│       ├── views/
│       │   └── Main.vue      # Vue 组件
│       └── components/
├── plugin.json               # 插件配置
├── package.json
└── tsconfig.json
```

## 🎯 核心概念

### 1. Plugin 基类

所有插件都应该继承 `Plugin` 基类：

```typescript
import { Plugin, PluginContext } from 'runixo-plugin-sdk'

export default class MyPlugin extends Plugin {
  constructor(context: PluginContext) {
    super(context)
  }

  async onLoad() {
    // 插件加载时调用
  }

  async onEnable() {
    // 插件启用时调用
  }

  async onDisable() {
    // 插件禁用时调用
  }
}
```

### 2. 生命周期钩子

- `onLoad()` - 插件首次加载时调用
- `onEnable()` - 插件启用时调用
- `onDisable()` - 插件禁用时调用
- `onUnload()` - 插件卸载时调用
- `onConfigChange(config)` - 配置变更时调用

### 3. PluginContext API

插件通过 `context` 访问系统功能：

#### 存储 API

```typescript
// 普通存储
await this.context.storage.set('key', 'value')
const value = await this.context.storage.get('key')

// 安全存储（加密）
await this.context.secureStorage.set('api_token', 'secret')
const token = await this.context.secureStorage.get('api_token')
```

#### HTTP 客户端

```typescript
const response = await this.context.http.get('https://api.example.com/data')
console.log(response.data)

await this.context.http.post('https://api.example.com/create', {
  name: 'test'
})
```

#### UI API

```typescript
// 显示通知
this.context.ui.showNotification('操作成功', 'success')

// 显示确认框
const confirmed = await this.context.ui.showConfirm('确定要删除吗？')

// 显示输入框
const name = await this.context.ui.showPrompt('请输入名称')
```

#### 系统 API

```typescript
// 执行命令（需要权限）
const result = await this.context.system.executeCommand('ls -la')

// 读取文件（需要权限）
const content = await this.context.system.readFile('/path/to/file')

// 获取系统信息
const info = await this.context.system.getSystemInfo()
```

#### 事件系统

```typescript
// 监听事件
this.context.events.on('server:connected', (data) => {
  console.log('Server connected:', data)
})

// 发送事件
this.context.events.emit('plugin:action', { action: 'test' })
```

#### Agent API

```typescript
// 注册 Agent 工具
this.registerAgentTool({
  name: 'my_tool',
  displayName: 'My Tool',
  description: 'A custom tool',
  category: 'custom',
  dangerous: false,
  parameters: {
    type: 'object',
    properties: {
      input: {
        type: 'string',
        description: 'Input parameter'
      }
    },
    required: ['input']
  },
  handler: 'myToolHandler'
})

// 与 Agent 对话
const response = await this.callAgent('帮我列出所有容器')
```

### 4. 注册能力

#### 注册菜单

```typescript
this.registerMenu({
  id: 'my-plugin-menu',
  label: '我的插件',
  icon: 'Star',
  route: '/plugin/my-plugin',
  position: 'sidebar',
  order: 100
})
```

#### 注册路由

```typescript
this.registerRoute({
  path: '/plugin/my-plugin',
  name: 'MyPlugin',
  component: 'views/Main.vue',
  meta: {
    title: '我的插件'
  }
})
```

#### 注册工具

```typescript
this.registerTool({
  name: 'my_tool',
  displayName: '我的工具',
  description: '这是一个示例工具',
  category: 'custom',
  parameters: {
    input: {
      type: 'string',
      description: '输入参数',
      required: true
    }
  },
  handler: async (params) => {
    return { result: `处理: ${params.input}` }
  }
})
```

## 🔒 权限系统

在 `plugin.json` 中声明所需权限：

```json
{
  "permissions": [
    "network:request",      // 网络请求
    "file:read",           // 读取文件
    "file:write",          // 写入文件
    "system:execute",      // 执行命令
    "menu:register",       // 注册菜单
    "route:register",      // 注册路由
    "tool:register",       // 注册工具
    "agent:tool"           // 注册 Agent 工具
  ]
}
```

## 📋 plugin.json 配置

```json
{
  "id": "my-plugin",
  "name": "我的插件",
  "version": "1.0.0",
  "description": "插件描述",
  "author": "作者",
  "icon": "🔌",
  "main": "dist/main/index.js",
  "renderer": "dist/renderer/index.js",
  "permissions": ["network:request", "menu:register"],
  "capabilities": {
    "menus": [...],
    "routes": [...],
    "tools": [...]
  },
  "config": {
    "apiToken": {
      "label": "API Token",
      "type": "password",
      "required": true
    }
  }
}
```

## 🎨 前端开发

### Vue 组件

```vue
<template>
  <div class="my-plugin">
    <h1>{{ title }}</h1>
    <el-button @click="doSomething">执行操作</el-button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const title = ref('我的插件')

async function doSomething() {
  try {
    const result = await window.electronAPI.plugin.call(
      'my-plugin',
      'my_tool',
      { input: 'test' }
    )
    ElMessage.success('操作成功')
  } catch (error) {
    ElMessage.error('操作失败: ' + error.message)
  }
}
</script>
```

### 调用插件方法

```typescript
// 从渲染进程调用插件方法
const result = await window.electronAPI.plugin.call(
  'plugin-id',
  'method-name',
  { param1: 'value1' }
)
```

## 🔧 CLI 命令

### create

创建新插件：

```bash
runixo-plugin create [name] [options]

Options:
  -t, --template <template>  插件模板 (basic, cloud-service, monitoring)
```

### dev

启动开发服务器：

```bash
runixo-plugin dev [options]

Options:
  -p, --port <port>  开发服务器端口 (默认: 3000)
```

### build

构建插件：

```bash
runixo-plugin build [options]

Options:
  -w, --watch  监听模式
```

## 📚 示例插件

### 基础插件示例

```typescript
import { Plugin, PluginContext } from 'runixo-plugin-sdk'

export default class HelloPlugin extends Plugin {
  async onLoad() {
    this.log.info('Hello plugin loaded')
    
    this.registerTool({
      name: 'hello_world',
      displayName: 'Hello World',
      description: 'Say hello',
      category: 'example',
      parameters: {
        name: {
          type: 'string',
          description: 'Your name',
          required: true
        }
      },
      handler: async (params) => {
        return { message: `Hello, ${params.name}!` }
      }
    })
  }
}
```

### 云服务插件示例

```typescript
import { Plugin, PluginContext } from 'runixo-plugin-sdk'

export default class CloudPlugin extends Plugin {
  private apiToken: string | null = null

  async onLoad() {
    this.apiToken = await this.context.secureStorage.get('api_token')
    
    this.registerAgentTool({
      name: 'cloud_list_resources',
      displayName: 'List Cloud Resources',
      description: 'List all cloud resources',
      category: 'cloud',
      dangerous: false,
      parameters: {
        type: 'object',
        properties: {},
        required: []
      },
      handler: 'listResources'
    })
  }

  async listResources(): Promise<any[]> {
    const response = await this.context.http.get(
      'https://api.cloud.com/resources',
      {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`
        }
      }
    )
    return response.data
  }
}
```

## 🐛 调试

### 日志记录

```typescript
this.log.debug('调试信息')
this.log.info('普通信息')
this.log.warn('警告信息')
this.log.error('错误信息')
```

### 开发模式

在开发模式下，插件会自动重载：

```bash
npm run dev
```

## 📖 更多资源

- [完整 API 文档](./API.md)
- [插件开发指南](./GUIDE.md)
- [最佳实践](./BEST_PRACTICES.md)
- [示例插件](../examples/)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 License

MIT
