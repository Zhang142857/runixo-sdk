#!/usr/bin/env node

import { Command } from 'commander'
import { createPlugin } from './create'
import { buildPlugin } from './build'
import { packPlugin } from './pack'

const program = new Command()
program.name('runixo-plugin').description('Runixo Plugin SDK CLI').version('1.0.0')

program.command('create [name]').description('Create a new plugin project')
  .option('-t, --template <type>', 'Template: basic, cloud-service', 'basic')
  .action(createPlugin)

program.command('build').description('Build the plugin (TypeScript → JS)')
  .option('-w, --watch', 'Watch mode')
  .action(buildPlugin)

program.command('pack').description('Package plugin into .shplugin file')
  .option('-o, --output <dir>', 'Output directory', '.')
  .action(packPlugin)

program.parse()
