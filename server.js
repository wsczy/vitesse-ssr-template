/* eslint-disable @typescript-eslint/ban-ts-comment */
const fs = require('fs')
const path = require('path')
const express = require('express')
const axios = require('axios')
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

  app.use('/justTest/getFruitList', async (req, res) => {
    const names = ['Orange', 'Apricot', 'Apple', 'Plum', 'Pear', 'Pome', 'Banana', 'Cherry', 'Grapes', 'Peach']
    const list = names.map((name, id) => {
      return {
        id: ++id,
        name,
        price: Math.ceil(Math.random() * 100),
      }
    })
    const data = {
      data: list,
      code: 0,
      msg: '',
    }
    res.end(JSON.stringify(data))
  })

  app.use('*', async (req, res) => {
    try {
      const url = req.originalUrl

      let template, render
      if (!isProd) {
        // always read fresh template in dev (如果是开发模式不会走下面的逻辑，待删除)
        template = fs.readFileSync(resolve('index.html'), 'utf-8')
        template = await vite.transformIndexHtml(url, template)
        render = (await vite.ssrLoadModule('/src/entry-server.js')).render
      }
      else {
        template = indexProd
        render = require('./server/entry-server.js').render
      }

      // const [appHtml, state, links] = await render(url, manifest);
      const [appHtml, state, preloadLinks, headHTML] = await render(url, { manifest, preload: true })

      const buf = Buffer.from(state, 'utf8')
      const base64Encoded = buf.toString('base64')

      const html = template
        // .replace('<html>', `<html${headHTML.htmlAttrs}>`)
        // .replace('<body>', `<body${headHTML.bodyAttrs}>\n${headHTML.bodyTagsOpen}`)
        // .replace('</body>', `${headHTML.bodyTags}</body>`)
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
    app.listen(12345, () => {
      console.log('http://localhost:12345')
    }),
  )
}

exports.createServer = createServer
