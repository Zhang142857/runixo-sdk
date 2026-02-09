// ==================== Plugin Manifest ====================
export interface PluginManifest {
  id: string
  name: string
  version: string
  description: string
  author: string
  icon?: string
  category?: string
  main?: string
  renderer?: string
  agent?: string          // agent-side script entry
  permissions: string[]
  capabilities?: {
    menus?: MenuDef[]
    routes?: RouteDef[]
    tools?: ToolDef[]
  }
  config?: Record<string, ConfigField>
  dependencies?: string[]
  minAppVersion?: string
}

export interface ConfigField {
  label: string
  type: 'string' | 'number' | 'boolean' | 'password' | 'select'
  description?: string
  required?: boolean
  default?: any
  options?: { label: string; value: any }[]
}

export interface MenuDef {
  id: string
  label: string
  icon?: string
  route?: string
  position: 'sidebar' | 'toolbar' | 'context'
  order?: number
}

export interface RouteDef {
  path: string
  name: string
  component?: string
  meta?: Record<string, any>
}

export interface ToolDef {
  name: string
  displayName: string
  description: string
  category: string
  dangerous?: boolean
  parameters: Record<string, ParamDef>
}

export interface ParamDef {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  description: string
  required: boolean
  default?: any
}

// ==================== Plugin Context ====================
export interface PluginContext {
  pluginId: string
  metadata: PluginManifest
  config: Record<string, any>
  logger: Logger
  storage: Storage
  http: HttpClient
  events: EventBus
  ui: UIApi
  server: ServerApi
  agent: AgentApi
  tools: RegistryApi<ToolDef & { handler: Function }>
  menus: RegistryApi<MenuDef>
  routes: RegistryApi<RouteDef>
  commands: RegistryApi<CommandDef>
}

export interface Logger {
  debug(...args: any[]): void
  info(...args: any[]): void
  warn(...args: any[]): void
  error(...args: any[]): void
}

export interface Storage {
  get(key: string): Promise<any>
  set(key: string, value: any): Promise<void>
  delete(key: string): Promise<void>
  keys(): Promise<string[]>
}

export interface HttpClient {
  get<T = any>(url: string, opts?: HttpOpts): Promise<HttpRes<T>>
  post<T = any>(url: string, data?: any, opts?: HttpOpts): Promise<HttpRes<T>>
  put<T = any>(url: string, data?: any, opts?: HttpOpts): Promise<HttpRes<T>>
  delete<T = any>(url: string, opts?: HttpOpts): Promise<HttpRes<T>>
}

export interface HttpOpts { headers?: Record<string, string>; timeout?: number }
export interface HttpRes<T = any> { data: T; status: number; headers: Record<string, string> }

export interface EventBus {
  on(event: string, handler: Function): void
  off(event: string, handler: Function): void
  emit(event: string, data?: any): void
}

export interface UIApi {
  showNotification(msg: string, type?: 'info' | 'success' | 'warning' | 'error'): void
  showDialog(opts: { title: string; message: string; type?: string; buttons?: string[] }): Promise<number>
}

export interface ServerApi {
  executeCommand(serverId: string, cmd: string, args?: string[], opts?: { timeout?: number }): Promise<{ stdout: string; stderr: string; exit_code: number }>
  getSystemInfo(serverId: string): Promise<any>
  listServers(): Promise<{ id: string; name: string; host: string; status: string }[]>
}

export interface AgentApi {
  registerTool(tool: AgentToolDef): void
  executeOnAgent(serverId: string, action: string, params?: any): Promise<any>
  chat(prompt: string, opts?: { tools?: string[]; temperature?: number }): Promise<{ message: string }>
}

export interface AgentToolDef {
  name: string
  displayName: string
  description: string
  category: string
  dangerous: boolean
  parameters: { type: 'object'; properties: Record<string, { type: string; description: string }>; required: string[] }
  handler: string
}

export interface CommandDef {
  id: string
  name: string
  description: string
  handler: Function
  shortcut?: string
}

export interface RegistryApi<T> {
  register(item: T): void
  unregister(id: string): void
}
