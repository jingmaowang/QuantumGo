// 临时测试文件 - 直接测试 Supabase 连接
import { createClient } from '@supabase/supabase-js'

// 使用环境变量（更安全的方式）
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xubcabvalkimnemlpflz.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1YmNhYnZhbGtpbW5lbWxwZmx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5Njg5MDAsImV4cCI6MjA1MDU0NDkwMH0.example'

export const supabase = createClient(supabaseUrl, supabaseKey)

// 测试用户注册
export async function testRegister(username: string, password: string) {
  try {
    console.log('Testing Supabase registration...')
    
    // 直接在 users 表中插入用户
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          user_id: crypto.randomUUID(),
          username: username,
          password: password
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    console.log('Registration successful:', data)
    return { success: true, data }
  } catch (error: any) {
    console.error('Registration error:', error)
    return { success: false, error: error.message }
  }
}

// 测试用户登录
export async function testLogin(username: string, password: string) {
  try {
    console.log('Testing Supabase login...')
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single()

    if (error || !data) {
      throw new Error('用户不存在')
    }

    if (data.password !== password) {
      throw new Error('密码错误')
    }

    console.log('Login successful:', data)
    return { success: true, data }
  } catch (error: any) {
    console.error('Login error:', error)
    return { success: false, error: error.message }
  }
}
