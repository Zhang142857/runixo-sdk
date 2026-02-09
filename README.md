<div align="center">
  <h1>🧩 Runixo Plugin SDK</h1>
  <p><strong>为 Runixo 服务器管理平台开发插件</strong></p>

  <p>
    <a href="https://runixo.top">🌐 官网</a> ·
    <a href="https://runixo.top/guide/plugins">📖 插件开发指南</a> ·
    <a href="#api-参考">📚 API 参考</a>
  </p>

  <p>
    <a href="https://www.npmjs.com/package/runixo-sdk"><img src="https://img.shields.io/npm/v/runixo-sdk?style=flat-square&color=6366f1" alt="npm"></a>
    <a href="https://github.com/Zhang142857/runixo-sdk/blob/main/LICENSE"><img src="https://img.shields.io/github/license/Zhang142857/runixo-sdk?style=flat-square" alt="License"></a>
    <img src="https://img.shields.io/badge/TypeScript-5.3+-3178C6?style=flat-square&logo=typescript" alt="TypeScript">
  </p>
</div>

---

## ✨ 插件能做什么？

Runixo 插件可以扩展客户端的任何功能：

- 🖥️ **自定义 UI** — 在侧边栏添加页面，用 Vue 3 构建界面
- 🤖 **AI 工具** — 注册 AI 可调用的工具函数，让 AI 使用你的插件能力
- ☁️ **云服务集成** — 接入任何云平台 API（Cloudflare、AWS、阿里云等）
- 📊 **监控扩展** — 自定义监控指标和告警规则
- 🔧 **运维自动化** — 编排复杂的运维工作流

---

## 🚀 快速开始

```bash
# 创建插件项目
npx runixo-sdk create my-plugin

# 开发
cd my-plugin
npm install
npm run dev        # 开发模式

# 构建 & 打包
npm run build
npm run pack       # 生成 .shplugin 文件
```

将 `.shplugin` 文件拖入 Runixo 客户端即可安装。

---

## 📁 插件结构

```
my-plugin/
├── plugin.json          # 插件清单（元数据、权限、路由）
├── package.json
├── tsconfig.json
├── src/
│   ├── main/
│   │   └── index.ts     # 主进程入口（Node.js 环境）
│   └── renderer/
│       └── views/
│           └── Main.vue  # UI 组件（Vue 3）
└── dist/                 # 构建产物
```

---

## 📝 插件清单

`plugin.json` 定义插件的元数据、权限和功能：

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "一个 Runixo 插件",
  "author": "You",
  "main": "dist/main/index.js",
  "permissions": ["tool:register", "menu:register", "route:register"],
  "capabilities": {
    "menus": [{
      "id": "my-menu",
      "label": "My Plugin",
      "icon": "Cpu",
      "route": "/plugin/my-plugin",
      "position": "sidebar"
    }],
    "routes": [{
      "path": "/plugin/my-plugin",
      "name": "MyPlugin",
      "component": "views/Main.vue"
    }]
  }
}
```

---

## 💻 编写插件

```typescript
import { Plugin, Tool, Command, OnEvent } from 'runixo-sdk'

export default class MyPlugin extends Plugin {
  async onLoad() {
    this.log.info('插件已加载')
  }

  // 注册 AI 工具 — AI 可以调用这个函数
  @Tool({
    name: 'check_uptime',
    description: 'Check server uptime',
    category: 'monitoring'
  })
  async checkUptime(params: { serverId: string }) {
    const result = await this.context.server.executeCommand(
      params.serverId, 'bash', ['-c', 'uptime']
    )
    return result.stdout
  }

  // 监听事件
  @OnEvent('server:connected')
  async onServerConnected(data: { serverId: string }) {
    this.log.info(`服务器已连接: ${data.serverId}`)
  }

  // 注册命令
  @Command({ id: 'my-action', name: 'My Action' })
  async myAction() {
    await this.context.ui.showNotification('Hello!', 'success')
  }
}
```

---

## 📚 API 参考

每个插件通过 `this.context` 访问平台能力：

### 服务器 API

```typescript
// 执行命令
const result = await this.context.server.executeCommand(serverId, 'bash', ['-c', 'df -h'])

// 获取系统信息
const info = await this.context.server.getSystemInfo(serverId)

// 列出已连接服务器
const servers = await this.context.server.listServers()
```

### HTTP API

```typescript
const res = await this.context.http.get('https://api.example.com/data', {
  headers: { 'Authorization': 'Bearer token' },
  timeout: 5000
})
```

### 存储 API

```typescript
await this.context.storage.set('myKey', { data: 'value' })
const data = await this.context.storage.get('myKey')
```

### UI API

```typescript
await this.context.ui.showNotification('操作成功', 'success')
await this.context.ui.showDialog({ title: '确认', message: '是否继续？' })
```

### 完整 API 列表

| API | 说明 |
|---|---|
| `this.context.server` | 命令执行、系统信息、服务器列表 |
| `this.context.http` | HTTP 请求（GET/POST/PUT/DELETE） |
| `this.context.storage` | 持久化键值存储 |
| `this.context.ui` | 通知、对话框 |
| `this.context.events` | 事件总线（on/off/emit） |
| `this.context.agent` | Agent 端执行、AI 对话 |
| `this.log` | 日志（debug/info/warn/error） |

---

## 🧩 官方插件

| 插件 | 说明 |
|---|---|
| [cloudflare-v2](plugins/cloudflare-v2) | ☁️ Cloudflare DNS / SSL / 缓存 / Tunnel 管理 |
| [nginx-manager](plugins/nginx-manager) | 🌐 Nginx 站点管理 |
| [devops-assistant](plugins/devops-assistant) | 🤖 AI 驱动的 DevOps 工作流 |

---

## 📦 包结构

| 包 | 说明 |
|---|---|
| [@runixo/plugin-sdk](packages/plugin-sdk) | 核心 SDK（Plugin 基类、装饰器） |
| [@runixo/plugin-types](packages/plugin-types) | TypeScript 类型定义 |
| [@runixo/plugin-cli](packages/plugin-cli) | CLI 工具（创建/构建/打包） |

---

## 📦 相关仓库

| 仓库 | 说明 |
|---|---|
| [**runixo**](https://github.com/Zhang142857/runixo) | 桌面客户端（Electron + Vue 3） |
| [**runixo-agent**](https://github.com/Zhang142857/runixo-agent) | 服务器 Agent（Go） |

---

## 📄 License

[MIT](LICENSE)
