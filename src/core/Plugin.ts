import { PluginContext, PluginManifest, ToolDef, MenuDef, RouteDef, CommandDef, AgentToolDef } from '../types'

export abstract class Plugin {
  protected context: PluginContext
  protected config: Record<string, any>

  constructor(context: PluginContext) {
    this.context = context
    this.config = context.config
  }

  async onLoad(): Promise<void> { this._autoRegister() }
  async onEnable(): Promise<void> {}
  async onDisable(): Promise<void> {}
  async onUnload(): Promise<void> {}
  async onConfigChange(cfg: Record<string, any>): Promise<void> { this.config = cfg }

  private _autoRegister() {
    const proto = Object.getPrototypeOf(this)
    if (proto.__tools) for (const t of proto.__tools) this.context.tools.register({ ...t, handler: t.handler.bind(this) })
    if (proto.__commands) for (const c of proto.__commands) this.context.commands.register({ ...c, handler: c.handler.bind(this) })
    if (proto.__events) for (const e of proto.__events) this.context.events.on(e.event, e.handler.bind(this))
  }

  protected registerTool(tool: ToolDef & { handler: Function }) { this.context.tools.register(tool) }
  protected registerMenu(menu: MenuDef) { this.context.menus.register(menu) }
  protected registerRoute(route: RouteDef) { this.context.routes.register(route) }
  protected registerCommand(cmd: CommandDef) { this.context.commands.register(cmd) }
  protected registerAgentTool(tool: AgentToolDef) { this.context.agent.registerTool(tool) }

  get pluginId() { return this.context.pluginId }
  get metadata(): PluginManifest { return this.context.metadata }

  protected log = {
    debug: (...a: any[]) => this.context.logger.debug(...a),
    info: (...a: any[]) => this.context.logger.info(...a),
    warn: (...a: any[]) => this.context.logger.warn(...a),
    error: (...a: any[]) => this.context.logger.error(...a),
  }
}
