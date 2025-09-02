# 围棋游戏云服务部署指南

## 概述

本指南将帮助您将围棋游戏部署到免费的云服务平台上，无需服务器访问权限。

## 部署架构

```
云服务平台
├── 前端 (Vue.js) → Vercel/Netlify
├── 后端 (Rust API) → Railway/Render
└── 数据库 (PostgreSQL) → Railway/Supabase
```

## 方案一：Vercel + Railway（推荐）

### 前端部署到Vercel

1. **准备前端项目**
   ```bash
   cd frontend/quantum-go-web-master
   npm install
   npm run build
   ```

2. **部署到Vercel**
   - 访问 [vercel.com](https://vercel.com)
   - 使用GitHub账号登录
   - 点击"New Project"
   - 导入您的项目仓库
   - 选择"Vue.js"框架
   - 点击"Deploy"

3. **配置环境变量**
   - 在Vercel项目设置中添加：
     - `VITE_API_URL`: 后端API地址

### 后端部署到Railway

1. **准备后端项目**
   ```bash
   cd backend/quantum-go-api-main
   ```

2. **创建Railway项目**
   - 访问 [railway.app](https://railway.app)
   - 使用GitHub账号登录
   - 点击"New Project"
   - 选择"Deploy from GitHub repo"
   - 选择您的项目仓库

3. **配置环境变量**
   - 在Railway项目设置中添加：
     - `DATABASE_URL`: PostgreSQL连接字符串
     - `RUST_LOG`: info
     - `HOST`: 0.0.0.0
     - `PORT`: 3000

4. **添加PostgreSQL数据库**
   - 在Railway项目中点击"New"
   - 选择"Database" → "PostgreSQL"
   - 自动生成数据库连接信息

## 方案二：Netlify + Render

### 前端部署到Netlify

1. **准备构建文件**
   ```bash
   cd frontend/quantum-go-web-master
   npm run build
   ```

2. **部署到Netlify**
   - 访问 [netlify.com](https://netlify.com)
   - 使用GitHub账号登录
   - 拖拽`dist`文件夹到部署区域
   - 或连接GitHub仓库自动部署

### 后端部署到Render

1. **准备Dockerfile**
   ```dockerfile
   FROM rust:1.70 as builder
   WORKDIR /app
   COPY . .
   RUN cargo build --release

   FROM debian:bookworm-slim
   RUN apt-get update && apt-get install -y ca-certificates
   COPY --from=builder /app/target/release/quantum-go-api /usr/local/bin/
   EXPOSE 3000
   CMD ["quantum-go-api"]
   ```

2. **部署到Render**
   - 访问 [render.com](https://render.com)
   - 使用GitHub账号登录
   - 点击"New" → "Web Service"
   - 连接GitHub仓库
   - 选择"Docker"环境

## 方案三：全栈部署到Railway

### 使用Docker Compose

1. **创建railway.toml配置**
   ```toml
   [build]
   builder = "dockerfile"
   dockerfilePath = "Dockerfile"

   [deploy]
   startCommand = "docker-compose up"
   healthcheckPath = "/"
   healthcheckTimeout = 300
   restartPolicyType = "always"
   ```

2. **创建Dockerfile**
   ```dockerfile
   FROM node:18-alpine as frontend-builder
   WORKDIR /app/frontend
   COPY frontend/package*.json ./
   RUN npm install
   COPY frontend/ .
   RUN npm run build

   FROM rust:1.70 as backend-builder
   WORKDIR /app/backend
   COPY backend/Cargo.toml backend/Cargo.lock ./
   COPY backend/src ./src
   RUN cargo build --release

   FROM node:18-alpine
   WORKDIR /app
   COPY --from=frontend-builder /app/frontend/dist ./frontend/dist
   COPY --from=backend-builder /app/backend/target/release/quantum-go-api ./backend/quantum-go-api
   EXPOSE 3000
   CMD ["./backend/quantum-go-api"]
   ```

## 数据库配置

### 使用Railway PostgreSQL

1. **创建数据库**
   - 在Railway项目中添加PostgreSQL服务
   - 获取连接字符串

2. **初始化数据库**
   ```sql
   -- 创建用户表
   CREATE TABLE users (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       username VARCHAR(50) UNIQUE NOT NULL,
       email VARCHAR(100) UNIQUE NOT NULL,
       password_hash VARCHAR(255) NOT NULL,
       rating INTEGER DEFAULT 1200,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   -- 创建游戏表
   CREATE TABLE games (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       player1_id UUID REFERENCES users(id),
       player2_id UUID REFERENCES users(id),
       status VARCHAR(20) DEFAULT 'waiting',
       board_state TEXT,
       current_player INTEGER DEFAULT 1,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

### 使用Supabase（免费）

1. **创建Supabase项目**
   - 访问 [supabase.com](https://supabase.com)
   - 创建新项目
   - 获取数据库连接信息

2. **配置连接**
   - 在Railway/Render中添加环境变量：
     - `DATABASE_URL`: Supabase连接字符串

## 域名配置

### 自定义域名

1. **Vercel域名**
   - 在Vercel项目设置中添加自定义域名
   - 配置DNS记录指向Vercel

2. **Railway域名**
   - Railway自动提供`.railway.app`域名
   - 可配置自定义域名

3. **更新WordPress插件设置**
   - 在WordPress后台更新游戏URL
   - 使用新的部署地址

## 部署检查清单

### 前端检查
- [ ] 构建成功
- [ ] 环境变量配置正确
- [ ] API地址指向后端
- [ ] 静态资源加载正常

### 后端检查
- [ ] 编译成功
- [ ] 数据库连接正常
- [ ] API接口响应
- [ ] WebSocket连接正常

### 数据库检查
- [ ] 连接字符串正确
- [ ] 表结构创建成功
- [ ] 测试数据插入成功

## 监控和维护

### 日志查看
- **Vercel**: 项目仪表板 → Functions → Logs
- **Railway**: 项目仪表板 → Deployments → Logs
- **Render**: 服务仪表板 → Logs

### 性能监控
- 使用各平台提供的监控工具
- 设置告警通知
- 定期检查资源使用情况

## 成本估算

### 免费额度
- **Vercel**: 100GB带宽/月，无限制部署
- **Railway**: $5免费额度/月
- **Render**: 750小时免费/月
- **Netlify**: 100GB带宽/月

### 预估成本
- 小规模使用：**完全免费**
- 中等规模：**$5-10/月**
- 大规模使用：**$20-50/月**

## 故障排除

### 常见问题

1. **构建失败**
   - 检查依赖版本
   - 查看构建日志
   - 确认环境变量

2. **数据库连接失败**
   - 检查连接字符串
   - 确认数据库服务状态
   - 验证网络连接

3. **API调用失败**
   - 检查CORS配置
   - 确认API地址
   - 查看网络请求

## 下一步

部署完成后：
1. 测试所有功能
2. 更新WordPress插件设置
3. 配置自定义域名
4. 设置监控告警

您的围棋游戏就可以通过WordPress网站访问了！
