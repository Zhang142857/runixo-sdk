import { Plugin, PluginContext } from 'runixo-plugin-sdk'

const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4'

interface CloudflareZone {
  id: string
  name: string
  status: string
  name_servers: string[]
  plan: {
    name: string
  }
  created_on: string
}

interface CloudflareDNSRecord {
  id: string
  type: string
  name: string
  content: string
  ttl: number
  proxied: boolean
}

export default class CloudflarePlugin extends Plugin {
  private apiToken: string | null = null
  private accountId: string | null = null

  constructor(context: PluginContext) {
    super(context)
  }

  async onLoad() {
    this.log.info('Cloudflare plugin loaded')
    
    // 加载配置
    this.apiToken = await this.context.secureStorage.get('api_token')
    this.accountId = await this.context.secureStorage.get('account_id')
    
    // 注册 Agent 工具
    this.registerCloudflareTools()
  }

  async onEnable() {
    this.log.info('Cloudflare plugin enabled')
    
    if (!this.apiToken) {
      this.context.ui.showNotification(
        'Please configure Cloudflare API token in plugin settings',
        'warning'
      )
    }
  }

  async onDisable() {
    this.log.info('Cloudflare plugin disabled')
  }

  async onConfigChange(newConfig: any) {
    await super.onConfigChange(newConfig)
    
    // 保存 API Token 到安全存储
    if (newConfig.apiToken) {
      await this.context.secureStorage.set('api_token', newConfig.apiToken)
      this.apiToken = newConfig.apiToken
    }
    
    if (newConfig.accountId) {
      await this.context.secureStorage.set('account_id', newConfig.accountId)
      this.accountId = newConfig.accountId
    }
  }

  /**
   * 注册 Cloudflare Agent 工具
   */
  private registerCloudflareTools() {
    // 列出域名
    this.registerAgentTool({
      name: 'cloudflare_list_zones',
      displayName: '列出 Cloudflare 域名',
      description: '获取 Cloudflare 账户下的所有域名（Zone）列表',
      category: 'cloudflare',
      dangerous: false,
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            description: '域名状态过滤：active, pending, initializing, moved, deleted, deactivated'
          }
        },
        required: []
      },
      handler: 'listZones'
    })

    // 列出 DNS 记录
    this.registerAgentTool({
      name: 'cloudflare_list_dns_records',
      displayName: '列出 DNS 记录',
      description: '获取指定域名的 DNS 记录列表',
      category: 'cloudflare',
      dangerous: false,
      parameters: {
        type: 'object',
        properties: {
          zoneId: {
            type: 'string',
            description: '域名 Zone ID'
          },
          type: {
            type: 'string',
            description: '记录类型过滤：A, AAAA, CNAME, TXT, MX, NS 等'
          }
        },
        required: ['zoneId']
      },
      handler: 'listDNSRecords'
    })

    // 创建 DNS 记录
    this.registerAgentTool({
      name: 'cloudflare_create_dns_record',
      displayName: '创建 DNS 记录',
      description: '为指定域名创建新的 DNS 记录',
      category: 'cloudflare',
      dangerous: true,
      parameters: {
        type: 'object',
        properties: {
          zoneId: {
            type: 'string',
            description: '域名 Zone ID'
          },
          type: {
            type: 'string',
            description: '记录类型：A, AAAA, CNAME, TXT, MX 等'
          },
          name: {
            type: 'string',
            description: '记录名称（子域名）'
          },
          content: {
            type: 'string',
            description: '记录内容（IP地址或目标）'
          },
          proxied: {
            type: 'boolean',
            description: '是否启用 Cloudflare 代理'
          }
        },
        required: ['zoneId', 'type', 'name', 'content']
      },
      handler: 'createDNSRecord'
    })

    // 删除 DNS 记录
    this.registerAgentTool({
      name: 'cloudflare_delete_dns_record',
      displayName: '删除 DNS 记录',
      description: '删除指定的 DNS 记录',
      category: 'cloudflare',
      dangerous: true,
      parameters: {
        type: 'object',
        properties: {
          zoneId: {
            type: 'string',
            description: '域名 Zone ID'
          },
          recordId: {
            type: 'string',
            description: 'DNS 记录 ID'
          }
        },
        required: ['zoneId', 'recordId']
      },
      handler: 'deleteDNSRecord'
    })

    // 清除缓存
    this.registerAgentTool({
      name: 'cloudflare_purge_cache',
      displayName: '清除缓存',
      description: '清除 Cloudflare CDN 缓存',
      category: 'cloudflare',
      dangerous: true,
      parameters: {
        type: 'object',
        properties: {
          zoneId: {
            type: 'string',
            description: '域名 Zone ID'
          },
          purgeEverything: {
            type: 'boolean',
            description: '是否清除所有缓存'
          },
          files: {
            type: 'array',
            description: '要清除的文件 URL 列表'
          }
        },
        required: ['zoneId']
      },
      handler: 'purgeCache'
    })
  }

  /**
   * 发送 Cloudflare API 请求
   */
  private async cfRequest(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any
  ): Promise<any> {
    if (!this.apiToken) {
      throw new Error('Cloudflare API Token not configured')
    }

    try {
      const response = await this.context.http.request({
        method,
        url: `${CLOUDFLARE_API_BASE}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        data: body
      })

      if (!response.data.success) {
        const errors = response.data.errors || []
        throw new Error(errors.map((e: any) => e.message).join(', ') || 'API request failed')
      }

      return response.data.result
    } catch (error: any) {
      this.log.error('Cloudflare API request failed:', error)
      throw new Error(`Cloudflare API error: ${error.message}`)
    }
  }

  /**
   * 列出域名
   */
  async listZones(params: { status?: string } = {}): Promise<CloudflareZone[]> {
    let endpoint = '/zones'
    if (params.status) {
      endpoint += `?status=${params.status}`
    }

    const zones = await this.cfRequest(endpoint)
    this.log.info(`Listed ${zones.length} zones`)
    return zones
  }

  /**
   * 列出 DNS 记录
   */
  async listDNSRecords(params: { zoneId: string; type?: string }): Promise<CloudflareDNSRecord[]> {
    let endpoint = `/zones/${params.zoneId}/dns_records`
    if (params.type) {
      endpoint += `?type=${params.type}`
    }

    const records = await this.cfRequest(endpoint)
    this.log.info(`Listed ${records.length} DNS records for zone ${params.zoneId}`)
    return records
  }

  /**
   * 创建 DNS 记录
   */
  async createDNSRecord(params: {
    zoneId: string
    type: string
    name: string
    content: string
    proxied?: boolean
    ttl?: number
  }): Promise<CloudflareDNSRecord> {
    const body = {
      type: params.type,
      name: params.name,
      content: params.content,
      proxied: params.proxied || false,
      ttl: params.ttl || 1
    }

    const record = await this.cfRequest(
      `/zones/${params.zoneId}/dns_records`,
      'POST',
      body
    )

    this.log.info(`Created DNS record: ${params.name} (${params.type})`)
    this.context.ui.showNotification('DNS record created successfully', 'success')
    
    return record
  }

  /**
   * 删除 DNS 记录
   */
  async deleteDNSRecord(params: { zoneId: string; recordId: string }): Promise<void> {
    await this.cfRequest(
      `/zones/${params.zoneId}/dns_records/${params.recordId}`,
      'DELETE'
    )

    this.log.info(`Deleted DNS record: ${params.recordId}`)
    this.context.ui.showNotification('DNS record deleted successfully', 'success')
  }

  /**
   * 清除缓存
   */
  async purgeCache(params: {
    zoneId: string
    purgeEverything?: boolean
    files?: string[]
  }): Promise<void> {
    const body: any = {}

    if (params.purgeEverything) {
      body.purge_everything = true
    } else if (params.files && params.files.length > 0) {
      body.files = params.files
    } else {
      throw new Error('Must specify either purgeEverything or files')
    }

    await this.cfRequest(
      `/zones/${params.zoneId}/purge_cache`,
      'POST',
      body
    )

    this.log.info(`Purged cache for zone ${params.zoneId}`)
    this.context.ui.showNotification('Cache purged successfully', 'success')
  }

  /**
   * 检查是否已认证
   */
  isAuthenticated(): boolean {
    return !!this.apiToken
  }

  /**
   * 获取区域列表（用于前端）
   */
  async getZones(): Promise<CloudflareZone[]> {
    return this.listZones()
  }

  /**
   * 获取 DNS 记录（用于前端）
   */
  async getDNSRecords(zoneId: string): Promise<CloudflareDNSRecord[]> {
    return this.listDNSRecords({ zoneId })
  }
}
