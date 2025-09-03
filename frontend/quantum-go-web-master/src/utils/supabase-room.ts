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
    console.log('Creating room with Supabase...')
    
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
          visitor_id: gameMode === "ai" ? null : null,
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
