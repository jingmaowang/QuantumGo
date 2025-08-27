use crate::entity::{Chessman, RoomInfo};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::error::Error;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIMove {
    /// 合法坐标如 "3,4"；等待/无需落子时为 "waiting"/"none"
    pub position: String,
    /// "white"/"black"，或等待/无需落子时 "waiting"/"none"
    pub color: String,
    pub confidence: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuantumBoardState {
    pub board1: HashMap<String, Chessman>, // 第一个棋盘
    pub board2: HashMap<String, Chessman>, // 第二个棋盘
    pub current_player: String,            // "black" 或 "white"
    pub quantum_phase: QuantumPhase,       // 量子阶段
    pub model: i32,                        // 棋盘大小：9/13/19
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum QuantumPhase {
    BlackQuantum,   // 黑方量子阶段（玩家）
    WhiteQuantum,   // 白方量子阶段（AI）
    Entanglement,   // 纠缠阶段（系统处理）
}

pub struct SimpleQuantumAI {
    pub difficulty: AIDifficulty,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AIDifficulty {
    Beginner,
    Intermediate,
    Advanced,
}

impl SimpleQuantumAI {
    pub fn new(difficulty: AIDifficulty) -> Self {
        Self { difficulty }
    }

    /// 获取AI的下一步落子（AI 永远执白）
    pub fn get_next_move(&self, game_state: &QuantumBoardState) -> Result<AIMove, Box<dyn Error + Send + Sync>> {
        match game_state.quantum_phase {
            QuantumPhase::BlackQuantum => {
                // 玩家阶段：AI 等待
                Ok(AIMove {
                    position: "waiting".to_string(),
                    color: "waiting".to_string(),
                    confidence: 0.0,
                })
            }
            QuantumPhase::WhiteQuantum => {
                // AI 白方阶段：选择白棋点
                self.white_quantum_move(game_state)
            }
            QuantumPhase::Entanglement => {
                // 纠缠阶段无需落子（系统自动处理）
                Ok(AIMove {
                    position: "none".to_string(),
                    color: "none".to_string(),
                    confidence: self.get_confidence_for_difficulty(),
                })
            }
        }
    }

    /// 白方量子阶段：选择最佳落子位置（AI 执白）
    fn white_quantum_move(&self, game_state: &QuantumBoardState) -> Result<AIMove, Box<dyn Error + Send + Sync>> {
        let available_positions = self.get_available_positions(game_state);
        
        println!("AI white_quantum_move: available_positions={:?}", available_positions);

        if available_positions.is_empty() {
            // 无点可下，返回无需落子（上层不应写盘）
            return Ok(AIMove {
                position: "none".to_string(),
                color: "white".to_string(),
                confidence: self.get_confidence_for_difficulty(),
            });
        }

        // 可选策略：尽量避免与黑子位置重复（考虑双盘）
        let mut candidate_positions = Vec::new();
        'outer: for pos in &available_positions {
            // 若该点在任一盘被黑子占据，则尽量跳过
            for ch in game_state.board1.values() {
                if ch.color == "black" && ch.position == *pos {
                    continue 'outer;
                }
            }
            for ch in game_state.board2.values() {
                if ch.color == "black" && ch.position == *pos {
                    continue 'outer;
                }
            }
            candidate_positions.push(pos.clone());
        }
        if candidate_positions.is_empty() {
            candidate_positions = available_positions;
        }
        
        println!("AI white_quantum_move: candidate_positions={:?}", candidate_positions);

        let best_position = self.greedy_position_selection(game_state, &candidate_positions, "white");
        
        println!("AI white_quantum_move: selected_position={}", best_position);

        Ok(AIMove {
            position: best_position,
            color: "white".to_string(),
            confidence: self.get_confidence_for_difficulty(),
        })
    }

    /// 获取可用的落子位置（两个棋盘该点都未被占用）
    fn get_available_positions(&self, game_state: &QuantumBoardState) -> Vec<String> {
        let mut positions = Vec::new();
        let model = game_state.model;

        println!("AI get_available_positions: board1_size={}, board2_size={}", 
                 game_state.board1.len(), game_state.board2.len());
        println!("AI get_available_positions: board1 keys: {:?}", game_state.board1.keys().collect::<Vec<_>>());
        println!("AI get_available_positions: board2 keys: {:?}", game_state.board2.keys().collect::<Vec<_>>());

        for x in 1..=model {
            for y in 1..=model {
                let pos = format!("{x},{y}");
                
                // 检查该位置是否被任何棋子占用（黑子或白子）
                let board1_occupied = game_state.board1.contains_key(&pos);
                let board2_occupied = game_state.board2.contains_key(&pos);
                
                // 检查该位置是否已经有任何颜色的棋子
                let has_any_chess = board1_occupied || board2_occupied;
                
                if !has_any_chess {
                    positions.push(pos);
                } else {
                    println!("AI get_available_positions: position {} is occupied (board1: {}, board2: {})", 
                             pos, board1_occupied, board2_occupied);
                    if board1_occupied {
                        println!("  Board1 chessman: {:?}", game_state.board1.get(&pos));
                    }
                    if board2_occupied {
                        println!("  Board2 chessman: {:?}", game_state.board2.get(&pos));
                    }
                }
            }
        }
        
        println!("AI get_available_positions: available_positions={:?}", positions);
        positions
    }

    /// 贪心策略选择位置（简化版本，确保AI能正常下棋）
    fn greedy_position_selection(&self, game_state: &QuantumBoardState, positions: &[String], color: &str) -> String {
        if positions.is_empty() {
            // 理论不会触发，上游已处理
            let center = (game_state.model + 1) / 2;
            return format!("{},{}", center, center);
        }

        // 简化：随机选择一个可用位置，避免总是选择同一个位置
        let random_index = (positions.len() + game_state.board1.len() + game_state.board2.len()) % positions.len();
        let selected_position = &positions[random_index];

        println!("AI greedy_position_selection: available positions: {:?}", positions);
        println!("AI greedy_position_selection: selected position: {} (random index: {})", 
                 selected_position, random_index);

        selected_position.clone()
    }

    /// 评估某个位置的分数
    fn evaluate_position(&self, game_state: &QuantumBoardState, position: &str, color: &str) -> f64 {
        let mut score = 0.0;

        // 1) 中心奖励
        score += self.center_bonus(position, game_state.model);

        // 2) 连接奖励
        score += self.connection_bonus(game_state, position, color);

        // 3) 防守奖励
        score += self.defense_bonus(game_state, position, color);

        // 4) 攻击奖励
        score += self.attack_bonus(game_state, position, color);

        // 5) 量子策略奖励（双盘）
        score += self.quantum_strategy_bonus(game_state, position, color);

        score
    }

    /// 中心位置奖励：越靠近中心分越高
    fn center_bonus(&self, position: &str, model: i32) -> f64 {
        let parts: Vec<&str> = position.split(',').collect();
        if parts.len() != 2 {
            return 0.0;
        }
        let x: i32 = parts[0].parse().unwrap_or(0);
        let y: i32 = parts[1].parse().unwrap_or(0);

        let center = (model + 1) / 2;
        let distance_from_center = ((x - center).abs() + (y - center).abs()) as f64;

        // 简单线性：离中心越近分越高
        (model as f64 - distance_from_center) * 0.5
    }

    /// 连接奖励：相邻同色
    fn connection_bonus(&self, game_state: &QuantumBoardState, position: &str, color: &str) -> f64 {
        let mut bonus = 0.0;
        let neighbors = self.get_neighbors(position, game_state.model);

        for neighbor in neighbors {
            if let Some(ch) = game_state.board1.get(&neighbor) {
                if ch.color == color {
                    bonus += 2.0;
                }
            }
            if let Some(ch) = game_state.board2.get(&neighbor) {
                if ch.color == color {
                    bonus += 2.0;
                }
            }
        }
        bonus
    }

    /// 防守奖励：相邻己方
    fn defense_bonus(&self, game_state: &QuantumBoardState, position: &str, color: &str) -> f64 {
        let mut bonus = 0.0;
        let neighbors = self.get_neighbors(position, game_state.model);

        for neighbor in neighbors {
            if let Some(ch) = game_state.board1.get(&neighbor) {
                if ch.color == color {
                    bonus += 1.5;
                }
            }
            if let Some(ch) = game_state.board2.get(&neighbor) {
                if ch.color == color {
                    bonus += 1.5;
                }
            }
        }
        bonus
    }

    /// 攻击奖励：相邻对方
    fn attack_bonus(&self, game_state: &QuantumBoardState, position: &str, color: &str) -> f64 {
        let mut bonus = 0.0;
        let enemy_color = if color == "black" { "white" } else { "black" };
        let neighbors = self.get_neighbors(position, game_state.model);

        for neighbor in neighbors {
            if let Some(ch) = game_state.board1.get(&neighbor) {
                if ch.color == enemy_color {
                    bonus += 2.5;
                }
            }
            if let Some(ch) = game_state.board2.get(&neighbor) {
                if ch.color == enemy_color {
                    bonus += 2.5;
                }
            }
        }
        bonus
    }

    /// 量子策略奖励：分别评估双盘并取 max，若两盘都>0 额外加分
    fn quantum_strategy_bonus(&self, game_state: &QuantumBoardState, position: &str, color: &str) -> f64 {
        let b1 = self.evaluate_board_position(&game_state.board1, position, color, game_state.model);
        let b2 = self.evaluate_board_position(&game_state.board2, position, color, game_state.model);
        let mut score = b1.max(b2);
        if b1 > 0.0 && b2 > 0.0 {
            score += 1.0;
        }
        score
    }

    /// 评估单盘中的位置（邻接性）
    fn evaluate_board_position(
        &self,
        board: &HashMap<String, Chessman>,
        position: &str,
        color: &str,
        model: i32,
    ) -> f64 {
        let mut score = 0.0;
        let neighbors = self.get_neighbors(position, model);
        for neighbor in neighbors {
            if let Some(chess) = board.get(&neighbor) {
                if chess.color == color {
                    score += 1.0;
                } else {
                    score += 0.5; // 与异色相邻，可能形成战术机会
                }
            }
        }
        score
    }

    /// 获取相邻的上下左右
    fn get_neighbors(&self, position: &str, model: i32) -> Vec<String> {
        let parts: Vec<&str> = position.split(',').collect();
        if parts.len() != 2 {
            return Vec::new();
        }
        let x: i32 = parts[0].parse().unwrap_or(0);
        let y: i32 = parts[1].parse().unwrap_or(0);

        let mut neighbors = Vec::new();
        let directions = [(0, 1), (0, -1), (1, 0), (-1, 0)];

        for (dx, dy) in directions {
            let nx = x + dx;
            let ny = y + dy;
            if nx >= 1 && nx <= model && ny >= 1 && ny <= model {
                neighbors.push(format!("{nx},{ny}"));
            }
        }
        neighbors
    }

    /// 难度对应置信度
    fn get_confidence_for_difficulty(&self) -> f64 {
        match self.difficulty {
            AIDifficulty::Beginner => 0.3,
            AIDifficulty::Intermediate => 0.5,
            AIDifficulty::Advanced => 0.7,
        }
    }
}

/// 从 RoomInfo 转为 QuantumBoardState
pub fn room_info_to_quantum_board_state(room_info: &RoomInfo) -> QuantumBoardState {
    // 解析 board 字段
    let board_data = &room_info.board;
    let mut board1 = HashMap::new();
    let mut board2 = HashMap::new();

    println!("Converting room_info to quantum board state...");
    println!("Raw board data: {:?}", board_data);

    if let Some(board_obj) = board_data.as_object() {
        println!("Board is an object with {} entries", board_obj.len());
        for (_pos, chessman_data) in board_obj {
            if let Some(chessman) = chessman_data.as_object() {
                // 兼容 color / type 两种字段名
                let position_opt = chessman.get("position").and_then(|v| v.as_str());
                let color_opt = chessman
                    .get("color")
                    .and_then(|v| v.as_str())
                    .or_else(|| chessman.get("type").and_then(|v| v.as_str()));
                let brother_opt = chessman.get("brother").and_then(|v| v.as_str());

                if let (Some(position), Some(color), Some(brother)) = (position_opt, color_opt, brother_opt) {
                    let chessman1 = Chessman {
                        position: position.to_string(),
                        color: color.to_string(),
                        brother: brother.to_string(),
                    };
                    let chessman2 = Chessman {
                        position: brother.to_string(),
                        color: color.to_string(),
                        brother: position.to_string(),
                    };
                    board1.insert(position.to_string(), chessman1);
                    board2.insert(brother.to_string(), chessman2);
                }
            }
        }
    }

    println!("Final board1: {:?}", board1);
    println!("Final board2: {:?}", board2);

    // 与"AI 执白"的规则对齐：
    // 优先使用存储的 phase 字段，如果没有则通过 moves % 2 推导
    let quantum_phase = if let Some(phase_str) = &room_info.phase {
        // 从存储的字符串解析量子阶段
        match phase_str.as_str() {
            "BlackQuantum" => QuantumPhase::BlackQuantum,
            "WhiteQuantum" => QuantumPhase::WhiteQuantum,
            "Entanglement" => QuantumPhase::Entanglement,
            _ => {
                // 如果存储的phase无效，回退到moves%2推导
                if room_info.moves % 2 == 0 {
                    QuantumPhase::BlackQuantum
                } else {
                    QuantumPhase::WhiteQuantum
                }
            }
        }
    } else {
        // 没有存储的phase，使用moves%2推导
        if room_info.moves % 2 == 0 {
            QuantumPhase::BlackQuantum
        } else {
            QuantumPhase::WhiteQuantum
        }
    };

    // 添加调试信息
    println!("Quantum phase calculation: stored_phase={:?}, moves={}, moves%2={}, final_phase={:?}", 
             room_info.phase, room_info.moves, room_info.moves % 2, quantum_phase);
    
    // 添加更详细的调试信息
    println!("Quantum phase details: room_info.phase={:?}, room_info.moves={}, room_info.round={}", 
             room_info.phase, room_info.moves, room_info.round);

    // 当前轮到谁：与 phase 对齐
    let current_player = match quantum_phase {
        QuantumPhase::BlackQuantum => "black".to_string(),
        QuantumPhase::WhiteQuantum => "white".to_string(),
        QuantumPhase::Entanglement => room_info.round.clone(), // 如果从外部载入就尊重原值
    };

    println!("Current player determined: {:?}", current_player);

    QuantumBoardState {
        board1,
        board2,
        current_player,
        quantum_phase,
        model: normalize_model(room_info.model),
    }
}

/// 从传递的棋盘状态创建 QuantumBoardState
pub fn create_quantum_state_from_board_state(
    board_state: &serde_json::Value,
    room_info: &RoomInfo,
) -> QuantumBoardState {
    let mut board1 = HashMap::new();
    let mut board2 = HashMap::new();

    println!("Creating quantum state from provided board state: {:?}", board_state);

    if let Some(board_state_obj) = board_state.as_object() {
        // 解析 board1
        if let Some(board1_data) = board_state_obj.get("board1") {
            if let Some(board1_obj) = board1_data.as_object() {
                for (pos, chessman_data) in board1_obj {
                    if let Some(chessman) = chessman_data.as_object() {
                        let position = pos.clone();
                        let color = chessman
                            .get("type")
                            .and_then(|v| v.as_str())
                            .unwrap_or("black")
                            .to_string();
                        let brother = chessman
                            .get("brother")
                            .and_then(|v| v.as_str())
                            .unwrap_or(pos)
                            .to_string();

                        let chessman = Chessman {
                            position: position.clone(),
                            color: color.clone(),
                            brother: brother.clone(),
                        };
                        board1.insert(position, chessman);
                    }
                }
            }
        }

        // 解析 board2
        if let Some(board2_data) = board_state_obj.get("board2") {
            if let Some(board2_obj) = board2_data.as_object() {
                for (pos, chessman_data) in board2_obj {
                    if let Some(chessman) = chessman_data.as_object() {
                        let position = pos.clone();
                        let color = chessman
                            .get("type")
                            .and_then(|v| v.as_str())
                            .unwrap_or("black")
                            .to_string();
                        let brother = chessman
                            .get("brother")
                            .and_then(|v| v.as_str())
                            .unwrap_or(pos)
                            .to_string();

                        let chessman = Chessman {
                            position: position.clone(),
                            color: color.clone(),
                            brother: brother.clone(),
                        };
                        board2.insert(position, chessman);
                    }
                }
            }
        }

        // 获取其他状态信息
        let sub_status = board_state_obj
            .get("subStatus")
            .and_then(|v| v.as_str())
            .unwrap_or("black");
        
        let moves = board_state_obj
            .get("moves")
            .and_then(|v| v.as_i64())
            .unwrap_or(0) as i32;

        println!("Parsed board state - board1: {:?}, board2: {:?}, subStatus: {}, moves: {}", 
                 board1, board2, sub_status, moves);

        // 根据subStatus和moves确定量子阶段
        let quantum_phase = match sub_status {
            "black" => QuantumPhase::BlackQuantum,
            "white" => QuantumPhase::WhiteQuantum,
            "common" => QuantumPhase::Entanglement,
            _ => {
                if moves % 2 == 0 {
                    QuantumPhase::BlackQuantum
                } else {
                    QuantumPhase::WhiteQuantum
                }
            }
        };

        let current_player = match quantum_phase {
            QuantumPhase::BlackQuantum => "black".to_string(),
            QuantumPhase::WhiteQuantum => "white".to_string(),
            QuantumPhase::Entanglement => "black".to_string(), // 纠缠阶段后轮到黑方
        };

        QuantumBoardState {
            board1,
            board2,
            current_player,
            quantum_phase,
            model: normalize_model(room_info.model),
        }
    } else {
        // 如果无法解析，回退到数据库状态
        println!("Failed to parse board state, falling back to database state");
        room_info_to_quantum_board_state(room_info)
    }
}

/// 仅允许 9/13/19，非法值回退为 19
fn normalize_model(model: i32) -> i32 {
    match model {
        9 | 13 | 19 => model,
        _ => 19,
    }
}

/// AI 对战房间
pub struct AIRoom {
    pub room_id: Uuid,
    pub ai_player: SimpleQuantumAI,
    pub human_player_id: Uuid,
    pub game_state: QuantumBoardState,
}

impl AIRoom {
    /// 旧构造：默认 19x19
    pub fn new(room_id: Uuid, human_player_id: Uuid, difficulty: AIDifficulty) -> Self {
        Self::new_with_model(room_id, human_player_id, difficulty, 19)
    }

    /// 新构造：可选 9/13/19
    pub fn new_with_model(
        room_id: Uuid,
        human_player_id: Uuid,
        difficulty: AIDifficulty,
        model: i32,
    ) -> Self {
        let model = normalize_model(model);
        Self {
            room_id,
            ai_player: SimpleQuantumAI::new(difficulty),
            human_player_id,
            game_state: QuantumBoardState {
                board1: HashMap::new(),
                board2: HashMap::new(),
                current_player: "black".to_string(), // 开局黑方先手（玩家）
                quantum_phase: QuantumPhase::BlackQuantum,
                model,
            },
        }
    }

    /// 让 AI 行动（只在 WhiteQuantum 或 Entanglement 有意义）
    pub fn make_ai_move(&mut self) -> Result<AIMove, Box<dyn Error + Send + Sync>> {
        let ai_move = self.ai_player.get_next_move(&self.game_state)?;

        // 只有当坐标为合法点，且颜色为 "white"/"black" 时才写盘
        let is_real_move = (ai_move.color == "white" || ai_move.color == "black")
            && ai_move.position.contains(',');

        if is_real_move {
            self.apply_ai_move(&ai_move);
        }
        // 无论是否写盘，都推进阶段（纠缠阶段也要推进回黑方）
        self.update_quantum_phase();

        Ok(ai_move)
    }

    /// 应用 AI 落子（确保两个棋盘完全同步）
    fn apply_ai_move(&mut self, ai_move: &AIMove) {
        // 创建两个完全相同的棋子，确保两个棋盘同步
        let chessman1 = Chessman {
            position: ai_move.position.clone(),
            color: ai_move.color.clone(),
            brother: ai_move.position.clone(), // AI落子时，brother设置为自身位置
        };
        
        let chessman2 = Chessman {
            position: ai_move.position.clone(),
            color: ai_move.color.clone(),
            brother: ai_move.position.clone(), // AI落子时，brother设置为自身位置
        };

        // 在两个棋盘的相同位置插入相同的棋子，确保完全同步
        self.game_state
            .board1
            .insert(ai_move.position.clone(), chessman1);
        self.game_state
            .board2
            .insert(ai_move.position.clone(), chessman2);
            
        println!("AI move applied: position={}, color={}, both boards synchronized", 
                 ai_move.position, ai_move.color);
    }

    /// 推进量子阶段（黑方 → 白方 → 纠缠 → 黑方）
    fn update_quantum_phase(&mut self) {
        let old_phase = self.game_state.quantum_phase.clone();
        let old_player = self.game_state.current_player.clone();
        
        self.game_state.quantum_phase = match self.game_state.quantum_phase {
            QuantumPhase::BlackQuantum => {
                self.game_state.current_player = "white".to_string();
                QuantumPhase::WhiteQuantum
            }
            QuantumPhase::WhiteQuantum => {
                // 白方下完进入纠缠阶段
                self.game_state.current_player = "white".to_string();
                QuantumPhase::Entanglement
            }
            QuantumPhase::Entanglement => {
                // 纠缠阶段完毕，轮到黑方
                self.game_state.current_player = "black".to_string();
                QuantumPhase::BlackQuantum
            }
        };
        
        println!("AIRoom: Quantum phase updated: {:?} -> {:?}, player: {} -> {}", 
                 old_phase, self.game_state.quantum_phase, old_player, self.game_state.current_player);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;

    #[test]
    fn test_ai_creation() {
        let ai = SimpleQuantumAI::new(AIDifficulty::Intermediate);
        // 校验置信度而不是枚举底层数字
        assert!((ai.get_confidence_for_difficulty() - 0.5).abs() < 1e-9);
    }

    #[test]
    fn test_quantum_board_state_creation() {
        let state = QuantumBoardState {
            board1: HashMap::new(),
            board2: HashMap::new(),
            current_player: "black".to_string(),
            quantum_phase: QuantumPhase::BlackQuantum,
            model: 9,
        };
        assert_eq!(state.current_player, "black");
        assert_eq!(state.model, 9);
        assert_eq!(state.board1.len(), 0);
        assert_eq!(state.board2.len(), 0);
    }

    #[test]
    fn test_ai_get_next_move_waits_on_black_phase() {
        let ai = SimpleQuantumAI::new(AIDifficulty::Beginner);
        let state = QuantumBoardState {
            board1: HashMap::new(),
            board2: HashMap::new(),
            current_player: "black".to_string(),
            quantum_phase: QuantumPhase::BlackQuantum,
            model: 9,
        };

        let result = ai.get_next_move(&state).unwrap();
        assert_eq!(result.color, "waiting");
        assert_eq!(result.position, "waiting");
        assert_eq!(result.confidence, 0.0);
    }

    #[test]
    fn test_ai_get_next_move_white_phase_returns_white_move() {
        let ai = SimpleQuantumAI::new(AIDifficulty::Beginner);
        let state = QuantumBoardState {
            board1: HashMap::new(),
            board2: HashMap::new(),
            current_player: "white".to_string(),
            quantum_phase: QuantumPhase::WhiteQuantum,
            model: 9,
        };

        let mv = ai.get_next_move(&state).unwrap();
        assert_eq!(mv.color, "white");
        assert!(mv.position.contains(',')); // 如 "3,3"
        assert_eq!(mv.confidence, 0.3);
    }

    #[test]
    fn test_entanglement_phase_no_move() {
        let ai = SimpleQuantumAI::new(AIDifficulty::Advanced);
        let state = QuantumBoardState {
            board1: HashMap::new(),
            board2: HashMap::new(),
            current_player: "white".to_string(),
            quantum_phase: QuantumPhase::Entanglement,
            model: 13,
        };

        let mv = ai.get_next_move(&state).unwrap();
        assert_eq!(mv.color, "none");
        assert_eq!(mv.position, "none");
        assert!((mv.confidence - 0.7).abs() < 1e-9);
    }

    #[test]
    fn test_airoom_model_sizes() {
        let room_id = Uuid::new_v4();
        let human = Uuid::new_v4();

        let r9 = AIRoom::new_with_model(room_id, human, AIDifficulty::Beginner, 9);
        assert_eq!(r9.game_state.model, 9);

        let r13 = AIRoom::new_with_model(room_id, human, AIDifficulty::Beginner, 13);
        assert_eq!(r13.game_state.model, 13);

        let r19 = AIRoom::new_with_model(room_id, human, AIDifficulty::Beginner, 19);
        assert_eq!(r19.game_state.model, 19);

        let r_bad = AIRoom::new_with_model(room_id, human, AIDifficulty::Beginner, 7);
        assert_eq!(r_bad.game_state.model, 19); // 回退
    }

    #[test]
    fn test_phase_cycle() {
        let room_id = Uuid::new_v4();
        let human = Uuid::new_v4();
        let mut room = AIRoom::new_with_model(room_id, human, AIDifficulty::Beginner, 9);

        // 初始黑方阶段
        assert_eq!(room.game_state.quantum_phase, QuantumPhase::BlackQuantum);

        // 黑方阶段：AI 等待但仍推进到白方阶段
        let mv1 = room.make_ai_move().unwrap();
        assert_eq!(mv1.color, "waiting");
        assert_eq!(room.game_state.quantum_phase, QuantumPhase::WhiteQuantum);

        // 白方阶段：AI 落子并进入纠缠
        let mv2 = room.make_ai_move().unwrap();
        assert_eq!(mv2.color, "white");
        assert_eq!(room.game_state.quantum_phase, QuantumPhase::Entanglement);

        // 纠缠阶段：AI 不落子，进入黑方
        let mv3 = room.make_ai_move().unwrap();
        assert_eq!(mv3.color, "none");
        assert_eq!(room.game_state.quantum_phase, QuantumPhase::BlackQuantum);
    }

    #[test]
    fn test_quantum_phase_enum_ser_de() {
        let black = QuantumPhase::BlackQuantum;
        let white = QuantumPhase::WhiteQuantum;
        let ent = QuantumPhase::Entanglement;

        let jb = serde_json::to_string(&black).unwrap();
        let jw = serde_json::to_string(&white).unwrap();
        let je = serde_json::to_string(&ent).unwrap();

        assert_eq!(jb, "\"BlackQuantum\"");
        assert_eq!(jw, "\"WhiteQuantum\"");
        assert_eq!(je, "\"Entanglement\"");
    }
}
