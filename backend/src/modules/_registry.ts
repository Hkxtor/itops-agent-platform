/**
 * 模块路由自动注册器
 * 
 * 新增模块只需：
 * 1. 在模块目录下创建 routes.ts（导出 Router）
 * 2. 在此文件中添加一行配置
 * 
 * 无需手动修改 app.ts
 */

import { Express, Router } from 'express';
import { rateLimiter } from '../middleware/rateLimiter';
import { webhookIpFilter } from '../middleware/rateLimiter';

// 模块路由导入
import aiRoutes from './ai/routes';
import alertRoutes from './alerts/routes';
import autoRoutes from './auto/routes';
import containerRoutes from './containers/routes';
import databaseRoutes from './database/routes';
import dcRoutes from './dc/routes';
import infraRoutes from './infra/routes';
import kubernetesRoutes from './kubernetes/routes';
import monitorRoutes from './monitor/routes';
import networkRoutes from './network/routes';
import serverRoutes from './servers/routes';
import workflowRoutes from './workflow/routes';

// Auth 模块：auth 路由公开，user 路由受保护
import authOnlyRoutes from './auth/routes/authRoutes';
import userRoutes from './auth/routes/userRoutes';

// 特殊路由：挂载在 /api 根路径下（不归属特定模块前缀）
import alertAutoRouter from './alerts/routes/alertAutoRoutes';
import linkageRouter from './infra/routes/linkageRoutes';
import networkDiscoveryRouter from './network/routes/networkDiscoveryRoutes';
import alertCorrelationRouter from './alerts/routes/alertCorrelationRoutes';

// Webhook 路由（公开，需要 IP 过滤）
import webhookRoutes from './infra/routes/webhookRoutes';

interface ModuleConfig {
  path: string;
  router: Router;
  options?: {
    public?: boolean;       // 公开路由（不需要认证）
    webhook?: boolean;      // Webhook 路由（不需要认证，需要 IP 过滤）
    noRateLimit?: boolean;  // 不需要速率限制
  };
}

/**
 * 模块路由配置表
 * 
 * 添加新模块时，在此数组中添加一项即可
 */
const modules: ModuleConfig[] = [
  // === 公开路由（不需要认证） ===
  { path: '/api/auth', router: authOnlyRoutes, options: { public: true } },
  { path: '/api/webhooks', router: webhookRoutes, options: { webhook: true } },

  // === 受保护路由（需要认证 + 速率限制） ===
  { path: '/api', router: aiRoutes },
  { path: '/api', router: alertRoutes },
  { path: '/api', router: autoRoutes },
  { path: '/api', router: containerRoutes },
  { path: '/api', router: databaseRoutes },
  { path: '/api', router: dcRoutes },
  { path: '/api', router: infraRoutes },
  { path: '/api', router: kubernetesRoutes },
  { path: '/api', router: monitorRoutes },
  { path: '/api', router: networkRoutes },
  { path: '/api', router: serverRoutes },
  { path: '/api', router: workflowRoutes },
  { path: '/api', router: userRoutes },

  // === 特殊路由：挂载在 /api 根路径 ===
  { path: '/api', router: alertAutoRouter },
  { path: '/api', router: linkageRouter },
  { path: '/api', router: networkDiscoveryRouter },
  { path: '/api', router: alertCorrelationRouter },
];

/**
 * 注册所有模块路由到 Express 应用
 */
export function registerAllModules(app: Express): void {
  for (const mod of modules) {
    if (mod.options?.webhook) {
      // Webhook 路由：IP 过滤 + 速率限制
      app.use(mod.path, webhookIpFilter, rateLimiter, mod.router);
    } else if (mod.options?.public) {
      // 公开路由：仅速率限制
      app.use(mod.path, rateLimiter, mod.router);
    } else if (mod.options?.noRateLimit) {
      // 无速率限制
      app.use(mod.path, mod.router);
    } else {
      // 受保护路由：速率限制（认证在 app.ts 中统一处理）
      app.use(mod.path, rateLimiter, mod.router);
    }
  }
}
