import chalk from 'chalk'
import ora from 'ora'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

interface BuildOptions {
  watch?: boolean
}

export async function buildCommand(options?: BuildOptions) {
  console.log(chalk.blue.bold('\n🔨 Building plugin...\n'))

  const spinner = ora('Compiling TypeScript...').start()

  try {
    const command = options?.watch ? 'tsc --watch' : 'tsc'
    
    if (options?.watch) {
      spinner.text = 'Watching for changes...'
      const child = exec(command)
      
      child.stdout?.on('data', (data) => {
        console.log(data.toString())
      })
      
      child.stderr?.on('data', (data) => {
        console.error(chalk.red(data.toString()))
      })
      
    } else {
      const { stdout, stderr } = await execAsync(command)
      
      if (stderr) {
        spinner.warn(chalk.yellow('Build completed with warnings'))
        console.log(stderr)
      } else {
        spinner.succeed(chalk.green('Build completed successfully!'))
      }
      
      if (stdout) {
        console.log(stdout)
      }
    }

  } catch (error: any) {
    spinner.fail(chalk.red('Build failed'))
    console.error(error.message)
    process.exit(1)
  }
}
