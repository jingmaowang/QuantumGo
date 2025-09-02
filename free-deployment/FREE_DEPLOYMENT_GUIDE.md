# Vercel + Supabase + WordPress 完全免费部署指南

## 概述

本指南将帮助您使用 **Vercel + Supabase + WordPress 插件** 完全免费部署围棋游戏，无需任何费用。这是专为 DeepBrainTech 官网设计的完整解决方案。

## 免费服务对比

| 服务 | 免费额度 | 限制 |
|------|----------|------|
| **Vercel** | 100GB带宽/月 | 无限制部署 |
| **Netlify** | 100GB带宽/月 | 无限制构建 |
| **Supabase** | 500MB数据库 | 50,000行数据 |
| **GitHub Pages** | 1GB存储 | 静态网站 |

## 完整部署流程

### 第一步：创建Supabase数据库（免费）

1. **注册Supabase账号**
   - 访问 [supabase.com](https://supabase.com)
   - 使用GitHub账号注册
   - 创建新项目，项目名称：`quantum-go-game`

2. **配置数据库**
   - 在项目仪表板中，点击左侧菜单的"SQL Editor"
   - 点击"New query"
   - 复制 `free-deployment/supabase-setup.sql` 中的完整脚本
   - 粘贴到编辑器中，点击"Run"执行
   - 等待执行完成，确认所有表创建成功

3. **获取API密钥**
   - 在项目仪表板中，点击左侧菜单的"Settings" → "API"
   - 复制以下信息：
     - **Project URL**：例如 `https://your-project.supabase.co`
     - **anon public** 密钥：以 `eyJ` 开头的长字符串

### 第二步：部署到Vercel（免费）

1. **准备项目文件**
   ```bash
   # 在项目根目录复制配置文件
   cp free-deployment/vercel.json ./
   ```

2. **部署到Vercel**
   - 访问 [vercel.com](https://vercel.com)
   - 使用GitHub账号登录
   - 点击"New Project"
   - 选择"Import Git Repository"
   - 选择您的围棋游戏项目仓库
   - 点击"Import"

3. **配置构建设置**
   - **Framework Preset**: 选择 "Vite"
   - **Root Directory**: 选择 `frontend/quantum-go-web-master`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. **配置环境变量**
   - 在项目设置中找到"Environment Variables"
   - 添加以下变量：
     - `VITE_SUPABASE_URL`: 您的 Supabase Project URL
     - `VITE_SUPABASE_ANON_KEY`: 您的 Supabase anon public 密钥

5. **部署**
   - 点击"Deploy"
   - 等待构建完成（通常需要 2-5 分钟）
   - 获得免费的 `.vercel.app` 域名

### 第三步：安装WordPress插件

1. **准备插件文件**
   - 将 `wordpress-plugin` 文件夹压缩为 ZIP 文件
   - 文件名：`quantum-go-integration.zip`

2. **安装插件**
   - 进入 WordPress 后台
   - 点击"插件" → "安装插件"
   - 点击"上传插件"
   - 选择 `quantum-go-integration.zip` 文件
   - 点击"现在安装"
   - 安装完成后点击"启用插件"

3. **配置插件设置**
   - 进入"设置" → "围棋游戏"
   - 在"游戏URL"字段中输入您的 Vercel 部署地址
   - 自定义按钮文字（默认：开始游戏）
   - 选择按钮位置（默认：右下角）
   - 选择是否启用浮动按钮
   - 点击"保存更改"

### 第四步：测试集成效果

1. **测试游戏链接**
   - 访问您的官网 [deepbraintechnology.com](https://deepbraintechnology.com/)
   - 找到 "CogniGo™ (Quantum Go)" 部分
   - 点击 "Learn more" 按钮
   - 确认能正确跳转到游戏

2. **测试浮动按钮**
   - 在网站任意页面查看右下角
   - 确认浮动按钮显示正常
   - 点击按钮测试跳转功能

3. **测试移动端**
   - 使用手机访问网站
   - 确认按钮在移动端显示正常
   - 测试点击功能

## 方案二：Netlify + Supabase（备选）

### 第一步：部署到Netlify（免费）

1. **准备项目文件**
   ```bash
   # 在项目根目录创建 netlify.toml 配置文件
   cp free-deployment/netlify.toml ./
   ```

2. **部署到Netlify**
   - 访问 [netlify.com](https://netlify.com)
   - 使用GitHub账号登录
   - 点击"New site from Git"
   - 选择您的项目仓库

3. **配置构建设置**
   - 构建命令：`cd frontend/quantum-go-web-master && npm install && npm run build`
   - 发布目录：`frontend/quantum-go-web-master/dist`

4. **配置环境变量**
   - 在Netlify项目设置中添加：
     - `DATABASE_URL`: Supabase连接字符串
     - `SUPABASE_URL`: Supabase项目URL
     - `SUPABASE_ANON_KEY`: Supabase匿名密钥

### 第二步：配置后端函数

1. **创建Netlify函数**
   ```bash
   mkdir -p netlify/functions
   ```

2. **创建API函数**
   - 将Rust后端逻辑转换为JavaScript函数
   - 或使用Netlify的Rust运行时

## 方案三：GitHub Pages（仅前端）

### 部署静态前端

1. **准备构建文件**
   ```bash
   cd frontend/quantum-go-web-master
   npm install
   npm run build
   ```

2. **推送到GitHub**
   ```bash
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin main
   ```

3. **启用GitHub Pages**
   - 在GitHub仓库设置中找到"Pages"
   - 选择"Deploy from a branch"
   - 选择"main"分支和"/ (root)"文件夹

## 成本分析

### 完全免费的条件
- **小规模使用**：< 1000用户/月
- **数据量**：< 500MB数据库
- **带宽**：< 100GB/月

### 预估使用量
- **个人项目**：完全免费
- **小型团队**：完全免费
- **中型项目**：可能需要升级

## 部署检查清单

### 前端检查
- [ ] 构建成功
- [ ] 静态资源加载正常
- [ ] 响应式设计正常

### 后端检查
- [ ] API接口响应
- [ ] 数据库连接正常
- [ ] 环境变量配置正确

### 数据库检查
- [ ] 表结构创建成功
- [ ] 测试数据插入成功
- [ ] 权限设置正确

## 监控和维护

### 免费监控工具
- **Vercel Analytics**：免费的基础分析
- **Netlify Analytics**：免费的访问统计
- **Supabase Dashboard**：免费的数据库监控

### 性能优化
- 使用CDN加速
- 启用Gzip压缩
- 优化图片资源
- 使用缓存策略

## 故障排除

### 常见问题

1. **构建失败**
   - 检查依赖版本
   - 查看构建日志
   - 确认环境变量

2. **数据库连接失败**
   - 检查连接字符串
   - 确认Supabase项目状态
   - 验证API密钥

3. **部署失败**
   - 检查配置文件
   - 确认文件路径
   - 查看错误日志

## 下一步

部署完成后：
1. 测试所有功能
2. 更新WordPress插件设置
3. 配置自定义域名（可选）
4. 设置监控告警

## 总结

使用这个方案，您可以：
- ✅ **完全免费**部署围棋游戏
- ✅ **无需服务器**管理
- ✅ **自动扩展**和备份
- ✅ **全球CDN**加速
- ✅ **SSL证书**自动配置

您的围棋游戏就可以通过WordPress网站免费访问了！
