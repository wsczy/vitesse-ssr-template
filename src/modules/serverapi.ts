import { server } from '~/api/server'

const apiUrl = import.meta.env.VITE_API_URL

server.init({
  url: apiUrl,
  headers: {},
  interceptor: {
    requestInterceptor: (config) => {
      return config
    },
    responseInterceptor(response) {
      return response
    },
  },

})
