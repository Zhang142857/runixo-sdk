import chalk from 'chalk'
import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs'
import * as path from 'path'

const execAsync = promisify(exec)

export async function buildPlugin(opts: { watch?: boolean }) {
  console.log(chalk.blue('\n🔨 Building plugin...\n'))

  // Check if tsconfig exists
  if (!fs.existsSync(path.join(process.cwd(), 'tsconfig.json'))) {
    console.error(chalk.red('❌ tsconfig.json not found'))
    process.exit(1)
  }

  try {
    if (opts.watch) {
      const child = exec('npx tsc --watch')
      child.stdout?.pipe(process.stdout)
      child.stderr?.pipe(process.stderr)
    } else {
      const { stderr } = await execAsync('npx tsc')
      if (stderr && !stderr.includes('error')) {
        console.log(chalk.yellow(stderr))
      }
      console.log(chalk.green('✅ Build completed!\n'))
    }
  } catch (e: any) {
    console.error(chalk.red('❌ Build failed'))
    if (e.stdout) console.log(e.stdout)
    if (e.stderr) console.error(e.stderr)
    process.exit(1)
  }
}
