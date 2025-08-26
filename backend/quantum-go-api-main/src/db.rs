use crate::entity::{RoomInfo, User};
use bcrypt::{DEFAULT_COST, hash, verify};
use sqlx::postgres::PgPoolOptions;
use sqlx::{Error, PgPool};
use uuid::Uuid;

const MAX_CONNECTIONS: u32 = 5;

/// Database connection and operations handler
#[derive(Debug)]
pub struct Database {
    pool: PgPool,
}

impl Database {
    pub async fn new(database_url: &str) -> Result<Self, Error> {
        let pool = PgPoolOptions::new()
            .max_connections(MAX_CONNECTIONS)
            .connect(database_url)
            .await?;

        Self::initialize_tables(&pool).await?;
        Ok(Self { pool })
    }

    async fn initialize_tables(pool: &PgPool) -> Result<(), Error> {
        // Create users table
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                user_id UUID NOT NULL UNIQUE,
                username VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL
            )
            "#,
        )
        .execute(pool)
        .await?;

        // Create room_infos table
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS room_infos (
                id SERIAL PRIMARY KEY,
                room_id UUID NOT NULL UNIQUE,
                owner_id UUID NOT NULL,
                visitor_id UUID,
                status VARCHAR(50) NOT NULL,
                round VARCHAR(50) NOT NULL,
                winner VARCHAR(50),
                board JSONB NOT NULL,
                countdown INTEGER NOT NULL DEFAULT 30,
                moves INTEGER NOT NULL DEFAULT 0,
                black_lost INTEGER NOT NULL DEFAULT 0,
                white_lost INTEGER NOT NULL DEFAULT 0,
                model INTEGER NOT NULL DEFAULT 9,
                chessman_records JSONB NOT NULL DEFAULT '[]'::jsonb
            );
            "#,
        )
        .execute(pool)
        .await?;

        Ok(())
    }

    // Actively used user operations
    pub async fn create_user(&self, username: &str, password: &str) -> Result<User, Error> {
        let user_id = Uuid::new_v4();
        let hashed_password = hash_password(password)?;

        sqlx::query_as::<_, User>(
            "INSERT INTO users (user_id, username, password) VALUES ($1, $2, $3) RETURNING *",
        )
        .bind(user_id)
        .bind(username)
        .bind(hashed_password)
        .fetch_one(&self.pool)
        .await
    }

    pub async fn verify_user(&self, username: &str, password: &str) -> Result<User, Error> {
        let user = self.get_user_by_username(username).await?;

        if verify_password(password, &user.password)? {
            Ok(user)
        } else {
            Err(Error::RowNotFound)
        }
    }

    pub async fn get_user_by_username(&self, username: &str) -> Result<User, Error> {
        sqlx::query_as::<_, User>("SELECT * FROM users WHERE username = $1")
            .bind(username)
            .fetch_one(&self.pool)
            .await
    }

    // Reserved for future use
    #[allow(dead_code)]
    pub async fn get_user_by_id(&self, id: i32) -> Result<User, Error> {
        sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1")
            .bind(id)
            .fetch_one(&self.pool)
            .await
    }

    #[allow(dead_code)]
    pub async fn get_user_by_user_id(&self, user_id: Uuid) -> Result<User, Error> {
        sqlx::query_as::<_, User>("SELECT * FROM users WHERE user_id = $1")
            .bind(user_id)
            .fetch_one(&self.pool)
            .await
    }

    #[allow(dead_code)]
    pub async fn update_user_password(
        &self,
        user_id: Uuid,
        new_password: &str,
    ) -> Result<User, Error> {
        let hashed_password = hash_password(new_password)?;

        sqlx::query_as::<_, User>("UPDATE users SET password = $1 WHERE user_id = $2 RETURNING *")
            .bind(hashed_password)
            .bind(user_id)
            .fetch_one(&self.pool)
            .await
    }

    #[allow(dead_code)]
    pub async fn delete_user(&self, user_id: Uuid) -> Result<(), Error> {
        sqlx::query("DELETE FROM users WHERE user_id = $1")
            .bind(user_id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    // Actively used room operations
    pub async fn create_room(&self, room_info: &RoomInfo) -> Result<RoomInfo, Error> {
        sqlx::query_as::<_, RoomInfo>(
            r#"
            INSERT INTO room_infos (
                room_id, owner_id, visitor_id, status, round, winner, board, countdown, moves, black_lost, white_lost, model, chessman_records
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *
            "#,
        )
        .bind(room_info.room_id)
        .bind(room_info.owner_id)
        .bind(room_info.visitor_id)
        .bind(&room_info.status)
        .bind(&room_info.round)
        .bind(&room_info.winner)
        .bind(&room_info.board)
        .bind(room_info.countdown)
        .bind(room_info.moves)
        .bind(room_info.black_lost)
        .bind(room_info.white_lost)
        .bind(room_info.model)
        .bind(&room_info.chessman_records)
        .fetch_one(&self.pool)
        .await
    }

    pub async fn get_room_by_room_id(&self, room_id: Uuid) -> Result<RoomInfo, Error> {
        sqlx::query_as::<_, RoomInfo>("SELECT * FROM room_infos WHERE room_id = $1")
            .bind(room_id)
            .fetch_one(&self.pool)
            .await
    }

    pub async fn update_room(&self, room_info: &RoomInfo) -> Result<RoomInfo, Error> {
        sqlx::query_as::<_, RoomInfo>(
            r#"
            UPDATE room_infos SET
                visitor_id = $1,
                status = $2,
                round = $3,
                winner = $4,
                board = $5,
                countdown = $6,
                moves = $7,
                black_lost = $8,
                white_lost = $9,
                model = $10,
                chessman_records = $11
            WHERE id = $12 RETURNING *
            "#,
        )
        .bind(room_info.visitor_id)
        .bind(&room_info.status)
        .bind(&room_info.round)
        .bind(&room_info.winner)
        .bind(&room_info.board)
        .bind(room_info.countdown)
        .bind(room_info.moves)
        .bind(room_info.black_lost)
        .bind(room_info.white_lost)
        .bind(room_info.model)
        .bind(&room_info.chessman_records)
        .bind(room_info.id)
        .fetch_one(&self.pool)
        .await
    }

    // Reserved for future use
    #[allow(dead_code)]
    pub async fn get_room_by_id(&self, id: i32) -> Result<RoomInfo, Error> {
        sqlx::query_as::<_, RoomInfo>("SELECT * FROM room_infos WHERE id = $1")
            .bind(id)
            .fetch_one(&self.pool)
            .await
    }

    #[allow(dead_code)]
    pub async fn delete_room(&self, id: i32) -> Result<(), Error> {
        sqlx::query("DELETE FROM room_infos WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }
}

// Helper functions for password hashing
fn hash_password(password: &str) -> Result<String, Error> {
    hash(password, DEFAULT_COST).map_err(|e| {
        Error::Io(std::io::Error::new(
            std::io::ErrorKind::Other,
            e.to_string(),
        ))
    })
}

fn verify_password(password: &str, hash: &str) -> Result<bool, Error> {
    verify(password, hash).map_err(|e| {
        Error::Io(std::io::Error::new(
            std::io::ErrorKind::Other,
            e.to_string(),
        ))
    })
}
