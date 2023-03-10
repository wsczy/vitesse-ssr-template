/* eslint-disable @typescript-eslint/ban-ts-comment */
const fs = require('fs')
const path = require('path')
const express = require('express')
const axios = require('axios')
const NodeCache = require('node-cache')

/** stdTTL:设置缓存过期时间 checkperiod:检查缓存过期时间 */
const webCache = new NodeCache({ stdTTL: 120, checkperiod: 120 })
// Polyfill
// globalThis.fetch = require('node-fetch')
axios.defaults.adapter = require('axios/lib/adapters/http')

const isTest = process.env.NODE_ENV === 'test' || !!process.env.VITE_TEST_BUILD
const isProduction = process.env.NODE_ENV === 'production'
async function createServer(root = process.cwd(), isProd = isProduction) {
  const resolve = p => path.resolve(__dirname, p)
  const indexProd = isProd ? fs.readFileSync(resolve('./client/index.html'), 'utf-8') : ''

  // @ts-expect-error
  const manifest = isProd ? require('./client/ssr-manifest.json') : {}

  const app = express()

  app.use('/img', express.static('client/img'))

  let vite
  if (!isProd) {
    vite = await require('vite').createServer({
      root,
      logLevel: isTest ? 'error' : 'info',
      server: {
        middlewareMode: true,
        watch: {
          usePolling: true,
          interval: 100,
        },
      },
      appType: 'custom',
    })
    // use vite's connect instance as middleware
    app.use(vite.middlewares)
  }
  else {
    app.use(require('compression')())
    app.use(
      require('serve-static')(resolve('client'), {
        index: false,
      }),
    )
  }
  // 测试接口
  app.use('/apitest/getfruit', async (req, res) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const data = [
          { id: 1, name: '苹果', description: '可口的大苹果' },
          { id: 2, name: '香蕉', description: '弯弯的大香蕉' },
          { id: 3, name: '菠萝', description: '黄色的大菠萝' },
          { id: 4, name: '葡萄', description: '紫色的小葡萄' },
        ]
        resolve(data.filter(item => item.id === Number(req.query.id))[0])
      }, 2000)
    }).then((result) => {
      res.end(JSON.stringify(result))
    })
  })

  app.use('*', async (req, res) => {
    try {
      const url = req.originalUrl
      let template, render
      if (!isProd) {
        template = fs.readFileSync(resolve('index.html'), 'utf-8')
        template = await vite.transformIndexHtml(url, template)
        render = (await vite.ssrLoadModule('/src/entry-server.js')).render
      }
      else {
        const hasKey = webCache.has(req.baseUrl)
        if (hasKey) {
          console.log('从缓存中获取');
          [template, render] = webCache.get(req.baseUrl)
        }
        else {
          console.log('开始渲染')
          template = indexProd
          render = require('./server/entry-server.js').render
          webCache.set(req.baseUrl, [template, render])
        }
      }

      const [appHtml, state, preloadLinks, headHTML] = await render(url, { manifest, preload: true })
      // 将pinia中的数据转换成base64格式传给客户端
      const buf = Buffer.from(state, 'utf8')
      const base64Encoded = buf.toString('base64')

      const html = template
        .replace('</head>', `${headHTML.headTags}</head>`)
        .replace('<!--preload-links-->', preloadLinks)
        .replace('<!--pinia-->', base64Encoded)
        .replace('<!--app-html-->', appHtml)
      res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
    }
    catch (e) {
      vite && vite.ssrFixStacktrace(e)
      console.log(e.stack)
      res.status(500).end(e.stack)
    }
  })

  return { app, vite }
}

if (!isTest) {
  createServer().then(({ app }) =>
    app.listen(9999, () => {
      console.log('http://localhost:9999')
    }),
  )
}

exports.createServer = createServer
