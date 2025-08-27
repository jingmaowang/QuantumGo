use crate::entity::{RoomInfo, User, LeaderboardEntry};
use axum::{Json, extract::State, http::StatusCode};
use serde::Deserialize;
use uuid::Uuid;

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
    };

    match state.db.create_room(&room_info).await {
        Ok(_) => Ok((
            StatusCode::CREATED,
            Json(serde_json::json!({ 
                "room_id": room_id,
                "game_mode": game_mode 
            })),
        )),
        Err(err) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                "error": format!("Failed to create room: {}", err)
            })),
        )),
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
