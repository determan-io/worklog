import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useProjects, useCreateTimeEntry, useUpdateTimeEntry, useTimeEntries } from '../hooks/useApi';
import LoadingSpinner from '../components/LoadingSpinner';

export default function TimeEntryFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { data: projectsData } = useProjects({ is_active: 'true' });
  const { data: timeEntriesData, isLoading: timeEntriesLoading } = useTimeEntries();
  const createTimeEntryMutation = useCreateTimeEntry();
  const updateTimeEntryMutation = useUpdateTimeEntry();
  
  const projects = projectsData?.data || [];
  const timeEntries = timeEntriesData?.data || [];
  
  // Determine form type from URL
  const isWeeklyTimesheet = location.pathname.includes('/weekly');
  const isEditMode = !!id;
  
  // Single entry state
  const [entry, setEntry] = useState({
    project_id: '',
    entry_date: '',
    duration_hours: '',
    task_description: '',
    hourly_rate: '',
    notes: ''
  });

  // Load entry data when in edit mode
  useEffect(() => {
    if (isEditMode && id && timeEntries.length > 0) {
      const foundEntry = timeEntries.find((e: any) => e.id === parseInt(id));
      if (foundEntry) {
        setEntry({
          project_id: foundEntry.project_id,
          entry_date: foundEntry.entry_date ? new Date(foundEntry.entry_date).toISOString().split('T')[0] : '',
          duration_hours: foundEntry.duration_hours?.toString() || '',
          task_description: foundEntry.task_description || '',
          hourly_rate: foundEntry.hourly_rate?.toString() || '',
          notes: foundEntry.notes || ''
        });
      }
    }
  }, [id, isEditMode, timeEntries]);
  
  // Weekly timesheet state
  const [weeklyTimesheet, setWeeklyTimesheet] = useState({
    project_id: '',
    week_start_date: '',
    entries: {
      monday: { task_description: '', hours: '', notes: '' },
      tuesday: { task_description: '', hours: '', notes: '' },
      wednesday: { task_description: '', hours: '', notes: '' },
      thursday: { task_description: '', hours: '', notes: '' },
      friday: { task_description: '', hours: '', notes: '' },
      saturday: { task_description: '', hours: '', notes: '' },
      sunday: { task_description: '', hours: '', notes: '' }
    }
  });
  
  const [errors, setErrors] = useState<any>({});
  
  const handleProjectChange = (projectId: string) => {
    const project = projects.find((p: any) => p.id === projectId);
    setEntry({ ...entry, project_id: projectId });
  };
  
  const handleWeeklyProjectChange = (projectId: string) => {
    const project = projects.find((p: any) => p.id === projectId);
    setWeeklyTimesheet({ ...weeklyTimesheet, project_id: projectId });
  };

  // Get Monday of the week for any given date
  const getMondayOfWeek = (dateString: string): string => {
    if (!dateString) return '';
    
    // Parse date string as local date to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Calculate days to subtract to get to Monday
    // Monday is day 1, so subtract (dayOfWeek - 1) days
    // But handle Sunday (day 0) specially: subtract 6 days
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const monday = new Date(date);
    monday.setDate(date.getDate() - diff);
    
    // Return as YYYY-MM-DD format
    const yearStr = monday.getFullYear();
    const monthStr = String(monday.getMonth() + 1).padStart(2, '0');
    const dayStr = String(monday.getDate()).padStart(2, '0');
    
    return `${yearStr}-${monthStr}-${dayStr}`;
  };

  const handleWeekStartDateChange = (dateString: string) => {
    const monday = getMondayOfWeek(dateString);
    setWeeklyTimesheet({ ...weeklyTimesheet, week_start_date: monday });
  };
  
  const handleCreateWeeklyTimesheet = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate the dates for each day of the week
    const weekStart = new Date(weeklyTimesheet.week_start_date);
    const dates = [
      new Date(weekStart),
      new Date(weekStart.getTime() + 1 * 24 * 60 * 60 * 1000),
      new Date(weekStart.getTime() + 2 * 24 * 60 * 60 * 1000),
      new Date(weekStart.getTime() + 3 * 24 * 60 * 60 * 1000),
      new Date(weekStart.getTime() + 4 * 24 * 60 * 60 * 1000),
      new Date(weekStart.getTime() + 5 * 24 * 60 * 60 * 1000),
      new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000)
    ];
    
    const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    try {
      // Create entries for each day of the week
      for (let i = 0; i < dayNames.length; i++) {
        const day = dayNames[i];
        const entry = weeklyTimesheet.entries[day as keyof typeof weeklyTimesheet.entries];
        const hours = entry.hours || '0'; // Use 0 if empty
        
        await createTimeEntryMutation.mutateAsync({
          project_id: weeklyTimesheet.project_id,
          entry_date: dates[i].toISOString().split('T')[0],
          duration_hours: hours,
          task_description: entry.task_description || `${day.charAt(0).toUpperCase() + day.slice(1)} work`,
          notes: entry.notes
        });
      }
      
      navigate('/time-tracking');
    } catch (error) {
      console.error('Failed to create weekly timesheet:', error);
      alert('Failed to create weekly timesheet.');
    }
  };
  
  const handleCreateTimeEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditMode && id) {
        // Don't send project_id when updating (it can't be changed)
        const { project_id, ...updateData } = entry;
        await updateTimeEntryMutation.mutateAsync({ id: parseInt(id), data: updateData });
      } else {
        await createTimeEntryMutation.mutateAsync(entry);
      }
      navigate('/time-tracking');
    } catch (error) {
      console.error(isEditMode ? 'Failed to update time entry:' : 'Failed to create time entry:', error);
      alert(isEditMode ? 'Failed to update time entry.' : 'Failed to create time entry.');
    }
  };
  
  if (isEditMode && timeEntriesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isWeeklyTimesheet ? 'Create Weekly Timesheet' : isEditMode ? 'Edit Time Entry' : 'Add Time Entry'}
          </h1>
          <p className="mt-2 text-gray-600">
            {isWeeklyTimesheet 
              ? 'Create time entries for the entire week' 
              : isEditMode 
              ? 'Update your time entry'
              : 'Log your time on a project'}
          </p>
        </div>
        <button
          className="btn-secondary btn-md"
          onClick={() => navigate('/time-tracking')}
        >
          Cancel
        </button>
      </div>
      
      <div className="card p-8">
        {isWeeklyTimesheet ? (
          // Weekly Timesheet Form
          <form onSubmit={handleCreateWeeklyTimesheet} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="weekly_project_id" className="label mb-1">Project *</label>
                <select
                  id="weekly_project_id"
                  className={`input ${errors['project_id'] ? 'border-red-500' : ''}`}
                  value={weeklyTimesheet.project_id}
                  onChange={(e) => handleWeeklyProjectChange(e.target.value)}
                  required
                >
                  <option value="">Select a project</option>
                  {projects
                    .filter((project: any) => project.billing_model === 'timesheet')
                    .map((project: any) => (
                      <option key={project.id} value={project.id}>
                        {project.name} - {project.customer?.name}
                      </option>
                    ))}
                </select>
                <p className="text-sm text-gray-600 mt-1">
                  📅 Weekly timecard project - creates entries for the entire week
                </p>
              </div>
              <div>
                <label htmlFor="week_start_date" className="label mb-1">Week Start Date (Monday) *</label>
                <input
                  type="date"
                  id="week_start_date"
                  className={`input ${errors['week_start_date'] ? 'border-red-500' : ''}`}
                  value={weeklyTimesheet.week_start_date}
                  onChange={(e) => handleWeekStartDateChange(e.target.value)}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 Selected date will automatically adjust to the Monday of that week
                </p>
              </div>
            </div>
            
            {/* Monday - Sunday entries */}
            <div className="space-y-3 mt-6">
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day, index) => {
                // Calculate the date for this day
                const getDayDate = () => {
                  if (!weeklyTimesheet.week_start_date) return '';
                  const [year, month, dayNum] = weeklyTimesheet.week_start_date.split('-').map(Number);
                  const weekStart = new Date(year, month - 1, dayNum);
                  const dayDate = new Date(weekStart);
                  dayDate.setDate(weekStart.getDate() + index);
                  
                  // Format as MM/DD/YYYY
                  const monthStr = String(dayDate.getMonth() + 1).padStart(2, '0');
                  const dayStr = String(dayDate.getDate()).padStart(2, '0');
                  const yearStr = dayDate.getFullYear();
                  return `${monthStr}/${dayStr}/${yearStr}`;
                };

                return (
                <div key={day} className="border rounded p-4 bg-gray-50">
                  <h4 className="text-sm font-medium text-gray-700 mb-2 capitalize">{day} ({getDayDate()})</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label htmlFor={`${day}_hours`} className="label mb-1 text-xs">Hours</label>
                      <input
                        type="number"
                        id={`${day}_hours`}
                        className="input text-sm"
                        value={weeklyTimesheet.entries[day as keyof typeof weeklyTimesheet.entries].hours}
                        onChange={(e) => {
                          const newEntries = { ...weeklyTimesheet.entries };
                          newEntries[day as keyof typeof newEntries].hours = e.target.value;
                          setWeeklyTimesheet({ ...weeklyTimesheet, entries: newEntries });
                        }}
                        placeholder="0"
                        step="0.25"
                        min="0"
                      />
                    </div>
                    <div className="col-span-2">
                      <label htmlFor={`${day}_description`} className="label mb-1 text-xs">Task Description</label>
                      <input
                        type="text"
                        id={`${day}_description`}
                        className="input text-sm"
                        value={weeklyTimesheet.entries[day as keyof typeof weeklyTimesheet.entries].task_description}
                        onChange={(e) => {
                          const newEntries = { ...weeklyTimesheet.entries };
                          newEntries[day as keyof typeof newEntries].task_description = e.target.value;
                          setWeeklyTimesheet({ ...weeklyTimesheet, entries: newEntries });
                        }}
                        placeholder="What did you work on?"
                      />
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                className="btn-secondary btn-md"
                onClick={() => navigate('/time-tracking')}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary btn-md flex items-center gap-2"
                disabled={createTimeEntryMutation.isPending}
              >
                {createTimeEntryMutation.isPending ? 'Creating...' : 'Create Weekly Timesheet'}
              </button>
            </div>
          </form>
        ) : (
          // Single Time Entry Form
          <form onSubmit={handleCreateTimeEntry} className="space-y-6">
            <div>
              <label htmlFor="project_id" className="label mb-1">Project *</label>
              {isEditMode ? (
                <input
                  id="project_id"
                  type="text"
                  className="input bg-gray-100"
                  value={projects.find((p: any) => p.id === entry.project_id)?.name || 'Unknown Project'}
                  disabled
                  readOnly
                />
              ) : (
                <>
                  <select
                    id="project_id"
                    className={`input ${errors['project_id'] ? 'border-red-500' : ''}`}
                    value={entry.project_id}
                    onChange={(e) => handleProjectChange(e.target.value)}
                    required
                  >
                    <option value="">Select a project</option>
                    {projects
                      .filter((project: any) => project.billing_model === 'task-based')
                      .map((project: any) => (
                        <option key={project.id} value={project.id}>
                          {project.name} - {project.customer?.name}
                        </option>
                      ))}
                  </select>
                  <p className="text-sm text-gray-600 mt-1">
                    🎯 Task-based project - can add multiple entries per day
                  </p>
                </>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="entry_date" className="label mb-1">Date *</label>
                <input
                  type="date"
                  id="entry_date"
                  className={`input ${errors['entry_date'] ? 'border-red-500' : ''}`}
                  value={entry.entry_date}
                  onChange={(e) => setEntry({ ...entry, entry_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <label htmlFor="duration_hours" className="label mb-1">Duration (hours) *</label>
                <input
                  type="number"
                  id="duration_hours"
                  className={`input ${errors['duration_hours'] ? 'border-red-500' : ''}`}
                  value={entry.duration_hours}
                  onChange={(e) => setEntry({ ...entry, duration_hours: e.target.value })}
                  placeholder="e.g., 2.5 (for 2 hours 30 min)"
                  step="0.25"
                  min="0.25"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  1.25 = 1 hour 15 min, 0.5 = 30 min, 1.0 = 1 hour
                </p>
              </div>
            </div>
            
            <div>
              <label htmlFor="task_description" className="label mb-1">Task Description *</label>
              <textarea
                id="task_description"
                className={`input ${errors['task_description'] ? 'border-red-500' : ''}`}
                rows={3}
                value={entry.task_description}
                onChange={(e) => setEntry({ ...entry, task_description: e.target.value })}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="hourly_rate" className="label mb-1">Hourly Rate</label>
                <input
                  type="number"
                  id="hourly_rate"
                  className="input"
                  value={entry.hourly_rate}
                  onChange={(e) => setEntry({ ...entry, hourly_rate: e.target.value })}
                  placeholder="e.g., 150"
                  step="0.01"
                />
              </div>
              <div>
                <label htmlFor="notes" className="label mb-1">Notes</label>
                <input
                  type="text"
                  id="notes"
                  className="input"
                  value={entry.notes}
                  onChange={(e) => setEntry({ ...entry, notes: e.target.value })}
                  placeholder="Additional notes"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                className="btn-secondary btn-md"
                onClick={() => navigate('/time-tracking')}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary btn-md flex items-center gap-2"
                disabled={createTimeEntryMutation.isPending || updateTimeEntryMutation.isPending}
              >
                {createTimeEntryMutation.isPending || updateTimeEntryMutation.isPending 
                  ? (isEditMode ? 'Updating...' : 'Adding...') 
                  : (isEditMode ? 'Update Time Entry' : 'Add Time Entry')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

