/**
  这是 .env 文件的 typescript 类型定义
 */
interface ImportMetaEnv {
  VITE_APP_NAME: string
  VITE_APP_MODE: 'development' | 'production' | 'staging'
  VITE_API_URL: string
}
