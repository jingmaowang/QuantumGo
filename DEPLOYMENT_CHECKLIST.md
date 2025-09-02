# 部署检查清单

## 部署前准备

### ✅ 项目文件检查
- [ ] 确认项目结构完整
- [ ] 检查 `frontend/quantum-go-web-master` 文件夹存在
- [ ] 确认 `package.json` 文件存在
- [ ] 检查 `vite.config.ts` 配置正确

### ✅ 配置文件准备
- [ ] 复制 `free-deployment/vercel.json` 到项目根目录
- [ ] 确认 `supabase-setup.sql` 脚本完整
- [ ] 准备 `wordpress-plugin` 文件夹

## 第一步：Supabase 数据库设置

### ✅ 账号注册
- [ ] 访问 [supabase.com](https://supabase.com)
- [ ] 使用 GitHub 账号注册
- [ ] 创建新项目：`quantum-go-game`
- [ ] 选择区域：Asia Pacific (Singapore)

### ✅ 数据库配置
- [ ] 进入 SQL Editor
- [ ] 创建新查询
- [ ] 复制并执行 `supabase-setup.sql` 脚本
- [ ] 确认所有表创建成功：
  - [ ] users 表
  - [ ] games 表
  - [ ] game_moves 表
  - [ ] leaderboard 表

### ✅ API 密钥获取
- [ ] 进入 Settings → API
- [ ] 复制 Project URL
- [ ] 复制 anon public 密钥
- [ ] 保存到安全位置

## 第二步：Vercel 部署

### ✅ 账号注册
- [ ] 访问 [vercel.com](https://vercel.com)
- [ ] 使用 GitHub 账号登录
- [ ] 授权 Vercel 访问仓库

### ✅ 项目导入
- [ ] 点击 "New Project"
- [ ] 选择 "Import Git Repository"
- [ ] 选择围棋游戏项目仓库
- [ ] 点击 "Import"

### ✅ 构建设置
- [ ] Framework Preset: Vite
- [ ] Root Directory: `frontend/quantum-go-web-master`
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `dist`
- [ ] Install Command: `npm install`

### ✅ 环境变量配置
- [ ] 添加 `VITE_SUPABASE_URL`
- [ ] 添加 `VITE_SUPABASE_ANON_KEY`
- [ ] 确认变量值正确

### ✅ 部署执行
- [ ] 点击 "Deploy"
- [ ] 等待构建完成
- [ ] 确认部署成功
- [ ] 获取部署 URL

## 第三步：WordPress 插件安装

### ✅ 插件文件准备
- [ ] 压缩 `wordpress-plugin` 文件夹
- [ ] 文件名：`quantum-go-integration.zip`
- [ ] 确认文件大小合理

### ✅ 插件安装
- [ ] 进入 WordPress 后台
- [ ] 插件 → 安装插件
- [ ] 上传插件 ZIP 文件
- [ ] 安装并启用插件

### ✅ 插件配置
- [ ] 进入设置 → 围棋游戏
- [ ] 输入 Vercel 部署 URL
- [ ] 设置按钮文字
- [ ] 选择按钮位置
- [ ] 启用浮动按钮
- [ ] 保存设置

## 第四步：功能测试

### ✅ 游戏链接测试
- [ ] 访问官网首页
- [ ] 找到 CogniGo™ 部分
- [ ] 点击 "Learn more" 按钮
- [ ] 确认跳转到游戏页面
- [ ] 测试游戏功能

### ✅ 浮动按钮测试
- [ ] 检查右下角浮动按钮
- [ ] 点击按钮测试跳转
- [ ] 确认按钮样式正常
- [ ] 测试悬停效果

### ✅ 移动端测试
- [ ] 使用手机访问网站
- [ ] 测试按钮显示
- [ ] 测试点击功能
- [ ] 确认响应式设计

### ✅ 数据库测试
- [ ] 注册新用户
- [ ] 创建游戏房间
- [ ] 下棋测试
- [ ] 查看游戏记录

## 第五步：性能优化

### ✅ 加载速度测试
- [ ] 测试页面加载时间
- [ ] 检查资源加载
- [ ] 优化图片大小
- [ ] 启用压缩

### ✅ 用户体验测试
- [ ] 测试按钮响应速度
- [ ] 检查错误处理
- [ ] 测试网络异常情况
- [ ] 确认用户反馈

## 第六步：监控和维护

### ✅ 监控设置
- [ ] 设置 Vercel 监控
- [ ] 配置 Supabase 监控
- [ ] 设置错误告警
- [ ] 监控使用量

### ✅ 备份策略
- [ ] 确认数据库自动备份
- [ ] 备份代码仓库
- [ ] 记录配置信息
- [ ] 制定恢复计划

## 常见问题检查

### ✅ 部署问题
- [ ] 检查构建日志
- [ ] 确认环境变量
- [ ] 验证文件路径
- [ ] 检查依赖版本

### ✅ 功能问题
- [ ] 检查数据库连接
- [ ] 验证 API 密钥
- [ ] 测试网络连接
- [ ] 确认权限设置

### ✅ 性能问题
- [ ] 检查资源使用
- [ ] 监控响应时间
- [ ] 优化查询性能
- [ ] 调整缓存策略

## 完成确认

### ✅ 最终检查
- [ ] 所有功能正常工作
- [ ] 用户体验良好
- [ ] 性能满足要求
- [ ] 监控告警正常
- [ ] 文档完整

### ✅ 交付清单
- [ ] 部署地址
- [ ] 管理账号信息
- [ ] 配置文档
- [ ] 使用说明
- [ ] 联系方式

---

**部署完成后，您的围棋游戏就可以通过 DeepBrainTech 官网访问了！**

如有任何问题，请参考部署指南或联系技术支持。
