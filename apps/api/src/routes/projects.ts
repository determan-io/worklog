import { Router } from 'express';
import { ProjectController } from '../controllers/projectController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router: Router = Router();
const projectController = new ProjectController();

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/v1/projects - Get projects
router.get('/', projectController.getProjects.bind(projectController));

// GET /api/v1/projects/:id - Get project details
router.get('/:id', projectController.getProject.bind(projectController));

// POST /api/v1/projects - Create project (admin/manager only)
router.post('/', requireRole(['admin', 'manager']), projectController.createProject.bind(projectController));

// PUT /api/v1/projects/:id - Update project (admin/manager only)
router.put('/:id', requireRole(['admin', 'manager']), projectController.updateProject.bind(projectController));

export default router;
