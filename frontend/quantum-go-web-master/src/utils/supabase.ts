import { createClient } from '@supabase/supabase-js'
import Config from '@/config'

// 创建 Supabase 客户端
export const supabase = createClient(Config.supabaseUrl, Config.supabaseKey)

// 用户注册
export async function registerUser(username: string, password: string) {
  try {
    // 使用 Supabase 的 auth 服务
    const { data, error } = await supabase.auth.signUp({
      email: `${username}@example.com`, // 临时邮箱
      password: password,
      options: {
        data: {
          username: username
        }
      }
    })

    if (error) {
      throw error
    }

    // 在 users 表中创建用户记录
    const { error: insertError } = await supabase
      .from('users')
      .insert([
        {
          user_id: data.user?.id,
          username: username,
          password: password // 注意：实际应用中应该加密
        }
      ])

    if (insertError) {
      throw insertError
    }

    return { success: true, data }
  } catch (error: any) {
    console.error('Registration error:', error)
    return { success: false, error: error.message }
  }
}

// 用户登录
export async function loginUser(username: string, password: string) {
  try {
    // 从 users 表查找用户
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single()

    if (userError || !userData) {
      throw new Error('用户不存在')
    }

    // 简单的密码验证（实际应用中应该使用加密）
    if (userData.password !== password) {
      throw new Error('密码错误')
    }

    return { success: true, data: userData }
  } catch (error: any) {
    console.error('Login error:', error)
    return { success: false, error: error.message }
  }
}

// 创建游戏房间
export async function createRoom(userId: string, model: number = 9, countdown: number = 30) {
  try {
    const { data, error } = await supabase
      .from('room_infos')
      .insert([
        {
          room_id: crypto.randomUUID(),
          owner_id: userId,
          status: 'waiting',
          round: '1',
          board: {},
          countdown: countdown,
          moves: 0,
          black_lost: 0,
          white_lost: 0,
          model: model,
          chessman_records: [],
          phase: 'BlackQuantum'
        }
      ])
      .select()
      .single()

    if (error) {
      throw error
    }

    return { success: true, data }
  } catch (error: any) {
    console.error('Create room error:', error)
    return { success: false, error: error.message }
  }
}

// 获取排行榜
export async function getLeaderboard(model: number = 9, limit: number = 10) {
  try {
    const { data, error } = await supabase
      .from('user_rankings')
      .select(`
        rating,
        wins,
        losses,
        users!inner(username)
      `)
      .eq('model', model)
      .order('rating', { ascending: false })
      .limit(limit)

    if (error) {
      throw error
    }

    return { success: true, data }
  } catch (error: any) {
    console.error('Get leaderboard error:', error)
    return { success: false, error: error.message }
  }
}
