# Runixo Plugin SDK

Build plugins for the [Runixo](https://github.com/Zhang142857/runixo) server management platform.

## Quick Start

```bash
# Create a new plugin
npx runixo-sdk create my-plugin

# Build
cd my-plugin
npm install
npm run build

# Package into .shplugin
npm run pack
```

## Install Plugin

Drag the `.shplugin` file into the Runixo client to install.

## Plugin Structure

```
my-plugin/
├── plugin.json          # Plugin manifest
├── package.json
├── tsconfig.json
├── src/
│   ├── main/
│   │   └── index.ts     # Main process entry
│   └── renderer/
│       └── views/
│           └── Main.vue  # UI component
└── dist/                 # Built output
```

## plugin.json

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "A Runixo plugin",
  "author": "You",
  "main": "dist/main/index.js",
  "permissions": ["tool:register", "menu:register", "route:register"],
  "capabilities": {
    "menus": [{ "id": "my-menu", "label": "My Plugin", "icon": "Cpu", "route": "/plugin/my-plugin", "position": "sidebar" }],
    "routes": [{ "path": "/plugin/my-plugin", "name": "MyPlugin", "component": "views/Main.vue" }]
  }
}
```

## Plugin API

```typescript
import { Plugin, Tool, Command, OnEvent } from 'runixo-sdk'

export default class MyPlugin extends Plugin {
  async onEnable() {
    this.log.info('Plugin enabled!')
  }

  @Tool({ name: 'my_tool', description: 'Does something', category: 'utils' })
  async myTool(params: any) {
    const result = await this.context.server.executeCommand(params.serverId, 'bash', ['-c', 'uptime'])
    return result.stdout
  }
}
```

## Available Context APIs

- `this.context.server` - Execute commands, get system info
- `this.context.http` - Make HTTP requests
- `this.context.storage` - Persistent key-value storage
- `this.context.ui` - Show notifications and dialogs
- `this.context.events` - Event bus
- `this.context.agent` - Agent-side execution
- `this.log` - Logging

## License

MIT
