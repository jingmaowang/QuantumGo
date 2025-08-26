use crate::db::Database;
use crate::entity::Room;
use crate::entity::WsSender;
use crate::entity::{Chessman, RoomInfo, GameResult};
use crate::rating::RatingSystem;
use axum::{
    extract::{
        Path, State,
        connect_info::ConnectInfo,
        ws::{Message, WebSocket, WebSocketUpgrade},
    },
    response::IntoResponse,
};
use axum_extra::TypedHeader;
use futures::{sink::SinkExt, stream::StreamExt};
use serde::{Deserialize, Serialize};
use serde_json::{Value, to_string};
use std::{collections::HashMap, error::Error, net::SocketAddr, sync::Arc};
use tokio::sync::Mutex;
use tracing::info;
use uuid::Uuid;

#[derive(Clone)]
pub struct AppState {
    pub rooms: Arc<Mutex<HashMap<Uuid, Room>>>,
    pub db: Arc<Database>,
}

pub async fn ws_handler(
    State(state): State<AppState>,
    Path((user_id, room_id)): Path<(Uuid, Uuid)>,
    ws: WebSocketUpgrade,
    user_agent: Option<TypedHeader<headers::UserAgent>>,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
) -> impl IntoResponse {
    let user_agent = user_agent
        .map(|TypedHeader(user_agent)| user_agent.to_string())
        .unwrap_or_else(|| String::from("Unknown browser"));

    info!("`{user_agent}` at {addr} connected.");
    ws.on_upgrade(move |socket| handle_socket(socket, addr, state, room_id, user_id))
}

async fn send_start_game_message(sender: &WsSender) -> Result<(), Box<dyn Error + Send + Sync>> {
    let msg = Data::<serde_json::Value> {
        mode: "startGame".to_string(),
        data: serde_json::Value::Null,
    };
    sender
        .lock()
        .await
        .send(Message::Text(serde_json::to_string(&msg)?.into()))
        .await?;
    Ok(())
}

async fn handle_user_connection(
    ws_sender: &mut WsSender,
    room: &mut Room,
    state: &AppState,
    room_info: &RoomInfo,
    user_id: Uuid,
) -> Result<(), Box<dyn Error + Send + Sync>> {
    let is_owner = user_id == room_info.owner_id;
    let is_visitor = room_info.visitor_id.map_or(true, |vid| vid == user_id);

    if is_owner {
        room.user1 = Some(ws_sender.clone());
    } else if is_visitor {
        room.user2 = Some(ws_sender.clone());
        if let Err(err) = update_room_visitor(state, room_info, user_id).await {
            info!("Failed to update room visitor: {}", err);
            return Err("Failed to update room visitor".into());
        }

        // Send start game message to both players
        if let (Some(user1), Some(user2)) = (&room.user1, &room.user2) {
            send_start_game_message(user1).await?;
            send_start_game_message(user2).await?;
        }
    } else {
        return Err("Room is full".into());
    }

    Ok(())
}

async fn handle_socket(
    socket: WebSocket,
    who: SocketAddr,
    state: AppState,
    room_id: Uuid,
    user_id: Uuid,
) {
    let (ws_sender, mut ws_receiver) = socket.split();
    let mut ws_sender = Arc::new(Mutex::new(ws_sender));

    // Get room info from database
    let room_info = match state.db.get_room_by_room_id(room_id).await {
        Ok(info) => info,
        Err(_) => {
            send_error_message(&ws_sender, "Room not found").await;
            return;
        }
    };

    // Setup WebSocket connection in memory
    let mut rooms = state.rooms.lock().await;
    let room = rooms.entry(room_id).or_insert(Room {
        user1: None,
        user2: None,
    });

    // Handle user connection
    if let Err(err) =
        handle_user_connection(&mut ws_sender, room, &state, &room_info, user_id).await
    {
        send_error_message(&ws_sender, &err.to_string()).await;
        return;
    }

    info!("`{user_id}` at {who} connected to room `{room_id}`.");
    drop(rooms);

    let room_info = room_info.clone();
    tokio::spawn(async move {
        process_messages(&mut ws_receiver, &state, room_id, user_id).await;

        // Cleanup on disconnect
        cleanup_connection(&state, room_id, user_id, &room_info).await;
    });
}

async fn send_error_message(ws_sender: &WsSender, message: &str) {
    let msg = Data::<SendMessage> {
        mode: "error".to_string(),
        data: SendMessage {
            message: message.to_string(),
        },
    };
    let _ = ws_sender
        .lock()
        .await
        .send(Message::Text(to_string(&msg).unwrap().into()))
        .await;
}

async fn update_room_visitor(
    state: &AppState,
    room_info: &RoomInfo,
    user_id: Uuid,
) -> Result<RoomInfo, sqlx::Error> {
    state
        .db
        .update_room(&RoomInfo {
            id: room_info.id,
            room_id: room_info.room_id,
            owner_id: room_info.owner_id,
            visitor_id: Some(user_id),
            status: "playing".to_string(),
            round: room_info.round.clone(),
            winner: room_info.winner.clone(),
            board: room_info.board.clone(),
            countdown: room_info.countdown,
            moves: room_info.moves,
            black_lost: room_info.black_lost,
            white_lost: room_info.white_lost,
            model: room_info.model.clone(),
            chessman_records: room_info.chessman_records.clone(),
        })
        .await
}

async fn process_messages(
    ws_receiver: &mut futures::stream::SplitStream<WebSocket>,
    state: &AppState,
    room_id: Uuid,
    user_id: Uuid,
) {
    while let Some(Ok(Message::Text(text))) = ws_receiver.next().await {
        info!("message: {text}");

        let msg: Data<Value> = match serde_json::from_str(&text) {
            Ok(msg) => msg,
            Err(_) => continue,
        };

        let mut rooms = state.rooms.lock().await;
        if let Some(room) = rooms.get_mut(&room_id) {
            // Get room info from database
            let room_info = match state.db.get_room_by_room_id(room_id).await {
                Ok(info) => info,
                Err(_) => {
                    send_error_message(&room.user1.as_ref().unwrap(), "Room not found").await;
                    send_error_message(&room.user2.as_ref().unwrap(), "Room not found").await;
                    return;
                }
            };

            let target = if user_id == room_info.owner_id {
                &mut room.user2
            } else {
                &mut room.user1
            };

            if let Some(target_tx) = target {
                handle_message(&msg, target_tx, state, &room_info, &text).await;
            }
        }
    }
}

async fn handle_message(
    msg: &Data<Value>,
    target_tx: &mut WsSender,
    state: &AppState,
    room_info: &RoomInfo,
    text: &str,
) {
    match msg.mode.as_str() {
        "updateChess" => handle_update_chess(msg, target_tx, state, room_info).await,
        "setWinner" => handle_set_winner(msg, target_tx, state, room_info, text).await,
        _ => {
            let _ = target_tx
                .lock()
                .await
                .send(Message::Text(text.to_string().into()))
                .await;
        }
    }
}

async fn handle_update_chess(
    msg: &Data<Value>,
    target_tx: &mut WsSender,
    state: &AppState,
    room_info: &RoomInfo,
) {
    if let Ok(data) = serde_json::from_value::<UpdataChess>(msg.data.clone()) {
        let resp = Data::<UpdataChessResponse> {
            mode: "updateChess".to_string(),
            data: UpdataChessResponse {
                put_chess: data.put_chess.clone(),
            },
        };

        if data.put_chess.position != "0,0" {
            if let Err(err) = update_game_state(state, room_info, &data).await {
                info!("Failed to update room state: {}", err);
                return;
            }
        }

        let _ = target_tx
            .lock()
            .await
            .send(Message::Text(to_string(&resp).unwrap().into()))
            .await;
    }
}

async fn update_game_state(
    state: &AppState,
    room_info: &RoomInfo,
    data: &UpdataChess,
) -> Result<RoomInfo, sqlx::Error> {
    state
        .db
        .update_room(&RoomInfo {
            id: room_info.id,
            room_id: room_info.room_id,
            owner_id: room_info.owner_id,
            visitor_id: room_info.visitor_id,
            status: room_info.status.clone(),
            round: if room_info.round == "black" {
                "white".to_string()
            } else {
                "black".to_string()
            },
            winner: room_info.winner.clone(),
            board: data.board.clone(),
            countdown: 30,
            moves: room_info.moves + 1,
            black_lost: data.black_lost,
            white_lost: data.white_lost,
            model: room_info.model.clone(),
            chessman_records: data.chessman_records.clone(),
        })
        .await
}

async fn handle_set_winner(
    msg: &Data<Value>,
    target_tx: &mut WsSender,
    state: &AppState,
    room_info: &RoomInfo,
    text: &str,
) {
    if let Ok(data) = serde_json::from_value::<SetWinner>(msg.data.clone()) {
        if let Err(err) = update_winner(state, room_info, &data).await {
            info!("Failed to update room winner: {}", err);
            return;
        }

        let _ = target_tx
            .lock()
            .await
            .send(Message::Text(text.to_string().into()))
            .await;
    }
}

async fn update_winner(
    state: &AppState,
    room_info: &RoomInfo,
    data: &SetWinner,
) -> Result<RoomInfo, sqlx::Error> {
    let updated_room = state
        .db
        .update_room(&RoomInfo {
            id: room_info.id,
            room_id: room_info.room_id,
            owner_id: room_info.owner_id,
            visitor_id: room_info.visitor_id,
            status: "finished".to_string(),
            round: room_info.round.clone(),
            winner: Some(data.winner.clone()),
            board: room_info.board.clone(),
            countdown: room_info.countdown,
            moves: room_info.moves,
            black_lost: room_info.black_lost,
            white_lost: room_info.white_lost,
            model: room_info.model.clone(),
            chessman_records: room_info.chessman_records.clone(),
        })
        .await?;

    // 游戏结束后更新评分
    let rating_system = RatingSystem::new();
    let game_result = GameResult {
        winner: Some(data.winner.clone()),
        black_score: room_info.black_lost,
        white_score: room_info.white_lost,
        model: room_info.model,
    };

    // 在后台更新评分，不阻塞响应
    let db_clone = state.db.clone();
    let owner_id = room_info.owner_id;
    
    // 如果有访客，更新双方评分
    if let Some(visitor_id) = room_info.visitor_id {
        tokio::spawn(async move {
            if let Err(err) = rating_system.update_ratings(
                &db_clone,
                &game_result,
                owner_id,
                visitor_id,
            ).await {
                info!("Failed to update ratings: {}", err);
            }
        });
    }

    Ok(updated_room)
}

async fn cleanup_connection(state: &AppState, room_id: Uuid, user_id: Uuid, room_info: &RoomInfo) {
    let mut rooms = state.rooms.lock().await;
    if let Some(room) = rooms.get_mut(&room_id) {
        if user_id == room_info.owner_id {
            room.user1 = None;
        } else {
            room.user2 = None;
        }
    }
}

#[derive(Serialize, Deserialize)]
struct Data<T> {
    #[serde(rename(serialize = "type", deserialize = "type"))]
    mode: String,
    data: T,
}

#[derive(Serialize, Deserialize)]
struct UpdataChess {
    #[serde(rename(serialize = "putChess", deserialize = "putChess"))]
    put_chess: Chessman,
    board: Value,
    black_lost: i32,
    white_lost: i32,
    chessman_records: serde_json::Value,
}

#[derive(Serialize, Deserialize)]
struct UpdataChessResponse {
    #[serde(rename(serialize = "putChess", deserialize = "putChess"))]
    put_chess: Chessman,
}

#[derive(Serialize, Deserialize)]
struct SetWinner {
    winner: String,
}

#[derive(Serialize, Deserialize)]
struct SendMessage {
    message: String,
}
