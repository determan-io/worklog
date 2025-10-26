import { Router } from 'express';
import { SowController } from '../controllers/sowController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router: Router = Router();
const sowController = new SowController();

// Apply authentication middleware
const authMiddleware = authenticateToken;

// GET /sows - List all SOWs
router.get('/', authMiddleware, sowController.getSows);

// GET /sows/:id - Get specific SOW
router.get('/:id', authMiddleware, sowController.getSow);

// GET /sows/:id/stats - Get SOW statistics
router.get('/:id/stats', authMiddleware, sowController.getSowStats);

// POST /sows - Create new SOW
router.post('/', authMiddleware, requireRole(['admin', 'manager']), sowController.createSow);

// PUT /sows/:id - Update SOW
router.put('/:id', authMiddleware, requireRole(['admin', 'manager']), sowController.updateSow);

// DELETE /sows/:id - Delete SOW
router.delete('/:id', authMiddleware, requireRole(['admin']), sowController.deleteSow);

export default router;
