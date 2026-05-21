# ITOps Agent Platform - Quick Deployment Guide

> 🚀 一键部署企业级 IT 运维 Agent 平台

## 镜像仓库地址

| 仓库 | 地址 |
|------|------|
| **后端镜像** | `registry.cn-hangzhou.aliyuncs.com/huluwa666/tsq-images-hub:itops-backend-latest` |
| **前端镜像** | `registry.cn-hangzhou.aliyuncs.com/huluwa666/tsq-images-hub:itops-frontend-latest` |

## 方式一：一键脚本部署（推荐）

### Windows

```powershell
# 使用默认配置部署（从阿里云拉取镜像）
.\deploy.ps1

# 自定义端口部署
.\deploy.ps1 -BackendPort 8000 -FrontendPort 9000

# 指定版本部署
.\deploy.ps1 -Version v1.0.0

# 使用自定义镜像仓库
.\deploy.ps1 -Registry your-registry.com -Namespace your-namespace/your-repo
```

### Linux/Mac

```bash
# 添加执行权限
chmod +x deploy.sh

# 使用默认配置部署（从阿里云拉取镜像）
./deploy.sh

# 自定义端口部署
./deploy.sh --backend-port 8000 --frontend-port 9000

# 指定版本部署
./deploy.sh --version v1.0.0

# 使用自定义镜像仓库
./deploy.sh --registry your-registry.com --namespace your-namespace/your-repo
```

## 方式二：Docker Compose 部署

### 1. 创建 docker-compose.yml

```yaml
version: '3.8'

services:
  backend:
    image: registry.cn-hangzhou.aliyuncs.com/huluwa666/tsq-images-hub:itops-backend-latest
    container_name: itops-backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=your-secret-key-change-in-production
      - DOUBAO_API_KEY=your-doubao-api-key
      - OPENAI_API_KEY=your-openai-api-key
    volumes:
      - itops-data:/app/data
    restart: unless-stopped

  frontend:
    image: registry.cn-hangzhou.aliyuncs.com/huluwa666/tsq-images-hub:itops-frontend-latest
    container_name: itops-frontend
    ports:
      - "8080:80"
    depends_on:
      backend:
        condition: service_healthy
    restart: unless-stopped

volumes:
  itops-data:
    driver: local
```

### 2. 创建 .env 文件

```env
# JWT 密钥（生产环境必须修改）
JWT_SECRET=your-secret-key-change-in-production

# LLM API 配置（至少配置一个）
# 豆包
DOUBAO_API_KEY=your-doubao-api-key
DOUBAO_API_BASE=https://ark.cn-beijing.volces.com/api/v3
DOUBAO_MODEL=doubao-4o

# OpenAI
OPENAI_API_KEY=your-openai-api-key
OPENAI_API_BASE=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o
```

### 3. 启动服务

```bash
docker-compose up -d
```

## 方式三：Docker Run 部署

```bash
# 创建数据卷
docker volume create itops-data

# 启动后端
docker run -d \
  --name itops-backend \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e JWT_SECRET=your-secret-key \
  -e DOUBAO_API_KEY=your-api-key \
  -v itops-data:/app/data \
  registry.cn-hangzhou.aliyuncs.com/huluwa666/tsq-images-hub:itops-backend-latest

# 启动前端
docker run -d \
  --name itops-frontend \
  -p 8080:80 \
  --link itops-backend \
  registry.cn-hangzhou.aliyuncs.com/huluwa666/tsq-images-hub:itops-frontend-latest
```

## 访问系统

部署完成后访问：

- 🌐 **前端界面**: http://localhost:8080
- 🔧 **后端 API**: http://localhost:3001
- 📊 **健康检查**: http://localhost:3001/health

**默认管理员账号**:
- 用户名: `admin`
- 密码: `admin123`

## 常用命令

```bash
# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 查看后端日志
docker-compose logs -f backend

# 重启服务
docker-compose restart

# 停止服务
docker-compose down

# 停止并删除数据卷
docker-compose down -v
```

## 环境变量说明

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `JWT_SECRET` | JWT 签名密钥（生产环境必须修改） | - |
| `DOUBAO_API_KEY` | 豆包 API 密钥 | - |
| `DOUBAO_API_BASE` | 豆包 API 地址 | `https://ark.cn-beijing.volces.com/api/v3` |
| `DOUBAO_MODEL` | 豆包模型名称 | `doubao-4o` |
| `OPENAI_API_KEY` | OpenAI API 密钥 | - |
| `OPENAI_API_BASE` | OpenAI API 地址 | `https://api.openai.com/v1` |
| `OPENAI_MODEL` | OpenAI 模型名称 | `gpt-4o` |

## 数据持久化

SQLite 数据库存储在 Docker 卷 `itops-data` 中，删除容器不会丢失数据。

```bash
# 备份数据
docker run --rm -v itops-data:/data -v $(pwd):/backup alpine tar czf /backup/itops-data-backup.tar.gz -C /data .

# 恢复数据
docker run --rm -v itops-data:/data -v $(pwd):/backup alpine tar xzf /backup/itops-data-backup.tar.gz -C /data
```

## 故障排查

### 容器无法启动

```bash
# 查看详细日志
docker logs itops-backend
docker logs itops-frontend
```

### 端口被占用

```bash
# Windows
netstat -ano | findstr :3001

# Linux/Mac
lsof -i :3001
```

更换端口：
```bash
.\deploy.ps1 -BackendPort 8001 -FrontendPort 9001
```

### 数据库权限问题

```bash
# 重置数据卷
docker-compose down -v
docker volume create itops-data
docker-compose up -d
```

## 生产环境建议

1. ✅ 修改 `JWT_SECRET` 为强随机密钥
2. ✅ 配置 LLM API 密钥
3. ✅ 使用 HTTPS 反向代理（Nginx/Traefik）
4. ✅ 定期备份数据卷
5. ✅ 配置防火墙规则限制访问
6. ✅ 使用 `--restart unless-stopped` 确保服务自启动

## 获取帮助

- 📖 完整文档: [GitHub Repository](https://github.com/your-org/ITOpsAgent)
- 📧 邮箱: [huawei_network@foxmail.com](mailto:huawei_network@foxmail.com)
- 🌐 官网: [ITOpsAgentinfo](https://www.zjzwfw.cloud/ITOpsAgentinfo)
