# QuantumGo 排行榜系统

## 功能概述

QuantumGo 现在包含一个完整的玩家评分和排行榜系统，使用 Glicko2 评分算法为不同棋盘尺寸（9×9、13×13、19×19）分别计算排名。

## 主要特性

### 🏆 评分系统
- **Glicko2 算法**: 使用业界标准的 Glicko2 评分算法
- **分别排名**: 9×9、13×13、19×19 棋盘分别计算评分
- **实时更新**: 游戏结束后自动更新玩家评分
- **公平竞争**: 考虑评分偏差和波动性，确保评分准确性

### 📊 排行榜功能
- **实时排名**: 显示所有玩家的当前排名
- **详细统计**: 包含评分、RD值、游戏场次、胜率等
- **分类查看**: 可按棋盘尺寸筛选查看排名
- **美观界面**: 现代化的响应式设计，支持移动端

### 🎮 游戏集成
- **自动评分**: 游戏结束时自动计算并更新评分
- **胜负记录**: 记录每场游戏的胜负结果
- **历史追踪**: 保存玩家的游戏历史和评分变化

## 技术实现

### 后端架构
- **数据库**: PostgreSQL 存储用户评分数据
- **评分算法**: Glicko2 实现，支持并发更新
- **API 接口**: RESTful API 提供排行榜数据
- **WebSocket**: 实时游戏状态更新

### 前端实现
- **Vue 3**: 使用 Composition API 构建
- **响应式设计**: 支持桌面和移动设备
- **状态管理**: Vuex 管理应用状态
- **路由系统**: Vue Router 处理页面导航

## 数据库结构

### user_rankings 表
```sql
CREATE TABLE user_rankings (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    model INTEGER NOT NULL,           -- 棋盘尺寸 (9, 13, 19)
    rating DOUBLE PRECISION NOT NULL, -- Glicko2 评分
    rd DOUBLE PRECISION NOT NULL,     -- 评分偏差
    vol DOUBLE PRECISION NOT NULL,    -- 评分波动性
    games_played INTEGER NOT NULL,    -- 总游戏场次
    wins INTEGER NOT NULL,            -- 胜利场次
    losses INTEGER NOT NULL,          -- 失败场次
    draws INTEGER NOT NULL,           -- 平局场次
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, model)
);
```

## API 接口

### 获取排行榜
```
POST /getLeaderboard
Content-Type: application/json

{
    "model": 13,    // 棋盘尺寸: 9, 13, 19
    "limit": 50     // 返回记录数量 (可选，默认50)
}
```

### 响应格式
```json
[
    {
        "rank": 1,
        "username": "player1",
        "rating": 1850.5,
        "rd": 45.2,
        "games_played": 25,
        "wins": 18,
        "losses": 5,
        "draws": 2,
        "win_rate": 72.0
    }
]
```

## 使用方法

### 1. 启动后端服务
```bash
cd backend/quantum-go-api-main
cargo run
```

### 2. 启动前端服务
```bash
cd frontend/quantum-go-web-master
npm run dev
```

### 3. 访问排行榜
- 在导航栏点击 "Leaderboard" 或 "排行榜"
- 选择棋盘尺寸查看对应排名
- 查看自己的排名和统计信息

### 4. 游戏评分
- 正常进行游戏
- 游戏结束后系统自动计算评分
- 评分会在排行榜中实时更新

## 评分算法说明

### Glicko2 参数
- **初始评分**: 1500
- **初始 RD**: 350
- **初始波动性**: 0.06
- **系统参数 τ**: 0.5

### 评分计算
1. **游戏结果**: 胜利(1.0)、失败(0.0)、平局(0.5)
2. **评分更新**: 根据对手评分和结果计算新评分
3. **RD 更新**: 评分偏差随时间衰减
4. **波动性**: 反映评分变化的不确定性

## 配置说明

### 环境变量
```bash
DATABASE_URL=postgres://username:password@localhost:5432/quantum_go
```

### 数据库配置
- 确保 PostgreSQL 服务运行
- 创建数据库 `quantum_go`
- 系统会自动创建必要的表结构

## 扩展功能

### 未来计划
- [ ] 玩家个人资料页面
- [ ] 评分历史图表
- [ ] 赛季排行榜
- [ ] 成就系统
- [ ] 好友排行榜

### 自定义配置
- 修改 `src/rating.rs` 中的 Glicko2 参数
- 调整数据库连接池大小
- 自定义排行榜显示字段

## 故障排除

### 常见问题
1. **评分不更新**: 检查游戏是否正确结束
2. **排行榜为空**: 确认有玩家完成过游戏
3. **数据库连接失败**: 检查 PostgreSQL 服务状态

### 日志查看
```bash
# 后端日志
cargo run 2>&1 | tee server.log

# 数据库查询
psql -d quantum_go -c "SELECT * FROM user_rankings LIMIT 5;"
```

## 贡献指南

欢迎提交 Issue 和 Pull Request 来改进排行榜系统！

### 开发环境
- Rust 1.70+
- Node.js 16+
- PostgreSQL 12+
- Vue 3.3+

### 代码规范
- 遵循 Rust 和 Vue 官方代码规范
- 添加适当的注释和文档
- 编写单元测试
- 确保代码通过编译检查

---

**QuantumGo 排行榜系统** - 让每一局游戏都有意义！
