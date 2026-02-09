/**
 * HTTP 客户端辅助类
 * 为插件提供便捷的 HTTP 请求封装
 */
import { HttpResponse, HttpOptions } from 'runixo-plugin-types'

export class HttpClient {
  private baseURL: string
  private defaultHeaders: Record<string, string>

  constructor(baseURL: string = '', defaultHeaders: Record<string, string> = {}) {
    this.baseURL = baseURL.replace(/\/$/, '')
    this.defaultHeaders = defaultHeaders
  }

  setBaseURL(url: string): void {
    this.baseURL = url.replace(/\/$/, '')
  }

  setHeader(key: string, value: string): void {
    this.defaultHeaders[key] = value
  }

  removeHeader(key: string): void {
    delete this.defaultHeaders[key]
  }

  /**
   * 设置 Bearer Token
   */
  setBearerToken(token: string): void {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`
  }

  private mergeHeaders(options?: HttpOptions): Record<string, string> {
    return { ...this.defaultHeaders, ...options?.headers }
  }

  private buildURL(path: string, params?: Record<string, any>): string {
    const url = path.startsWith('http') ? path : `${this.baseURL}${path}`
    if (!params) return url
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&')
    return qs ? `${url}?${qs}` : url
  }

  /**
   * 创建一个带有基础配置的子客户端
   */
  create(config: { baseURL?: string; headers?: Record<string, string> }): HttpClient {
    return new HttpClient(
      config.baseURL || this.baseURL,
      { ...this.defaultHeaders, ...config.headers }
    )
  }
}

/**
 * 重试包装器
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | undefined
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err as Error
      if (i < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
      }
    }
  }
  throw lastError
}
