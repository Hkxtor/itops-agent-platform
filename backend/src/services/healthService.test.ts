import { describe, it, expect, beforeEach } from 'vitest';
import { HealthService, SystemHealth } from './healthService';

describe('HealthService', () => {
  let healthService: HealthService;

  beforeEach(() => {
    healthService = new HealthService();
  });

  describe('checkHealth', () => {
    it('should return health check with valid structure', async () => {
      const health = await healthService.checkHealth();
      
      expect(health).toBeDefined();
      expect(health.status).toBeDefined();
      expect(health.timestamp).toBeDefined();
      expect(health.uptime).toBeGreaterThanOrEqual(0);
      expect(health.version).toBeDefined();
    });

    it('should include system information', async () => {
      const health = await healthService.checkHealth();
      
      expect(health.system).toBeDefined();
      expect(health.system.platform).toBeDefined();
      expect(health.system.arch).toBeDefined();
      expect(health.system.nodeVersion).toBeDefined();
      expect(health.system.processUptime).toBeGreaterThanOrEqual(0);
      expect(health.system.pid).toBeGreaterThan(0);
    });

    it('should include memory information', async () => {
      const health = await healthService.checkHealth();
      
      expect(health.memory).toBeDefined();
      expect(health.memory.total).toBeGreaterThan(0);
      expect(health.memory.used).toBeGreaterThan(0);
      expect(health.memory.free).toBeGreaterThan(0);
      expect(health.memory.percentUsed).toBeGreaterThan(0);
      expect(health.memory.percentUsed).toBeLessThanOrEqual(100);
      expect(health.memory.rss).toBeGreaterThan(0);
      expect(health.memory.heapTotal).toBeGreaterThan(0);
      expect(health.memory.heapUsed).toBeGreaterThan(0);
    });

    it('should include CPU information', async () => {
      const health = await healthService.checkHealth();
      
      expect(health.cpu).toBeDefined();
      expect(health.cpu.cores).toBeGreaterThan(0);
      expect(health.cpu.loadAverage).toBeDefined();
      expect(health.cpu.loadAverage.length).toBeGreaterThan(0);
      expect(health.cpu.model).toBeDefined();
      expect(health.cpu.usagePercent).toBeGreaterThanOrEqual(0);
    });

    it('should include disk information', async () => {
      const health = await healthService.checkHealth();
      
      expect(health.disk).toBeDefined();
      expect(health.disk.databaseSize).toBeGreaterThanOrEqual(0);
      expect(health.disk.logSize).toBeGreaterThanOrEqual(0);
      expect(health.disk.backupSize).toBeGreaterThanOrEqual(0);
    });

    it('should include database information', async () => {
      const health = await healthService.checkHealth();
      
      expect(health.database).toBeDefined();
      expect(health.database.status).toBeDefined();
      expect(health.database.latencyMs).toBeGreaterThanOrEqual(0);
      expect(health.database.openConnections).toBeGreaterThanOrEqual(0);
      expect(health.database.size).toBeGreaterThanOrEqual(0);
      expect(health.database.tableCount).toBeGreaterThan(0);
    });

    it('should include websocket information', async () => {
      const health = await healthService.checkHealth();
      
      expect(health.websocket).toBeDefined();
      expect(health.websocket.status).toBeDefined();
      expect(health.websocket.activeConnections).toBeGreaterThanOrEqual(0);
    });

    it('should include health checks', async () => {
      const health = await healthService.checkHealth();
      
      expect(health.checks).toBeDefined();
      expect(health.checks.length).toBeGreaterThan(0);
      
      const checkNames = health.checks.map(c => c.name);
      expect(checkNames).toContain('memory_usage');
      expect(checkNames).toContain('cpu_load');
      expect(checkNames).toContain('database');
      expect(checkNames).toContain('uptime');
    });

    it('should include performance metrics', async () => {
      const health = await healthService.checkHealth();
      
      expect(health.performance).toBeDefined();
      expect(health.performance.avgResponseTime).toBeGreaterThanOrEqual(0);
      expect(health.performance.p95ResponseTime).toBeGreaterThanOrEqual(0);
      expect(health.performance.p99ResponseTime).toBeGreaterThanOrEqual(0);
      expect(health.performance.requestsPerMinute).toBeGreaterThanOrEqual(0);
    });

    it('should have valid status', async () => {
      const health = await healthService.checkHealth();
      
      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.status);
    });
  });

  describe('getHealthSummary', () => {
    it('should return health summary', () => {
      const summary = healthService.getHealthSummary();
      
      expect(summary).toBeDefined();
      expect(summary.currentStatus).toBeDefined();
      expect(summary.uptime).toBeGreaterThanOrEqual(0);
      expect(summary.historyCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getHealthHistory', () => {
    it('should return health history array', () => {
      const history = healthService.getHealthHistory();
      
      expect(Array.isArray(history)).toBe(true);
    });

    it('should include history after health check', async () => {
      await healthService.checkHealth();
      const history = healthService.getHealthHistory();
      
      expect(history.length).toBeGreaterThan(0);
    });
  });

  describe('getLastCheck', () => {
    it('should return null before first check', () => {
      const freshService = new HealthService();
      expect(freshService.getLastCheck()).toBeNull();
    });

    it('should return last check result after health check', async () => {
      await healthService.checkHealth();
      const lastCheck = healthService.getLastCheck();
      
      expect(lastCheck).not.toBeNull();
      expect(lastCheck?.timestamp).toBeDefined();
    });
  });
});
