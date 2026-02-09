import {
  AgentToolDefinition,
  AgentDefinition,
  WorkflowDefinition,
  PromptTemplateDefinition,
  AgentCallOptions,
  AgentResponse
} from 'runixo-plugin-types'

/**
 * 插件Agent API
 * 提供AI能力相关的API
 */
export interface PluginAgentAPI {
  /**
   * 注册Agent工具
   */
  registerTool(tool: AgentToolDefinition): void

  /**
   * 注册AI Agent
   */
  registerAgent(agent: AgentDefinition): void

  /**
   * 注册工作流
   */
  registerWorkflow(workflow: WorkflowDefinition): void

  /**
   * 注册提示词模板
   */
  registerPromptTemplate(template: PromptTemplateDefinition): void

  /**
   * 调用Agent进行对话
   */
  chat(prompt: string, options?: AgentCallOptions): Promise<AgentResponse>

  /**
   * 执行工作流
   */
  executeWorkflow(workflowId: string, inputs: Record<string, any>): Promise<any>

  /**
   * 渲染提示词模板
   */
  renderPrompt(templateId: string, variables: Record<string, any>): string

  /**
   * 获取已注册的Agent列表
   */
  listAgents(): AgentDefinition[]

  /**
   * 获取已注册的工作流列表
   */
  listWorkflows(): WorkflowDefinition[]

  /**
   * 获取已注册的提示词模板列表
   */
  listPromptTemplates(): PromptTemplateDefinition[]
}
