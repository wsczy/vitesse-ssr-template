import { basename } from 'path'
import { renderToString } from 'vue/server-renderer'
import { renderHeadToString } from '@vueuse/head'
import { createApp } from '~/main'

function renderPreloadLinks(modules, manifest) {
  let links = ''
  const seen = new Set()
  modules.forEach((id) => {
    const files = manifest[id]
    if (files) {
      files.forEach((file) => {
        if (!seen.has(file)) {
          seen.add(file)
          const filename = basename(file)
          if (manifest[filename]) {
            for (const depFile of manifest[filename]) {
              links += renderPreloadLink(depFile)
              seen.add(depFile)
            }
          }
          links += renderPreloadLink(file)
        }
      })
    }
  })
  return links
}

function renderPreloadLink(file) {
  if (file.endsWith('.js'))
    return `<link rel="modulepreload" crossorigin href="${file}">`

  else if (file.endsWith('.css'))
    return `<link rel="stylesheet" href="${file}">`

  else
    return ''
}

export async function render(url, manifest) {
  const { app, router, pinia, head } = createApp()
  // set the router to the desired URL before rendering
  await router.push(url)

  router.push(url)
  try {
    await router.isReady()

    const ctx = {}
    const appHtml = await renderToString(app, ctx)
    const headHTML = await renderHeadToString(head)
    const preloadLinks = renderPreloadLinks(ctx.modules, manifest)

    const state = JSON.stringify(pinia.state.value)

    return [appHtml, state, preloadLinks, headHTML]
  }
  catch (error) {
    console.log(error)
  }
}
