import { useParams, useNavigate } from 'react-router-dom';
import { useTimeEntry } from '../hooks/useApi';
import LoadingSpinner from '../components/LoadingSpinner';

export default function TimeEntryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: timeEntryData, isLoading } = useTimeEntry(parseInt(id || '0'));

  const timeEntry = timeEntryData?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!timeEntry) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="card p-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Time Entry Not Found</h2>
          <button onClick={() => navigate(-1)} className="btn-secondary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const getEntryHours = (entry: any) => {
    return typeof entry.duration_hours === 'string' ? parseFloat(entry.duration_hours) : (entry.duration_hours || 0);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-900 mb-2"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Time Entry Details</h1>
        </div>
      </div>

      {/* Details Card */}
      <div className="card p-6">
        <div className="space-y-6">
          {/* Date and Status */}
          <div>
            <label className="text-sm font-medium text-gray-500">Date</label>
            <p className="text-lg font-semibold text-gray-900 mt-1">
              {new Date(timeEntry.entry_date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>

          {/* Status */}
          <div>
            <label className="text-sm font-medium text-gray-500">Status</label>
            <div className="mt-1">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                timeEntry.status === 'approved' ? 'bg-green-100 text-green-800' :
                timeEntry.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                timeEntry.status === 'rejected' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {timeEntry.status}
              </span>
            </div>
          </div>

          {/* Project */}
          {timeEntry.project && (
            <div>
              <label className="text-sm font-medium text-gray-500">Project</label>
              <p className="text-lg font-semibold text-gray-900 mt-1">{timeEntry.project.name}</p>
            </div>
          )}

          {/* Duration */}
          <div>
            <label className="text-sm font-medium text-gray-500">Duration</label>
            <p className="text-lg font-semibold text-gray-900 mt-1">{getEntryHours(timeEntry).toFixed(2)} hours</p>
          </div>

          {/* Time Range */}
          {timeEntry.start_time && timeEntry.end_time && (
            <div>
              <label className="text-sm font-medium text-gray-500">Time Range</label>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {timeEntry.start_time} - {timeEntry.end_time}
              </p>
            </div>
          )}

          {/* Task Description */}
          {timeEntry.task_description && (
            <div>
              <label className="text-sm font-medium text-gray-500">Task Description</label>
              <p className="text-gray-900 mt-1">{timeEntry.task_description}</p>
            </div>
          )}

          {/* Notes */}
          {timeEntry.notes && (
            <div>
              <label className="text-sm font-medium text-gray-500">Notes</label>
              <p className="text-gray-900 mt-1">{timeEntry.notes}</p>
            </div>
          )}

          {/* Hourly Rate */}
          {timeEntry.hourly_rate && (
            <div>
              <label className="text-sm font-medium text-gray-500">Hourly Rate</label>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                ${parseFloat(timeEntry.hourly_rate).toFixed(2)}/hour
              </p>
            </div>
          )}

          {/* Created and Updated Dates */}
          {timeEntry.created_at && (
            <div>
              <label className="text-sm font-medium text-gray-500">Created</label>
              <p className="text-gray-900 mt-1">
                {new Date(timeEntry.created_at).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          )}

          {timeEntry.updated_at && (
            <div>
              <label className="text-sm font-medium text-gray-500">Last Updated</label>
              <p className="text-gray-900 mt-1">
                {new Date(timeEntry.updated_at).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

