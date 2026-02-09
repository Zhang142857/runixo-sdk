export function Tool(config: { name: string; displayName?: string; description: string; category: string; dangerous?: boolean; parameters?: Record<string, any> }) {
  return function (_target: any, _key: string, desc: PropertyDescriptor) {
    if (!_target.__tools) _target.__tools = []
    _target.__tools.push({ ...config, displayName: config.displayName || config.name, handler: desc.value })
    return desc
  }
}

export function Command(config: { id: string; name: string; description: string; shortcut?: string }) {
  return function (_target: any, _key: string, desc: PropertyDescriptor) {
    if (!_target.__commands) _target.__commands = []
    _target.__commands.push({ ...config, handler: desc.value })
    return desc
  }
}

export function OnEvent(event: string) {
  return function (_target: any, _key: string, desc: PropertyDescriptor) {
    if (!_target.__events) _target.__events = []
    _target.__events.push({ event, handler: desc.value })
    return desc
  }
}

export function RequirePermission(...perms: string[]) {
  return function (_target: any, _key: string, desc: PropertyDescriptor) {
    const orig = desc.value
    desc.value = function (this: any, ...args: any[]) {
      const has = this.context?.metadata?.permissions || []
      for (const p of perms) if (!has.includes(p)) throw new Error(`Missing permission: ${p}`)
      return orig.apply(this, args)
    }
    return desc
  }
}
