import { Router } from 'express';
import { syncLotteryData, getLotteryStats, getLatestRecords } from '../services/lotteryService.js';

const router = Router();

// GET /api/lottery/latest
router.get('/latest', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 10;
  try {
    const records = getLatestRecords(limit);
    res.json({ success: true, data: records });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/lottery/stats
router.get('/stats', (req, res) => {
  try {
    const stats = getLotteryStats();
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/lottery/sync
router.post('/sync', async (req, res) => {
  try {
    const result = await syncLotteryData();
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
