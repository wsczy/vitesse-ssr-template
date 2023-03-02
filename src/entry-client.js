import { createApp } from '~/main'
const { app, router, pinia, head } = createApp(false)

router.beforeResolve((to, from, next) => {
  try {
    next()
  }
  catch (err) {
    next(err)
  }
})

if (window.__INITIAL_STATE__) {
  // 获取服务端渲染阶段结束时pinia中的数据
  const base64Encoded = window.__INITIAL_STATE__
  const binaryString = atob(base64Encoded)
  const decoded = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++)
    decoded[i] = binaryString.charCodeAt(i)

  const strBack = new TextDecoder().decode(decoded)

  pinia.state.value = JSON.parse(strBack)
}

router.isReady().then(() => {
  app.mount('#app', true)
  // @ts-expect-error untyped
  window.head = head
})
