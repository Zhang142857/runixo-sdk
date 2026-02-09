const express = require('express')
const QRCode = require('qrcode')

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 首页
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>二维码生成器</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 20px;
      padding: 40px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      max-width: 500px;
      width: 100%;
    }
    h1 {
      text-align: center;
      color: #333;
      margin-bottom: 30px;
      font-size: 28px;
    }
    .form-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      margin-bottom: 8px;
      color: #555;
      font-weight: 500;
    }
    input, select {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid #e0e0e0;
      border-radius: 10px;
      font-size: 16px;
      transition: border-color 0.3s;
    }
    input:focus, select:focus {
      outline: none;
      border-color: #667eea;
    }
    button {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 18px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
    }
    .result {
      margin-top: 30px;
      text-align: center;
      display: none;
    }
    .result img {
      max-width: 250px;
      border-radius: 10px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    }
    .download-btn {
      margin-top: 15px;
      background: #22c55e;
      display: inline-block;
      padding: 10px 30px;
      width: auto;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      color: #999;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔲 二维码生成器</h1>
    <form id="qrForm">
      <div class="form-group">
        <label>输入内容（网址或文本）</label>
        <input type="text" id="text" placeholder="https://example.com" required>
      </div>
      <div class="form-group">
        <label>二维码大小</label>
        <select id="size">
          <option value="200">小 (200px)</option>
          <option value="300" selected>中 (300px)</option>
          <option value="400">大 (400px)</option>
        </select>
      </div>
      <button type="submit">生成二维码</button>
    </form>
    <div class="result" id="result">
      <img id="qrImage" src="" alt="QR Code">
      <br>
      <a id="downloadLink" class="download-btn" download="qrcode.png">下载二维码</a>
    </div>
    <div class="footer">
      Powered by Runixo
    </div>
  </div>
  <script>
    document.getElementById('qrForm').addEventListener('submit', async (e) => {
      e.preventDefault()
      const text = document.getElementById('text').value
      const size = document.getElementById('size').value
      const img = document.getElementById('qrImage')
      const result = document.getElementById('result')
      const downloadLink = document.getElementById('downloadLink')
      
      const url = '/generate?text=' + encodeURIComponent(text) + '&size=' + size
      img.src = url
      downloadLink.href = url
      result.style.display = 'block'
    })
  </script>
</body>
</html>
  `)
})

// 生成二维码 API
app.get('/generate', async (req, res) => {
  const { text, size = 300 } = req.query
  
  if (!text) {
    return res.status(400).json({ error: '请提供 text 参数' })
  }
  
  try {
    const qrBuffer = await QRCode.toBuffer(text, {
      width: parseInt(size),
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    })
    
    res.set('Content-Type', 'image/png')
    res.send(qrBuffer)
  } catch (err) {
    res.status(500).json({ error: '生成失败: ' + err.message })
  }
})

// API 接口（返回 base64）
app.post('/api/generate', async (req, res) => {
  const { text, size = 300 } = req.body
  
  if (!text) {
    return res.status(400).json({ error: '请提供 text 参数' })
  }
  
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      width: parseInt(size),
      margin: 2
    })
    
    res.json({ success: true, data: dataUrl })
  } catch (err) {
    res.status(500).json({ error: '生成失败: ' + err.message })
  }
})

app.listen(PORT, () => {
  console.log(`🚀 二维码生成器运行在 http://localhost:${PORT}`)
})
