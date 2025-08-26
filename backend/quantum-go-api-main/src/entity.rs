use axum::extract::ws::{Message, WebSocket};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use std::sync::Arc;
use tokio::sync::Mutex;
use uuid::Uuid;

// 房间结构：保存两个客户端的发送通道

pub type WsSender = Arc<Mutex<futures::stream::SplitSink<WebSocket, Message>>>;

pub struct Room {
    pub user1: Option<WsSender>,
    pub user2: Option<WsSender>,
}

#[derive(Clone, Deserialize, Serialize, FromRow)]
pub struct RoomInfo {
    #[serde(skip_serializing)]
    pub id: i32,
    pub room_id: Uuid,
    pub owner_id: Uuid,
    pub visitor_id: Option<Uuid>,
    pub status: String,
    pub round: String,
    pub winner: Option<String>,
    pub board: serde_json::Value,
    pub countdown: i32,
    pub moves: i32,
    pub black_lost: i32,
    pub white_lost: i32,
    pub model: i32,
    pub chessman_records: serde_json::Value,
}

#[derive(Clone, Deserialize, Serialize, FromRow)]
pub struct User {
    #[serde(skip_serializing)]
    #[allow(dead_code)]
    pub id: i32,
    pub user_id: Uuid,
    #[serde(rename(serialize = "user_name", deserialize = "user_name"))]
    pub username: String,
    #[serde(rename(serialize = "user_password", deserialize = "user_password"))]
    pub password: String,
}

// 新增：用户评分结构
#[derive(Clone, Deserialize, Serialize, FromRow)]
pub struct UserRanking {
    pub id: i32,
    pub user_id: Uuid,
    pub model: i32, // 9, 13, 19
    pub rating: f64,
    pub rd: f64,    // Rating Deviation
    pub vol: f64,   // Volatility
    pub games_played: i32,
    pub wins: i32,
    pub losses: i32,
    pub draws: i32,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

// 新增：排行榜条目
#[derive(Clone, Deserialize, Serialize)]
pub struct LeaderboardEntry {
    pub username: String,
    pub rating: f64,
    pub rd: f64,
    pub games_played: i32,
    pub wins: i32,
    pub losses: i32,
    pub draws: i32,
}

// 新增：游戏结果
#[derive(Clone, Deserialize, Serialize)]
pub struct GameResult {
    pub winner: Option<String>, // "black", "white", or None for draw
    pub black_score: i32,
    pub white_score: i32,
    pub model: i32,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Chessman {
    pub position: String,
    #[serde(rename(serialize = "type", deserialize = "type"))]
    pub color: String,
    pub brother: String,
}
