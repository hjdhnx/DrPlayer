# Pup Sniffer API 完整文档

## 📖 概述

Pup Sniffer 是一个基于 Puppeteer 和 Fastify 的视频资源嗅探服务，提供了强大的网页内容抓取和视频链接嗅探功能。本文档将详细介绍所有 API 接口的使用方法，包含完整的代码示例。

**服务地址**: `http://localhost:57573`

## 🚀 快速开始

### 启动服务

```bash
# 方式一：使用 npm
npm start

# 方式二：直接运行二进制文件
./pup-sniffer-win.exe  # Windows
./pup-sniffer-linux    # Linux
./pup-sniffer-macos    # macOS
```

### 验证服务状态

```bash
curl http://localhost:57573/health
```

## 📋 API 接口列表

| 接口 | 方法 | 路径 | 功能 |
|------|------|------|------|
| 首页 | GET | `/` | 演示页面 |
| 视频嗅探 | GET | `/sniffer` | 嗅探视频资源链接 |
| 页面源码 | GET | `/fetCodeByWebView` | 获取页面源码 |
| 健康检查 | GET | `/health` | 服务状态检查 |
| 活跃状态 | GET | `/active` | 浏览器状态检查 |

---

## 🎯 1. 视频嗅探接口

### 基本信息

- **接口路径**: `/sniffer`
- **请求方法**: `GET`
- **功能**: 嗅探指定页面中的视频资源链接（m3u8、mp4等）

### 请求参数

| 参数名 | 类型 | 必需 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `url` | string | ✅ | - | 要嗅探的页面URL |
| `mode` | string | ❌ | "0" | 嗅探模式：0=单个链接，1=多个链接 |
| `is_pc` | string | ❌ | "0" | 设备模拟：0=移动设备，1=PC |
| `timeout` | string | ❌ | "10000" | 超时时间（毫秒） |
| `css` | string | ❌ | - | 等待的CSS选择器 |
| `script` | string | ❌ | - | 页面执行脚本（Base64编码） |
| `init_script` | string | ❌ | - | 页面初始化脚本（Base64编码） |
| `headers` | string | ❌ | - | 自定义请求头（换行分隔） |
| `custom_regex` | string | ❌ | - | 自定义匹配正则表达式 |
| `sniffer_exclude` | string | ❌ | - | 排除匹配的正则表达式 |

### 响应格式

#### 成功响应

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "url": "https://example.com/video.m3u8",
    "headers": {
      "referer": "https://example.com",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    },
    "from": "https://example.com/play",
    "cost": "2345 ms",
    "code": 200,
    "msg": "超级嗅探解析成功"
  },
  "timestamp": 1703123456789
}
```

#### 错误响应

```json
{
  "code": 400,
  "msg": "URL参数不能为空",
  "data": null,
  "timestamp": 1703123456789
}
```

### 使用示例

#### 1. 基础嗅探

```bash
curl "http://localhost:57573/sniffer?url=https://example.com/play"
```

```javascript
// JavaScript 示例
async function basicSniffer() {
    const response = await fetch('http://localhost:57573/sniffer?url=https://example.com/play');
    const result = await response.json();
    
    if (result.code === 200) {
        console.log('视频链接:', result.data.url);
        console.log('请求头:', result.data.headers);
    } else {
        console.error('嗅探失败:', result.msg);
    }
}
```

```python
# Python 示例
import requests

def basic_sniffer():
    url = "http://localhost:57573/sniffer"
    params = {
        "url": "https://example.com/play"
    }
    
    response = requests.get(url, params=params)
    result = response.json()
    
    if result["code"] == 200:
        print(f"视频链接: {result['data']['url']}")
        print(f"请求头: {result['data']['headers']}")
    else:
        print(f"嗅探失败: {result['msg']}")
```

#### 2. 多链接嗅探

```bash
curl "http://localhost:57573/sniffer?url=https://example.com/play&mode=1&timeout=15000"
```

```javascript
// JavaScript 多链接嗅探
async function multiSniffer() {
    const params = new URLSearchParams({
        url: 'https://example.com/play',
        mode: '1',
        timeout: '15000'
    });
    
    const response = await fetch(`http://localhost:57573/sniffer?${params}`);
    const result = await response.json();
    
    if (result.code === 200 && Array.isArray(result.data)) {
        result.data.forEach((video, index) => {
            console.log(`视频 ${index + 1}:`, video.url);
        });
    }
}
```

#### 3. PC模式嗅探

```bash
curl "http://localhost:57573/sniffer?url=https://example.com/play&is_pc=1"
```

#### 4. 自定义脚本嗅探

```bash
# 先将脚本进行Base64编码
script_b64=$(echo "document.querySelector('video').play()" | base64)
curl "http://localhost:57573/sniffer?url=https://example.com/play&script=$script_b64"
```

```javascript
// JavaScript 自定义脚本示例
async function customScriptSniffer() {
    const script = "document.querySelector('video').play()";
    const scriptB64 = btoa(script); // Base64编码
    
    const params = new URLSearchParams({
        url: 'https://example.com/play',
        script: scriptB64
    });
    
    const response = await fetch(`http://localhost:57573/sniffer?${params}`);
    const result = await response.json();
    return result;
}
```

#### 5. 自定义请求头

```javascript
// 自定义请求头示例
async function customHeadersSniffer() {
    const headers = [
        'User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        'Referer: https://example.com',
        'Authorization: Bearer your-token'
    ].join('\n');
    
    const params = new URLSearchParams({
        url: 'https://example.com/play',
        headers: headers
    });
    
    const response = await fetch(`http://localhost:57573/sniffer?${params}`);
    return await response.json();
}
```

---

## 📄 2. 页面源码获取接口

### 基本信息

- **接口路径**: `/fetCodeByWebView`
- **请求方法**: `GET`
- **功能**: 获取指定页面的完整HTML源码

### 请求参数

| 参数名 | 类型 | 必需 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `url` | string | ✅ | - | 要获取源码的页面URL |
| `is_pc` | string | ❌ | "0" | 设备模拟：0=移动设备，1=PC |
| `timeout` | string | ❌ | "10000" | 超时时间（毫秒） |
| `css` | string | ❌ | - | 等待的CSS选择器 |
| `script` | string | ❌ | - | 页面执行脚本（Base64编码） |
| `init_script` | string | ❌ | - | 页面初始化脚本（Base64编码） |
| `headers` | string | ❌ | - | 自定义请求头（换行分隔） |

### 响应格式

#### 成功响应

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "content": "<!DOCTYPE html><html><head>...</head><body>...</body></html>",
    "headers": {
      "location": "https://example.com",
      "content-type": "text/html"
    },
    "cost": "1234 ms"
  },
  "timestamp": 1703123456789
}
```

### 使用示例

#### 1. 基础源码获取

```bash
curl "http://localhost:57573/fetCodeByWebView?url=https://example.com"
```

```javascript
// JavaScript 示例
async function getPageSource() {
    const response = await fetch('http://localhost:57573/fetCodeByWebView?url=https://example.com');
    const result = await response.json();
    
    if (result.code === 200) {
        console.log('页面源码:', result.data.content);
        console.log('响应头:', result.data.headers);
        console.log('耗时:', result.data.cost);
    }
}
```

```python
# Python 示例
import requests

def get_page_source():
    url = "http://localhost:57573/fetCodeByWebView"
    params = {"url": "https://example.com"}
    
    response = requests.get(url, params=params)
    result = response.json()
    
    if result["code"] == 200:
        print(f"页面源码长度: {len(result['data']['content'])}")
        print(f"耗时: {result['data']['cost']}")
        
        # 保存到文件
        with open('page_source.html', 'w', encoding='utf-8') as f:
            f.write(result['data']['content'])
```

#### 2. 等待特定元素加载

```javascript
// 等待特定CSS选择器出现
async function waitForElement() {
    const params = new URLSearchParams({
        url: 'https://example.com',
        css: '.video-container', // 等待视频容器加载
        timeout: '20000'
    });
    
    const response = await fetch(`http://localhost:57573/fetCodeByWebView?${params}`);
    return await response.json();
}
```

---

## ❤️ 3. 健康检查接口

### 基本信息

- **接口路径**: `/health`
- **请求方法**: `GET`
- **功能**: 检查服务运行状态

### 响应格式

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "status": "ok",
    "service": "pup-sniffer"
  },
  "timestamp": 1703123456789
}
```

### 使用示例

```bash
curl http://localhost:57573/health
```

```javascript
// 服务状态监控
async function checkServiceHealth() {
    try {
        const response = await fetch('http://localhost:57573/health');
        const result = await response.json();
        
        if (result.code === 200 && result.data.status === 'ok') {
            console.log('✅ 服务运行正常');
            return true;
        } else {
            console.log('❌ 服务状态异常');
            return false;
        }
    } catch (error) {
        console.log('❌ 服务连接失败:', error.message);
        return false;
    }
}
```

---

## 🔄 4. 活跃状态接口

### 基本信息

- **接口路径**: `/active`
- **请求方法**: `GET`
- **功能**: 检查浏览器实例状态

### 响应格式

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "active": true,
    "browser": "initialized",
    "timestamp": "2023-12-21T10:30:56.789Z"
  },
  "timestamp": 1703123456789
}
```

### 使用示例

```bash
curl http://localhost:57573/active
```

---

## 🛠️ 高级用法

### 1. 批量嗅探

```javascript
// 批量嗅探多个URL
async function batchSniffer(urls) {
    const results = [];
    
    for (const url of urls) {
        try {
            const response = await fetch(`http://localhost:57573/sniffer?url=${encodeURIComponent(url)}`);
            const result = await response.json();
            results.push({
                url: url,
                success: result.code === 200,
                data: result.data
            });
        } catch (error) {
            results.push({
                url: url,
                success: false,
                error: error.message
            });
        }
        
        // 避免请求过于频繁
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return results;
}

// 使用示例
const urls = [
    'https://example1.com/play',
    'https://example2.com/video',
    'https://example3.com/watch'
];

batchSniffer(urls).then(results => {
    console.log('批量嗅探结果:', results);
});
```

### 2. 错误处理和重试

```javascript
// 带重试机制的嗅探函数
async function snifferWithRetry(url, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(`http://localhost:57573/sniffer?url=${encodeURIComponent(url)}&timeout=15000`);
            const result = await response.json();
            
            if (result.code === 200) {
                return result;
            } else if (i === maxRetries - 1) {
                throw new Error(`嗅探失败: ${result.msg}`);
            }
        } catch (error) {
            if (i === maxRetries - 1) {
                throw error;
            }
            console.log(`第 ${i + 1} 次尝试失败，${2 ** i} 秒后重试...`);
            await new Promise(resolve => setTimeout(resolve, 2 ** i * 1000));
        }
    }
}
```

### 3. 结果缓存

```javascript
// 简单的内存缓存实现
class SnifferCache {
    constructor(ttl = 300000) { // 5分钟缓存
        this.cache = new Map();
        this.ttl = ttl;
    }
    
    get(url) {
        const item = this.cache.get(url);
        if (item && Date.now() - item.timestamp < this.ttl) {
            return item.data;
        }
        this.cache.delete(url);
        return null;
    }
    
    set(url, data) {
        this.cache.set(url, {
            data: data,
            timestamp: Date.now()
        });
    }
    
    async sniffer(url) {
        // 先检查缓存
        const cached = this.get(url);
        if (cached) {
            console.log('使用缓存结果');
            return cached;
        }
        
        // 发起新请求
        const response = await fetch(`http://localhost:57573/sniffer?url=${encodeURIComponent(url)}`);
        const result = await response.json();
        
        // 缓存成功结果
        if (result.code === 200) {
            this.set(url, result);
        }
        
        return result;
    }
}

// 使用示例
const cache = new SnifferCache();
cache.sniffer('https://example.com/play').then(result => {
    console.log('嗅探结果:', result);
});
```

## 🚨 错误码说明

| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| 400 | 请求参数错误 | 检查必需参数是否提供 |
| 500 | 服务器内部错误 | 检查服务器日志，重启服务 |
| 504 | 请求超时 | 增加timeout参数值 |

## 💡 最佳实践

1. **合理设置超时时间**: 根据目标网站的加载速度设置合适的timeout值
2. **使用适当的设备模拟**: 某些网站对PC和移动端返回不同内容
3. **处理异步加载**: 使用css参数等待关键元素加载完成
4. **错误处理**: 始终检查返回的code字段，妥善处理错误情况
5. **避免频繁请求**: 在批量操作时添加适当的延迟
6. **缓存结果**: 对于相同URL的重复请求，考虑使用缓存

## 📞 技术支持

如果在使用过程中遇到问题，请：

1. 检查服务是否正常运行（访问 `/health` 接口）
2. 查看服务器控制台日志
3. 确认目标URL是否可正常访问
4. 检查网络连接和防火墙设置

---

*本文档持续更新中，如有疑问请参考项目README或提交Issue。*