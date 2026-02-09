/**
 * 插件元数据
 */
export interface PluginMetadata {
  id: string
  name: string
  version: string
  description: string
  author: string
  icon?: string
  homepage?: string
  repository?: string
  main: string
  renderer?: string
  permissions: string[]
  capabilities?: PluginCapabilities
  config?: PluginConfigSchema
  dependencies?: PluginDependencies
  minAppVersion?: string
  keywords?: string[]
  license?: string
  screenshots?: string[]
  changelog?: string
}

/**
 * 插件依赖
 */
export interface PluginDependencies {
  plugins?: Record<string, string>  // 插件依赖 { "plugin-id": "^1.0.0" }
  npm?: Record<string, string>      // npm包依赖
}

/**
 * 插件能力声明
 */
export interface PluginCapabilities {
  menus?: MenuDefinition[]
  routes?: RouteDefinition[]
  tools?: ToolDefinition[]
  commands?: CommandDefinition[]
  agents?: AgentDefinition[]
  workflows?: WorkflowDefinition[]
  prompts?: PromptTemplateDefinition[]
}

/**
 * 插件配置模式（支持JSON Schema）
 */
export interface PluginConfigSchema {
  type?: 'object'
  properties: Record<string, ConfigFieldSchema>
  required?: string[]
  title?: string
  description?: string
}

/**
 * 配置字段模式
 */
export interface ConfigFieldSchema {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  title?: string
  description?: string
  default?: any
  enum?: any[]
  format?: 'password' | 'email' | 'url' | 'date' | 'color'
  minimum?: number
  maximum?: number
  minLength?: number
  maxLength?: number
  pattern?: string
  items?: ConfigFieldSchema
  properties?: Record<string, ConfigFieldSchema>
  ui?: {
    widget?: 'input' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'switch' | 'slider' | 'color' | 'date'
    placeholder?: string
    help?: string
    order?: number
  }
}

/**
 * 插件配置
 */
export type PluginConfig = Record<string, any>

/**
 * 菜单定义
 */
export interface MenuDefinition {
  id: string
  label: string
  icon?: string
  route?: string
  position: 'sidebar' | 'toolbar' | 'context'
  order?: number
  children?: MenuDefinition[]
  visible?: boolean
}

/**
 * 路由定义
 */
export interface RouteDefinition {
  path: string
  name: string
  component?: string
  meta?: {
    title?: string
    icon?: string
    requiresAuth?: boolean
    [key: string]: any
  }
}

/**
 * 工具定义
 */
export interface ToolDefinition {
  name: string
  displayName: string
  description: string
  category: string
  dangerous?: boolean
  parameters: Record<string, ParameterDefinition>
  handler: (params: any) => Promise<any> | AsyncGenerator<any, void, unknown>
  permissions?: string[]
  streaming?: boolean  // 支持流式输出
}

/**
 * 参数定义
 */
export interface ParameterDefinition {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  description: string
  required: boolean
  default?: any
  enum?: any[]
  validation?: (value: any) => boolean
}

/**
 * 命令定义
 */
export interface CommandDefinition {
  id: string
  name: string
  description: string
  handler: (...args: any[]) => Promise<any>
  shortcut?: string
}

/**
 * Agent工具定义
 */
export interface AgentToolDefinition {
  name: string
  displayName: string
  description: string
  category: string
  dangerous: boolean
  parameters: {
    type: 'object'
    properties: Record<string, {
      type: string
      description: string
    }>
    required: string[]
  }
  handler: string
}

/**
 * AI Agent定义
 */
export interface AgentDefinition {
  id: string
  name: string
  description: string
  systemPrompt: string
  tools: string[]  // 可用工具列表
  temperature?: number
  maxTokens?: number
  icon?: string
  category?: string
}

/**
 * 工作流定义
 */
export interface WorkflowDefinition {
  id: string
  name: string
  description: string
  steps: WorkflowStep[]
  icon?: string
  category?: string
}

/**
 * 工作流步骤
 */
export interface WorkflowStep {
  id: string
  type: 'tool' | 'agent' | 'condition' | 'loop'
  name: string
  config: {
    tool?: string
    agent?: string
    params?: Record<string, any>
    condition?: string
    loopOver?: string
  }
  next?: string | string[]  // 下一步ID或条件分支
}

/**
 * 提示词模板定义
 */
export interface PromptTemplateDefinition {
  id: string
  name: string
  description: string
  template: string
  variables: Array<{
    name: string
    description: string
    type: 'string' | 'number' | 'boolean'
    required: boolean
    default?: any
  }>
  category?: string
  tags?: string[]
}

/**
 * HTTP请求选项
 */
export interface HttpOptions {
  headers?: Record<string, string>
  timeout?: number
  params?: Record<string, any>
}

/**
 * HTTP请求配置
 */
export interface HttpRequestConfig extends HttpOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  url: string
  data?: any
}

/**
 * HTTP响应
 */
export interface HttpResponse<T = any> {
  data: T
  status: number
  statusText: string
  headers: Record<string, string>
}

/**
 * 对话框选项
 */
export interface DialogOptions {
  title: string
  message: string
  type?: 'info' | 'warning' | 'error' | 'question'
  buttons?: string[]
  defaultButton?: number
  cancelButton?: number
}

/**
 * 对话框结果
 */
export interface DialogResult {
  response: number
  checkboxChecked?: boolean
}

/**
 * 命令执行选项
 */
export interface ExecOptions {
  cwd?: string
  env?: Record<string, string>
  timeout?: number
  shell?: boolean
}

/**
 * 命令执行结果
 */
export interface CommandResult {
  stdout: string
  stderr: string
  exitCode: number
}

/**
 * 系统信息
 */
export interface SystemInfo {
  platform: string
  arch: string
  hostname: string
  cpus: number
  totalMemory: number
  freeMemory: number
  uptime: number
}

/**
 * 事件处理器
 */
export type EventHandler = (data?: any) => void

/**
 * Agent调用选项
 */
export interface AgentCallOptions {
  tools?: string[]
  temperature?: number
  maxTokens?: number
}

/**
 * Agent响应
 */
export interface AgentResponse {
  message: string
  toolCalls?: Array<{
    tool: string
    params: any
    result: any
  }>
}

/**
 * 聊天选项
 */
export interface ChatOptions {
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
}

/**
 * 聊天消息
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

/**
 * 插件权限枚举
 */
export enum PluginPermission {
  // 网络权限
  NETWORK_REQUEST = 'network:request',
  
  // 文件系统权限
  FILE_READ = 'file:read',
  FILE_WRITE = 'file:write',
  
  // 系统权限
  SYSTEM_EXECUTE = 'system:execute',
  SYSTEM_INFO = 'system:info',
  
  // UI权限
  UI_NOTIFICATION = 'ui:notification',
  UI_DIALOG = 'ui:dialog',
  
  // 注册权限
  MENU_REGISTER = 'menu:register',
  ROUTE_REGISTER = 'route:register',
  TOOL_REGISTER = 'tool:register',
  COMMAND_REGISTER = 'command:register',
  
  // Agent权限
  AGENT_TOOL = 'agent:tool',
  AGENT_CHAT = 'agent:chat',
  AGENT_REGISTER = 'agent:register',
  WORKFLOW_REGISTER = 'workflow:register',
  PROMPT_REGISTER = 'prompt:register'
}

/**
 * 插件市场信息
 */
export interface PluginMarketInfo {
  id: string
  name: string
  version: string
  description: string
  author: string
  icon?: string
  screenshots?: string[]
  downloads: number
  rating: number
  ratingCount: number
  tags: string[]
  category: string
  license: string
  homepage?: string
  repository?: string
  publishedAt: string
  updatedAt: string
  size: number
  verified: boolean
}

/**
 * 插件安装状态
 */
export enum PluginInstallStatus {
  NOT_INSTALLED = 'not_installed',
  INSTALLING = 'installing',
  INSTALLED = 'installed',
  UPDATING = 'updating',
  UPDATE_AVAILABLE = 'update_available',
  ERROR = 'error'
}

/**
 * 插件安装选项
 */
export interface PluginInstallOptions {
  version?: string
  force?: boolean
  skipDependencies?: boolean
}

/**
 * 插件更新信息
 */
export interface PluginUpdateInfo {
  pluginId: string
  currentVersion: string
  latestVersion: string
  changelog: string
  breaking: boolean
}
