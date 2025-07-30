import { Router, Request, Response } from 'express';
import { atlasMonitoring } from '../services/atlasMonitoring.service';
import { protect, restrictTo } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Protect all monitoring routes - admin only
router.use(protect);
router.use(restrictTo('admin'));

/**
 * Get cluster health status
 */
router.get('/health', async (req: Request, res: Response, next: any) => {
  try {
    if (!atlasMonitoring.isConfigured()) {
      return res.status(200).json({
        status: 'ok',
        monitoring: 'disabled',
        message: 'Atlas monitoring not configured'
      });
    }
    
    const clusterStatus = await atlasMonitoring.getClusterStatus();
    const dbStats = await atlasMonitoring.getDatabaseStats();
    const alerts = await atlasMonitoring.getRecentAlerts(5);
    
    res.status(200).json({
      status: 'ok',
      monitoring: 'enabled',
      cluster: clusterStatus,
      database: dbStats,
      activeAlerts: alerts.length,
      alerts: alerts.map(alert => ({
        id: alert.id,
        eventType: alert.eventTypeName,
        status: alert.status,
        created: alert.created
      }))
    });
  } catch (error) {
    next(new AppError('Failed to fetch monitoring data', 500));
  }
});

/**
 * Check if scaling is needed
 */
router.get('/scaling-check', async (req: Request, res: Response, next: any) => {
  try {
    const result = await atlasMonitoring.checkScalingNeeded();
    
    res.status(200).json({
      scalingNeeded: result.needed,
      reason: result.reason,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(new AppError('Failed to check scaling status', 500));
  }
});

/**
 * Create a manual backup
 */
router.post('/backup', async (req: Request, res: Response, next: any) => {
  try {
    const { description } = req.body;
    
    const success = await atlasMonitoring.createSnapshot('Cluster0', description);
    
    if (!success) {
      throw new AppError('Failed to create backup', 500);
    }
    
    res.status(201).json({
      success: true,
      message: 'Backup initiated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get database metrics for dashboard
 */
router.get('/metrics', async (req: Request, res: Response, next: any) => {
  try {
    const [clusterStatus, dbStats, alerts] = await Promise.all([
      atlasMonitoring.getClusterStatus(),
      atlasMonitoring.getDatabaseStats(),
      atlasMonitoring.getRecentAlerts()
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        cluster: clusterStatus,
        database: dbStats,
        alerts: alerts,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(new AppError('Failed to fetch metrics', 500));
  }
});

export default router;