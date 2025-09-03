// 临时测试文件 - 直接测试 Supabase 连接
import { supabase } from './supabase'

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
