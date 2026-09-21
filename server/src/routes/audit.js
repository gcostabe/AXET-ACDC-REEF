import { Router } from 'express';
import { getRteDb } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET /api/audit/changelog (Admin only)
router.get('/changelog', requireAdmin, async (req, res) => {
  try {
    const db = getRteDb();
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 15));
    const search = req.query.search;

    const filter = {};
    if (search) {
      filter.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { userEmail: { $regex: search, $options: 'i' } },
        { entityId: { $regex: search, $options: 'i' } },
        { formulaName: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await db.collection('AUDIT_CHANGELOG').countDocuments(filter);
    const logs = await db.collection('AUDIT_CHANGELOG')
      .find(filter)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      logs
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
