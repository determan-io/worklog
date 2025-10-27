import { useTimeEntries, useProjects, useOrganizations } from '../hooks/useApi';
import LoadingSpinner from '../components/LoadingSpinner';

export default function DashboardPage() {
  const { data: timeEntriesData, isLoading: timeEntriesLoading } = useTimeEntries({ 
    limit: 5,
    start_date: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
    end_date: new Date(new Date().setHours(23, 59, 59, 999)).toISOString()
  });
  
  const { data: projectsData, isLoading: projectsLoading } = useProjects({ status: 'active' });
  const { isLoading: orgsLoading } = useOrganizations();

  const isLoading = timeEntriesLoading || projectsLoading || orgsLoading;

  // Calculate today's time
  const todayEntries = timeEntriesData?.data || [];
  const todayMinutes = todayEntries.reduce((total: number, entry: any) => {
    return total + (entry.duration_minutes || 0);
  }, 0);
  const todayHours = Math.floor(todayMinutes / 60);
  const todayRemainingMinutes = todayMinutes % 60;

  // Calculate this week's time
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const { data: weekEntriesData } = useTimeEntries({
    start_date: weekStart.toISOString(),
    end_date: weekEnd.toISOString()
  });

  const weekEntries = weekEntriesData?.data || [];
  const weekMinutes = weekEntries.reduce((total: number, entry: any) => {
    return total + (entry.duration_minutes || 0);
  }, 0);
  const weekHours = Math.floor(weekMinutes / 60);
  const weekRemainingMinutes = weekMinutes % 60;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome to your WorkLog dashboard
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900">Today's Time</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {todayHours}h {todayRemainingMinutes}m
          </p>
        </div>
        
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900">This Week</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {weekHours}h {weekRemainingMinutes}m
          </p>
        </div>
        
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900">Active Projects</h3>
          <p className="text-3xl font-bold text-purple-600 mt-2">
            {projectsData?.data?.length || 0}
          </p>
        </div>
        
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900">Recent Entries</h3>
          <p className="text-3xl font-bold text-orange-600 mt-2">
            {todayEntries.length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Time Entries</h3>
          {todayEntries.length > 0 ? (
            <div className="space-y-3">
              {todayEntries.slice(0, 5).map((entry: any) => (
                <div key={entry.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="font-medium text-gray-900">{entry.task_description}</p>
                    <p className="text-sm text-gray-500">{entry.project?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {Math.floor((entry.duration_minutes || 0) / 60)}h {(entry.duration_minutes || 0) % 60}m
                    </p>
                    <p className="text-sm text-gray-500">
                      {entry.start_time ? new Date(entry.start_time).toLocaleTimeString() : 'N/A'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              No time entries today
            </div>
          )}
        </div>
        
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <a href="/time-tracking" className="btn-primary btn-md w-full block text-center">
              Add Time Entry
            </a>
            <a href="/projects" className="btn-outline btn-md w-full block text-center">
              View Projects
            </a>
            <a href="/customers" className="btn-outline btn-md w-full block text-center">
              View Customers
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
