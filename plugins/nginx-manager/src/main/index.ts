import { Plugin, Tool } from 'runixo-sdk'

export default class NginxManagerPlugin extends Plugin {
  private get configPath() {
    const p = this.config.nginxConfigPath || '/etc/nginx'
    // 防止命令注入：只允许安全的路径字符
    if (!/^\/[a-zA-Z0-9_./-]+$/.test(p)) {
      throw new Error(`Invalid nginx config path: ${p}`)
    }
    return p
  }

  // 验证站点文件名，防止命令注入
  private validateSiteName(site: string): string {
    if (!/^[a-zA-Z0-9._-]+$/.test(site)) {
      throw new Error(`Invalid site name: ${site}`)
    }
    return site
  }

  async onEnable() {
    this.log.info('Nginx Manager plugin enabled')
  }

  @Tool({
    name: 'nginx_status',
    displayName: 'Nginx 状态',
    description: 'Get nginx service status',
    category: 'web',
    parameters: {
      serverId: { type: 'string', description: 'Server ID', required: true }
    }
  })
  async getStatus(params: { serverId: string }) {
    const status = await this.context.server.executeCommand(params.serverId, 'bash', ['-c', 'systemctl is-active nginx 2>/dev/null || echo inactive'])
    const version = await this.context.server.executeCommand(params.serverId, 'bash', ['-c', 'nginx -v 2>&1 || echo unknown'])
    const test = await this.context.server.executeCommand(params.serverId, 'bash', ['-c', 'nginx -t 2>&1'])
    return {
      running: status.stdout.trim() === 'active',
      version: version.stderr?.trim() || version.stdout.trim(),
      configTest: test.exit_code === 0 ? 'ok' : test.stderr.trim()
    }
  }

  @Tool({
    name: 'nginx_sites',
    displayName: '站点列表',
    description: 'List nginx site configurations',
    category: 'web',
    parameters: {
      serverId: { type: 'string', description: 'Server ID', required: true }
    }
  })
  async listSites(params: { serverId: string }) {
    const enabled = await this.context.server.executeCommand(params.serverId, 'bash', ['-c', `ls ${this.configPath}/sites-enabled/ 2>/dev/null || ls ${this.configPath}/conf.d/*.conf 2>/dev/null || echo ""`])
    return enabled.stdout.trim().split('\n').filter(Boolean).map(f => ({ name: f.replace('.conf', ''), file: f }))
  }

  @Tool({
    name: 'nginx_site_config',
    displayName: '查看站点配置',
    description: 'Read a site configuration file',
    category: 'web',
    parameters: {
      serverId: { type: 'string', description: 'Server ID', required: true },
      site: { type: 'string', description: 'Site config filename', required: true }
    }
  })
  async getSiteConfig(params: { serverId: string; site: string }) {
    const site = this.validateSiteName(params.site)
    const paths = [`${this.configPath}/sites-enabled/${site}`, `${this.configPath}/conf.d/${site}`]
    for (const p of paths) {
      const r = await this.context.server.executeCommand(params.serverId, 'bash', ['-c', `cat "${p}" 2>/dev/null`])
      if (r.exit_code === 0 && r.stdout) return { path: p, content: r.stdout }
    }
    return { error: 'Config not found' }
  }

  @Tool({
    name: 'nginx_reload',
    displayName: '重载 Nginx',
    description: 'Test config and reload nginx',
    category: 'web',
    dangerous: true,
    parameters: {
      serverId: { type: 'string', description: 'Server ID', required: true }
    }
  })
  async reload(params: { serverId: string }) {
    const test = await this.context.server.executeCommand(params.serverId, 'bash', ['-c', 'nginx -t 2>&1'])
    if (test.exit_code !== 0) return { success: false, error: test.stderr.trim() }
    const reload = await this.context.server.executeCommand(params.serverId, 'bash', ['-c', 'systemctl reload nginx 2>&1'])
    return { success: reload.exit_code === 0, message: reload.exit_code === 0 ? 'Nginx reloaded' : reload.stderr.trim() }
  }
}
