import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTimeEntries, useDeleteTimeEntry, useUpdateTimeEntry } from '../hooks/useApi';
import LoadingSpinner from '../components/LoadingSpinner';

export default function TimeTrackingPage() {
  const navigate = useNavigate();
  const { data: timeEntriesData, isLoading: timeEntriesLoading, refetch } = useTimeEntries();
  const deleteTimeEntryMutation = useDeleteTimeEntry();
  const updateTimeEntryMutation = useUpdateTimeEntry();

  const timeEntries = timeEntriesData?.data || [];
  const isLoading = timeEntriesLoading;

  // Status filter state
  const [statusFilter, setStatusFilter] = useState('all');

  // Check if entry is editable (draft or rejected)
  const isEditable = (status: string) => ['draft', 'rejected'].includes(status);

  // Check if entry can be submitted (draft only)
  const canSubmit = (status: string) => status === 'draft';

  // Group time entries by week (for weekly timesheets)
  const groupEntriesByWeek = (entries: any[]) => {
    // Group by project_id first
    const byProject: { [key: string]: any[] } = {};
    
    entries.forEach((entry) => {
      if (!byProject[entry.project_id]) {
        byProject[entry.project_id] = [];
      }
      byProject[entry.project_id].push(entry);
    });
    
    const processedEntries: any[] = [];
    
    // For each project, check if entries form weeks
    Object.keys(byProject).forEach((projectId) => {
      const projectEntries = byProject[projectId].sort((a, b) => 
        new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime()
      );
      
      // Look for consecutive groups of 7 days
      let i = 0;
      while (i < projectEntries.length) {
        const weekEntries = [projectEntries[i]];
        
        // Look for entries that are consecutive days
        for (let j = i + 1; j < projectEntries.length; j++) {
          const currentDate = new Date(projectEntries[j].entry_date);
          const prevDate = new Date(projectEntries[j - 1].entry_date);
          
          const dayDiff = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (dayDiff === 1 && weekEntries.length < 7) {
            // Consecutive day
            weekEntries.push(projectEntries[j]);
          } else {
            break;
          }
        }
        
        if (weekEntries.length >= 3) {
          // This is a weekly timesheet - group them together
          const dates = weekEntries.map(e => new Date(e.entry_date).toISOString().split('T')[0]);
          const totalHours = weekEntries.reduce((sum, e) => 
            sum + parseFloat(e.duration_hours || '0'), 0
          );
          
          // Get Monday of the week
          const firstDayOfWeek = new Date(dates[0]);
          const dayOfWeek = firstDayOfWeek.getDay();
          const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          const monday = new Date(firstDayOfWeek);
          monday.setDate(firstDayOfWeek.getDate() - diff);
          
          processedEntries.push({
            ...weekEntries[0],
            isWeekGroup: true,
            weekEntries: weekEntries,
            weekStartDate: monday.toISOString().split('T')[0],
            totalHours,
            entry_count: weekEntries.length
          });
        } else {
          // Single entries
          weekEntries.forEach(entry => processedEntries.push(entry));
        }
        
        i += weekEntries.length;
      }
    });
    
    return processedEntries;
  };

  // Filter entries by status
  const filteredEntries = statusFilter === 'all' 
    ? timeEntries 
    : timeEntries.filter((entry: any) => entry.status === statusFilter);
  
  const groupedEntries = groupEntriesByWeek(filteredEntries);

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this time entry?')) {
      try {
        await deleteTimeEntryMutation.mutateAsync(id);
        refetch();
      } catch (error) {
        console.error('Failed to delete time entry:', error);
      }
    }
  };

  const handleSubmit = async (id: number) => {
    try {
      await updateTimeEntryMutation.mutateAsync({ id, data: { status: 'submitted' } });
      refetch();
    } catch (error) {
      console.error('Failed to submit time entry:', error);
      alert('Failed to submit time entry.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Time Tracking</h1>
          <p className="mt-2 text-gray-600">
            Track your time on projects
          </p>
        </div>
        <div className="flex gap-3">
          <button
            className="btn-primary btn-md flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
            onClick={() => navigate('/time-tracking/add')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Time Entry
          </button>
          <button
            className="btn-secondary btn-md flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
            onClick={() => navigate('/time-tracking/weekly')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            Create Weekly Timesheet
          </button>
        </div>
      </div>

      {/* Time Entries List */}
      <div className="card p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Recent Time Entries</h3>
          <div className="flex items-center gap-2">
            <label htmlFor="status-filter" className="text-sm text-gray-700">Filter:</label>
            <select
              id="status-filter"
              className="input btn-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : groupedEntries.length > 0 ? (
          <div className="space-y-4">
            {groupedEntries.map((entry: any) => (
              <div key={entry.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {entry.isWeekGroup ? (
                      <>
                        <h4 className="text-lg font-medium text-gray-900">
                          <button 
                            onClick={() => navigate(`/time-entries/${entry.weekEntries[0].uuid}`)}
                            className="text-gray-900 hover:text-blue-600 hover:underline transition-colors"
                          >
                            Weekly Timesheet - {entry.task_description}
                          </button>
                        </h4>
                        <div className="mt-1 text-sm text-gray-600">
                          <p>📋 {entry.project?.name} - {entry.project?.customer?.name}</p>
                          <p>
                            📅 <button 
                              onClick={() => navigate(`/time-entries/${entry.weekEntries[0].uuid}`)}
                              className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                            >
                              Week of {new Date(entry.weekStartDate).toLocaleDateString()}
                            </button>
                          </p>
                          <p>⏱️ {entry.totalHours.toFixed(2)} hours total ({entry.entry_count} days)</p>
                          {entry.hourly_rate && (
                            <p>💰 ${parseFloat(entry.hourly_rate).toFixed(2)}/hour</p>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <h4 className="text-lg font-medium text-gray-900">{entry.task_description}</h4>
                        <div className="mt-1 text-sm text-gray-600">
                          <p>📋 {entry.project?.name} - {entry.project?.customer?.name}</p>
                          {entry.entry_date && (
                            <p>
                              📅 <button 
                                onClick={() => navigate(`/time-entries/${entry.uuid}`)}
                                className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                              >
                                {new Date(entry.entry_date).toLocaleDateString()}
                              </button>
                            </p>
                          )}
                          {entry.duration_hours && (
                            <p>⏱️ {parseFloat(entry.duration_hours).toFixed(2)} hours</p>
                          )}
                          {entry.hourly_rate && (
                            <p>💰 ${parseFloat(entry.hourly_rate).toFixed(2)}/hour</p>
                          )}
                        </div>
                        {entry.notes && (
                          <p className="mt-2 text-sm text-gray-500">{entry.notes}</p>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      className="btn-outline btn-sm flex items-center gap-1 hover:bg-gray-50 transition-all duration-200"
                      onClick={() => navigate(`/time-entries/${entry.uuid || entry.weekEntries[0].uuid}`)}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Details
                    </button>
                    {isEditable(entry.status) && (
                      <>
                        <button 
                          className="btn-outline btn-sm flex items-center gap-1 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                          onClick={() => navigate(`/time-tracking/edit/${entry.id}`)}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button 
                          className="btn-outline btn-sm flex items-center gap-1 hover:bg-red-50 hover:border-red-300 transition-all duration-200 text-red-600"
                          onClick={() => handleDelete(entry.id)}
                          disabled={deleteTimeEntryMutation.isPending}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          {deleteTimeEntryMutation.isPending ? 'Deleting...' : 'Delete'}
                        </button>
                      </>
                    )}
                    {canSubmit(entry.status) && (
                      <button 
                        className="btn-primary btn-sm flex items-center gap-1 hover:bg-green-600 transition-all duration-200"
                        onClick={() => handleSubmit(entry.id)}
                        disabled={updateTimeEntryMutation.isPending}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {updateTimeEntryMutation.isPending ? 'Submitting...' : 'Submit'}
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex justify-end space-x-2 mt-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    entry.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                    entry.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                    entry.status === 'approved' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {entry.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <p>No time entries yet</p>
            <p className="text-sm mt-1">Add your first time entry to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
