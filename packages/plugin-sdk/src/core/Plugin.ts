import {
  PluginContext,
  PluginConfig,
  PluginMetadata,
  ToolDefinition,
  MenuDefinition,
  RouteDefinition,
  CommandDefinition,
  AgentToolDefinition,
  AgentCallOptions,
  AgentResponse,
  AgentDefinition,
  WorkflowDefinition,
  PromptTemplateDefinition
} from 'runixo-plugin-types'

/**
 * 插件基类
 * 所有插件都应该继承此类
 */
export abstract class Plugin {
  protected context: PluginContext
  protected config: PluginConfig

  constructor(context: PluginContext) {
    this.context = context
    this.config = context.config
  }

  /**
   * 插件加载时调用（插件首次安装或应用启动时）
   * 自动注册通过装饰器声明的工具、命令和事件监听器
   */
  async onLoad(): Promise<void> {
    this.autoRegister()
  }

  /**
   * 自动注册装饰器声明的工具/命令/事件
   */
  private autoRegister(): void {
    const proto = Object.getPrototypeOf(this)

    // 注册 @Tool 装饰器标记的方法
    if (proto.__tools) {
      for (const tool of proto.__tools) {
        this.registerTool({
          ...tool,
          handler: tool.handler.bind(this)
        })
      }
    }

    // 注册 @Command 装饰器标记的方法
    if (proto.__commands) {
      for (const cmd of proto.__commands) {
        this.registerCommand({
          ...cmd,
          handler: cmd.handler.bind(this)
        })
      }
    }

    // 注册 @OnEvent 装饰器标记的方法
    if (proto.__eventListeners) {
      for (const listener of proto.__eventListeners) {
        this.context.events.on(listener.event, listener.handler.bind(this))
      }
    }
  }

  /**
   * 插件启用时调用
   */
  async onEnable(): Promise<void> {
    // 子类可选实现
  }

  /**
   * 插件禁用时调用
   */
  async onDisable(): Promise<void> {
    // 子类可选实现
  }

  /**
   * 插件卸载时调用
   */
  async onUnload(): Promise<void> {
    // 子类可选实现
  }

  /**
   * 配置变更时调用
   */
  async onConfigChange(newConfig: PluginConfig): Promise<void> {
    this.config = newConfig
  }

  /**
   * 注册工具到插件系统
   */
  protected registerTool(tool: ToolDefinition): void {
    this.context.tools.register(tool)
  }

  /**
   * 注册菜单项
   */
  protected registerMenu(menu: MenuDefinition): void {
    this.context.menus.register(menu)
  }

  /**
   * 注册路由
   */
  protected registerRoute(route: RouteDefinition): void {
    this.context.routes.register(route)
  }

  /**
   * 注册命令
   */
  protected registerCommand(command: CommandDefinition): void {
    this.context.commands.register(command)
  }

  /**
   * 注册Agent工具
   */
  protected registerAgentTool(tool: AgentToolDefinition): void {
    this.context.agent.registerTool(tool)
  }

  /**
   * 注册AI Agent
   */
  protected registerAgent(agent: AgentDefinition): void {
    this.context.agent.registerAgent(agent)
  }

  /**
   * 注册工作流
   */
  protected registerWorkflow(workflow: WorkflowDefinition): void {
    this.context.agent.registerWorkflow(workflow)
  }

  /**
   * 注册提示词模板
   */
  protected registerPromptTemplate(template: PromptTemplateDefinition): void {
    this.context.agent.registerPromptTemplate(template)
  }

  /**
   * 调用Agent
   */
  protected async callAgent(
    prompt: string,
    options?: AgentCallOptions
  ): Promise<AgentResponse> {
    return this.context.agent.chat(prompt, options) as any
  }

  /**
   * 执行工作流
   */
  protected async executeWorkflow(
    workflowId: string,
    inputs: Record<string, any>
  ): Promise<any> {
    return this.context.agent.executeWorkflow(workflowId, inputs)
  }

  /**
   * 渲染提示词模板
   */
  protected renderPrompt(
    templateId: string,
    variables: Record<string, any>
  ): string {
    return this.context.agent.renderPrompt(templateId, variables)
  }

  /**
   * 获取插件ID
   */
  get pluginId(): string {
    return this.context.pluginId
  }

  /**
   * 获取插件元数据
   */
  get metadata(): PluginMetadata {
    return this.context.metadata
  }

  /**
   * 日志记录
   */
  protected log = {
    debug: (msg: string, ...args: any[]) => this.context.logger.debug(msg, ...args),
    info: (msg: string, ...args: any[]) => this.context.logger.info(msg, ...args),
    warn: (msg: string, ...args: any[]) => this.context.logger.warn(msg, ...args),
    error: (msg: string, ...args: any[]) => this.context.logger.error(msg, ...args)
  }
}
