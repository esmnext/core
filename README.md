# genesis3
一个轻量级的 SSR 微服务框架

## 安装

**npm**
```bash
npm install genesis3
npm install genesis-vite vite -D
```
**yarn**
```bash
yarn add genesis3
yarn add genesis-vite vite -D
```
**pnpm**
```bash
pnpm install genesis3
pnpm install genesis-vite vite -D
```
### 配置脚本  
在`package.json`文件中配置脚本
```json
    "scripts": {
        "dev": "genesis-vite dev",
        "build": "genesis-vite build",
        "start": "genesis"
    }
```
## Hello World
在项目的`src`目录下，分别创建三个文件`entry-node.ts`、`entry-server.ts`、`entry-client.ts`

**entry-node.ts**    
创建一个 HTTP 的服务器，请求进来时，调用 `entry-server.ts` 文件默认导出的函数。
```ts
import { defineNode, createServer } from 'genesis3'

export default defineNode({
  created (genesis) {
    const server = createServer(genesis)
    server.listen(3000, () => {
      console.log('http://localhost:3000')
    })
  }
})
```
**entry-server.ts**    
请求进来时，设置当前请求的html内容
```ts
import { defineServer } from 'genesis3'

export default defineServer({
  async render (context) {
    const time = new Date().toISOString()
    context.html = '<h1>Hello World</h1>' +
    '<time>' + time + '</time><br>'
  }
})
```

**entry-client.ts**    
在客户端执行你的水合逻辑
```ts
const time: HTMLTimeElement | null = document.querySelector('time')
if (time) {
  setInterval(() => {
    time.innerText = new Date().toISOString()
  }, 1000)
}
```

**Express**    
有时候，我们希望自定义服务器，这里以`Express`举例
```ts
import { defineNode } from 'genesis3'

import express from 'express'

export default defineNode({
  created (genesis) {
    const server = express()
    server.use(genesis.base, genesis.middleware)

    server.get('*', async (req, res, next) => {
      try {
        const context = await genesis.render({ url: req.url })
        res.send(context.html)
      } catch (e) {
        next(e)
      }
    })
    server.listen(3000, () => {
      console.log('http://localhost:3000')
    })
  }
})
```