<script lang="ts" setup>
import testApi from '~/api'
type Await<T> = T extends Promise<infer P> ? P : T
type Fruit = Await<ReturnType<typeof testApi.getFruit>>
const props = defineProps<{ id: string }>()

const fruitdata = ref<Fruit>()

async function getFruit(id: number) {
  const res = await testApi.getFruit(id)
  if (res)
    fruitdata.value = res
}

await getFruit(Number(props.id))

watchEffect(() => {
  useHead({
    title: `商品 · ${fruitdata.value?.name}`,
    meta: [
      { name: 'description', content: fruitdata.value?.description },
      { name: 'keywords', content: fruitdata.value?.name },
    ],
  })
})
</script>

<template>
  <p>id：{{ fruitdata?.id }}</p>
  <p>商品：{{ fruitdata?.name }}</p>
  <p>描述:{{ fruitdata?.description }}</p>
</template>
