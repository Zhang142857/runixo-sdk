# 二维码生成器

简单的 Node.js 二维码生成器，用于测试 Runixo 项目部署功能。

## 本地运行

```bash
npm install
npm start
```

访问 http://localhost:3000

## 部署到服务器

在 Runixo 客户端中：

1. 点击 **网站管理** → **添加** → **项目部署**
2. 填写配置：
   - 项目名称: `qrcode`
   - 项目类型: `Node.js`
   - 域名: 你的域名或使用 IP
   - 项目目录: `/var/www/qrcode`
   - 运行端口: `3000`
   - 构建步骤: `npm install`
   - 启动命令: `npm start`

3. 创建项目后，将代码上传到服务器的 `/var/www/qrcode` 目录
4. 点击 **部署** 按钮

## API

### GET /generate

生成二维码图片

参数:
- `text`: 要编码的内容（必填）
- `size`: 图片大小，默认 300

示例: `/generate?text=https://github.com&size=400`

### POST /api/generate

生成二维码 Base64

请求体:
```json
{
  "text": "https://github.com",
  "size": 300
}
```

响应:
```json
{
  "success": true,
  "data": "data:image/png;base64,..."
}
```
