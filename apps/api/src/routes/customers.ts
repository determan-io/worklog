import { Router } from 'express';
import { CustomerController } from '../controllers/customerController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router: Router = Router();
const customerController = new CustomerController();

// Apply authentication middleware
const authMiddleware = authenticateToken;

// GET /customers - List all customers
router.get('/', authMiddleware, customerController.getCustomers);

// GET /customers/:id - Get specific customer
router.get('/:id', authMiddleware, customerController.getCustomer);

// GET /customers/:id/stats - Get customer statistics
router.get('/:id/stats', authMiddleware, customerController.getCustomerStats);

// POST /customers - Create new customer
router.post('/', authMiddleware, requireRole(['admin', 'manager']), customerController.createCustomer);

// PUT /customers/:id - Update customer
router.put('/:id', authMiddleware, requireRole(['admin', 'manager']), customerController.updateCustomer);

// DELETE /customers/:id - Delete customer
router.delete('/:id', authMiddleware, requireRole(['admin']), customerController.deleteCustomer);

export default router;
