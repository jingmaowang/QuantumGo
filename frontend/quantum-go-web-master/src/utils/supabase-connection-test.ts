// Supabase 连接测试工具
import { createClient } from '@supabase/supabase-js'

// 使用环境变量
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('Supabase URL:', supabaseUrl ? '已设置' : '未设置')
console.log('Supabase Key:', supabaseKey ? '已设置' : '未设置')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 环境变量未正确设置')
  throw new Error('Supabase 环境变量未设置')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// 测试连接
export async function testSupabaseConnection() {
  try {
    console.log('🔍 测试 Supabase 连接...')
    
    // 测试基本连接
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Supabase 连接失败:', error)
      return { success: false, error: error.message }
    }
    
    console.log('✅ Supabase 连接成功!')
    return { success: true, data }
  } catch (error: any) {
    console.error('❌ Supabase 连接异常:', error)
    return { success: false, error: error.message }
  }
}

// 测试用户表结构
export async function testUsersTable() {
  try {
    console.log('🔍 测试 users 表...')
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ users 表访问失败:', error)
      return { success: false, error: error.message }
    }
    
    console.log('✅ users 表访问成功!')
    return { success: true, data }
  } catch (error: any) {
    console.error('❌ users 表访问异常:', error)
    return { success: false, error: error.message }
  }
}
