import { server } from './server'

export default {
  getUserName(id: number) {
    return server.http.post<{ id: number; username: string }>('/apis', {
      id,
    })
  },

  getFruit(id: number) {
    return new Promise<{
      id: number
      name: string
      description: string
    }>((resolve) => {
      setTimeout(() => {
        const data = [
          { id: 1, name: '苹果', description: '可口的大苹果' },
          { id: 2, name: '香蕉', description: '弯弯的大香蕉' },
          { id: 3, name: '菠萝', description: '黄色的大菠萝' },
          { id: 4, name: '葡萄', description: '紫色的小葡萄' },
        ]
        resolve(data.filter(item => item.id === id)[0])
      }, 2000)
    })
  },
}
