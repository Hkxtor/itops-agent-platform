# API 文档

本文档详细描述了企业IT运维多Agent自动化平台的所有API接口。

## 基础信息

- **Base URL**: `http://localhost:3001`
- **认证方式**: JWT Bearer Token
- **数据格式**: JSON

## 认证

### 登录

```HTTP
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin"
}
```

**响应:**

```JSON
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

### 使用Token

在后续请求的Header中添加：

```
Authorization: Bearer <your_token>
```

## 服务器管理

### 获取服务器列表

```http
GET /api/servers
Authorization: Bearer <token>
```

### 获取单个服务器

```http
GET /api/servers/:id
Authorization: Bearer <token>
```

### 创建服务器

```http
POST /api/servers
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "生产服务器",
  "host": "192.168.1.100",
  "port": 22,
  "username": "root",
  "authType": "password",
  "password": "your_password",
  "description": "生产环境服务器",
  "tags": "生产,Web"
}
```

### 更新服务器

```http
PUT /api/servers/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "更新后的名称",
  "description": "新的描述"
}
```

### 删除服务器

```http
DELETE /api/servers/:id
Authorization: Bearer <token>
```

### 测试服务器连接

```http
POST /api/servers/:id/test
Authorization: Bearer <token>
```

### 执行命令

```http
POST /api/servers/:id/exec
Authorization: Bearer <token>
Content-Type: application/json

{
  "command": "df -h"
}
```

### 获取命令历史

```http
GET /api/servers/:id/command-history
Authorization: Bearer <token>
```

### 执行合规检查

```http
POST /api/servers/:id/compliance
Authorization: Bearer <token>
```

### 获取合规检查历史

```http
GET /api/servers/:id/compliance-history
Authorization: Bearer <token>
```

## Agent管理

### 获取Agent列表

```http
GET /api/agents
Authorization: Bearer <token>
```

### 获取单个Agent

```http
GET /api/agents/:id
Authorization: Bearer <token>
```

### 创建Agent

```http
POST /api/agents
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "自定义Agent",
  "emoji": "🤖",
  "description": "Agent描述",
  "systemPrompt": "系统提示词",
  "config": {}
}
```

### 更新Agent

```http
PUT /api/agents/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "更新后的名称",
  "description": "新的描述"
}
```

### 删除Agent

```http
DELETE /api/agents/:id
Authorization: Bearer <token>
```

## 工作流管理

### 获取工作流列表

```http
GET /api/workflows
Authorization: Bearer <token>
```

### 获取单个工作流

```http
GET /api/workflows/:id
Authorization: Bearer <token>
```

### 创建工作流

```http
POST /api/workflows
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "自定义工作流",
  "description": "工作流描述",
  "nodes": [],
  "edges": []
}
```

### 更新工作流

```http
PUT /api/workflows/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "更新后的名称",
  "nodes": [],
  "edges": []
}
```

### 删除工作流

```http
DELETE /api/workflows/:id
Authorization: Bearer <token>
```

## 任务执行

### 获取任务列表

```http
GET /api/tasks
Authorization: Bearer <token>
```

### 获取任务详情

```http
GET /api/tasks/:id
Authorization: Bearer <token>
```

### 创建并启动任务

```http
POST /api/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "workflowId": 1,
  "context": {
    "serverId": 1
  }
}
```

### 暂停任务

```http
PUT /api/tasks/:id/pause
Authorization: Bearer <token>
```

### 继续任务

```http
PUT /api/tasks/:id/resume
Authorization: Bearer <token>
```

### 取消任务

```http
PUT /api/tasks/:id/cancel
Authorization: Bearer <token>
```

## 告警管理

### 获取告警列表

```http
GET /api/alerts
Authorization: Bearer <token>

# 查询参数
?source=zabbix
&severity=critical
&status=open
```

### 创建告警

```http
POST /api/alerts
Authorization: Bearer <token>
Content-Type: application/json

{
  "source": "manual",
  "severity": "medium",
  "title": "告警标题",
  "content": "告警详细内容"
}
```

### 确认告警

```http
PUT /api/alerts/:id/acknowledge
Authorization: Bearer <token>
```

### 解决告警

```http
PUT /api/alerts/:id/resolve
Authorization: Bearer <token>
```

## 告警自动处理

### 获取映射列表

```http
GET /api/alert-mappings
Authorization: Bearer <token>
```

### 创建映射

```http
POST /api/alert-mappings
Authorization: Bearer <token>
Content-Type: application/json

{
  "source": "zabbix",
  "severity": "critical",
  "titlePattern": "CPU",
  "workflowId": 1,
  "enabled": true
}
```

### 更新映射

```http
PUT /api/alert-mappings/:id
Authorization: Bearer <token>
```

### 删除映射

```http
DELETE /api/alert-mappings/:id
Authorization: Bearer <token>
```

## 告警降噪

### 获取降噪规则

```http
GET /api/alert-noise
Authorization: Bearer <token>
```

### 创建降噪规则

```http
POST /api/alert-noise
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "规则名称",
  "type": "merge",
  "config": {}
}
```

## 根因分析

### 分析告警根因

```http
POST /api/root-cause-analysis
Authorization: Bearer <token>
Content-Type: application/json

{
  "alertId": 1
}
```

### 获取分析历史

```http
GET /api/root-cause-analysis/:alertId
Authorization: Bearer <token>
```

## 脚本管理

### 获取脚本列表

```http
GET /api/scripts
Authorization: Bearer <token>
```

### 创建脚本

```http
POST /api/scripts
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "脚本名称",
  "content": "#!/bin/bash\necho hello",
  "description": "描述",
  "category": "系统监控"
}
```

### 执行脚本

```http
POST /api/scripts/:id/execute
Authorization: Bearer <token>
Content-Type: application/json

{
  "serverId": 1,
  "params": {}
}
```

## 定时任务

### 获取定时任务列表

```http
GET /api/scheduled-tasks
Authorization: Bearer <token>
```

### 创建定时任务

```http
POST /api/scheduled-tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "任务名称",
  "description": "描述",
  "cronExpression": "0 0 * * *",
  "workflowId": 1,
  "enabled": true
}
```

### 立即执行定时任务

```http
POST /api/scheduled-tasks/:id/trigger
Authorization: Bearer <token>
```

## 报告系统

### 生成报告

```http
POST /api/reports/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "templateId": 1,
  "variables": {}
}
```

### 获取报告Markdown

```http
GET /api/reports/:taskId/markdown
Authorization: Bearer <token>
```

## 知识库

### 获取知识列表

```http
GET /api/knowledge
Authorization: Bearer <token>
```

### 搜索知识

```http
GET /api/knowledge/search?q=关键词
Authorization: Bearer <token>
```

### 创建知识条目

```http
POST /api/knowledge
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "标题",
  "content": "内容",
  "category": "分类",
  "tags": "标签"
}
```

## 审计日志

### 获取审计日志

```http
GET /api/audit-logs
Authorization: Bearer <token>

# 查询参数
?userId=1
&action=create
&startDate=2024-01-01
&endDate=2024-12-31
```

## 通知系统

### 获取通知列表

```http
GET /api/notifications
Authorization: Bearer <token>
```

### 标记为已读

```http
PUT /api/notifications/:id/read
Authorization: Bearer <token>
```

### 通知配置

```http
GET /api/notification-configs
POST /api/notification-configs
PUT /api/notification-configs/:id
DELETE /api/notification-configs/:id
```

## 用户管理

### 获取用户列表

```http
GET /api/users
Authorization: Bearer <token>
```

### 创建用户

```http
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "newuser",
  "password": "password123",
  "role": "operator"
}
```

### 更新用户

```http
PUT /api/users/:id
Authorization: Bearer <token>
```

### 删除用户

```http
DELETE /api/users/:id
Authorization: Bearer <token>
```

## 系统设置

### 获取设置

```http
GET /api/settings
Authorization: Bearer <token>
```

### 更新设置

```http
PUT /api/settings
Authorization: Bearer <token>
Content-Type: application/json

{
  "doubanApiKey": "your_key",
  "openaiApiKey": "your_key"
}
```

## Webhook

### Prometheus Alertmanager

```http
POST /api/webhooks/prometheus
Content-Type: application/json

{
  "alerts": [...]
}
```

### Zabbix

```http
POST /api/webhooks/zabbix
Content-Type: application/json

{
  "trigger": "告警名称",
  "host": "主机名",
  "severity": "high"
}
```

### 通用Webhook

```http
POST /api/webhooks/generic
Content-Type: application/json

{
  "source": "your-system",
  "severity": "medium",
  "title": "标题",
  "content": "内容"
}
```

## Copilot

### 发送消息

```http
POST /api/copilot/chat
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "帮我检查服务器状态"
}
```

## 仪表盘

### 获取仪表盘数据

```http
GET /api/dashboard
Authorization: Bearer <token>
```

### 获取告警趋势

```http
GET /api/dashboard/alert-trends
Authorization: Bearer <token>

# 查询参数
?days=7
```

### 获取任务统计

```http
GET /api/dashboard/task-stats
Authorization: Bearer <token>
```

## 数据导入导出

### 导入服务器列表（CSV）

```http
POST /api/import-export/servers/import
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <CSV文件>
```

**CSV 格式要求：**

- 列：hostname, name, port, username, authType, password/privateKey, description, tags, groupIds
- authType 可选值：password / privateKey
- 自动去重：hostname+name 联合去重
- 事务保证：全部成功或全部失败

**响应：**

```json
{
  "success": true,
  "data": {
    "total": 10,
    "imported": 8,
    "skipped": 2,
    "errors": [
      {
        "row": 5,
        "hostname": "server-5",
        "error": "SSH 连接失败"
      }
    ]
  }
}
```

### 导出服务器列表

```http
GET /api/import-export/servers/export?format=csv
Authorization: Bearer <token>
```

### 导出告警数据

```http
GET /api/import-export/alerts/export?format=csv&startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer <token>
```

### 导出审计日志

```http
GET /api/import-export/audit-logs/export?format=csv&startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer <token>
```

### 导出报表

```http
GET /api/import-export/reports/export?format=csv
Authorization: Bearer <token>
```

### 下载服务器导入模板

```http
GET /api/import-export/template/servers
```

## 备份与恢复

### 创建备份

```http
POST /api/backups
Authorization: Bearer <token>
```

### 获取备份列表

```http
GET /api/backups
Authorization: Bearer <token>
```

### 恢复备份

```http
POST /api/backups/restore/:id
Authorization: Bearer <token>
```

**响应：**

```json
{
  "success": true,
  "message": "数据库已恢复，系统将在1秒后自动重启",
  "requiresRestart": true
}
```

> 恢复备份后系统会自动优雅重启：关闭HTTP/WS服务 → 停止定时任务 → 替换数据库文件 → 退出进程（由进程管理器自动重启）

### 删除备份

```http
DELETE /api/backups/:id
Authorization: Bearer <token>
```

## 服务器分组管理

### 获取分组列表

```http
GET /api/server-groups
Authorization: Bearer <token>
```

### 创建分组

```http
POST /api/server-groups
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "生产环境",
  "description": "生产环境服务器",
  "parentId": null,
  "sortOrder": 1
}
```

### 更新分组

```http
PUT /api/server-groups/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "更新后的名称",
  "description": "新描述"
}
```

### 删除分组

```http
DELETE /api/server-groups/:id
Authorization: Bearer <token>
```

### 获取分组下的服务器

```http
GET /api/server-groups/:id/servers
Authorization: Bearer <token>
```

### 添加服务器到分组

```http
POST /api/server-groups/:id/servers
Authorization: Bearer <token>
Content-Type: application/json

{
  "serverId": "server-uuid"
}
```

### 从分组移除服务器

```http
DELETE /api/server-groups/:id/servers/:serverId
Authorization: Bearer <token>
```

## 多 Agent 协作

### 创建多 Agent 任务

```http
POST /api/multi-agent
Authorization: Bearer <token>
Content-Type: application/json

{
  "agentIds": ["agent-1", "agent-2"],
  "task": "任务描述",
  "collaborationMode": "sequential"
}
```

### 获取多 Agent 任务状态

```http
GET /api/multi-agent/:id
Authorization: Bearer <token>
```

## 自动修复（Auto Remediation）

### 获取修复策略列表

```http
GET /api/remediation-policies
Authorization: Bearer <token>
```

### 创建修复策略

```http
POST /api/remediation-policies
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "CPU 过高自动重启",
  "alertRule": "cpu_usage > 90",
  "action": "restart_service",
  "enabled": true
}
```

### 获取修复执行记录

```http
GET /api/remediation-executions
Authorization: Bearer <token>
```

## 备份与恢复

### 创建数据库备份

```http
POST /api/backups
Authorization: Bearer <token>
```

### 获取备份列表

```http
GET /api/backups
Authorization: Bearer <token>
```

### 恢复备份

```http
POST /api/backups/:id/restore
Authorization: Bearer <token>
```

## 数据库管理

### 获取数据库信息

```http
GET /api/database/info
Authorization: Bearer <token>
```

### 数据库健康检查

```http
GET /api/database/health
Authorization: Bearer <token>
```

## 健康检查

```http
GET /health
```

**响应:**

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## WebSocket事件

### 客户端 → 服务端

- `task:subscribe` - 订阅任务执行
- `task:unsubscribe` - 取消订阅
- `alert:subscribe` - 订阅告警

### 服务端 → 客户端

- `task:started`
- `task:node:started`
- `task:node:thinking`
- `task:node:output`
- `task:node:completed`
- `task:completed`
- `task:failed`
- `alert:new`
- `alert:updated`
- `notification:new`
- `remediation:executed` - 修复执行通知

## SSH 密钥管理

### 获取密钥列表

```http
GET /api/ssh-keys
Authorization: Bearer <token>
```

### 获取单个密钥

```http
GET /api/ssh-keys/:id
Authorization: Bearer <token>
```

### 获取密钥使用情况

```http
GET /api/ssh-keys/:id/usage
Authorization: Bearer <token>
```

### 创建密钥

```http
POST /api/ssh-keys
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "生产服务器密钥",
  "privateKey": "-----BEGIN OPENSSH PRIVATE KEY-----...",
  "passphrase": "optional-key-password"
}
```

### 更新密钥

```http
PUT /api/ssh-keys/:id
Authorization: Bearer <token>
```

### 删除密钥

```http
DELETE /api/ssh-keys/:id
Authorization: Bearer <token>
```

## 网络设备管理

### 获取设备列表

```http
GET /api/network-devices
Authorization: Bearer <token>
```

### 获取单个设备

```http
GET /api/network-devices/:id
Authorization: Bearer <token>
```

### 创建设备

```http
POST /api/network-devices
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "核心交换机",
  "host": "192.168.1.1",
  "deviceType": "switch",
  "vendor": "huawei",
  "username": "admin",
  "password": "password"
}
```

### 更新设备

```http
PUT /api/network-devices/:id
Authorization: Bearer <token>
```

### 删除设备

```http
DELETE /api/network-devices/:id
Authorization: Bearer <token>
```

### 测试设备连接

```http
POST /api/network-devices/test-connection
Authorization: Bearer <token>
```

### 执行设备巡检

```http
POST /api/network-devices/:id/inspect
Authorization: Bearer <token>
```

### 批量巡检

```http
POST /api/network-devices/batch-inspect
Authorization: Bearer <token>
```

### SNMP 巡检

```http
POST /api/network-devices/:id/inspect-snmp
Authorization: Bearer <token>
```

### 获取巡检历史

```http
GET /api/network-devices/:id/history
Authorization: Bearer <token>
```

### 获取巡检详情

```http
GET /api/network-devices/history/:inspectionId
Authorization: Bearer <token>
```

### 生成巡检命令

```http
POST /api/network-devices/:id/generate-commands
Authorization: Bearer <token>
```

### 分析巡检输出

```http
POST /api/network-devices/analyze-output
Authorization: Bearer <token>
```

## 网络高级功能

```http
GET    /api/network-advanced          # 获取高级功能列表
POST   /api/network-advanced          # 创建高级功能配置
GET    /api/network-advanced/:id      # 获取配置详情
PUT    /api/network-advanced/:id      # 更新配置
DELETE /api/network-advanced/:id      # 删除配置
```

## 网络发现

```http
GET    /api/network-discovery             # 获取发现任务列表
POST   /api/network-discovery             # 创建发现任务
GET    /api/network-discovery/:id         # 获取发现任务详情
PUT    /api/network-discovery/:id         # 更新发现任务
DELETE /api/network-discovery/:id         # 删除发现任务
POST   /api/network-discovery/:id/start   # 启动发现
POST   /api/network-discovery/:id/stop    # 停止发现
```

## SNMP 管理

### 获取 SNMP 配置列表

```http
GET /api/snmp
Authorization: Bearer <token>
```

### 创建 SNMP 配置

```http
POST /api/snmp
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "设备SNMP配置",
  "host": "192.168.1.1",
  "community": "public",
  "version": "2c",
  "port": 161
}
```

### 获取 SNMP 配置详情

```http
GET /api/snmp/:id
Authorization: Bearer <token>
```

### 更新 SNMP 配置

```http
PUT /api/snmp/:id
Authorization: Bearer <token>
```

### 删除 SNMP 配置

```http
DELETE /api/snmp/:id
Authorization: Bearer <token>
```

### 执行 SNMP 查询

```http
POST /api/snmp/:id/query
Authorization: Bearer <token>
```

### 获取 SNMP Trap 日志

```http
GET /api/snmp/traps
Authorization: Bearer <token>
```

### 获取 OID 注册表

```http
GET /api/snmp/oids
Authorization: Bearer <token>
```

## 网络拓扑

### 获取拓扑数据

```http
GET /api/topology
Authorization: Bearer <token>
```

### 获取拓扑节点

```http
GET /api/topology/nodes
Authorization: Bearer <token>
```

### 获取拓扑边

```http
GET /api/topology/edges
Authorization: Bearer <token>
```

### 创建拓扑节点

```http
POST /api/topology/nodes
Authorization: Bearer <token>
```

### 更新拓扑节点

```http
PUT /api/topology/nodes/:id
Authorization: Bearer <token>
```

### 删除拓扑节点

```http
DELETE /api/topology/nodes/:id
Authorization: Bearer <token>
```

## 变更管理

### 获取变更记录列表

```http
GET /api/changes
Authorization: Bearer <token>
```

### 创建变更记录

```http
POST /api/changes
Authorization: Bearer <token>
```

### 获取变更详情

```http
GET /api/changes/:id
Authorization: Bearer <token>
```

### 更新变更记录

```http
PUT /api/changes/:id
Authorization: Bearer <token>
```

## AI 模型管理

### 获取模型列表

```http
GET /api/ai-models
Authorization: Bearer <token>
```

### 获取默认模型

```http
GET /api/ai-models/default
Authorization: Bearer <token>
```

### 获取单个模型

```http
GET /api/ai-models/:id
Authorization: Bearer <token>
```

### 创建模型

```http
POST /api/ai-models
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "豆包-4o",
  "provider": "doubao",
  "modelId": "doubao-4o",
  "apiKey": "your-api-key",
  "apiBase": "https://ark.cn-beijing.volces.com/api/v3",
  "isDefault": true
}
```

### 更新模型

```http
PUT /api/ai-models/:id
Authorization: Bearer <token>
```

### 重新排序模型

```http
PUT /api/ai-models/reorder
Authorization: Bearer <token>
Content-Type: application/json

{
  "modelIds": ["id-1", "id-2", "id-3"]
}
```

### 删除模型

```http
DELETE /api/ai-models/:id
Authorization: Bearer <token>
```

### 测试模型连通性

```http
POST /api/ai-models/:id/test
Authorization: Bearer <token>
```

## 审批中心（HITL）

### 获取审批列表

```http
GET /api/approvals
Authorization: Bearer <token>

# 查询参数
?status=pending
&type=remediation
&page=1&limit=20
```

### 获取待审批数量

```http
GET /api/approvals/pending/count
Authorization: Bearer <token>
```

### 获取审批详情

```http
GET /api/approvals/:id
Authorization: Bearer <token>
```

### 通过审批

```http
POST /api/approvals/:id/approve
Authorization: Bearer <token>
Content-Type: application/json

{
  "comment": "已确认，可以执行"
}
```

### 拒绝审批

```http
POST /api/approvals/:id/reject
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "需要进一步评估风险"
}
```

## AI 智能修复

### 获取修复记录列表

```http
GET /api/ai-remediations
Authorization: Bearer <token>
```

### 获取单个修复记录

```http
GET /api/ai-remediations/:id
Authorization: Bearer <token>
```

### 创建修复任务

```http
POST /api/ai-remediations
Authorization: Bearer <token>
```

## 告警自动分析

```http
GET  /api/alert-auto/analysis          # 获取分析记录列表
GET  /api/alert-auto/analysis/:id      # 获取分析详情
POST /api/alert-auto/analyze           # 触发告警分析
```

## 告警关联分析

```http
GET    /api/alert-correlation/groups           # 获取关联组列表
GET    /api/alert-correlation/groups/:id       # 获取关联组详情
POST   /api/alert-correlation/groups           # 创建关联组
DELETE /api/alert-correlation/groups/:id       # 删除关联组
POST   /api/alert-correlation/analyze          # 触发关联分析
```

## 联动规则

```http
GET    /api/linkage/rules              # 获取联动规则列表
POST   /api/linkage/rules              # 创建联动规则
GET    /api/linkage/rules/:id          # 获取规则详情
PUT    /api/linkage/rules/:id          # 更新规则
DELETE /api/linkage/rules/:id          # 删除规则
POST   /api/linkage/rules/:id/trigger  # 手动触发规则
```

## 数据库连接管理

### 获取数据库连接列表

```http
GET /api/db-connections
Authorization: Bearer <token>
```

### 创建数据库连接

```http
POST /api/db-connections
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "生产数据库",
  "type": "mysql",
  "host": "192.168.1.100",
  "port": 3306,
  "username": "dbuser",
  "password": "dbpassword",
  "database": "production"
}
```

### 获取连接详情

```http
GET /api/db-connections/:id
Authorization: Bearer <token>
```

### 更新连接

```http
PUT /api/db-connections/:id
Authorization: Bearer <token>
```

### 删除连接

```http
DELETE /api/db-connections/:id
Authorization: Bearer <token>
```

### 测试连接

```http
POST /api/db-connections/:id/test
Authorization: Bearer <token>
```

## VNC 远程桌面

### 获取 VNC 会话列表

```http
GET /api/vnc/sessions
Authorization: Bearer <token>
```

### 创建 VNC 会话

```http
POST /api/vnc/sessions
Authorization: Bearer <token>
```

## QAnything 知识库

```http
GET    /api/knowledge/qanything/status         # 获取 QAnything 服务状态
POST   /api/knowledge/qanything/sync           # 同步知识库到 QAnything
GET    /api/knowledge/qanything/search         # 搜索 QAnything 知识库
```

## 服务器管理增强

```http
GET    /api/server-management/servers             # 获取增强服务器列表（含分组/信息）
POST   /api/server-management/import              # 批量导入服务器
GET    /api/server-management/template/servers    # 下载导入模板
POST   /api/server-management/collect/:id         # 采集主机信息
```

## 命令执行历史

```http
GET    /api/server-commands                      # 获取命令执行历史
GET    /api/server-commands/:id                   # 获取命令执行详情
POST   /api/server-commands                       # 执行新命令
```

## 通知配置

```http
GET    /api/notification-config                   # 获取通知配置
POST   /api/notification-config                   # 创建通知配置
PUT    /api/notification-config/:id               # 更新通知配置
DELETE /api/notification-config/:id               # 删除通知配置
```

## 修复审计

```http
GET    /api/remediation-audits                    # 获取修复审计记录
GET    /api/remediation-audits/:id                # 获取审计详情
```

## 数据中心基础设施管理（DC 模块）

> 借鉴 NetBox DCIM 数据模型，管理机房、机柜、U位分配、设备制造商、设备型号、配电系统、线缆拓扑。  
> **Base Path**: `/api/dc`（同时挂载 `/api/dc-infrastructure`）

### 机房管理

```http
GET    /api/dc/rooms          # 获取机房列表
POST   /api/dc/rooms          # 创建机房
PUT    /api/dc/rooms/:id      # 更新机房（含 layout_config 3D布局配置）
DELETE /api/dc/rooms/:id      # 删除机房（级联删除机柜）
```

**创建机房:**
```http
POST /api/dc/rooms
Content-Type: application/json

{
  "name": "A01",
  "label": "核心机房A",
  "description": "主数据中心",
  "width_m": 20,
  "depth_m": 15,
  "sort_order": 1
}
```

### 机柜管理

```http
GET    /api/dc/racks          # 获取机柜列表（支持筛选）
POST   /api/dc/racks          # 创建机柜
PUT    /api/dc/racks/:id      # 更新机柜
DELETE /api/dc/racks/:id      # 删除机柜（级联删除U位）
```

**查询参数:**
```
?room_id=<uuid>     # 按机房筛选
?status=normal      # 按状态筛选（normal/warning/critical）
?search=关键词       # 按名称模糊搜索
```

**创建机柜:**
```http
POST /api/dc/racks
Content-Type: application/json

{
  "name": "Rack-A01-01",
  "room_id": "room-uuid",
  "row_number": 1,
  "total_u": 42,
  "sort_order": 1,
  "position_x": 0,
  "position_z": 0
}
```

### U位管理

```http
GET    /api/dc/slots              # 获取所有U位数据（DataRoom 3D 调用）
GET    /api/dc/slots/:rackId      # 获取指定机柜的U位
POST   /api/dc/slots              # 分配U位（上架设备，自动检测冲突）
PUT    /api/dc/slots/:id          # 更新U位（移位设备）
DELETE /api/dc/slots/:id          # 移除U位（下架设备）
```

**分配U位（上架设备）:**
```http
POST /api/dc/slots
Content-Type: application/json

{
  "rack_id": "rack-uuid",
  "device_id": "server-uuid",
  "device_type": "server",
  "device_type_id": "device-type-uuid",
  "start_u": 10,
  "end_u": 12,
  "position_face": "front",
  "lifecycle_notes": "上线部署"
}
```

**冲突处理:** U位范围重叠时返回 `409 Conflict`，超出机柜容量返回 `400 Bad Request`。  
**自动高度计算:** 若提供 `device_type_id`，`end_u` 会自动从设备型号的 `u_height` 推导。

### 设备分布

```http
GET /api/dc/devices              # 按机房/机柜分组的设备分布
GET /api/dc/devices/unallocated  # 未分配（未上架）的设备
```

**未分配设备查询参数:**
```
?search=关键词   # 按名称/IP搜索
```

### 3D 总览

```http
GET /api/dc/overview   # DataRoom 3D 总览数据（聚合机房、机柜、设备、环境数据）
```

**响应包含:** rooms 列表、summary 统计、rackData（含设备数、警告数）、slotData（设备与关联状态）、环境温湿度、PUE。

### 设备制造商（NetBox-inspired）

```http
GET    /api/dc/manufacturers       # 获取全部制造商列表
GET    /api/dc/manufacturers/:id   # 获取单个制造商（含关联设备型号数）
POST   /api/dc/manufacturers       # 创建制造商
PUT    /api/dc/manufacturers/:id   # 更新制造商
DELETE /api/dc/manufacturers/:id   # 删除制造商（有关联型号时禁止删除）
```

**创建制造商:**
```http
POST /api/dc/manufacturers
Content-Type: application/json

{
  "name": "Huawei",
  "slug": "huawei",
  "description": "华为技术有限公司",
  "logo_url": "https://example.com/huawei.png",
  "sort_order": 1
}
```

### 设备型号（NetBox-inspired）

```http
GET    /api/dc/device-types                      # 获取型号列表（可按制造商筛选）
GET    /api/dc/device-types/:id                  # 获取单个型号（含槽位定义 + 实例数）
POST   /api/dc/device-types                      # 创建型号
PUT    /api/dc/device-types/:id                  # 更新型号
DELETE /api/dc/device-types/:id                  # 删除型号（有实例引用时禁止删除）
```

**查询参数:**
```
?manufacturer_id=<uuid>   # 按制造商筛选
```

**创建设备型号:**
```http
POST /api/dc/device-types
Content-Type: application/json

{
  "manufacturer_id": "manufacturer-uuid",
  "model": "RH2288H V5",
  "slug": "rh2288h-v5",
  "part_number": "02311KAV",
  "u_height": 2,
  "is_full_depth": 1,
  "subdevice_role": null,
  "airflow": "front-to-rear",
  "weight_kg": 25.5,
  "max_power_w": 800,
  "description": "2U 通用服务器"
}
```

### 配电柜（NetBox-inspired）

```http
GET    /api/dc/power-panels       # 获取配电柜列表（含关联机房 + 馈线数）
GET    /api/dc/power-panels/:id   # 获取单个配电柜详情（含供电线路列表）
POST   /api/dc/power-panels       # 创建配电柜
PUT    /api/dc/power-panels/:id   # 更新配电柜
DELETE /api/dc/power-panels/:id   # 删除配电柜（有关联馈线时禁止删除）
```

**创建配电柜:**
```http
POST /api/dc/power-panels
Content-Type: application/json

{
  "room_id": "room-uuid",
  "name": "PP-A01-01",
  "location_label": "A01机房东侧",
  "panel_type": "rpp",
  "voltage": 220,
  "amperage": 63,
  "phase_count": 3,
  "description": "A01机房主配电柜",
  "sort_order": 1
}
```

### 供电线路（NetBox-inspired）

```http
GET    /api/dc/power-feeds                  # 获取全部供电线路（可按配电柜筛选）
GET    /api/dc/power-feeds/rack/:rackId     # 获取指定机柜的所有供电线路
GET    /api/dc/power-feeds/:id              # 单条供电线路详情
POST   /api/dc/power-feeds                  # 创建供电线路
PUT    /api/dc/power-feeds/:id              # 更新供电线路
DELETE /api/dc/power-feeds/:id              # 删除供电线路
```

**查询参数:**
```
?power_panel_id=<uuid>   # 按配电柜筛选
```

**创建供电线路:**
```http
POST /api/dc/power-feeds
Content-Type: application/json

{
  "power_panel_id": "panel-uuid",
  "rack_id": "rack-uuid",
  "name": "Feed-A",
  "status": "active",
  "feed_type": "primary",
  "supply": "ac",
  "voltage": 220,
  "amperage": 16,
  "max_utilization_pct": 80,
  "current_load_w": 1200,
  "description": "机柜主供电"
}
```

### 线缆管理（NetBox-inspired）

```http
GET    /api/dc/cables                     # 获取线缆列表（可按设备/状态筛选）
GET    /api/dc/cables/scene               # 获取带3D坐标的全部线缆（DataRoom3D 渲染）
GET    /api/dc/cables/topology/:rackId    # 机柜内部设备连接拓扑
POST   /api/dc/cables                     # 创建线缆连接
PUT    /api/dc/cables/:id                 # 更新线缆
DELETE /api/dc/cables/:id                 # 删除线缆
```

**查询参数:**
```
?device_id=<uuid>   # 按设备筛选（匹配 A端 或 B端）
?status=connected   # 按状态筛选（connected/disconnected/planned）
```

**创建线缆连接:**
```http
POST /api/dc/cables
Content-Type: application/json

{
  "name": "CBL-001",
  "cable_type": "cat6",
  "cable_color": "蓝色",
  "length_m": 3.5,
  "status": "connected",
  "a_device_id": "server-uuid",
  "a_device_type": "server",
  "a_port_name": "eth0",
  "b_device_id": "switch-uuid",
  "b_device_type": "network_device",
  "b_port_name": "GE0/0/1",
  "description": "服务器到交换机"
}
```

**Scene 端点:** 自动计算每条线缆两端的 3D 坐标（机柜位置 + U位高度），返回 `a_position` / `b_position` 的 `[x, y, z]` 坐标数组，前端 DataRoom3D 可直接渲染。

### PDU/UPS 管理

```http
GET    /api/dc/pdus          # 获取PDU/UPS列表
POST   /api/dc/pdus          # 创建PDU/UPS
PUT    /api/dc/pdus/:id      # 更新PDU/UPS
DELETE /api/dc/pdus/:id      # 删除PDU/UPS
```

**创建PDU:**
```http
POST /api/dc/pdus
Content-Type: application/json

{
  "name": "PDU-A01-01A",
  "type": "pdu",
  "status": "active",
  "rack_id": "rack-uuid",
  "power_capacity_w": 5000,
  "current_load_w": 2500,
  "input_voltage": 220,
  "output_sockets": 24,
  "model": "AP8858",
  "ip_address": "192.168.1.200",
  "snmp_community": "public"
}
```

### 设备生命周期

```http
GET /api/dc/lifecycle     # 获取生命周期记录（自动记录上架/移位/下架）
```

**查询参数:**
```
?action=mounted   # 按操作类型筛选（mounted/moved/unmounted）
?limit=100         # 返回条数限制（默认500）
```

### 数据导入导出

```http
GET  /api/dc/export   # 导出完整数据中心数据（机房/机柜/U位/PDU/生命周期）
POST /api/dc/import    # 导入数据中心数据（先清空后导入）
```

**导入请求体:**
```http
POST /api/dc/import
Content-Type: application/json

{
  "rooms": [],
  "racks": [],
  "slots": [],
  "pdus": [],
  "lifecycles": []
}
```

### 健康检查

```http
GET /api/dc/health
```

**响应:**
```json
{ "success": true, "message": "DC routes OK" }
```

### WebSocket 事件

#### 服务端 → 客户端

| 事件 | 说明 |
|------|------|
| `dc:status` | 每 5 秒推送一次 DC 概览状态 |

**`dc:status` 数据格式:**
```json
{
  "timestamp": 1700000000000,
  "summary": {
    "totalRacks": 20,
    "totalSlots": 840,
    "totalDevices": 156,
    "onlineDevices": 142,
    "alertDevices": 3
  },
  "rackUtil": [
    { "id": "...", "name": "Rack-A01-01", "used_u": 24, "total_u": 42, "device_count": 12 }
  ],
  "roomEnv": [
    { "id": "...", "name": "A01", "label": "核心机房A", "current_temperature": 23.5, "current_humidity": 48.2 }
  ]
}
```

## 错误响应

所有API在出错时返回统一格式：

```json
{
  "success": false,
  "error": "错误信息",
  "code": "ERROR_CODE"
}
```

HTTP状态码：

- 200: 成功
- 400: 请求参数错误
- 401: 未认证
- 403: 无权限
- 404: 资源不存在
- 500: 服务器内部错误

