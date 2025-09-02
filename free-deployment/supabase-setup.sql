-- Supabase 免费数据库初始化脚本
-- 在 Supabase SQL 编辑器中运行此脚本

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rating INTEGER DEFAULT 1200,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建游戏表
CREATE TABLE IF NOT EXISTS games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player1_id UUID REFERENCES users(id),
    player2_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'waiting',
    board_state TEXT,
    current_player INTEGER DEFAULT 1,
    winner_id UUID REFERENCES users(id),
    game_type VARCHAR(20) DEFAULT 'pvp',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建游戏记录表
CREATE TABLE IF NOT EXISTS game_moves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES games(id),
    player_id UUID REFERENCES users(id),
    move_data JSONB NOT NULL,
    move_number INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建排行榜表
CREATE TABLE IF NOT EXISTS leaderboard (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    rating INTEGER NOT NULL,
    rank_position INTEGER,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_rating ON users(rating);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_games_player1 ON games(player1_id);
CREATE INDEX IF NOT EXISTS idx_games_player2 ON games(player2_id);
CREATE INDEX IF NOT EXISTS idx_game_moves_game_id ON game_moves(game_id);
CREATE INDEX IF NOT EXISTS idx_game_moves_player_id ON game_moves(player_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rating ON leaderboard(rating);

-- 插入测试数据
INSERT INTO users (username, email, password_hash, rating, wins, losses) VALUES 
('test_user', 'test@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KzKz2O', 1200, 0, 0),
('ai_player', 'ai@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KzKz2O', 1500, 0, 0)
ON CONFLICT (username) DO NOTHING;

-- 启用行级安全策略（RLS）
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- 创建策略（允许所有操作，适合游戏应用）
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations on games" ON games FOR ALL USING (true);
CREATE POLICY "Allow all operations on game_moves" ON game_moves FOR ALL USING (true);
CREATE POLICY "Allow all operations on leaderboard" ON leaderboard FOR ALL USING (true);

-- 创建更新排行榜的函数
CREATE OR REPLACE FUNCTION update_leaderboard()
RETURNS TRIGGER AS $$
BEGIN
    -- 更新排行榜
    INSERT INTO leaderboard (user_id, rating, rank_position)
    SELECT id, rating, ROW_NUMBER() OVER (ORDER BY rating DESC)
    FROM users
    ON CONFLICT (user_id) DO UPDATE SET
        rating = EXCLUDED.rating,
        rank_position = EXCLUDED.rank_position,
        updated_at = CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
CREATE TRIGGER update_leaderboard_trigger
    AFTER UPDATE OF rating ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_leaderboard();
