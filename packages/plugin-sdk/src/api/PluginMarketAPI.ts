import {
  PluginMarketInfo,
  PluginInstallStatus,
  PluginInstallOptions,
  PluginUpdateInfo
} from 'runixo-plugin-types'

/**
 * 插件市场API
 * 提供插件发现、安装、更新等功能
 */
export interface PluginMarketAPI {
  /**
   * 搜索插件
   */
  search(query: string, options?: {
    category?: string
    tags?: string[]
    sort?: 'downloads' | 'rating' | 'updated' | 'name'
    limit?: number
    offset?: number
  }): Promise<PluginMarketInfo[]>

  /**
   * 获取插件详情
   */
  getPluginInfo(pluginId: string): Promise<PluginMarketInfo>

  /**
   * 安装插件
   */
  install(pluginId: string, options?: PluginInstallOptions): Promise<void>

  /**
   * 卸载插件
   */
  uninstall(pluginId: string): Promise<void>

  /**
   * 更新插件
   */
  update(pluginId: string, version?: string): Promise<void>

  /**
   * 检查更新
   */
  checkUpdates(): Promise<PluginUpdateInfo[]>

  /**
   * 获取插件安装状态
   */
  getInstallStatus(pluginId: string): PluginInstallStatus

  /**
   * 获取已安装的插件列表
   */
  listInstalled(): Promise<PluginMarketInfo[]>

  /**
   * 获取热门插件
   */
  getFeatured(limit?: number): Promise<PluginMarketInfo[]>

  /**
   * 获取插件分类
   */
  getCategories(): Promise<Array<{ id: string; name: string; count: number }>>
}
