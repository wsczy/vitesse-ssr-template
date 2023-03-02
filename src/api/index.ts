import { server } from './server'

export default {
  getUserName(id: number) {
    return server.http.get<{ id: number; username: string }>('/apis', {
      id,
    })
  },

  getFruit(id: number) {
    return server.http.get<{ id: number; name: string; description: string }>('/apitest/getfruit', {
      params: {
        id,
      },
    })
  },
}
