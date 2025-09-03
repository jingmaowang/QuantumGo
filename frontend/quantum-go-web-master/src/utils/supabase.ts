// 统一的 Supabase 客户端
import { createClient } from '@supabase/supabase-js'

// 使用环境变量
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase 环境变量未设置')
}

// 创建单一的 Supabase 客户端实例
export const supabase = createClient(supabaseUrl, supabaseKey)