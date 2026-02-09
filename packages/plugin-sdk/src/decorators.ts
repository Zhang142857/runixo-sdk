/**
 * 插件装饰器
 * 提供声明式的插件开发方式
 */

/**
 * 标记方法为工具处理器
 * @example
 * @Tool({ name: 'my_tool', description: '...', category: 'utils' })
 * async myTool(params: any) { ... }
 */
export function Tool(config: {
  name: string
  displayName?: string
  description: string
  category: string
  dangerous?: boolean
  parameters?: Record<string, { type: string; description: string; required: boolean }>
}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    if (!target.__tools) target.__tools = []
    target.__tools.push({
      ...config,
      displayName: config.displayName || config.name,
      handler: descriptor.value
    })
    return descriptor
  }
}

/**
 * 标记方法为命令处理器
 */
export function Command(config: {
  id: string
  name: string
  description: string
  shortcut?: string
}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    if (!target.__commands) target.__commands = []
    target.__commands.push({
      ...config,
      handler: descriptor.value
    })
    return descriptor
  }
}

/**
 * 标记方法为事件监听器
 */
export function OnEvent(eventName: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    if (!target.__eventListeners) target.__eventListeners = []
    target.__eventListeners.push({
      event: eventName,
      handler: descriptor.value
    })
    return descriptor
  }
}

/**
 * 标记方法需要特定权限
 */
export function RequirePermission(...permissions: string[]) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const original = descriptor.value
    descriptor.value = function (this: any, ...args: any[]) {
      const pluginPermissions = this.context?.metadata?.permissions || []
      for (const perm of permissions) {
        if (!pluginPermissions.includes(perm)) {
          throw new Error(`缺少权限: ${perm}`)
        }
      }
      return original.apply(this, args)
    }
    return descriptor
  }
}
