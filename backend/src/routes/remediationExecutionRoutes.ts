import { Router, Request, Response } from 'express';
import { remediationService } from '../services/remediationService';
import { logger } from '../utils/logger';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const filters = {
      policy_id: req.query.policy_id as string | undefined,
      alert_id: req.query.alert_id as string | undefined,
      status: req.query.status as string | undefined,
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined
    };

    const result = remediationService.listExecutions(filters);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Failed to list remediation executions:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to list executions'
    });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const execution = remediationService.getExecution(req.params.id);
    res.json({ success: true, data: execution });
  } catch (error) {
    logger.error('Failed to get remediation execution:', error);
    res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : 'Execution not found'
    });
  }
});

router.post('/:id/approve', (req: Request, res: Response) => {
  try {
    const { action, comment } = req.body;
    const userId = (req as any).user?.id || 'system';

    if (action !== 'approve' && action !== 'reject') {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be "approve" or "reject"'
      });
    }

    remediationService.approveExecution(req.params.id, action, userId, comment);
    res.json({ success: true, message: `Execution ${action}d` });
  } catch (error) {
    logger.error('Failed to approve execution:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to approve execution'
    });
  }
});

router.post('/:id/retry', (req: Request, res: Response) => {
  try {
    remediationService.retryExecution(req.params.id);
    res.json({ success: true, message: 'Execution retried' });
  } catch (error) {
    logger.error('Failed to retry execution:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to retry execution'
    });
  }
});

export default router;
