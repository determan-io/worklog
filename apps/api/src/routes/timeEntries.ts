import { Router } from 'express';
import { TimeEntryController } from '../controllers/timeEntryController';
import { authenticateToken } from '../middleware/auth';

const router: Router = Router();
const timeEntryController = new TimeEntryController();

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/v1/time-entries - Get time entries
router.get('/', timeEntryController.getTimeEntries.bind(timeEntryController));

// POST /api/v1/time-entries - Create time entry
router.post('/', timeEntryController.createTimeEntry.bind(timeEntryController));

// GET /api/v1/time-entries/:id - Get single time entry (must be before PUT/DELETE)
router.get('/:id', timeEntryController.getTimeEntry.bind(timeEntryController));

// PUT /api/v1/time-entries/:id - Update time entry
router.put('/:id', timeEntryController.updateTimeEntry.bind(timeEntryController));

// DELETE /api/v1/time-entries/:id - Delete time entry
router.delete('/:id', timeEntryController.deleteTimeEntry.bind(timeEntryController));

export default router;
