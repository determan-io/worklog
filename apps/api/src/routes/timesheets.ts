import { Router } from 'express';
import { TimesheetController } from '../controllers/timesheetController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router: Router = Router();
const timesheetController = new TimesheetController();

// Apply authentication middleware
const authMiddleware = authenticateToken;

// GET /timesheets - List all timesheets
router.get('/', authMiddleware, timesheetController.getTimesheets);

// GET /timesheets/:id - Get specific timesheet
router.get('/:id', authMiddleware, timesheetController.getTimesheet);

// POST /timesheets - Create new timesheet
router.post('/', authMiddleware, timesheetController.createTimesheet);

// PUT /timesheets/:id - Update timesheet
router.put('/:id', authMiddleware, timesheetController.updateTimesheet);

// POST /timesheets/:id/submit - Submit timesheet for approval
router.post('/:id/submit', authMiddleware, timesheetController.submitTimesheet);

// POST /timesheets/:id/approve - Approve timesheet
router.post('/:id/approve', authMiddleware, requireRole(['admin', 'manager']), timesheetController.approveTimesheet);

// POST /timesheets/:id/reject - Reject timesheet
router.post('/:id/reject', authMiddleware, requireRole(['admin', 'manager']), timesheetController.rejectTimesheet);

// DELETE /timesheets/:id - Delete timesheet
router.delete('/:id', authMiddleware, timesheetController.deleteTimesheet);

export default router;
