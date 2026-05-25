import db from '../database';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';

export async function initRemediationPolicies(): Promise<void> {
  const existingCount = db.prepare('SELECT COUNT(*) as count FROM remediation_policies').get() as { count: number };
  
  if (existingCount.count > 0) {
    return;
  }
  
  logger.info('Initializing default remediation policies...');
  
  const policies = [
    {
      id: uuidv4(),
      name: '磁盘空间不足自动清理',
      description: '当磁盘使用率超过阈值时，自动清理日志和临时文件',
      alert_source: 'zabbix',
      alert_severity: 'high',
      alert_keywords: JSON.stringify(['disk', 'space', 'full']),
      alert_tags: JSON.stringify(['storage', 'disk']),
      execution_mode: 'approval',
      workflow_id: null,
      workflow_params: JSON.stringify({
        server_id: '{{alert.host}}',
        cleanup_paths: ['/var/log', '/tmp'],
        threshold: 90
      }),
      max_executions_per_hour: 3,
      cooldown_seconds: 600,
      enable_verification: 1,
      verification_params: JSON.stringify({
        server_id: '{{alert.host}}',
        check_disk_usage: true
      }),
      verification_timeout_seconds: 120,
      enable_rollback: 0,
      rollback_on_failure: 0
    },
    {
      id: uuidv4(),
      name: '服务宕机自动重启',
      description: '当检测到服务宕机时，自动尝试重启服务',
      alert_source: 'zabbix',
      alert_severity: 'disaster',
      alert_keywords: JSON.stringify(['down', 'stopped', 'unreachable']),
      alert_tags: JSON.stringify(['service', 'process']),
      execution_mode: 'auto',
      workflow_id: null,
      workflow_params: JSON.stringify({
        server_id: '{{alert.host}}',
        service_name: '{{alert.service}}'
      }),
      max_executions_per_hour: 5,
      cooldown_seconds: 300,
      enable_verification: 1,
      verification_params: JSON.stringify({
        server_id: '{{alert.host}}',
        check_service_status: '{{alert.service}}'
      }),
      verification_timeout_seconds: 60,
      enable_rollback: 1,
      rollback_on_failure: 0
    },
    {
      id: uuidv4(),
      name: '高 CPU 使用率处理',
      description: '当 CPU 使用率持续过高时，分析原因并提供建议',
      alert_source: 'zabbix',
      alert_severity: 'warning',
      alert_keywords: JSON.stringify(['cpu', 'high', 'load']),
      alert_tags: JSON.stringify(['performance', 'cpu']),
      execution_mode: 'suggestion',
      workflow_id: null,
      workflow_params: JSON.stringify({
        server_id: '{{alert.host}}',
        collect_top_processes: true
      }),
      max_executions_per_hour: 2,
      cooldown_seconds: 1800,
      enable_verification: 0,
      verification_params: null,
      verification_timeout_seconds: 60,
      enable_rollback: 0,
      rollback_on_failure: 0
    }
  ];
  
  const insertStmt = db.prepare(`
    INSERT INTO remediation_policies (
      id, name, description, alert_source, alert_severity,
      alert_keywords, alert_tags, execution_mode, workflow_id,
      workflow_params, max_executions_per_hour, cooldown_seconds,
      enable_verification, verification_params, verification_timeout_seconds,
      enable_rollback, rollback_on_failure
    ) VALUES (
      @id, @name, @description, @alert_source, @alert_severity,
      @alert_keywords, @alert_tags, @execution_mode, @workflow_id,
      @workflow_params, @max_executions_per_hour, @cooldown_seconds,
      @enable_verification, @verification_params, @verification_timeout_seconds,
      @enable_rollback, @rollback_on_failure
    )
  `);
  
  const insertMany = db.transaction((ps: typeof policies) => {
    for (const p of ps) {
      insertStmt.run(p);
    }
  });
  
  insertMany(policies);
  
  logger.info(`Created ${policies.length} default remediation policies`);
}
