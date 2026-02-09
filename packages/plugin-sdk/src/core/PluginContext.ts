import {
  PluginConfig,
  PluginMetadata,
  ToolDefinition,
  MenuDefinition,
  RouteDefinition,
  CommandDefinition,
  AgentDefinition,
  WorkflowDefinition,
  PromptTemplateDefinition,
  HttpRequestConfig,
  HttpResponse,
  DialogOptions,
  DialogResult,
  ExecOptions,
  CommandResult,
  SystemInfo,
  EventHandler
} from 'runixo-plugin-types'

/**
 * 插件上下文
 * 提供插件运行时的所有API
 */
export interface PluginContext {
  readonly pluginId: string
  readonly config: PluginConfig
  readonly metadata: PluginMetadata

  // 存储API
  storage: PluginStorageAPI
  secureStorage: PluginSecureStorageAPI

  // 网络API
  http: PluginHttpAPI

  // UI API
  ui: PluginUIAPI

  // 服务器操作API
  server: PluginServerAPI
  file: PluginFileAPI

  // 事件API
  events: PluginEventAPI

  // AI API
  agent: PluginAgentAPI

  // 注册API
  tools: PluginToolsAPI
  menus: PluginMenusAPI
  routes: PluginRoutesAPI
  commands: PluginCommandsAPI

  // 日志API
  logger: PluginLoggerAPI
}

/**
 * 存储API
 */
export interface PluginStorageAPI {
  get<T = any>(key: string): Promise<T | null>
  set(key: string, value: any): Promise<void>
  delete(key: string): Promise<void>
  clear(): Promise<void>
  keys(): Promise<string[]>
}

/**
 * 加密存储API
 */
export interface PluginSecureStorageAPI {
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<void>
  delete(key: string): Promise<void>
}

/**
 * HTTP API
 */
export interface PluginHttpAPI {
  get<T = any>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>>
  post<T = any>(url: string, data?: any, config?: HttpRequestConfig): Promise<HttpResponse<T>>
  put<T = any>(url: string, data?: any, config?: HttpRequestConfig): Promise<HttpResponse<T>>
  delete<T = any>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>>
  request<T = any>(config: HttpRequestConfig): Promise<HttpResponse<T>>
}

/**
 * UI API
 */
export interface PluginUIAPI {
  showNotification(title: string, message: string, type?: 'info' | 'success' | 'warning' | 'error'): void
  showDialog(options: DialogOptions): Promise<DialogResult>
  showMessage(message: string, type?: 'info' | 'success' | 'warning' | 'error'): void
}

/**
 * 服务器操作API
 */
export interface PluginServerAPI {
  execute(serverId: string, command: string, options?: ExecOptions): Promise<CommandResult>
  getSystemInfo(serverId: string): Promise<SystemInfo>
  listServers(): Promise<Array<{ id: string; name: string; host: string }>>
}

/**
 * 文件操作API
 */
export interface PluginFileAPI {
  read(serverId: string, path: string): Promise<string>
  write(serverId: string, path: string, content: string): Promise<void>
  exists(serverId: string, path: string): Promise<boolean>
  delete(serverId: string, path: string): Promise<void>
  list(serverId: string, path: string): Promise<Array<{ name: string; isDirectory: boolean }>>
}

/**
 * 事件API
 */
export interface PluginEventAPI {
  on(event: string, handler: EventHandler): void
  off(event: string, handler: EventHandler): void
  emit(event: string, data?: any): void
  once(event: string, handler: EventHandler): void
}

/**
 * AI Agent API
 */
export interface PluginAgentAPI {
  registerTool(tool: any): void
  registerAgent(agent: AgentDefinition): void
  registerWorkflow(workflow: WorkflowDefinition): void
  registerPromptTemplate(template: PromptTemplateDefinition): void
  chat(prompt: string, options?: any): Promise<any>
  executeWorkflow(workflowId: string, inputs: Record<string, any>): Promise<any>
  renderPrompt(templateId: string, variables: Record<string, any>): string
  listAgents(): AgentDefinition[]
  listWorkflows(): WorkflowDefinition[]
  listPromptTemplates(): PromptTemplateDefinition[]
}

/**
 * 工具注册API
 */
export interface PluginToolsAPI {
  register(tool: ToolDefinition): void
  unregister(name: string): void
  list(): ToolDefinition[]
}

/**
 * 菜单注册API
 */
export interface PluginMenusAPI {
  register(menu: MenuDefinition): void
  unregister(id: string): void
  list(): MenuDefinition[]
}

/**
 * 路由注册API
 */
export interface PluginRoutesAPI {
  register(route: RouteDefinition): void
  unregister(path: string): void
  list(): RouteDefinition[]
}

/**
 * 命令注册API
 */
export interface PluginCommandsAPI {
  register(command: CommandDefinition): void
  unregister(id: string): void
  execute(id: string, ...args: any[]): Promise<any>
  list(): CommandDefinition[]
}

/**
 * 日志API
 */
export interface PluginLoggerAPI {
  debug(message: string, ...args: any[]): void
  info(message: string, ...args: any[]): void
  warn(message: string, ...args: any[]): void
  error(message: string, ...args: any[]): void
}
