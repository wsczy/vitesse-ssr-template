import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import axios from 'axios'

export interface ConnectionConfig {
  url: string
  headers: any
  interceptor?: {
    requestInterceptor: (config: AxiosRequestConfig) => AxiosRequestConfig
    responseInterceptor: (res: AxiosResponse) => AxiosResponse
  }
}

function CreateAxios(config: ConnectionConfig) {
  const _axios = axios.create({
    baseURL: config.url,
    timeout: 20000,
    headers: config.headers,
    withCredentials: true,
  })

  // 拦截器
  if (config?.interceptor) {
    _axios.interceptors.request.use(
      config.interceptor.requestInterceptor,
      err => Promise.reject(err),
    )

    _axios.interceptors.response.use(
      config.interceptor.responseInterceptor,
      err => Promise.reject(err),
    )
  }

  return _axios
}

export const server: {
  http: AxiosInstance
  init: (config: {
    url: string
    headers: any
    interceptor?: {
      requestInterceptor: (config: AxiosRequestConfig) => AxiosRequestConfig
      responseInterceptor: (res: AxiosResponse) => AxiosResponse
    }
  }) => AxiosInstance
} = {
  http: {} as AxiosInstance,
  init: (config: ConnectionConfig) => {
    server.http = CreateAxios(config)
    return server.http
  },
}
