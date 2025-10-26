import { Router } from 'express';
import { OrganizationController } from '../controllers/organizationController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router: Router = Router();
const organizationController = new OrganizationController();

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/v1/organizations - Get user's organizations
router.get('/', organizationController.getUserOrganizations.bind(organizationController));

// GET /api/v1/organizations/:id - Get organization details
router.get('/:id', organizationController.getOrganization.bind(organizationController));

// PUT /api/v1/organizations/:id - Update organization (admin/manager only)
router.put('/:id', requireRole(['admin', 'manager']), organizationController.updateOrganization.bind(organizationController));

export default router;
