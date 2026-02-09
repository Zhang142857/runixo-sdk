/**
 * Cloudflare 插件主进程入口
 * 提供 Cloudflare API 调用功能
 */

const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4'

interface CloudflareConfig {
  apiToken: string
  accountId?: string
}

let config: CloudflareConfig | null = null

/**
 * 初始化插件
 */
export function activate() {
  console.log('[Cloudflare Plugin] Activated')
}

/**
 * 停用插件
 */
export function deactivate() {
  config = null
  console.log('[Cloudflare Plugin] Deactivated')
}

/**
 * 配置变更回调
 */
export function onConfigChange(newConfig: CloudflareConfig) {
  config = newConfig
  console.log('[Cloudflare Plugin] Config updated')
}

/**
 * 发送 Cloudflare API 请求
 */
async function cfRequest(
  endpoint: string,
  method: string = 'GET',
  body?: unknown
): Promise<unknown> {
  if (!config?.apiToken) {
    throw new Error('Cloudflare API Token not configured')
  }

  const response = await fetch(`${CLOUDFLARE_API_BASE}${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${config.apiToken}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  })

  const data = await response.json()

  if (!data.success) {
    const errors = data.errors?.map((e: { message: string }) => e.message).join(', ')
    throw new Error(`Cloudflare API Error: ${errors || 'Unknown error'}`)
  }

  return data.result
}

/**
 * 列出所有域名（Zones）
 */
export async function listZones(args: { status?: string }): Promise<unknown> {
  let endpoint = '/zones'
  if (args.status) {
    endpoint += `?status=${args.status}`
  }
  return await cfRequest(endpoint)
}

/**
 * 列出 DNS 记录
 */
export async function listDNSRecords(args: { zoneId: string; type?: string }): Promise<unknown> {
  let endpoint = `/zones/${args.zoneId}/dns_records`
  if (args.type) {
    endpoint += `?type=${args.type}`
  }
  return await cfRequest(endpoint)
}

/**
 * 创建 DNS 记录
 */
export async function createDNSRecord(args: {
  zoneId: string
  type: string
  name: string
  content: string
  proxied?: boolean
  ttl?: number
}): Promise<unknown> {
  return await cfRequest(`/zones/${args.zoneId}/dns_records`, 'POST', {
    type: args.type,
    name: args.name,
    content: args.content,
    proxied: args.proxied ?? false,
    ttl: args.ttl ?? 1 // 1 = auto
  })
}

/**
 * 更新 DNS 记录
 */
export async function updateDNSRecord(args: {
  zoneId: string
  recordId: string
  type: string
  name: string
  content: string
  proxied?: boolean
  ttl?: number
}): Promise<unknown> {
  return await cfRequest(`/zones/${args.zoneId}/dns_records/${args.recordId}`, 'PUT', {
    type: args.type,
    name: args.name,
    content: args.content,
    proxied: args.proxied ?? false,
    ttl: args.ttl ?? 1
  })
}

/**
 * 删除 DNS 记录
 */
export async function deleteDNSRecord(args: {
  zoneId: string
  recordId: string
}): Promise<unknown> {
  return await cfRequest(`/zones/${args.zoneId}/dns_records/${args.recordId}`, 'DELETE')
}

/**
 * 清除缓存
 */
export async function purgeCache(args: {
  zoneId: string
  purgeEverything?: boolean
  files?: string[]
}): Promise<unknown> {
  const body: { purge_everything?: boolean; files?: string[] } = {}

  if (args.purgeEverything) {
    body.purge_everything = true
  } else if (args.files && args.files.length > 0) {
    body.files = args.files
  } else {
    body.purge_everything = true
  }

  return await cfRequest(`/zones/${args.zoneId}/purge_cache`, 'POST', body)
}

/**
 * 获取安全级别
 */
export async function getSecurityLevel(args: { zoneId: string }): Promise<unknown> {
  return await cfRequest(`/zones/${args.zoneId}/settings/security_level`)
}

/**
 * 设置安全级别
 */
export async function setSecurityLevel(args: {
  zoneId: string
  level: string
}): Promise<unknown> {
  return await cfRequest(`/zones/${args.zoneId}/settings/security_level`, 'PATCH', {
    value: args.level
  })
}

/**
 * 获取域名分析数据
 */
export async function getZoneAnalytics(args: {
  zoneId: string
  since?: string
  until?: string
}): Promise<unknown> {
  let endpoint = `/zones/${args.zoneId}/analytics/dashboard`
  const params: string[] = []

  if (args.since) params.push(`since=${args.since}`)
  if (args.until) params.push(`until=${args.until}`)

  if (params.length > 0) {
    endpoint += `?${params.join('&')}`
  }

  return await cfRequest(endpoint)
}

/**
 * 获取防火墙规则
 */
export async function getFirewallRules(args: { zoneId: string }): Promise<unknown> {
  return await cfRequest(`/zones/${args.zoneId}/firewall/rules`)
}

/**
 * 创建防火墙规则
 */
export async function createFirewallRule(args: {
  zoneId: string
  filter: { expression: string }
  action: string
  description?: string
  priority?: number
}): Promise<unknown> {
  // 首先创建 filter
  const filterResult = await cfRequest(`/zones/${args.zoneId}/filters`, 'POST', [args.filter]) as { id: string }[]

  // 然后创建规则
  return await cfRequest(`/zones/${args.zoneId}/firewall/rules`, 'POST', [{
    filter: { id: filterResult[0].id },
    action: args.action,
    description: args.description,
    priority: args.priority
  }])
}

/**
 * 删除防火墙规则
 */
export async function deleteFirewallRule(args: {
  zoneId: string
  ruleId: string
}): Promise<unknown> {
  return await cfRequest(`/zones/${args.zoneId}/firewall/rules/${args.ruleId}`, 'DELETE')
}

/**
 * 获取 WAF 规则包
 */
export async function getWAFPackages(args: { zoneId: string }): Promise<unknown> {
  return await cfRequest(`/zones/${args.zoneId}/firewall/waf/packages`)
}

/**
 * 获取 IP 访问规则
 */
export async function getIPAccessRules(args: { zoneId: string }): Promise<unknown> {
  return await cfRequest(`/zones/${args.zoneId}/firewall/access_rules/rules`)
}

/**
 * 创建 IP 访问规则（封禁/允许 IP）
 */
export async function createIPAccessRule(args: {
  zoneId: string
  mode: 'block' | 'challenge' | 'whitelist' | 'js_challenge'
  ip: string
  notes?: string
}): Promise<unknown> {
  return await cfRequest(`/zones/${args.zoneId}/firewall/access_rules/rules`, 'POST', {
    mode: args.mode,
    configuration: {
      target: 'ip',
      value: args.ip
    },
    notes: args.notes || `Added by Runixo at ${new Date().toISOString()}`
  })
}

/**
 * 删除 IP 访问规则
 */
export async function deleteIPAccessRule(args: {
  zoneId: string
  ruleId: string
}): Promise<unknown> {
  return await cfRequest(`/zones/${args.zoneId}/firewall/access_rules/rules/${args.ruleId}`, 'DELETE')
}
