# 插件开发指南

## 概述

Runixo 插件系统提供了强大的扩展能力，支持：

- 🎨 **UI扩展** - 菜单、路由、组件
- 🤖 **AI能力** - Agent、工作流、提示词模板
- 🔧 **工具注册** - 为AI助手提供工具
- 📦 **依赖管理** - 插件间依赖和npm包
- ⚙️ **配置UI** - 基于JSON Schema自动生成

## 快速开始

### 创建插件

```bash
npx @runixo/plugin-cli create my-plugin
cd my-plugin
npm install
npm run dev
```

### 插件结构

```
my-plugin/
├── plugin.json          # 插件清单
├── src/
│   ├── main/
│   │   └── index.ts    # 主进程代码
│   └── renderer/
│       └── views/      # Vue组件
├── package.json
└── tsconfig.json
```

## 插件清单 (plugin.json)

```json
{
  "id": "my-plugin",
  "name": "我的插件",
  "version": "1.0.0",
  "description": "插件描述",
  "author": "作者名",
  "icon": "icon.png",
  "main": "dist/main/index.js",
  "renderer": "dist/renderer/index.js",
  "permissions": [
    "network:request",
    "menu:register",
    "tool:register",
    "agent:register"
  ],
  "dependencies": {
    "plugins": {
      "cloudflare": "^1.0.0"
    },
    "npm": {
      "axios": "^1.0.0"
    }
  },
  "config": {
    "type": "object",
    "properties": {
      "apiKey": {
        "type": "string",
        "title": "API密钥",
        "description": "你的API密钥",
        "format": "password",
        "ui": {
          "widget": "input",
          "placeholder": "请输入API密钥"
        }
      },
      "enabled": {
        "type": "boolean",
        "title": "启用",
        "default": true,
        "ui": {
          "widget": "switch"
        }
      }
    },
    "required": ["apiKey"]
  }
}
```

## 插件开发

### 基础插件类

```typescript
import { Plugin } from '@runixo/plugin-sdk'

export default class MyPlugin extends Plugin {
  async onLoad() {
    // 插件加载时调用
    this.log.info('插件已加载')
    
    // 注册菜单
    this.registerMenu({
      id: 'my-menu',
      label: '我的菜单',
      icon: 'icon-name',
      route: '/my-plugin',
      position: 'sidebar'
    })
    
    // 注册路由
    this.registerRoute({
      path: '/my-plugin',
      name: 'MyPlugin',
      component: 'views/MyView.vue'
    })
  }

  async onEnable() {
    // 插件启用时调用
  }

  async onDisable() {
    // 插件禁用时调用
  }
}
```

### 注册AI工具

```typescript
import { Tool } from '@runixo/plugin-sdk'

export default class MyPlugin extends Plugin {
  @Tool({
    name: 'get_weather',
    displayName: '获取天气',
    description: '获取指定城市的天气信息',
    category: '工具',
    parameters: {
      city: {
        type: 'string',
        description: '城市名称',
        required: true
      }
    }
  })
  async getWeather(params: { city: string }) {
    const apiKey = this.config.apiKey
    const response = await this.context.http.get(
      `https://api.weather.com/v1/weather?city=${params.city}&key=${apiKey}`
    )
    return response.data
  }
}
```

### 注册AI Agent

```typescript
export default class MyPlugin extends Plugin {
  async onLoad() {
    // 注册专门的AI Agent
    this.registerAgent({
      id: 'weather-assistant',
      name: '天气助手',
      description: '帮助你查询天气信息',
      systemPrompt: '你是一个专业的天气助手，可以查询全球各地的天气信息。',
      tools: ['get_weather', 'get_forecast'],
      temperature: 0.7,
      icon: 'weather-icon',
      category: '助手'
    })
  }
}
```

### 注册工作流

```typescript
export default class MyPlugin extends Plugin {
  async onLoad() {
    this.registerWorkflow({
      id: 'deploy-website',
      name: '部署网站',
      description: '自动化部署网站流程',
      steps: [
        {
          id: 'build',
          type: 'tool',
          name: '构建项目',
          config: {
            tool: 'npm_build',
            params: { cwd: '/path/to/project' }
          },
          next: 'upload'
        },
        {
          id: 'upload',
          type: 'tool',
          name: '上传文件',
          config: {
            tool: 'upload_files',
            params: { source: 'dist/', dest: '/var/www/' }
          },
          next: 'restart'
        },
        {
          id: 'restart',
          type: 'tool',
          name: '重启服务',
          config: {
            tool: 'restart_service',
            params: { service: 'nginx' }
          }
        }
      ],
      icon: 'deploy-icon',
      category: '部署'
    })
  }
}
```

### 注册提示词模板

```typescript
export default class MyPlugin extends Plugin {
  async onLoad() {
    this.registerPromptTemplate({
      id: 'code-review',
      name: '代码审查',
      description: '审查代码质量和安全性',
      template: `请审查以下{{language}}代码：

\`\`\`{{language}}
{{code}}
\`\`\`

重点关注：
- 代码质量
- 安全漏洞
- 性能问题
- 最佳实践

请提供详细的审查报告。`,
      variables: [
        {
          name: 'language',
          description: '编程语言',
          type: 'string',
          required: true
        },
        {
          name: 'code',
          description: '要审查的代码',
          type: 'string',
          required: true
        }
      ],
      category: '开发',
      tags: ['代码', '审查', '质量']
    })
  }
}
```

### 使用工作流

```typescript
// 在插件中执行工作流
const result = await this.executeWorkflow('deploy-website', {
  projectPath: '/path/to/project'
})

// 使用提示词模板
const prompt = this.renderPrompt('code-review', {
  language: 'typescript',
  code: 'const x = 1;'
})

const response = await this.callAgent(prompt)
```

### 流式工具输出

```typescript
export default class MyPlugin extends Plugin {
  @Tool({
    name: 'stream_logs',
    displayName: '流式日志',
    description: '实时输出日志',
    streaming: true
  })
  async *streamLogs() {
    for (let i = 0; i < 10; i++) {
      yield `日志行 ${i}\n`
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
}
```

## 配置UI生成

插件配置会根据JSON Schema自动生成UI：

```json
{
  "config": {
    "type": "object",
    "properties": {
      "apiKey": {
        "type": "string",
        "title": "API密钥",
        "format": "password"
      },
      "region": {
        "type": "string",
        "title": "区域",
        "enum": ["us-east-1", "us-west-2", "eu-west-1"],
        "ui": {
          "widget": "select"
        }
      },
      "maxRetries": {
        "type": "number",
        "title": "最大重试次数",
        "minimum": 0,
        "maximum": 10,
        "default": 3,
        "ui": {
          "widget": "slider"
        }
      },
      "enabled": {
        "type": "boolean",
        "title": "启用",
        "default": true,
        "ui": {
          "widget": "switch"
        }
      }
    },
    "required": ["apiKey"]
  }
}
```

支持的字段类型：
- `string` - 文本输入、密码、选择器、文本域
- `number` - 数字输入、滑块
- `boolean` - 开关、复选框
- `array` - 数组编辑器
- `object` - 嵌套对象

支持的格式：
- `password` - 密码输入
- `email` - 邮箱验证
- `url` - URL验证
- `date` - 日期选择
- `color` - 颜色选择

## 依赖管理

### 插件依赖

```json
{
  "dependencies": {
    "plugins": {
      "cloudflare": "^1.0.0",
      "docker": ">=2.0.0"
    }
  }
}
```

### npm包依赖

```json
{
  "dependencies": {
    "npm": {
      "axios": "^1.0.0",
      "lodash": "^4.17.21"
    }
  }
}
```

## API参考

### PluginContext

```typescript
interface PluginContext {
  pluginId: string
  config: PluginConfig
  metadata: PluginMetadata
  
  // 存储
  storage: PluginStorageAPI
  secureStorage: PluginSecureStorageAPI
  
  // 网络
  http: PluginHttpAPI
  
  // UI
  ui: PluginUIAPI
  
  // 服务器操作
  server: PluginServerAPI
  file: PluginFileAPI
  
  // 事件
  events: PluginEventAPI
  
  // AI能力
  agent: PluginAgentAPI
  
  // 注册
  tools: PluginToolsAPI
  menus: PluginMenusAPI
  routes: PluginRoutesAPI
  commands: PluginCommandsAPI
  
  // 日志
  logger: PluginLoggerAPI
}
```

### 装饰器

```typescript
// 工具装饰器
@Tool(definition: ToolDefinition)

// 命令装饰器
@Command(definition: CommandDefinition)

// 事件监听装饰器
@OnEvent(eventName: string)
```

## 发布插件

### 1. 构建插件

```bash
npm run build
```

### 2. 发布到插件市场

```bash
npx @runixo/plugin-cli publish
```

### 3. 插件清单要求

- 必须包含 `id`, `name`, `version`, `description`, `author`
- 必须声明所需权限
- 建议提供 `icon`, `screenshots`, `homepage`
- 建议提供详细的 `changelog`

## 最佳实践

1. **权限最小化** - 只申请必需的权限
2. **错误处理** - 妥善处理所有错误情况
3. **日志记录** - 使用 `this.log` 记录关键操作
4. **配置验证** - 验证用户配置的有效性
5. **资源清理** - 在 `onUnload` 中清理资源
6. **安全存储** - 敏感信息使用 `secureStorage`
7. **用户体验** - 提供清晰的错误提示和帮助文档

## 示例插件

查看官方插件示例：
- `plugins/cloudflare-v2/` - Cloudflare管理插件
- `plugins/docker/` - Docker管理插件
- `plugins/nginx/` - Nginx管理插件

## 调试

### 开发模式

```bash
npm run dev
```

### 查看日志

```typescript
this.log.debug('调试信息')
this.log.info('普通信息')
this.log.warn('警告信息')
this.log.error('错误信息')
```

### 热重载

开发模式下，修改代码会自动重载插件。

## 常见问题

### Q: 如何访问其他插件的功能？

A: 通过依赖声明和事件系统：

```typescript
// 声明依赖
"dependencies": {
  "plugins": {
    "other-plugin": "^1.0.0"
  }
}

// 使用事件通信
this.context.events.emit('other-plugin:action', data)
```

### Q: 如何调用AI Agent？

A: 使用 `callAgent` 方法：

```typescript
const response = await this.callAgent('帮我查询天气', {
  tools: ['get_weather'],
  temperature: 0.7
})
```

### Q: 如何处理敏感配置？

A: 使用 `secureStorage` 和 `format: "password"`：

```json
{
  "config": {
    "properties": {
      "apiKey": {
        "type": "string",
        "format": "password"
      }
    }
  }
}
```

```typescript
// 存储
await this.context.secureStorage.set('apiKey', apiKey)

// 读取
const apiKey = await this.context.secureStorage.get('apiKey')
```

## 更多资源

- [API文档](https://docs.runixo.com/api)
- [插件市场](https://plugins.runixo.com)
- [社区论坛](https://community.runixo.com)
