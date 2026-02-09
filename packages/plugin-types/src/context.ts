import type {
  PluginConfig, PluginMetadata, ToolDefinition, MenuDefinition,
  RouteDefinition, CommandDefinition, AgentToolDefinition,
  HttpOptions, HttpRequestConfig, HttpResponse, DialogOptions, DialogResult,
  ExecOptions, CommandResult, SystemInfo, EventHandler, ChatOptions, ChatMessage
} from './types'

/**
 * 插件上下文接口
 * 提供插件可用的所有API
 */
export interface PluginContext {
  // ========== 基础信息 ==========
  
  /** 插件ID */
  readonly pluginId: string
  
  /** 插件配置 */
  readonly config: PluginConfig
  
  /** 插件元数据 */
  readonly metadata: PluginMetadata
  
  /** 应用版本 */
  readonly appVersion: string

  // ========== 存储API ==========
  
  storage: {
    /**
     * 获取存储的值
     */
    get<T = any>(key: string): Promise<T | null>
    
    /**
     * 设置存储的值
     */
    set(key: string, value: any): Promise<void>
    
    /**
     * 删除存储的值
     */
    delete(key: string): Promise<void>
    
    /**
     * 清空所有存储
     */
    clear(): Promise<void>
    
    /**
     * 获取所有键
     */
    keys(): Promise<string[]>
  }

  // ========== 安全存储API（加密） ==========
  
  secureStorage: {
    /**
     * 获取加密存储的值
     */
    get(key: string): Promise<string | null>
    
    /**
     * 设置加密存储的值
     */
    set(key: string, value: string): Promise<void>
    
    /**
     * 删除加密存储的值
     */
    delete(key: string): Promise<void>
  }

  // ========== HTTP客户端 ==========
  
  http: {
    /**
     * GET请求
     */
    get<T = any>(url: string, options?: HttpOptions): Promise<HttpResponse<T>>
    
    /**
     * POST请求
     */
    post<T = any>(url: string, data?: any, options?: HttpOptions): Promise<HttpResponse<T>>
    
    /**
     * PUT请求
     */
    put<T = any>(url: string, data?: any, options?: HttpOptions): Promise<HttpResponse<T>>
    
    /**
     * DELETE请求
     */
    delete<T = any>(url: string, options?: HttpOptions): Promise<HttpResponse<T>>
    
    /**
     * 自定义请求
     */
    request<T = any>(config: HttpRequestConfig): Promise<HttpResponse<T>>
  }

  // ========== UI API ==========
  
  ui: {
    /**
     * 显示通知
     */
    showNotification(message: string, type?: 'success' | 'error' | 'warning' | 'info'): void
    
    /**
     * 显示对话框
     */
    showDialog(options: DialogOptions): Promise<DialogResult>
    
    /**
     * 显示确认框
     */
    showConfirm(message: string, title?: string): Promise<boolean>
    
    /**
     * 显示输入框
     */
    showPrompt(message: string, defaultValue?: string): Promise<string | null>
    
    /**
     * 注册Vue组件
     */
    registerComponent(name: string, component: any): void
    
    /**
     * 打开外部链接
     */
    openExternal(url: string): void
  }

  // ========== 系统API（受限） ==========
  
  system: {
    /**
     * 执行命令（需要权限）
     */
    executeCommand(command: string, options?: ExecOptions): Promise<CommandResult>
    
    /**
     * 读取文件（需要权限）
     */
    readFile(path: string, encoding?: string): Promise<string>
    
    /**
     * 写入文件（需要权限）
     */
    writeFile(path: string, content: string, encoding?: string): Promise<void>
    
    /**
     * 检查文件是否存在
     */
    fileExists(path: string): Promise<boolean>
    
    /**
     * 获取系统信息
     */
    getSystemInfo(): Promise<SystemInfo>
  }

  // ========== 事件系统 ==========
  
  events: {
    /**
     * 监听事件
     */
    on(event: string, handler: EventHandler): void
    
    /**
     * 监听一次事件
     */
    once(event: string, handler: EventHandler): void
    
    /**
     * 取消监听
     */
    off(event: string, handler: EventHandler): void
    
    /**
     * 发送事件
     */
    emit(event: string, data?: any): void
  }

  // ========== Agent API ==========
  
  agent: {
    /**
     * 注册Agent工具
     */
    registerTool(tool: AgentToolDefinition): void
    
    /**
     * 调用Agent工具
     */
    callTool(toolName: string, params: any): Promise<any>
    
    /**
     * 与Agent对话
     */
    chat(message: string, options?: ChatOptions): Promise<string>
    
    /**
     * 获取对话历史
     */
    getHistory(): Promise<ChatMessage[]>
  }

  // ========== 工具注册 ==========
  
  tools: {
    /**
     * 注册工具
     */
    register(tool: ToolDefinition): void
    
    /**
     * 取消注册工具
     */
    unregister(toolName: string): void
    
    /**
     * 获取已注册的工具
     */
    list(): ToolDefinition[]
  }

  // ========== 菜单注册 ==========
  
  menus: {
    /**
     * 注册菜单
     */
    register(menu: MenuDefinition): void
    
    /**
     * 取消注册菜单
     */
    unregister(menuId: string): void
  }

  // ========== 路由注册 ==========
  
  routes: {
    /**
     * 注册路由
     */
    register(route: RouteDefinition): void
    
    /**
     * 取消注册路由
     */
    unregister(routeName: string): void
    
    /**
     * 导航到路由
     */
    navigate(path: string): void
  }

  // ========== 命令注册 ==========
  
  commands: {
    /**
     * 注册命令
     */
    register(command: CommandDefinition): void
    
    /**
     * 取消注册命令
     */
    unregister(commandId: string): void
    
    /**
     * 执行命令
     */
    execute(commandId: string, ...args: any[]): Promise<any>
  }

  // ========== 日志API ==========
  
  logger: {
    debug(message: string, ...args: any[]): void
    info(message: string, ...args: any[]): void
    warn(message: string, ...args: any[]): void
    error(message: string, ...args: any[]): void
  }
}

export * from './types'
