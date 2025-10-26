import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';

const router: Router = Router();
const userController = new UserController();

// Apply authentication to all routes
router.use(authenticateToken);

// POST /api/v1/users - Create a new user
router.post('/', userController.createUser.bind(userController));

// PUT /api/v1/users/uuid/:uuid - Update user information by UUID
router.put('/uuid/:uuid', userController.updateUserByUuid.bind(userController));

// GET /api/v1/users/uuid/:uuid - Get user details by UUID
router.get('/uuid/:uuid', userController.getUserByUuid.bind(userController));

// PUT /api/v1/users/:id - Update user information (deprecated, use UUID)
router.put('/:id', userController.updateUser.bind(userController));

// GET /api/v1/users/:id - Get user details (deprecated, use UUID)
router.get('/:id', userController.getUserById.bind(userController));

// GET /api/v1/users - Get users in the authenticated user's organization (must be last)
router.get('/', userController.getUsers.bind(userController));

export default router;

