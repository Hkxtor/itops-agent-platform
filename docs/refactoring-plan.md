# Daima 项目重构方案

> 基于 Keep 和 Ongrid 项目架构最佳实践的全面重构计划

---

## 目录

- [一、背景与目标](#一背景与目标)
- [二、现状分析](#二现状分析)
- [三、参考项目分析](#三参考项目分析)
- [四、目标架构](#四目标架构)
- [五、分阶段实施计划](#五分阶段实施计划)
- [六、详细实施步骤](#六详细实施步骤)
- [七、风险与回滚方案](#七风险与回滚方案)
- [八、验收标准](#八验收标准)

---

## 一、背景与目标

### 1.1 项目现状

Daima 是一个功能丰富的 IT 运维多 Agent 自动化平台，覆盖 13 个业务领域，后端约 200+ 文件，前端约 150+ 文件。随着功能持续增长，项目面临以下挑战：

- 文件数量膨胀，AI 编程工具难以高效工作
- 路由注册分散在 `app.ts` 中（约 100 行手动 import）
- 模块间耦合度高，缺乏统一的服务生命周期管理
- 数据库迁移版本号混乱
- 部分目录结构不一致（`routes/dc/` 游离于 `modules/` 之外）

### 1.2 重构目标

| 目标 | 说明 |
|------|------|
| **AI 工具友好** | 每个模块文件数控制在 5-15 个，上下文大小适合 AI 处理 |
| **模块自包含** | 每个模块有统一的入口（index.ts），边界清晰 |
| **路由自动化** | 新增模块无需手动修改 `app.ts` |
| **架构统一** | 消除 `routes/dc/` 等游离目录 |
| **零破坏性** | 所有改动不破坏现有功能，可分阶段回滚 |

---

## 二、现状分析

### 2.1 当前目录结构

```
daima/
├── backend/
│   └── src/
│       ├── app.ts                    # 入口（~100行路由注册）
│       ├── middleware/               # 6个中间件
│       ├── models/                   # 数据库层
│       │   ├── database.ts
│       │   ├── migrations.ts
│       │   ├── migrations/           # 38个迁移文件
│       │   └── presets/              # 预设数据
│       ├── modules/                  # 13个业务模块
│       │   ├── ai/                   # AI智能运维
│       │   ├── alerts/               # 告警管理
│       │   ├── auth/                 # 认证授权
│       │   ├── auto/                 # 自动化修复
│       │   ├── containers/           # 容器虚拟化
│       │   ├── database/             # 数据库管理
│       │   ├── dc/                   # 数据中心（无routes）
│       │   ├── infra/                # 基础设施
│       │   ├── kubernetes/           # K8s管理
│       │   ├── monitor/              # 监控面板
│       │   ├── network/              # 网络管理
│       │   ├── servers/              # 服务器管理
│       │   └── workflow/             # 工作流引擎
│       ├── routes/
│       │   └── dc/                   # ⚠️ 游离的DC路由（13个文件）
│       ├── services/                 # ⚠️ 部分服务未归入modules
│       ├── types/                    # 类型定义
│       └── utils/                    # 工具函数
│
└── frontend/
    └── src/
        ├── App.tsx                   # ~200行路由定义
        ├── modules/                  # 14个前端模块
        └── shared/                   # 共享组件
```

### 2.2 核心问题清单

| # | 问题 | 严重度 | 影响 |
|---|------|--------|------|
| 1 | `app.ts` 中约 100 行手动路由注册 | 🔴 高 | 新增模块易遗漏，维护成本高 |
| 2 | `routes/dc/` 游离于 `modules/` 之外 | 🔴 高 | 架构不一致 |
| 3 | 模块缺少统一入口（index.ts） | 🟡 中 | AI工具难以理解模块边界 |
| 4 | 数据库迁移版本号冲突（v007/v016/v017/v018） | 🟡 中 | 迁移混乱，潜在风险 |
| 5 | 服务初始化星型依赖 | 🟡 中 | 耦合度高，难以测试 |
| 6 | 前端路由集中在 App.tsx（~200行） | 🟡 中 | 难以维护 |
| 7 | 部分模块文件过少（database仅1个服务） | 🟢 低 | 目录开销大于代码量 |
| 8 | 缺少 API 版本前缀 | 🟢 低 | 未来兼容性风险 |

### 2.3 文件统计

| 模块 | 路由文件 | 服务文件 | 前端页面 | 复杂度 |
|------|---------|---------|---------|--------|
| ai | 8 | 18+ | 8 | 🔴 高 |
| alerts | 6 | 15+ | 7 | 🔴 高 |
| auth | 2 | 4 | 3 | 🟢 低 |
| auto | 4 | 3 | 6 | 🟡 中 |
| containers | 8 | 7 | 14 | 🔴 高 |
| database | 2 | 1 | 1 | 🟢 低 |
| dc | 0(+13游离) | 1 | 2 | 🟡 中 |
| infra | 16 | 14 | 11 | 🔴 高 |
| kubernetes | 1 | 1 | 1 | 🟢 低 |
| monitor | 4 | 3 | 4 | 🟡 中 |
| network | 7 | 12 | 5 | 🔴 高 |
| servers | 5 | 3 | 11 | 🟡 中 |
| workflow | 3 | 7 | 5 | 🟡 中 |

---

## 三、参考项目分析

### 3.1 Keep 项目（keep-main）

| 借鉴点 | 说明 |
|--------|------|
| **Provider 插件模式** | 100+ Provider 通过工厂模式统一注册，每个 Provider 独立子目录 |
| **分层架构** | routes → bl（业务逻辑）→ core（数据访问），依赖方向清晰 |
| **前端 Feature-Sliced Design** | entities/features/shared 三层分离，模块边界明确 |
| **配置驱动** | 通过环境变量和 Docker Compose 灵活配置 |

### 3.2 Ongrid 项目（ongrid-main）

| 借鉴点 | 说明 |
|--------|------|
| **DDD 限界上下文** | iam/manager/edgeagent 三个 BC 严格隔离，`.go-arch-lint.yml` 强制约束 |
| **Composition Root** | `cmd/ongrid/main.go` 统一装配所有依赖 |
| **每个 BC 内部分层** | server → service → biz → model，依赖方向由工具强制 |
| **自动路由发现** | 每个 BC 的 server 层自包含路由定义 |
| **模块统一入口** | 每个模块有清晰的 index 或入口文件 |

---

## 四、目标架构

### 4.1 后端目标结构

```
daima/
├── backend/
│   └── src/
│       ├── core/                        # 核心基础设施
│       │   ├── app.ts                   # 入口（精简后 ~30行）
│       │   ├── middleware/              # 中间件（不变）
│       │   │   ├── auth.ts
│       │   │   ├── commandFilter.ts
│       │   │   ├── errorHandler.ts
│       │   │   ├── rateLimiter.ts
│       │   │   ├── trace.ts
│       │   │   └── validation.ts
│       │   ├── database/               # 数据库层
│       │   │   ├── connection.ts       # 重命名自 database.ts
│       │   │   ├── migrations.ts
│       │   │   ├── migrations/         # 规范化版本号
│       │   │   └── presets/
│       │   ├── types/                  # 共享类型
│       │   │   └── index.ts
│       │   └── utils/                  # 工具函数
│       │       ├── logger.ts
│       │       ├── env.ts
│       │       ├── response.ts
│       │       ├── retry.ts
│       │       └── sensitiveMask.ts
│       │
│       ├── modules/                    # 业务模块（每个自包含）
│       │   ├── _registry.ts            # 🆕 自动路由发现
│       │   │
│       │   ├── ai/                     # AI智能运维
│       │   │   ├── index.ts            # 🆕 模块入口
│       │   │   ├── routes.ts           # 🆕 路由集中定义
│       │   │   ├── services/           # 业务逻辑
│       │   │   │   ├── agentExecutor.ts
│       │   │   │   ├── agentToolRegistry.ts
│       │   │   │   ├── copilotService.ts
│       │   │   │   ├── multiAgentCollaboration.ts
│       │   │   │   ├── llmService.ts
│       │   │   │   ├── aiModelService.ts
│       │   │   │   ├── rootCauseAnalysisService.ts
│       │   │   │   ├── aiRemediationService.ts
│       │   │   │   ├── enhancedRAGService.ts
│       │   │   │   ├── qanythingService.ts
│       │   │   │   ├── localRuleEngine.ts
│       │   │   │   ├── multiAgent/     # 双层Agent架构
│       │   │   │   └── providers/      # Provider生态
│       │   │   └── types.ts            # 🆕 模块专属类型
│       │   │
│       │   ├── alerts/                 # 告警管理
│       │   │   ├── index.ts
│       │   │   ├── routes.ts
│       │   │   ├── services/
│       │   │   └── types.ts
│       │   │
│       │   ├── auth/                   # 认证授权
│       │   │   ├── index.ts
│       │   │   ├── routes.ts
│       │   │   ├── services/
│       │   │   └── types.ts
│       │   │
│       │   ├── auto/                   # 自动化修复
│       │   │   ├── index.ts
│       │   │   ├── routes.ts
│       │   │   ├── services/
│       │   │   └── types.ts
│       │   │
│       │   ├── containers/             # 容器虚拟化
│       │   │   ├── index.ts
│       │   │   ├── routes.ts
│       │   │   ├── services/
│       │   │   └── types.ts
│       │   │
│       │   ├── database/               # 数据库管理
│       │   │   ├── index.ts
│       │   │   ├── routes.ts
│       │   │   ├── services/
│       │   │   └── types.ts
│       │   │
│       │   ├── dc/                     # 数据中心（合并 routes/dc/）
│       │   │   ├── index.ts
│       │   │   ├── routes.ts           # 🆕 从 routes/dc/ 迁移
│       │   │   ├── services/
│       │   │   └── types.ts
│       │   │
│       │   ├── infra/                  # 基础设施
│       │   │   ├── index.ts
│       │   │   ├── routes.ts
│       │   │   ├── services/
│       │   │   └── types.ts
│       │   │
│       │   ├── kubernetes/             # K8s管理
│       │   │   ├── index.ts
│       │   │   ├── routes.ts
│       │   │   ├── services/
│       │   │   └── types.ts
│       │   │
│       │   ├── monitor/                # 监控面板
│       │   │   ├── index.ts
│       │   │   ├── routes.ts
│       │   │   ├── services/
│       │   │   └── types.ts
│       │   │
│       │   ├── network/                # 网络管理
│       │   │   ├── index.ts
│       │   │   ├── routes.ts
│       │   │   ├── services/
│       │   │   └── types.ts
│       │   │
│       │   ├── servers/                # 服务器管理
│       │   │   ├── index.ts
│       │   │   ├── routes.ts
│       │   │   ├── services/
│       │   │   └── types.ts
│       │   │
│       │   └── workflow/               # 工作流引擎
│       │       ├── index.ts
│       │       ├── routes.ts
│       │       ├── services/
│       │       └── types.ts
│       │
│       └── shared/                     # 跨模块共享
│           ├── schemas/                # Zod校验
│           ├── websocket/              # WebSocket
│           └── constants/              # 全局常量
```

### 4.2 前端目标结构

```
frontend/
└── src/
    ├── App.tsx                         # 精简后 ~30行（模块路由聚合）
    ├── core/                           # 核心基础设施
    │   ├── contexts/                   # React Context
    │   ├── hooks/                      # 自定义Hooks
    │   ├── lib/                        # 工具库（api.ts等）
    │   └── i18n/                       # 国际化
    ├── modules/                        # 业务模块（与后端一一对应）
    │   ├── ai/
    │   │   ├── index.ts                # 🆕 模块路由定义
    │   │   ├── pages/
    │   │   └── components/
    │   ├── alerts/
    │   │   ├── index.ts
    │   │   ├── pages/
    │   │   └── components/
    │   ├── auth/
    │   ├── auto/
    │   ├── containers/
    │   ├── database/
    │   ├── dc/
    │   ├── infra/
    │   ├── kubernetes/
    │   ├── monitor/
    │   ├── network/
    │   ├── servers/
    │   └── workflow/
    └── shared/                         # 共享层
        ├── components/                 # ErrorBoundary, ProtectedRoute等
        ├── layouts/                    # 主布局
        └── pages/                      # NotFound等
```

### 4.3 模块规范（每个模块必须遵守）

```
modules/<name>/
├── index.ts            # 必须：导出 routes 和公开的服务接口
├── routes.ts           # 必须：模块内所有路由定义
├── services/           # 必须：业务逻辑
│   └── *.ts
├── types.ts            # 推荐：模块专属类型
└── README.md           # 推荐：模块文档（AI友好）
```

**index.ts 模板：**

```typescript
/**
 * <模块名> 模块
 * 
 * 职责：<一句话描述>
 * 依赖：<列出依赖的其他模块>
 */

export { default as routes } from './routes';

// 公开的服务接口（仅导出需要被其他模块使用的）
export { someService } from './services/someService';
```

**routes.ts 模板：**

```typescript
import { Router } from 'express';
import { rateLimiter } from '../../core/middleware/rateLimiter';

const router = Router();

// 所有路由统一挂载 rateLimiter
router.use(rateLimiter);

// 路由定义
router.get('/list', someHandler);
router.post('/create', someHandler);
// ...

export default router;
```

---

## 五、分阶段实施计划

### 阶段总览

```
Phase 0: 准备工作（1天）
  └── 创建分支、备份、编写测试

Phase 1: 核心重构（2-3天）🔴 P0
  ├── 1.1 创建 modules/_registry.ts 自动路由发现
  ├── 1.2 合并 routes/dc/ → modules/dc/routes.ts
  └── 1.3 精简 app.ts

Phase 2: 模块规范化（3-5天）🟡 P1
  ├── 2.1 每个模块添加 index.ts
  ├── 2.2 每个模块添加 routes.ts
  ├── 2.3 提取模块专属 types.ts
  └── 2.4 迁移版本号规范化

Phase 3: 深度优化（5-7天）🟢 P2
  ├── 3.1 服务容器/DI
  ├── 3.2 前端路由模块化
  ├── 3.3 添加模块 README
  └── 3.4 清理冗余代码

Phase 4: 持续改进（长期）
  ├── 4.1 增加测试覆盖
  ├── 4.2 API 版本化
  └── 4.3 架构约束工具
```

---

## 六、详细实施步骤

### Phase 1：核心重构（P0 - 立即执行）

#### 1.1 创建自动路由发现 `modules/_registry.ts`

**目标**：将 `app.ts` 中约 100 行路由注册简化为 1 行。

**实施步骤**：

1. 创建 `backend/src/modules/_registry.ts`
2. 每个模块导出 `routes`，在 `_registry.ts` 中统一聚合
3. 修改 `app.ts`，用 `registerAllModules(app)` 替代手动注册

**_registry.ts 代码：**

```typescript
import { Express, Router } from 'express';
import { rateLimiter } from '../core/middleware/rateLimiter';
import { routes as aiRoutes } from './ai';
import { routes as alertRoutes } from './alerts';
import { routes as authRoutes } from './auth';
import { routes as autoRoutes } from './auto';
import { routes as containerRoutes } from './containers';
import { routes as databaseRoutes } from './database';
import { routes as dcRoutes } from './dc';
import { routes as infraRoutes } from './infra';
import { routes as kubernetesRoutes } from './kubernetes';
import { routes as monitorRoutes } from './monitor';
import { routes as networkRoutes } from './network';
import { routes as serverRoutes } from './servers';
import { routes as workflowRoutes } from './workflow';

interface ModuleConfig {
  path: string;
  router: Router;
  public?: boolean; // 公开路由（不需要认证）
}

const modules: ModuleConfig[] = [
  { path: '/api/auth', router: authRoutes, public: true },
  { path: '/api/ai', router: aiRoutes },
  { path: '/api/alerts', router: alertRoutes },
  { path: '/api/auto', router: autoRoutes },
  { path: '/api/containers', router: containerRoutes },
  { path: '/api/databases', router: databaseRoutes },
  { path: '/api/dc', router: dcRoutes },
  { path: '/api/infra', router: infraRoutes },
  { path: '/api/kubernetes', router: kubernetesRoutes },
  { path: '/api/monitor', router: monitorRoutes },
  { path: '/api/network', router: networkRoutes },
  { path: '/api/servers', router: serverRoutes },
  { path: '/api/workflow', router: workflowRoutes },
];

export function registerAllModules(app: Express): void {
  for (const mod of modules) {
    if (mod.public) {
      app.use(mod.path, mod.router);
    } else {
      app.use(mod.path, rateLimiter, mod.router);
    }
  }
}
```

**app.ts 改动**：

```typescript
// 之前：约 100 行手动 import + app.use()
// import aiRoutes from './modules/ai/routes/agentRoutes';
// import aiModelRoutes from './modules/ai/routes/aiModelRoutes';
// ... 60+ 行

// 之后：1 行
import { registerAllModules } from './modules/_registry';
registerAllModules(app);
```

#### 1.2 合并 `routes/dc/` → `modules/dc/routes.ts`

**目标**：消除游离的 `routes/dc/` 目录，统一到 `modules/dc/` 下。

**实施步骤**：

1. 在 `modules/dc/` 下创建 `routes.ts`
2. 将 `routes/dc/` 下 13 个路由文件的内容合并到 `routes.ts`
3. 更新所有 import 路径
4. 删除 `routes/dc/` 目录
5. 更新 `modules/dc/index.ts` 导出 routes

#### 1.3 精简 `app.ts`

**目标**：将 `app.ts` 从 ~500 行精简到 ~200 行。

**改动内容**：

- 路由注册 → 替换为 `registerAllModules(app)`
- 服务初始化 → 提取到 `core/serviceInit.ts`
- 中间件配置 → 保持不变

---

### Phase 2：模块规范化（P1 - 本周执行）

#### 2.1 每个模块添加 `index.ts`

**模板**：

```typescript
/**
 * AI 智能运维模块
 * 
 * 职责：多Agent协作、LLM调用、根因分析、知识库、Provider生态
 * 依赖：auth（认证）、alerts（告警触发）
 */

// 路由
export { default as routes } from './routes';

// 公开服务（供其他模块使用）
export { executeTask } from './services/multiAgent';
export { providerRegistry } from './services/providers';
```

#### 2.2 每个模块添加 `routes.ts`

将模块内分散的路由文件（如 `modules/ai/routes/agentRoutes.ts`、`modules/ai/routes/aiModelRoutes.ts` 等）聚合到一个 `routes.ts` 中。

**模板**：

```typescript
import { Router } from 'express';
import { rateLimiter } from '../../core/middleware/rateLimiter';

const router = Router();
router.use(rateLimiter);

// Agent 管理
import agentRoutes from './routes/agentRoutes';
router.use('/agents', agentRoutes);

// AI 模型管理
import aiModelRoutes from './routes/aiModelRoutes';
router.use('/ai-models', aiModelRoutes);

// 多Agent协作
import multiAgentRoutes from './routes/multiAgentRoutes';
router.use('/multi-agent', multiAgentRoutes);

// ... 其他子路由

export default router;
```

#### 2.3 提取模块专属 `types.ts`

将 `core/types/index.ts` 中与特定模块相关的类型定义提取到各模块的 `types.ts` 中。

**示例**：

```typescript
// modules/alerts/types.ts
export interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  source: string;
  message: string;
  timestamp: number;
  status: 'active' | 'acknowledged' | 'resolved';
  // ...
}

export interface AlertRule {
  id: string;
  name: string;
  condition: string;
  // ...
}
```

#### 2.4 数据库迁移版本号规范化

**当前问题**：

| 文件名 | 实际版本 | 问题 |
|--------|---------|------|
| v007_credentials_table.ts | v007 | 与下方冲突 |
| v007_fix_users_id_type.ts | v007 | 与上方冲突 |
| v016_databases_table.ts | v016 | 与下方冲突 |
| v016_tool_links.ts | v016 | 与上方冲突 |
| v017_approval_requests.ts | v017 | 与下方冲突 |
| v017_tool_link_image.ts | v017 | 与上方冲突 |
| v018_alert_auto_response.ts | v018 | 与下方冲突 |
| v018_workflow_engine_enhancement.ts | v018 | 与上方冲突 |

**解决方案**：按执行顺序重新编号，统一为连续版本号。

| 原文件名 | 新文件名 |
|---------|---------|
| v007_credentials_table.ts | v007_credentials_table.ts（保留） |
| v007_fix_users_id_type.ts | v008_fix_users_id_type.ts |
| v016_databases_table.ts | v016_databases_table.ts（保留） |
| v016_tool_links.ts | v017_tool_links.ts |
| v017_approval_requests.ts | v018_approval_requests.ts |
| v017_tool_link_image.ts | v019_tool_link_image.ts |
| v018_alert_auto_response.ts | v020_alert_auto_response.ts |
| v018_workflow_engine_enhancement.ts | v021_workflow_engine_enhancement.ts |

后续迁移文件依次递增。

---

### Phase 3：深度优化（P2 - 后续执行）

#### 3.1 服务容器/依赖注入

**目标**：解决 `app.ts` 中星型依赖问题。

```typescript
// core/serviceContainer.ts
class ServiceContainer {
  private services = new Map<string, any>();
  private initOrder: string[] = [];

  register(name: string, factory: (ctx: ServiceContainer) => any, deps: string[] = []): void {
    // 注册服务及其依赖
  }

  async initAll(): Promise<void> {
    // 按依赖顺序初始化所有服务
  }

  async shutdownAll(): Promise<void> {
    // 按逆序关闭所有服务
  }

  get<T>(name: string): T {
    // 获取服务实例
  }
}

export const container = new ServiceContainer();
```

#### 3.2 前端路由模块化

**目标**：将 `App.tsx` 中 ~200 行路由定义拆分到各模块。

```typescript
// modules/ai/index.ts
import { lazy } from 'react';

export const aiRoutes = [
  {
    path: '/ai/agents',
    element: lazy(() => import('./pages/Agents')),
  },
  {
    path: '/ai/copilot',
    element: lazy(() => import('./pages/Copilot')),
  },
  // ...
];
```

```typescript
// App.tsx（精简后）
import { aiRoutes } from './modules/ai';
import { alertRoutes } from './modules/alerts';
// ...

const allRoutes = [
  ...aiRoutes,
  ...alertRoutes,
  // ...
];

function App() {
  return (
    <Routes>
      {allRoutes.map(route => (
        <Route key={route.path} path={route.path} element={<route.element />} />
      ))}
    </Routes>
  );
}
```

#### 3.3 添加模块 README

每个模块添加 `README.md`，包含：

```markdown
# AI 智能运维模块

## 职责
多Agent协作、LLM调用、根因分析、知识库管理

## 目录结构
- routes.ts - 路由定义
- services/ - 业务逻辑
- types.ts - 类型定义

## 对外接口
- executeTask(input) - 执行运维任务
- providerRegistry - Provider注册中心

## 依赖
- auth 模块（认证）
- alerts 模块（告警触发）

## AI 开发提示
当需要修改此模块时，请关注以下文件：
- services/multiAgent/ - 多Agent核心逻辑
- services/providers/ - Provider生态
```

---

### Phase 4：持续改进（长期）

#### 4.1 增加测试覆盖

| 模块 | 当前测试 | 目标测试 |
|------|---------|---------|
| ai | 部分 | 80% 覆盖 |
| alerts | 部分 | 80% 覆盖 |
| infra | 无 | 60% 覆盖 |
| containers | 无 | 60% 覆盖 |
| network | 无 | 60% 覆盖 |

#### 4.2 API 版本化

```
/api/v1/ai/agents        # 当前 API
/api/v2/ai/agents        # 未来版本
```

#### 4.3 架构约束工具

借鉴 Ongrid 的 `.go-arch-lint.yml`，使用 ESLint 规则约束模块间依赖：

```javascript
// .eslintrc.json 添加规则
{
  "rules": {
    "import/no-restricted-paths": [
      "error",
      {
        "zones": [
          {
            "target": "./src/modules/ai",
            "from": "./src/modules/containers"  // ai 不应依赖 containers
          }
        ]
      }
    ]
  }
}
```

---

## 七、风险与回滚方案

### 7.1 风险矩阵

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| 路由注册遗漏 | 中 | 高 | 自动化测试 + 逐模块验证 |
| import 路径错误 | 高 | 中 | TypeScript 编译检查 |
| 迁移版本号变更导致数据问题 | 低 | 高 | 仅改文件名，不改迁移逻辑 |
| 服务初始化顺序错误 | 低 | 中 | 保持原有初始化顺序 |

### 7.2 回滚方案

1. **Git 分支策略**：每个 Phase 在独立分支开发，合并前完整测试
2. **逐模块回滚**：每个模块独立，可单独回滚
3. **保留旧代码**：Phase 1 期间保留 `routes/dc/` 目录，验证通过后再删除

### 7.3 测试策略

```
Phase 1 完成后：
  ✅ TypeScript 编译通过
  ✅ 所有现有 API 端点可访问
  ✅ 前端页面正常加载
  ✅ 数据库迁移正常执行

Phase 2 完成后：
  ✅ 所有模块 index.ts 导出正确
  ✅ 类型定义无循环依赖
  ✅ 迁移版本号连续无冲突
```

---

## 八、验收标准

### 8.1 Phase 1 验收标准

- [ ] `app.ts` 中路由注册代码从 ~100 行减少到 ~5 行
- [ ] `routes/dc/` 目录已删除，内容合并到 `modules/dc/routes.ts`
- [ ] `modules/_registry.ts` 正常工作
- [ ] 所有现有功能无回归
- [ ] `npm run build` 编译通过
- [ ] 前端所有页面正常访问

### 8.2 Phase 2 验收标准

- [ ] 所有 13 个模块都有 `index.ts`
- [ ] 所有 13 个模块都有 `routes.ts`
- [ ] 模块间 import 路径清晰无循环依赖
- [ ] 数据库迁移版本号连续无冲突
- [ ] 每个模块文件数在 5-20 个之间

### 8.3 Phase 3 验收标准

- [ ] ServiceContainer 正常工作
- [ ] 前端 App.tsx 路由定义从 ~200 行减少到 ~30 行
- [ ] 每个模块有 README.md
- [ ] AI 工具可以在单个模块上下文中高效工作

---

## 附录

### A. 文件变更清单

| Phase | 新增文件 | 修改文件 | 删除文件 |
|-------|---------|---------|---------|
| Phase 1 | `modules/_registry.ts` | `app.ts` | `routes/dc/*`（13个） |
| Phase 2 | 13个 `index.ts`、13个 `routes.ts`、13个 `types.ts` | 迁移文件名 | - |
| Phase 3 | `core/serviceContainer.ts`、13个 `README.md` | `App.tsx` | - |

### B. 参考资源

- [Keep 项目架构](https://github.com/keephq/keep) - Provider 插件模式、分层架构
- [Ongrid 项目架构](https://github.com/ongridio/ongrid) - DDD 限界上下文、Composition Root
- [Feature-Sliced Design](https://feature-sliced.design/) - 前端模块化设计方法论
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html) - 分层架构原则
