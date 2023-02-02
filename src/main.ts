import { setupLayouts } from 'virtual:generated-layouts'
import { createApp as createClientApp, createSSRApp } from 'vue'
import { createHead } from '@vueuse/head'
import generatedRoutes from 'virtual:generated-pages'

import { createMemoryHistory, createRouter, createWebHistory } from 'vue-router'
import { createPinia } from 'pinia'
import App from './App.vue'

import '@unocss/reset/tailwind.css'
import './styles/main.css'
import 'uno.css'

export function createApp(ssr: boolean) {
  // 客户端逻辑使用createSSRApp(),elementplus有些组件会报错
  const app = ssr ? createSSRApp(App) : createClientApp(App)

  // install all modules under `modules/`
  Object.values(import.meta.globEager('./modules/*.ts')).map(i =>
    i.install?.({ app, isClinet: !import.meta.env.SSR }),
  )

  const routes = setupLayouts(generatedRoutes)
  const router = createRouter({
    history: import.meta.env.SSR === false ? createWebHistory() : createMemoryHistory(),
    routes,
  })
  const pinia = createPinia()
  const head = createHead()
  app.use(router)
  app.use(head)
  app.use(pinia)

  return { app, router, pinia, head }
}
