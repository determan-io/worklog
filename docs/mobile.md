# WorkLog Mobile App Documentation

## Overview
The WorkLog mobile app is built with React Native and Expo, designed specifically for employees to track their time efficiently. The app supports offline functionality and syncs data when connectivity is available.

## Features

### Core Time Tracking
- **Start/Stop Timer**: One-tap time tracking with visual indicators
- **Manual Time Entry**: Add time entries manually with project and task details
- **Project Selection**: Easy switching between assigned projects
- **Task Descriptions**: Add detailed descriptions for time entries
- **Notes**: Additional notes for time entries

### Offline Support
- **Local Storage**: SQLite database for offline data storage
- **Sync Queue**: Pending operations queued for sync
- **Background Sync**: Automatic sync when connectivity restored
- **Conflict Resolution**: Server-side conflict resolution

### User Experience
- **Intuitive Interface**: Clean, simple design focused on time tracking
- **Quick Actions**: Fast project switching and timer controls
- **Visual Feedback**: Progress indicators and status updates
- **Push Notifications**: Reminders and sync notifications

## App Architecture

### Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── common/         # Common components (Button, Input, etc.)
│   ├── time-tracking/  # Time tracking specific components
│   └── project/        # Project related components
├── screens/            # Screen components
│   ├── auth/           # Authentication screens
│   ├── home/           # Main dashboard
│   ├── projects/       # Project selection
│   ├── time-entries/   # Time entry management
│   └── settings/       # App settings
├── navigation/         # Navigation configuration
│   ├── AppNavigator.tsx
│   ├── AuthNavigator.tsx
│   └── MainNavigator.tsx
├── services/           # API and data services
│   ├── api/            # API client
│   ├── auth/           # Authentication service
│   ├── sync/           # Sync service
│   └── storage/        # Local storage service
├── store/              # State management
│   ├── slices/         # Redux slices
│   └── store.ts        # Store configuration
├── storage/            # Local database
│   ├── database.ts     # SQLite configuration
│   ├── models/         # Data models
│   └── migrations/     # Database migrations
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── constants/          # App constants
```

### Navigation Structure
```
AppNavigator
├── AuthNavigator (when not authenticated)
│   ├── LoginScreen
│   └── OrganizationSelectionScreen
└── MainNavigator (when authenticated)
    ├── HomeScreen
    ├── ProjectsScreen
    ├── TimeEntriesScreen
    ├── TimerScreen
    └── SettingsScreen
```

## Key Screens

### 1. Login Screen
- **Purpose**: User authentication and organization selection
- **Features**:
  - Username/password input
  - Organization selection dropdown
  - Biometric authentication (optional)
  - Remember me functionality

### 2. Home Screen
- **Purpose**: Main dashboard with quick actions
- **Features**:
  - Active timer display
  - Quick start timer button
  - Recent projects list
  - Today's time summary
  - Sync status indicator

### 3. Project Selection Screen
- **Purpose**: Select project for time tracking
- **Features**:
  - List of assigned projects
  - Search and filter projects
  - Project details preview
  - Quick start timer for project

### 4. Timer Screen
- **Purpose**: Active time tracking interface
- **Features**:
  - Large timer display
  - Start/stop/pause controls
  - Project and task information
  - Notes input
  - Background timer support

### 5. Time Entries Screen
- **Purpose**: View and manage time entries
- **Features**:
  - List of time entries
  - Filter by date, project, status
  - Edit/delete time entries
  - Manual time entry form
  - Sync status for each entry

## Offline Architecture

### Local Database (SQLite)
```sql
-- Time entries table
CREATE TABLE time_entries (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  task_description TEXT,
  start_time TEXT,
  end_time TEXT,
  duration_minutes INTEGER,
  is_timer_active INTEGER DEFAULT 0,
  is_billable INTEGER DEFAULT 1,
  notes TEXT,
  sync_status TEXT DEFAULT 'pending', -- pending, syncing, synced, error
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  billing_model TEXT NOT NULL,
  status TEXT NOT NULL,
  is_billable INTEGER DEFAULT 1,
  last_sync TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Sync queue table
CREATE TABLE sync_queue (
  id TEXT PRIMARY KEY,
  operation TEXT NOT NULL, -- create, update, delete
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  data TEXT NOT NULL, -- JSON data
  retry_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### Sync Strategy
1. **Background Sync**: Periodic sync every 5 minutes when online
2. **Manual Sync**: User-triggered sync via pull-to-refresh
3. **Conflict Resolution**: Server-side resolution with client notification
4. **Retry Logic**: Exponential backoff for failed syncs

### Offline Indicators
- **Sync Status**: Visual indicators for sync status
- **Connection Status**: Network connectivity indicator
- **Pending Changes**: Count of unsynced changes
- **Last Sync**: Timestamp of last successful sync

## State Management

### Redux Store Structure
```typescript
interface RootState {
  auth: {
    isAuthenticated: boolean;
    user: User | null;
    organization: Organization | null;
    token: string | null;
  };
  projects: {
    items: Project[];
    loading: boolean;
    error: string | null;
  };
  timeEntries: {
    items: TimeEntry[];
    activeTimer: TimeEntry | null;
    loading: boolean;
    error: string | null;
  };
  sync: {
    isOnline: boolean;
    isSyncing: boolean;
    lastSync: string | null;
    pendingChanges: number;
  };
  ui: {
    theme: 'light' | 'dark';
    language: string;
  };
}
```

### Key Actions
```typescript
// Authentication
const login = createAsyncThunk('auth/login', async (credentials) => {});
const logout = createAction('auth/logout');

// Projects
const fetchProjects = createAsyncThunk('projects/fetch', async () => {});
const selectProject = createAction('projects/select');

// Time Entries
const startTimer = createAsyncThunk('timeEntries/startTimer', async (projectId) => {});
const stopTimer = createAsyncThunk('timeEntries/stopTimer', async (entryId) => {});
const createTimeEntry = createAsyncThunk('timeEntries/create', async (entry) => {});

// Sync
const syncData = createAsyncThunk('sync/syncData', async () => {});
const setOnlineStatus = createAction('sync/setOnlineStatus');
```

## API Integration

### API Client Configuration
```typescript
const apiClient = axios.create({
  baseURL: 'https://api.worklog.com/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
apiClient.interceptors.request.use((config) => {
  const token = store.getState().auth.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      store.dispatch(logout());
    }
    return Promise.reject(error);
  }
);
```

### Offline-First API Calls
```typescript
const createTimeEntry = async (entry: TimeEntry) => {
  try {
    // Save to local database first
    const localEntry = await localDB.timeEntries.create(entry);
    
    // Queue for sync
    await syncQueue.add('create', 'time_entries', localEntry.id, entry);
    
    // Try to sync immediately if online
    if (isOnline) {
      await syncData();
    }
    
    return localEntry;
  } catch (error) {
    throw new Error('Failed to create time entry');
  }
};
```

## Push Notifications

### Notification Types
- **Timer Reminders**: Remind users to start/stop timers
- **Sync Notifications**: Notify when sync completes
- **Project Updates**: Notify when projects are updated
- **Timesheet Reminders**: Remind users to submit timesheets

### Implementation
```typescript
import * as Notifications from 'expo-notifications';

// Request permissions
const requestPermissions = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

// Schedule timer reminder
const scheduleTimerReminder = async (minutes: number) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Timer Reminder',
      body: 'Don\'t forget to track your time!',
    },
    trigger: {
      seconds: minutes * 60,
    },
  });
};
```

## Performance Optimization

### Image Optimization
- Use Expo Image component for optimized image loading
- Implement lazy loading for project images
- Cache frequently used images

### List Performance
- Use FlatList for large lists
- Implement pagination for time entries
- Use getItemLayout for better performance

### Memory Management
- Clean up timers and listeners on unmount
- Implement proper component cleanup
- Use React.memo for expensive components

## Testing

### Unit Tests
```typescript
// Example test for time entry creation
describe('TimeEntryService', () => {
  it('should create time entry locally', async () => {
    const entry = {
      project_id: 'project-1',
      task_description: 'Test task',
      start_time: new Date(),
      end_time: new Date(),
    };
    
    const result = await timeEntryService.create(entry);
    expect(result.id).toBeDefined();
    expect(result.sync_status).toBe('pending');
  });
});
```

### Integration Tests
- Test offline/online sync functionality
- Test authentication flow
- Test timer functionality
- Test data persistence

### E2E Tests
- Test complete user workflows
- Test offline scenarios
- Test sync behavior
- Test error handling

## Deployment

### Development
```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android
```

### Production Build
```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to app stores
eas submit --platform ios
eas submit --platform android
```

### App Store Configuration
- **iOS**: Configure in App Store Connect
- **Android**: Configure in Google Play Console
- **App Icons**: Generate all required sizes
- **Screenshots**: Create for all device sizes
- **Privacy Policy**: Required for app store submission

## Security Considerations

### Data Protection
- Encrypt sensitive data in local storage
- Use secure token storage
- Implement certificate pinning
- Validate all user inputs

### Authentication
- Store tokens securely
- Implement token refresh
- Handle authentication errors gracefully
- Support biometric authentication

### Network Security
- Use HTTPS for all API calls
- Implement request signing
- Validate server certificates
- Handle network errors gracefully