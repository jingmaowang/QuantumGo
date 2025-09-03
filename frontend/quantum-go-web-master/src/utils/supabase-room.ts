// Supabase 房间管理工具
import { supabase } from './supabase'

// 创建房间
export async function createRoom(
  ownerId: string, 
  model: number = 9, 
  countdown: number = 30, 
  gameMode: string = "pvp"
) {
  try {
    console.log('Creating room with Supabase...', { ownerId, model, countdown, gameMode })
    
    const roomId = crypto.randomUUID()
    const initialBoard = {
      board1: {},
      board2: {},
      blackQuantum: null,
      whiteQuantum: null
    }
    
    const { data, error } = await supabase
      .from('room_infos')
      .insert([
        {
          room_id: roomId,
          owner_id: ownerId,
          visitor_id: gameMode === "ai" ? "ai_player" : null,
          status: gameMode === "ai" ? "playing" : "waiting",
          round: "black",
          winner: null,
          board: initialBoard,
          countdown: countdown,
          moves: 0,
          black_lost: 0,
          white_lost: 0,
          model: model,
          chessman_records: [],
          phase: "BlackQuantum"
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Supabase create room error:', error)
      throw error
    }

    console.log('Room created successfully:', data)
    return { success: true, status: 200, data: { room_id: roomId } }
  } catch (error: any) {
    console.error('Create room error:', error)
    return { success: false, status: 500, data: { error: error.message } }
  }
}

// 获取房间信息
export async function getGameInfo(roomId: string) {
  try {
    console.log('Getting game info from Supabase...')
    
    const { data, error } = await supabase
      .from('room_infos')
      .select('*')
      .eq('room_id', roomId)
      .single()

    if (error) {
      console.error('Supabase get game info error:', error)
      throw error
    }

    console.log('Game info retrieved successfully:', data)
    return { success: true, status: 200, data }
  } catch (error: any) {
    console.error('Get game info error:', error)
    return { success: false, status: 500, data: { error: error.message } }
  }
}

// 更新房间信息
export async function updateRoomInfo(roomId: string, updates: any) {
  try {
    console.log('Updating room info in Supabase...')
    
    const { data, error } = await supabase
      .from('room_infos')
      .update(updates)
      .eq('room_id', roomId)
      .select()
      .single()

    if (error) {
      console.error('Supabase update room error:', error)
      throw error
    }

    console.log('Room updated successfully:', data)
    return { success: true, status: 200, data }
  } catch (error: any) {
    console.error('Update room error:', error)
    return { success: false, status: 500, data: { error: error.message } }
  }
}

// 加入房间
export async function joinRoom(roomId: string, visitorId: string) {
  try {
    console.log('Joining room in Supabase...')
    
    const { data, error } = await supabase
      .from('room_infos')
      .update({ 
        visitor_id: visitorId,
        status: "playing"
      })
      .eq('room_id', roomId)
      .select()
      .single()

    if (error) {
      console.error('Supabase join room error:', error)
      throw error
    }

    console.log('Joined room successfully:', data)
    return { success: true, status: 200, data }
  } catch (error: any) {
    console.error('Join room error:', error)
    return { success: false, status: 500, data: { error: error.message } }
  }
}

// 更新玩家移动状态
export async function updatePlayerMove(roomId: string, userId: string, position: string, gameMode: string, board?: any) {
  try {
    console.log('Updating player move in Supabase...')
    
    // 获取当前房间信息
    const { data: roomData, error: fetchError } = await supabase
      .from('room_infos')
      .select('*')
      .eq('room_id', roomId)
      .single()

    if (fetchError) {
      console.error('Failed to fetch room data:', fetchError)
      throw fetchError
    }

    // 更新房间信息
    const updates = {
      moves: roomData.moves + 1,
      board: board || roomData.board,
      chessman_records: roomData.chessman_records || []
    }

    const { data, error } = await supabase
      .from('room_infos')
      .update(updates)
      .eq('room_id', roomId)
      .select()
      .single()

    if (error) {
      console.error('Supabase update player move error:', error)
      throw error
    }

    console.log('Player move updated successfully:', data)
    return { success: true, status: 200, data }
  } catch (error: any) {
    console.error('Update player move error:', error)
    return { success: false, status: 500, data: { error: error.message } }
  }
}

// AI 移动（简化版本，返回随机位置）
export async function aiMove(roomId: string, userId: string, gameMode: string = "ai", boardState?: any) {
  try {
    console.log('AI move in Supabase...')
    
    // 简单的 AI 逻辑：随机选择一个位置
    const model = boardState?.model || 9
    const size = model
    
    // 生成随机位置
    const x = Math.floor(Math.random() * size)
    const y = Math.floor(Math.random() * size)
    const position = `${x},${y}`
    
    // 简单的 AI 移动响应
    const aiMove = {
      position: position,
      type: "white", // AI 是白方
      message: "AI 移动"
    }

    console.log('AI move generated:', aiMove)
    return { 
      success: true, 
      status: 200, 
      data: { 
        ai_move: aiMove,
        message: "AI 移动成功"
      } 
    }
  } catch (error: any) {
    console.error('AI move error:', error)
    return { success: false, status: 500, data: { error: error.message } }
  }
}
