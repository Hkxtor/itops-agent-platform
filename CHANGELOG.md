# Changelog

所有重要的项目变更都会记录在此文件中。

## [v6.0.0] - 2026-05-21

### 容器化与部署

- 新增 Dockerfile 多阶段构建，优化镜像体积和构建速度
- 新增后端 Dockerfile，使用 node:20-alpine 基础镜像，非 root 用户运行
- 新增前端 Dockerfile，使用 Nginx 提供静态文件服务
- 新增健康检查支持，后端使用 HTTP 健康检查端点
- 新增 OCI 元数据标签到镜像

### 一键部署

- 新增 `deploy.ps1` Windows 一键部署脚本
- 新增 `deploy.sh` Linux/Mac 一键部署脚本
- 支持自定义镜像仓库、命名空间、端口、版本
- 自动检测 Docker 环境、端口可用性、生成 JWT 密钥
- 自动生成 docker-compose.deploy.yml 部署配置

### 镜像仓库

- 新增 `docker-build-push.ps1` Windows 构建推送脚本
- 新增 `docker-build-push.sh` Linux/Mac 构建推送脚本
- 镜像推送到阿里云容器镜像仓库
- 后端镜像地址: `registry.cn-hangzhou.aliyuncs.com/huluwa666/tsq-images-hub:itops-backend-latest`
- 前端镜像地址: `registry.cn-hangzhou.aliyuncs.com/huluwa666/tsq-images-hub:itops-frontend-latest`

### CI/CD

- 新增 GitHub Actions 自动化构建和推送工作流
- 支持 push 到 main/master 分支自动触发构建
- 支持打 tag 自动构建并推送对应版本镜像

### 文档更新

- 新增 `DEPLOY.md` 快速部署指南
- 新增 `docker/README.md` 镜像仓库使用说明
- 更新 `README.md` 快速开始部分，新增一键脚本和阿里云镜像部署说明
- 更新 `docker-compose.yml` 支持本地构建模式
- 优化 `.dockerignore` 减少构建上下文大小

## [v5.3.0] - 2026-05-20

### 清理与优化

- 移除预设模拟服务器数据，服务器配置完全由用户手动添加
- 移除模拟告警生成功能，告警通过 Webhook 或 API 从真实监控系统接收
- 移除前端「模拟告警」按钮
- 简化 Agent 测试路由错误处理，移除冗余降级逻辑
- 清理项目冗余文件和临时调试文件
- 删除未使用的 assets/ 目录和重复资源

## [v5.2.0] - 2026-05-20

### 架构重构

- 移除所有模拟模式相关代码
- `mockExecutor.ts` 重命名为 `agentExecutor.ts`
- 移除降级响应生成逻辑，Agent 必须依赖真实 LLM 和 SSH 执行
- 未配置 API 密钥时抛出明确错误提示

## [v5.1.0] - 2026-05-20

### 修复和优化

- 修复 AI Copilot 路由认证问题，将 `/api/copilot` 移至认证中间件之前
- 增强工作流执行报告生成逻辑
- 优化 Dockerfile，配置国内镜像源加速依赖下载
- 添加 `start.ps1/start.sh`、`stop.ps1/stop.sh` 一键运维脚本
- 配置 npm 使用淘宝镜像源

## [v5.0.0] - 2026-05-19

### 新增功能

#### 工作流系统
- 拓扑排序算法优化，按照节点视觉位置排序（y 从上到下，x 从左到右）
- 执行顺序持久化到数据库
- 任务执行页面新增「节点结果」标签页

#### 报告系统
- 工作流执行自动生成 Markdown 格式报告
- 任务执行页面新增「相关报告」标签页
- 报告详情模态框

#### API 配置
- 修复登录 API 路径缺失 `/api` 前缀
- 模拟模式开关正常保存和读取

### UI 优化
- Logo 标题更新为「多Agent自动化平台」
- 优化 Markdown 渲染组件样式
- Agent 测试页面改为分区布局
- 修复关闭按钮显示问题

### 技术改进
- 健康检查使用 curl 替代 wget
- Dockerfile 安装 curl 用于健康检查
- 配置国内镜像源加速构建