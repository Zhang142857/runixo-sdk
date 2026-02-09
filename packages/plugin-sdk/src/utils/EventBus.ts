/**
 * 插件事件总线
 * 提供类型安全的事件发布/订阅机制
 */
export class EventBus {
  private handlers: Map<string, Set<Function>> = new Map()

  on(event: string, handler: Function): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set())
    }
    this.handlers.get(event)!.add(handler)
    // 返回取消订阅函数
    return () => this.off(event, handler)
  }

  once(event: string, handler: Function): () => void {
    const wrapper = (...args: any[]) => {
      this.off(event, wrapper)
      handler(...args)
    }
    return this.on(event, wrapper)
  }

  off(event: string, handler: Function): void {
    this.handlers.get(event)?.delete(handler)
  }

  emit(event: string, ...args: any[]): void {
    this.handlers.get(event)?.forEach(handler => {
      try {
        handler(...args)
      } catch (err) {
        console.error(`[EventBus] Error in handler for "${event}":`, err)
      }
    })
  }

  removeAll(event?: string): void {
    if (event) {
      this.handlers.delete(event)
    } else {
      this.handlers.clear()
    }
  }
}
