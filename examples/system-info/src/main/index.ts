import { Plugin, Tool } from 'runixo-sdk'

export default class SystemInfoPlugin extends Plugin {
  async onEnable() {
    this.log.info('System Info plugin enabled')
  }

  @Tool({
    name: 'get_system_overview',
    displayName: '系统概览',
    description: 'Get system overview for the current server',
    category: 'monitoring',
    parameters: {
      serverId: { type: 'string', description: 'Server ID', required: true }
    }
  })
  async getSystemOverview(params: { serverId: string }) {
    const info = await this.context.server.getSystemInfo(params.serverId)
    return {
      hostname: info.hostname,
      platform: info.platform,
      cpus: info.cpus,
      memory: `${(info.freeMemory / 1024 / 1024 / 1024).toFixed(1)}GB free / ${(info.totalMemory / 1024 / 1024 / 1024).toFixed(1)}GB total`,
      uptime: `${Math.floor(info.uptime / 3600)}h ${Math.floor((info.uptime % 3600) / 60)}m`
    }
  }

  @Tool({
    name: 'run_diagnostic',
    displayName: '运行诊断',
    description: 'Run basic system diagnostic',
    category: 'monitoring',
    parameters: {
      serverId: { type: 'string', description: 'Server ID', required: true }
    }
  })
  async runDiagnostic(params: { serverId: string }) {
    const cmds = [
      { name: 'disk', cmd: 'df -h / | tail -1' },
      { name: 'load', cmd: 'cat /proc/loadavg' },
      { name: 'memory', cmd: 'free -h | grep Mem' },
    ]
    const results: Record<string, string> = {}
    for (const c of cmds) {
      const r = await this.context.server.executeCommand(params.serverId, 'bash', ['-c', c.cmd])
      results[c.name] = r.stdout.trim()
    }
    return results
  }
}
