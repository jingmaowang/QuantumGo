use crate::entity::{RoomInfo, User, LeaderboardEntry};
use crate::ai::{SimpleQuantumAI, AIDifficulty, room_info_to_quantum_board_state};
use axum::{Json, extract::State, http::StatusCode};
use serde::Deserialize;
use uuid::Uuid;
use crate::ai::QuantumPhase;

type ApiResult<T> = Result<(StatusCode, Json<T>), (StatusCode, Json<serde_json::Value>)>;

#[derive(Deserialize)]
pub struct RegisterRequest {
    username: String,
    password: String,
}

#[derive(Deserialize)]
pub struct LoginRequest {
    username: String,
    password: String,
}

#[derive(Deserialize)]
pub struct CreateRoom {
    user_id: Uuid,
    model: i32,
    countdown: i32,
    game_mode: Option<String>, // 设为可选字段，保持向后兼容
}

#[derive(Deserialize)]
pub struct GetGameInfo {
    room_id: Uuid,
}

#[derive(Deserialize)]
pub struct GetLeaderboardRequest {
    model: i32,
    limit: Option<i32>,
}

// Authentication endpoints
#[axum::debug_handler]
pub async fn register(
    State(state): State<crate::ws::AppState>,
    Json(req): Json<RegisterRequest>,
) -> ApiResult<User> {
    match state.db.create_user(&req.username, &req.password).await {
        Ok(user) => Ok((StatusCode::CREATED, Json(user))),
        Err(err) => Err((
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({
                "error": format!("Failed to create user: {}", err)
            })),
        )),
    }
}

#[axum::debug_handler]
pub async fn login(
    State(state): State<crate::ws::AppState>,
    Json(req): Json<LoginRequest>,
) -> ApiResult<User> {
    match state.db.verify_user(&req.username, &req.password).await {
        Ok(user) => Ok((StatusCode::OK, Json(user))),
        Err(_) => Err((
            StatusCode::UNAUTHORIZED,
            Json(serde_json::json!({
                "error": "Invalid username or password"
            })),
        )),
    }
}

// Room management endpoints
#[axum::debug_handler]
pub async fn create_room(
    State(state): State<crate::ws::AppState>,
    Json(req): Json<CreateRoom>,
) -> ApiResult<serde_json::Value> {
    let room_id = Uuid::new_v4();
    
    // Set visitor_id based on game mode (default to PVP if not specified)
    let game_mode = req.game_mode.as_deref().unwrap_or("pvp");
    let visitor_id = if game_mode == "ai" {
        Some(Uuid::new_v4()) // Create a virtual AI player ID
    } else {
        None
    };
    
    println!("Creating room with game_mode: {}, visitor_id: {:?}", game_mode, visitor_id);
    
    let room_info = RoomInfo {
        id: 0,
        room_id,
        owner_id: req.user_id,
        visitor_id,
        status: if game_mode == "ai" { "playing".to_string() } else { "waiting".to_string() },
        round: "black".to_string(),
        winner: None,
        board: serde_json::Value::Object(serde_json::Map::new()),
        countdown: req.countdown,
        moves: 0,
        black_lost: 0,
        white_lost: 0,
        model: req.model,
        chessman_records: serde_json::Value::Array(vec![]),
        phase: Some("BlackQuantum".to_string()), // 新增：设置初始量子阶段
    };
    
    println!("Room info created: {:?}", room_info);

    match state.db.create_room(&room_info).await {
        Ok(created_room) => {
            println!("Room created successfully: {:?}", created_room);
            Ok((
                StatusCode::CREATED,
                Json(serde_json::json!({ 
                    "room_id": room_id,
                    "game_mode": game_mode 
                })),
            ))
        },
        Err(err) => {
            println!("Failed to create room: {}", err);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({
                    "error": format!("Failed to create room: {}", err)
                })),
            ))
        },
    }
}

#[axum::debug_handler]
pub async fn get_game_info(
    State(state): State<crate::ws::AppState>,
    Json(req): Json<GetGameInfo>,
) -> ApiResult<RoomInfo> {
    match state.db.get_room_by_room_id(req.room_id).await {
        Ok(room_info) => Ok((StatusCode::OK, Json(room_info))),
        Err(_) => Err((
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({
                "error": "Room not found"
            })),
        )),
    }
}

// 新增：排行榜接口
#[axum::debug_handler]
pub async fn get_leaderboard(
    State(state): State<crate::ws::AppState>,
    Json(req): Json<GetLeaderboardRequest>,
) -> ApiResult<Vec<LeaderboardEntry>> {
    let limit = req.limit.unwrap_or(50);
    
    if ![9, 13, 19].contains(&req.model) {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({
                "error": "Invalid model. Must be 9, 13, or 19"
            })),
        ));
    }

    match state.db.get_leaderboard(req.model, limit).await {
        Ok(leaderboard) => Ok((StatusCode::OK, Json(leaderboard))),
        Err(err) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                "error": format!("Failed to get leaderboard: {}", err)
            })),
        )),
    }
}

// 新增：更新玩家移动状态接口
#[derive(Deserialize)]
pub struct UpdatePlayerMoveRequest {
    pub room_id: Uuid,
    pub user_id: Uuid,
    pub position: String,
    pub game_mode: Option<String>,
    pub board: Option<serde_json::Value>, // 新增：棋盘状态
}

#[axum::debug_handler]
pub async fn update_player_move(
    State(state): State<crate::ws::AppState>,
    Json(req): Json<UpdatePlayerMoveRequest>,
) -> ApiResult<serde_json::Value> {
    // 获取房间信息
    let room_info = match state.db.get_room_by_room_id(req.room_id).await {
        Ok(info) => info,
        Err(_) => {
            return Err((
                StatusCode::NOT_FOUND,
                Json(serde_json::json!({
                    "error": "Room not found"
                })),
            ));
        }
    };

    println!("Updating player move - room_info: {:?}", room_info);
    
    // 更新房间信息中的moves计数、量子阶段和棋盘状态
    let mut updated_room_info = room_info.clone();
    updated_room_info.moves = room_info.moves + 1;
    
    // 如果moves变为奇数，说明轮到AI（白方）
    if updated_room_info.moves % 2 == 1 {
        updated_room_info.phase = Some("WhiteQuantum".to_string());
    } else {
        updated_room_info.phase = Some("BlackQuantum".to_string());
    }
    
    // 更新棋盘状态（如果提供）
    let board_updated = req.board.is_some();
    if let Some(board) = req.board {
        updated_room_info.board = board;
        println!("Board state updated with new data");
    }
    
    println!("Player move will update: moves={}, phase={:?}, board_updated={}", 
             updated_room_info.moves, updated_room_info.phase, board_updated);
    
    // 保存到数据库
    match state.db.update_room(&updated_room_info).await {
        Ok(_) => {
            println!("Player move updated successfully: moves={}, phase={:?}", 
                     updated_room_info.moves, updated_room_info.phase);
            Ok((
                StatusCode::OK,
                Json(serde_json::json!({
                    "message": "Player move updated successfully",
                    "moves": updated_room_info.moves,
                    "phase": updated_room_info.phase
                })),
            ))
        }
        Err(err) => {
            println!("Failed to update player move: {}", err);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({
                    "error": format!("Failed to update player move: {}", err)
                })),
            ))
        }
    }
}

// 新增：AI对战接口
#[derive(Deserialize)]
pub struct AIMoveRequest {
    room_id: Uuid,
    user_id: Uuid,
    game_mode: Option<String>, // 添加游戏模式参数
    board_state: Option<serde_json::Value>, // 新增：传递的棋盘状态
}

#[axum::debug_handler]
pub async fn ai_move(
    State(state): State<crate::ws::AppState>,
    Json(req): Json<AIMoveRequest>,
) -> ApiResult<serde_json::Value> {
    // 获取房间信息
    let room_info = match state.db.get_room_by_room_id(req.room_id).await {
        Ok(info) => info,
        Err(_) => {
            return Err((
                StatusCode::NOT_FOUND,
                Json(serde_json::json!({
                    "error": "Room not found"
                })),
            ));
        }
    };

    // 检查是否是AI对战房间
    println!("AI move request - room_info: {:?}", room_info);
    println!("AI move request - visitor_id: {:?}", room_info.visitor_id);
    println!("AI move request - current board: {:?}", room_info.board);
    println!("AI move request - current moves: {}", room_info.moves);
    
    // 检查是否是AI对战房间
    // 方法1: 通过visitor_id判断
    let is_ai_by_visitor = room_info.visitor_id.is_some();
    
    // 方法2: 通过请求参数判断
    let is_ai_by_request = req.game_mode.as_deref() == Some("ai");
    
    // 方法3: 通过房间状态判断（临时方案）
    let is_ai_by_status = room_info.status == "playing" && room_info.moves == 0;
    
    let is_ai_room = is_ai_by_visitor || is_ai_by_request || is_ai_by_status;
    
    println!("AI room check - visitor: {}, request: {}, status: {}, final: {}", 
             is_ai_by_visitor, is_ai_by_request, is_ai_by_status, is_ai_room);
    
    if !is_ai_room {
        println!("AI move rejected: not an AI room");
        return Err((
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({
                "error": "This is not an AI battle room"
            })),
        ));
    }
    
    println!("AI move request approved: room identified as AI room");

    // 创建AI玩家（默认中级难度）
    let ai_player = SimpleQuantumAI::new(AIDifficulty::Intermediate);
    
    // 转换游戏状态
    println!("Converting room_info to quantum board state...");
    println!("Room info details: moves={}, round={}, model={}, status={}", 
             room_info.moves, room_info.round, room_info.model, room_info.status);
    
    // 优先使用传递的棋盘状态，如果没有则使用数据库中的状态
    let quantum_state = if let Some(board_state) = &req.board_state {
        println!("Using provided board state: {:?}", board_state);
        // 从传递的棋盘状态创建量子状态
        crate::ai::create_quantum_state_from_board_state(board_state, &room_info)
    } else {
        println!("Using database board state");
        crate::ai::room_info_to_quantum_board_state(&room_info)
    };
    
    println!("Quantum state created: {:?}", quantum_state);
    
    // 获取AI的下一步落子
    println!("Getting AI's next move...");
    println!("Current quantum phase: {:?}, moves: {}", quantum_state.quantum_phase, room_info.moves);
    println!("AI will call get_next_move with quantum_phase: {:?}", quantum_state.quantum_phase);
    println!("Current board state - board1: {:?}, board2: {:?}", quantum_state.board1, quantum_state.board2);
    
    match ai_player.get_next_move(&quantum_state) {
        Ok(ai_move) => {
            // 检查AI是否在等待状态
            if ai_move.position == "waiting" {
                println!("AI is waiting for player's move");
                return Ok((
                    StatusCode::OK,
                    Json(serde_json::json!({
                        "ai_move": {
                            "position": "waiting",
                            "type": "waiting",
                            "brother": "waiting"
                        },
                        "message": "AI is waiting for player's move",
                        "status": "waiting"
                    })),
                ));
            }
            
            println!("AI move generated: {:?}", ai_move);
            
            // 如果AI要下棋，我们需要推进量子阶段并更新数据库
            if ai_move.position != "none" && ai_move.color != "none" && ai_move.position != "waiting" {
                // 计算新的量子阶段
                let new_phase = match quantum_state.quantum_phase {
                    QuantumPhase::BlackQuantum => "BlackQuantum", // 不应该发生
                    QuantumPhase::WhiteQuantum => "Entanglement",  // 白方下完进入纠缠
                    QuantumPhase::Entanglement => "BlackQuantum",  // 纠缠完毕轮到黑方
                };
                
                println!("AI move will advance quantum phase from {:?} to {}", 
                         quantum_state.quantum_phase, new_phase);
                
                // 更新房间信息中的量子阶段和moves计数
                let mut updated_room_info = room_info.clone();
                updated_room_info.phase = Some(new_phase.to_string());
                updated_room_info.moves = room_info.moves + 1; // 增加moves计数
                
                // 重要：更新棋盘状态，添加AI的落子
                if let Some(board_obj) = updated_room_info.board.as_object_mut() {
                    let ai_chessman = serde_json::json!({
                        "position": ai_move.position,
                        "type": ai_move.color,
                        "brother": ai_move.position
                    });
                    board_obj.insert(ai_move.position.clone(), ai_chessman);
                    println!("Updated board with AI move: {:?}", updated_room_info.board);
                } else {
                    // 如果board不是对象，创建一个新的对象
                    let mut new_board = serde_json::Map::new();
                    let ai_chessman = serde_json::json!({
                        "position": ai_move.position,
                        "type": ai_move.color,
                        "brother": ai_move.position
                    });
                    new_board.insert(ai_move.position.clone(), ai_chessman);
                    updated_room_info.board = serde_json::Value::Object(new_board);
                    println!("Created new board with AI move: {:?}", updated_room_info.board);
                }
                
                // 保存到数据库
                if let Err(err) = state.db.update_room(&updated_room_info).await {
                    println!("Failed to update room phase and moves: {}", err);
                } else {
                    println!("Room updated successfully: phase={}, moves={}", new_phase, updated_room_info.moves);
                }
            }
            
            // 这里应该更新游戏状态并返回AI的落子
            Ok((
                StatusCode::OK,
                Json(serde_json::json!({
                    "ai_move": {
                        "position": ai_move.position,
                        "type": ai_move.color,  // 转换为前端期望的type字段
                        "brother": ai_move.position
                    },
                    "message": "AI move generated successfully"
                })),
            ))
        }
        Err(err) => {
            println!("AI move generation failed: {}", err);
            // 如果AI无法生成移动，返回一个默认的等待响应
            Ok((
                StatusCode::OK,
                Json(serde_json::json!({
                    "ai_move": {
                        "position": "waiting",
                        "type": "waiting",
                        "brother": "waiting"
                    },
                    "message": "AI is temporarily unavailable, please wait",
                    "status": "waiting"
                })),
            ))
        }
    }
}
