import { Router } from 'express';
import { BillingController } from '../controllers/billingController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router: Router = Router();
const billingController = new BillingController();

// Apply authentication middleware
const authMiddleware = authenticateToken;

// GET /billing/batches - List all billing batches
router.get('/batches', authMiddleware, billingController.getBillingBatches);

// GET /billing/batches/stats - Get billing statistics
router.get('/batches/stats', authMiddleware, billingController.getBillingStats);

// GET /billing/batches/:id - Get specific billing batch
router.get('/batches/:id', authMiddleware, billingController.getBillingBatch);

// POST /billing/batches - Create new billing batch
router.post('/batches', authMiddleware, requireRole(['admin', 'manager']), billingController.createBillingBatch);

// PUT /billing/batches/:id - Update billing batch
router.put('/batches/:id', authMiddleware, requireRole(['admin', 'manager']), billingController.updateBillingBatch);

// POST /billing/batches/:id/items - Add items to billing batch
router.post('/batches/:id/items', authMiddleware, requireRole(['admin', 'manager']), billingController.addBillingItems);

// DELETE /billing/batches/:id/items/:itemId - Remove item from billing batch
router.delete('/batches/:id/items/:itemId', authMiddleware, requireRole(['admin', 'manager']), billingController.removeBillingItem);

// DELETE /billing/batches/:id - Delete billing batch
router.delete('/batches/:id', authMiddleware, requireRole(['admin']), billingController.deleteBillingBatch);

export default router;
