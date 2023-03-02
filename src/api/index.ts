import { server } from './server'

export const testapi = {
  getUserName(id: number) {
    return server.http.post<{ id: number; username: string }>('/apis', {
      id,
    })
  },
}
