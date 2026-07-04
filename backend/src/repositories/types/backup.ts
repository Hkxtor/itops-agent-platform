// backup 模块的表由自身 service 管理，类型在 backupService/backupTypes.ts 中定义
// 此处不重复定义，直接 re-export

export type { BackupInfo, BackupConfig } from '../../modules/backup/services/backupTypes';
