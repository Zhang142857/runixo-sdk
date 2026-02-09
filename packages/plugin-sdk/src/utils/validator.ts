/**
 * 插件清单验证器
 * 验证 plugin.json 的格式和内容
 */
import { PluginMetadata } from 'runixo-plugin-types'

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

const VALID_PERMISSIONS = [
  'network:request', 'file:read', 'file:write',
  'system:execute', 'system:info',
  'ui:notification', 'ui:dialog',
  'menu:register', 'route:register', 'tool:register', 'command:register',
  'agent:tool', 'agent:chat'
]

const SEMVER_REGEX = /^\d+\.\d+\.\d+(-[\w.]+)?$/
const PLUGIN_ID_REGEX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/

export function validateManifest(manifest: Partial<PluginMetadata>): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // 必填字段
  if (!manifest.id) errors.push('缺少必填字段: id')
  else if (!PLUGIN_ID_REGEX.test(manifest.id)) {
    errors.push('id 只能包含小写字母、数字和连字符，且不能以连字符开头或结尾')
  }

  if (!manifest.name) errors.push('缺少必填字段: name')
  if (!manifest.version) errors.push('缺少必填字段: version')
  else if (!SEMVER_REGEX.test(manifest.version)) {
    errors.push('version 必须符合语义化版本规范 (如 1.0.0)')
  }

  if (!manifest.description) warnings.push('建议添加 description 字段')
  if (!manifest.author) warnings.push('建议添加 author 字段')
  if (!manifest.main) warnings.push('未指定 main 入口文件')

  // 权限验证
  if (manifest.permissions) {
    for (const perm of manifest.permissions) {
      if (!VALID_PERMISSIONS.includes(perm)) {
        warnings.push(`未知权限: ${perm}`)
      }
    }
  }

  // 版本兼容性
  if (manifest.minAppVersion && !SEMVER_REGEX.test(manifest.minAppVersion)) {
    errors.push('minAppVersion 必须符合语义化版本规范')
  }

  return { valid: errors.length === 0, errors, warnings }
}

/**
 * 验证工具参数
 */
export function validateToolParams(
  params: Record<string, any>,
  schema: Record<string, { type: string; required: boolean; default?: any }>
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  for (const [key, def] of Object.entries(schema)) {
    const value = params[key]

    if (def.required && (value === undefined || value === null)) {
      errors.push(`缺少必填参数: ${key}`)
      continue
    }

    if (value !== undefined && value !== null) {
      const actualType = Array.isArray(value) ? 'array' : typeof value
      if (actualType !== def.type) {
        errors.push(`参数 ${key} 类型错误: 期望 ${def.type}，实际 ${actualType}`)
      }
    }
  }

  return { valid: errors.length === 0, errors }
}
