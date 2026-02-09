# DevOps助手插件

这是一个展示Runixo插件系统新功能的示例插件。

## 功能特性

### 🤖 AI Agent
- **DevOps助手** - 专业的DevOps AI助手
- 支持自然语言交互
- 提供部署、监控、故障诊断建议

### 🔄 自动化工作流
- **部署Web应用** - 完整的自动化部署流程
  1. 检查服务器健康状态
  2. 备份当前版本
  3. 构建应用
  4. 部署应用
  5. 验证部署
  6. 发送通知或回滚

### 📝 提示词模板
- **分析部署失败** - 智能分析部署失败原因
- **性能优化建议** - 系统性能分析和优化建议

### 🛠️ AI工具
- `deploy_application` - 部署应用
- `check_service_status` - 检查服务状态
- `analyze_logs` - 分析日志（支持流式输出）
- `rollback_deployment` - 回滚部署
- `restart_service` - 重启服务

### ⚙️ 配置UI
基于JSON Schema自动生成的配置界面，包括：
- 启用/禁用开关
- 部署模式选择
- Webhook URL输入
- 并发数滑块
- 自动回滚复选框
- 健康检查间隔

## 使用示例

### 与AI助手对话

```
用户: 帮我部署应用到生产环境
助手: 好的，我来帮你部署。请提供以下信息：
     - 应用名称
     - 版本号
     
用户: 应用名称是 my-app，版本是 1.2.3
助手: [调用 deploy_application 工具]
     部署成功！应用 my-app v1.2.3 已部署到生产环境。
```

### 执行工作流

```typescript
// 在代码中执行工作流
const result = await this.executeWorkflow('deploy-web-app', {
  appName: 'my-app',
  version: '1.2.3',
  environment: 'production'
})
```

### 使用提示词模板

```typescript
// 分析部署失败
const prompt = this.renderPrompt('analyze-deployment-failure', {
  appName: 'my-app',
  version: '1.2.3',
  environment: 'production',
  errorLog: '...',
  cpuUsage: 85,
  memoryUsage: 92,
  diskUsage: 78
})

const analysis = await this.callAgent(prompt)
```

## 配置说明

| 配置项 | 类型 | 说明 | 默认值 |
|--------|------|------|--------|
| enabled | boolean | 是否启用助手 | true |
| deploymentMode | string | 部署模式 | manual |
| notificationWebhook | string | 通知Webhook URL | - |
| maxConcurrentDeploys | number | 最大并发部署数 | 3 |
| autoRollback | boolean | 自动回滚 | true |
| healthCheckInterval | number | 健康检查间隔（秒） | 60 |

## 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build
```

## 许可证

MIT
