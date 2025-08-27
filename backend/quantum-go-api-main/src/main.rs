use axum::{
    Router,
    routing::{any, get, post},
};
use db::Database;
use std::collections::HashMap;
use std::sync::Arc;
use std::{env, net::SocketAddr, path::PathBuf};
use tokio::signal;
use tokio::sync::Mutex;
use tower_http::cors::{Any, CorsLayer};
use tower_http::{
    services::ServeDir,
    trace::{DefaultMakeSpan, DefaultOnRequest, DefaultOnResponse, TraceLayer},
};
use tracing::info;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod ai;
mod api;
mod db;
mod entity;
mod rating;
mod ws;

#[tokio::main]
async fn main() {
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| {
                format!("{}=debug,tower_http=debug", env!("CARGO_CRATE_NAME")).into()
            }),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let assets_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("assets");

    // 从环境变量获取数据库地址，如果没有设置则使用默认值
    let database_url = env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://postgres:postgres@localhost:5432/quantum_go".to_string());

    // 初始化数据库连接
    let database = Database::new(&database_url)
        .await
        .expect("Failed to connect to database");

    let state = ws::AppState {
        rooms: Arc::new(Mutex::new(HashMap::new())),
        db: Arc::new(database),
    };

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // build our application with some routes
    let app = Router::new()
        .fallback_service(ServeDir::new(assets_dir).append_index_html_on_directories(true))
        .route("/", get(|| async { "active" }))
        .route("/createRoom", post(api::create_room))
        .route("/getGameInfo", post(api::get_game_info))
        .route("/userRegister", post(api::register))
        .route("/getUserInfo", post(api::login))
        .route("/getLeaderboard", post(api::get_leaderboard))
        .route("/aiMove", post(api::ai_move))
        .route("/updatePlayerMove", post(api::update_player_move))
        .route("/ws/{user_id}/{room_id}", any(ws::ws_handler))
        .with_state(state)
        // logging so we can see what's going on
        .layer(cors)
        .layer(
            TraceLayer::new_for_http()
                .make_span_with(DefaultMakeSpan::default().include_headers(true))
                .on_request(DefaultOnRequest::default())
                .on_response(DefaultOnResponse::default()),
        );

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    tracing::debug!("listening on {}", listener.local_addr().unwrap());

    let shutdown = async {
        let ctrl_c = async {
            signal::ctrl_c()
                .await
                .expect("Failed to install Ctrl+C handler");
        };

        #[cfg(unix)]
        let terminate = async {
            signal::unix::signal(signal::unix::SignalKind::terminate())
                .expect("Failed to install signal handler")
                .recv()
                .await;
        };

        #[cfg(not(unix))]
        let terminate = std::future::pending::<()>();

        tokio::select! {
            _ = ctrl_c => {
                tracing::info!("Received Ctrl+C signal");
            },
            _ = terminate => {
                tracing::info!("Received SIGTERM signal");
            },
        }

        tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
        tracing::warn!("Graceful shutdown timeout, forcing exit");
        std::process::exit(0);
    };

    info!("Starting server on {}", listener.local_addr().unwrap());

    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<SocketAddr>(),
    )
    .with_graceful_shutdown(shutdown)
    .await
    .unwrap();
}
