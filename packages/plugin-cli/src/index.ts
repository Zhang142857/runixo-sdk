#!/usr/bin/env node

/**
 * Runixo 插件 CLI 工具
 * 用于创建、开发、构建和发布插件
 */

import { Command } from 'commander'
import chalk from 'chalk'
import inquirer from 'inquirer'
import fs from 'fs-extra'
import path from 'path'

const program = new Command()

program
  .name('runixo-plugin')
  .description('Runixo 插件开发工具')
  .version('2.0.0')

// 创建插件
program
  .command('create <name>')
  .description('创建新插件')
  .option('-t, --template <type>', '插件模板类型', 'basic')
  .action(async (name, options) => {
    console.log(chalk.blue('🚀 创建插件...'))

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'displayName',
        message: '插件显示名称:',
        default: name
      },
      {
        type: 'input',
        name: 'description',
        message: '插件描述:',
        default: '一个 Runixo 插件'
      },
      {
        type: 'input',
        name: 'author',
        message: '作者:',
        default: 'Your Name'
      },
      {
        type: 'list',
        name: 'type',
        message: '插件类型:',
        choices: [
          { name: '客户端插件', value: 'client' },
          { name: 'Agent插件', value: 'agent' },
          { name: '混合插件', value: 'hybrid' }
        ],
        default: 'hybrid'
      },
      {
        type: 'checkbox',
        name: 'features',
        message: '选择功能:',
        choices: [
          { name: 'UI扩展（菜单、路由）', value: 'ui', checked: true },
          { name: 'AI工具', value: 'tools', checked: true },
          { name: 'AI Agent', value: 'agent' },
          { name: '工作流', value: 'workflow' },
          { name: '提示词模板', value: 'prompts' },
          { name: '配置界面', value: 'config', checked: true }
        ]
      }
    ])

    const pluginDir = path.join(process.cwd(), name)
    
    // 创建目录结构
    await fs.ensureDir(pluginDir)
    await fs.ensureDir(path.join(pluginDir, 'src/main'))
    await fs.ensureDir(path.join(pluginDir, 'src/renderer/views'))
    await fs.ensureDir(path.join(pluginDir, 'src/renderer/components'))

    // 生成 plugin.json
    const pluginJson = {
      id: name,
      name: answers.displayName,
      version: '1.0.0',
      description: answers.description,
      author: answers.author,
      type: answers.type,
      main: 'dist/main/index.js',
      renderer: answers.features.includes('ui') ? 'dist/renderer/index.js' : undefined,
      permissions: generatePermissions(answers.features),
      config: answers.features.includes('config') ? generateConfigSchema() : undefined,
      capabilities: generateCapabilities(answers.features)
    }

    await fs.writeJSON(path.join(pluginDir, 'plugin.json'), pluginJson, { spaces: 2 })

    // 生成 package.json
    const packageJson = {
      name: `@runixo/plugin-${name}`,
      version: '1.0.0',
      description: answers.description,
      main: 'dist/main/index.js',
      scripts: {
        dev: 'tsc --watch',
        build: 'tsc',
        lint: 'eslint src --ext .ts,.tsx'
      },
      dependencies: {
        '@runixo/plugin-sdk': '^2.0.0',
        '@runixo/plugin-types': '^2.0.0'
      },
      devDependencies: {
        'typescript': '^5.0.0',
        '@types/node': '^20.0.0',
        'eslint': '^8.0.0'
      }
    }

    await fs.writeJSON(path.join(pluginDir, 'package.json'), packageJson, { spaces: 2 })

    // 生成主文件
    const mainContent = generateMainFile(name, answers)
    await fs.writeFile(path.join(pluginDir, 'src/main/index.ts'), mainContent)

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
        forceConsistentCasingInFileNames: true,
        declaration: true
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist']
    }

    await fs.writeJSON(path.join(pluginDir, 'tsconfig.json'), tsconfig, { spaces: 2 })

    // 生成 README
    const readme = generateReadme(name, answers)
    await fs.writeFile(path.join(pluginDir, 'README.md'), readme)

    console.log(chalk.green('✅ 插件创建成功！'))
    console.log(chalk.cyan('\n下一步:'))
    console.log(chalk.white(`  cd ${name}`))
    console.log(chalk.white('  npm install'))
    console.log(chalk.white('  npm run dev'))
  })

// 验证插件
program
  .command('validate')
  .description('验证插件配置')
  .action(async () => {
    console.log(chalk.blue('🔍 验证插件...'))
    
    const pluginJsonPath = path.join(process.cwd(), 'plugin.json')
    
    if (!await fs.pathExists(pluginJsonPath)) {
      console.log(chalk.red('❌ 未找到 plugin.json'))
      process.exit(1)
    }

    const pluginJson = await fs.readJSON(pluginJsonPath)
    const errors = []

    // 验证必需字段
    const required = ['id', 'name', 'version', 'description', 'author', 'main', 'permissions']
    for (const field of required) {
      if (!pluginJson[field]) {
        errors.push(`缺少必需字段: ${field}`)
      }
    }

    // 验证版本格式
    if (pluginJson.version && !/^\d+\.\d+\.\d+/.test(pluginJson.version)) {
      errors.push('版本号格式不正确，应为 x.y.z')
    }

    // 验证权限
    if (pluginJson.permissions && !Array.isArray(pluginJson.permissions)) {
      errors.push('permissions 应为数组')
    }

    if (errors.length > 0) {
      console.log(chalk.red('❌ 验证失败:'))
      errors.forEach(err => console.log(chalk.red(`  - ${err}`)))
      process.exit(1)
    }

    console.log(chalk.green('✅ 验证通过！'))
  })

// 构建插件
program
  .command('build')
  .description('构建插件')
  .action(async () => {
    console.log(chalk.blue('🔨 构建插件...'))
    
    const { execSync } = require('child_process')
    
    try {
      execSync('npm run build', { stdio: 'inherit' })
      console.log(chalk.green('✅ 构建成功！'))
    } catch (error) {
      console.log(chalk.red('❌ 构建失败'))
      process.exit(1)
    }
  })

// 发布插件
program
  .command('publish')
  .description('发布插件到市场')
  .action(async () => {
    console.log(chalk.blue('📦 发布插件...'))
    console.log(chalk.yellow('⚠️  此功能需要插件市场后端支持'))
    console.log(chalk.cyan('提示: 请先运行 npm run build 构建插件'))
  })

program.parse()

// 辅助函数
function generatePermissions(features: string[]): string[] {
  const permissions = []
  
  if (features.includes('ui')) {
    permissions.push('menu:register', 'route:register')
  }
  if (features.includes('tools')) {
    permissions.push('tool:register', 'agent:tool')
  }
  if (features.includes('agent')) {
    permissions.push('agent:register', 'agent:chat')
  }
  if (features.includes('workflow')) {
    permissions.push('workflow:register')
  }
  if (features.includes('prompts')) {
    permissions.push('prompt:register')
  }
  
  return permissions
}

function generateConfigSchema() {
  return {
    type: 'object',
    properties: {
      enabled: {
        type: 'boolean',
        title: '启用',
        default: true,
        ui: { widget: 'switch' }
      }
    }
  }
}

function generateCapabilities(features: string[]) {
  const capabilities: any = {}
  
  if (features.includes('ui')) {
    capabilities.menus = []
    capabilities.routes = []
  }
  if (features.includes('tools')) {
    capabilities.tools = []
  }
  if (features.includes('agent')) {
    capabilities.agents = []
  }
  if (features.includes('workflow')) {
    capabilities.workflows = []
  }
  if (features.includes('prompts')) {
    capabilities.prompts = []
  }
  
  return capabilities
}

function generateMainFile(name: string, answers: any): string {
  const className = toPascalCase(name) + 'Plugin'
  
  return `import { Plugin, Tool } from '@runixo/plugin-sdk'

export default class ${className} extends Plugin {
  async onLoad() {
    this.log.info('${answers.displayName} 加载中...')
    
    ${answers.features.includes('agent') ? `
    // 注册 AI Agent
    this.registerAgent({
      id: '${name}-assistant',
      name: '${answers.displayName}助手',
      description: '${answers.description}',
      systemPrompt: '你是一个专业的助手...',
      tools: []
    })
    ` : ''}
    
    ${answers.features.includes('workflow') ? `
    // 注册工作流
    this.registerWorkflow({
      id: '${name}-workflow',
      name: '示例工作流',
      description: '工作流描述',
      steps: []
    })
    ` : ''}
    
    this.log.info('${answers.displayName} 加载完成')
  }
  
  ${answers.features.includes('tools') ? `
  @Tool({
    name: 'example_tool',
    displayName: '示例工具',
    description: '这是一个示例工具',
    category: '工具',
    parameters: {
      input: {
        type: 'string',
        description: '输入参数',
        required: true
      }
    }
  })
  async exampleTool(params: { input: string }) {
    this.log.info('执行示例工具:', params.input)
    return { success: true, result: params.input }
  }
  ` : ''}
}
`
}

function generateReadme(name: string, answers: any): string {
  return `# ${answers.displayName}

${answers.description}

## 功能

${answers.features.map((f: string) => {
  const featureNames: Record<string, string> = {
    ui: '- UI扩展',
    tools: '- AI工具',
    agent: '- AI Agent',
    workflow: '- 工作流',
    prompts: '- 提示词模板',
    config: '- 配置界面'
  }
  return featureNames[f]
}).join('\n')}

## 安装

\`\`\`bash
npm install
\`\`\`

## 开发

\`\`\`bash
npm run dev
\`\`\`

## 构建

\`\`\`bash
npm run build
\`\`\`

## 许可证

MIT
`
}

function toPascalCase(str: string): string {
  return str
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
}
