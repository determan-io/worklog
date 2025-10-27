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

// GET /api/v1/time-entries/uuid/:uuid - Get single time entry by UUID
router.get('/uuid/:uuid', timeEntryController.getTimeEntryByUuid.bind(timeEntryController));

// GET /api/v1/time-entries/:id - Get single time entry by ID (deprecated, use UUID)
router.get('/:id', timeEntryController.getTimeEntry.bind(timeEntryController));

// PUT /api/v1/time-entries/uuid/:uuid - Update time entry by UUID
router.put('/uuid/:uuid', timeEntryController.updateTimeEntryByUuid.bind(timeEntryController));

// PUT /api/v1/time-entries/:id - Update time entry by ID (deprecated, use UUID)
router.put('/:id', timeEntryController.updateTimeEntry.bind(timeEntryController));

// DELETE /api/v1/time-entries/uuid/:uuid - Delete time entry by UUID
router.delete('/uuid/:uuid', timeEntryController.deleteTimeEntryByUuid.bind(timeEntryController));

// DELETE /api/v1/time-entries/:id - Delete time entry by ID (deprecated, use UUID)
router.delete('/:id', timeEntryController.deleteTimeEntry.bind(timeEntryController));

export default router;
