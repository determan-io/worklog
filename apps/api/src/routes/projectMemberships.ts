import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import projectMembershipController from '../controllers/projectMembershipController';

const router: Router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get all members of a project
router.get('/projects/:projectId/members', projectMembershipController.getProjectMembers.bind(projectMembershipController));

// Get all projects for a user
router.get('/users/:userId/projects', projectMembershipController.getUserProjects.bind(projectMembershipController));

// Add a user to a project
router.post('/projects/:projectId/members', projectMembershipController.addMember.bind(projectMembershipController));

// Update project membership
router.put('/memberships/:membershipId', projectMembershipController.updateMember.bind(projectMembershipController));

// Remove a user from a project
router.delete('/memberships/:membershipId', projectMembershipController.removeMember.bind(projectMembershipController));

export default router;

