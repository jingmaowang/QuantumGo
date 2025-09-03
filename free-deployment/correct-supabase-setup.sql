-- 正确的 Supabase 数据库初始化脚本
-- 根据您的 Rust 程序实际需要的表结构

-- 删除之前创建的表（如果存在）
DROP TABLE IF EXISTS leaderboard CASCADE;
DROP TABLE IF EXISTS game_moves CASCADE;
DROP TABLE IF EXISTS games CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 创建用户表（与 Rust 程序匹配）
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

-- 创建房间信息表（与 Rust 程序匹配）
CREATE TABLE room_infos (
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
    chessman_records JSONB NOT NULL DEFAULT '[]'::jsonb,
    phase VARCHAR(50) DEFAULT 'BlackQuantum'
);

-- 创建用户评分表（与 Rust 程序匹配）
CREATE TABLE user_rankings (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    model INTEGER NOT NULL,
    rating DOUBLE PRECISION NOT NULL DEFAULT 1500.0,
    rd DOUBLE PRECISION NOT NULL DEFAULT 350.0,
    vol DOUBLE PRECISION NOT NULL DEFAULT 0.06,
    games_played INTEGER NOT NULL DEFAULT 0,
    wins INTEGER NOT NULL DEFAULT 0,
    losses INTEGER NOT NULL DEFAULT 0,
    draws INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, model)
);

-- 创建索引
CREATE INDEX idx_users_user_id ON users(user_id);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_room_infos_room_id ON room_infos(room_id);
CREATE INDEX idx_room_infos_owner_id ON room_infos(owner_id);
CREATE INDEX idx_room_infos_visitor_id ON room_infos(visitor_id);
CREATE INDEX idx_room_infos_status ON room_infos(status);
CREATE INDEX idx_user_rankings_user_id ON user_rankings(user_id);
CREATE INDEX idx_user_rankings_model ON user_rankings(model);

-- 启用行级安全策略（RLS）
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_infos ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rankings ENABLE ROW LEVEL SECURITY;

-- 创建策略（允许所有操作，适合游戏应用）
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations on room_infos" ON room_infos FOR ALL USING (true);
CREATE POLICY "Allow all operations on user_rankings" ON user_rankings FOR ALL USING (true);

-- 插入测试数据
INSERT INTO users (user_id, username, password) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'test_user', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KzKz2O')
ON CONFLICT (user_id) DO NOTHING;

-- 为测试用户创建评分记录
INSERT INTO user_rankings (user_id, model, rating, rd, vol, games_played, wins, losses, draws) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 9, 1500.0, 350.0, 0.06, 0, 0, 0, 0),
('550e8400-e29b-41d4-a716-446655440000', 13, 1500.0, 350.0, 0.06, 0, 0, 0, 0),
('550e8400-e29b-41d4-a716-446655440000', 19, 1500.0, 350.0, 0.06, 0, 0, 0, 0)
ON CONFLICT (user_id, model) DO NOTHING;
