import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';

const router: Router = Router();
const userController = new UserController();

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/v1/users - Get users in the authenticated user's organization
router.get('/', userController.getUsers.bind(userController));

// GET /api/v1/users/:id - Get user details
router.get('/:id', userController.getUserById.bind(userController));

export default router;

