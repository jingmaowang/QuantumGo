use crate::db::Database;
use crate::entity::{UserRanking, GameResult as MatchResult};
use uuid::Uuid;

// glicko2 0.3.1 文档：GameResult::win/loss/draw(opponent_rating)
// new_rating(prior, results, sys_constant) -> Glicko2Rating
use glicko2::{Glicko2Rating, GameResult as GlickoGameResult, new_rating};

const TAU: f64 = 0.5; // 系统常数 τ，0.3 ~ 1.2 之间自行选择

pub struct RatingSystem;

impl RatingSystem {
    pub fn new() -> Self { Self }

    pub async fn update_ratings(
        &self,
        db: &Database,
        game_result: &MatchResult,
        black_player_id: Uuid,
        white_player_id: Uuid,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let model = game_result.model;

        // 1) 读取双方当前评级，如果不存在则创建默认记录
        let black_ranking = self.get_or_create_user_ranking(db, &black_player_id, model).await?;
        let white_ranking = self.get_or_create_user_ranking(db, &white_player_id, model).await?;

        // 2) 转成 glicko2 的 Rating 结构（字段名 value/deviation/volatility）
        let black_rating = to_glicko2(&black_ranking);
        let white_rating = to_glicko2(&white_ranking);

        // 3) 构造对局结果（从各自视角）
        let (black_res, white_res) = match game_result.winner.as_deref() {
            Some("black") => (
                [GlickoGameResult::win(white_rating)],
                [GlickoGameResult::loss(black_rating)],
            ),
            Some("white") => (
                [GlickoGameResult::loss(white_rating)],
                [GlickoGameResult::win(black_rating)],
            ),
            _ => (
                [GlickoGameResult::draw(white_rating)],
                [GlickoGameResult::draw(black_rating)],
            ),
        };

        // 4) 计算新评级（需要 sys_constant τ）
        let new_black = new_rating(black_rating, &black_res, TAU);
        let new_white = new_rating(white_rating, &white_res, TAU);

        // 5) 写回数据库字段（你的表用 rating/rd/vol 命名）
        let mut nb = black_ranking;
        nb.rating = new_black.value;
        nb.rd     = new_black.deviation;
        nb.vol    = new_black.volatility;
        nb.games_played += 1;
        match game_result.winner.as_deref() {
            Some("black") => nb.wins += 1,
            Some("white") => nb.losses += 1,
            _ => nb.draws += 1,
        }

        let mut nw = white_ranking;
        nw.rating = new_white.value;
        nw.rd     = new_white.deviation;
        nw.vol    = new_white.volatility;
        nw.games_played += 1;
        match game_result.winner.as_deref() {
            Some("white") => nw.wins += 1,
            Some("black") => nw.losses += 1,
            _ => nw.draws += 1,
        }

        db.update_user_ranking(&nb).await?;
        db.update_user_ranking(&nw).await?;
        Ok(())
    }

    // 新增：获取或创建用户评级记录
    async fn get_or_create_user_ranking(
        &self,
        db: &Database,
        user_id: &Uuid,
        model: i32,
    ) -> Result<UserRanking, Box<dyn std::error::Error>> {
        match db.get_user_ranking(user_id, model).await {
            Ok(ranking) => Ok(ranking),
            Err(_) => {
                // 如果不存在，创建默认评级记录
                let default_ranking = UserRanking {
                    id: 0,
                    user_id: *user_id,
                    model,
                    rating: 1500.0,
                    rd: 350.0,
                    vol: 0.06,
                    games_played: 0,
                    wins: 0,
                    losses: 0,
                    draws: 0,
                    created_at: chrono::Utc::now(),
                    updated_at: chrono::Utc::now(),
                };
                
                db.create_user_ranking(&default_ranking.user_id, default_ranking.model).await?;
                Ok(default_ranking)
            }
        }
    }
}

impl Default for RatingSystem {
    fn default() -> Self { Self::new() }
}

fn to_glicko2(r: &UserRanking) -> Glicko2Rating {
    Glicko2Rating {
        value:      r.rating, // μ
        deviation:  r.rd,     // φ
        volatility: r.vol,    // σ
    }
}
