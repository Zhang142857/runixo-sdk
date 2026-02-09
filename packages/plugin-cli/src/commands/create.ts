import inquirer from 'inquirer'
import chalk from 'chalk'
import ora from 'ora'
import fs from 'fs-extra'
import path from 'path'
import { generateBasicPlugin } from '../templates/basic'
import { generateCloudServicePlugin } from '../templates/cloud-service'

interface CreateOptions {
  template?: string
}

export async function createCommand(name?: string, options?: CreateOptions) {
  console.log(chalk.blue.bold('\n🚀 Runixo Plugin Creator\n'))

  // 如果没有提供名称，询问用户
  if (!name) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'pluginName',
        message: 'Plugin name:',
        validate: (input) => {
          if (!input) return 'Plugin name is required'
          if (!/^[a-z0-9-]+$/.test(input)) {
            return 'Plugin name must contain only lowercase letters, numbers, and hyphens'
          }
          return true
        }
      }
    ])
    name = answers.pluginName
  }

  // 如果没有提供模板，询问用户
  let template = options?.template
  if (!template) {
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'template',
        message: 'Select a template:',
        choices: [
          { name: 'Basic Plugin', value: 'basic' },
          { name: 'Cloud Service Plugin', value: 'cloud-service' },
          { name: 'Monitoring Plugin', value: 'monitoring' }
        ]
      }
    ])
    template = answers.template
  }

  // 询问插件详细信息
  const details = await inquirer.prompt([
    {
      type: 'input',
      name: 'displayName',
      message: 'Display name:',
      default: name!.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    },
    {
      type: 'input',
      name: 'description',
      message: 'Description:',
      default: `A Runixo plugin`
    },
    {
      type: 'input',
      name: 'author',
      message: 'Author:',
      default: 'Runixo'
    },
    {
      type: 'input',
      name: 'version',
      message: 'Version:',
      default: '1.0.0'
    }
  ])

  const pluginDir = path.join(process.cwd(), name!)
  
  // 检查目录是否已存在
  if (await fs.pathExists(pluginDir)) {
    console.log(chalk.red(`\n❌ Directory ${name} already exists\n`))
    process.exit(1)
  }

  const spinner = ora('Creating plugin...').start()

  try {
    // 创建插件目录
    await fs.ensureDir(pluginDir)

    // 根据模板生成文件
    const pluginConfig = {
      id: name!,
      name: details.displayName,
      description: details.description,
      author: details.author,
      version: details.version
    }

    switch (template) {
      case 'basic':
        await generateBasicPlugin(pluginDir, pluginConfig)
        break
      case 'cloud-service':
        await generateCloudServicePlugin(pluginDir, pluginConfig)
        break
      case 'monitoring':
        // TODO: 实现监控插件模板
        await generateBasicPlugin(pluginDir, pluginConfig)
        break
      default:
        await generateBasicPlugin(pluginDir, pluginConfig)
    }

    spinner.succeed(chalk.green('Plugin created successfully!'))

    console.log(chalk.cyan('\n📦 Next steps:\n'))
    console.log(chalk.white(`  cd ${name}`))
    console.log(chalk.white(`  npm install`))
    console.log(chalk.white(`  npm run dev`))
    console.log()

  } catch (error) {
    spinner.fail(chalk.red('Failed to create plugin'))
    console.error(error)
    process.exit(1)
  }
}
