import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { User, ITCheckEntry, ActivityLog } from '../types';
import { apiClient } from '../lib/api';

interface AppState {
  currentUser: User | null;
  entries: ITCheckEntry[];
  users: User[];
  activityLogs: ActivityLog[];
  isLoading: boolean;
}

type AppAction = 
  | { type: 'LOGIN'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'ADD_ENTRY'; payload: ITCheckEntry }
  | { type: 'UPDATE_ENTRY'; payload: ITCheckEntry }
  | { type: 'DELETE_ENTRY'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOAD_ENTRIES'; payload: ITCheckEntry[] }
  | { type: 'ADD_USER'; payload: User }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'DELETE_USER'; payload: string }
  | { type: 'LOAD_USERS'; payload: User[] }
  | { type: 'ADD_ACTIVITY_LOG'; payload: ActivityLog }
  | { type: 'LOAD_ACTIVITY_LOGS'; payload: ActivityLog[] };

const initialState: AppState = {
  currentUser: null,
  entries: [],
  users: [],
  activityLogs: [],
  isLoading: true,
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  addEntry: (entry: Omit<ITCheckEntry, 'id' | 'addedBy' | 'timestamp'>) => Promise<void>;
  updateEntry: (entry: ITCheckEntry) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  logActivity: (action: ActivityLog['action'], targetId?: string, targetName?: string, details?: string) => void;
  migrateLocalDataToDatabase: () => Promise<void>;
} | undefined>(undefined);

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, currentUser: action.payload };
    case 'LOGOUT':
      return { ...state, currentUser: null };
    case 'ADD_ENTRY':
      return { ...state, entries: [...state.entries, action.payload] };
    case 'UPDATE_ENTRY':
      return {
        ...state,
        entries: state.entries.map(entry =>
          entry.id === action.payload.id ? action.payload : entry
        ),
      };
    case 'DELETE_ENTRY':
      return {
        ...state,
        entries: state.entries.filter(entry => entry.id !== action.payload),
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'LOAD_ENTRIES':
      return { ...state, entries: action.payload };
    case 'ADD_USER':
      return { ...state, users: [...state.users, action.payload] };
    case 'UPDATE_USER':
      return {
        ...state,
        users: state.users.map(user =>
          user.id === action.payload.id ? action.payload : user
        ),
      };
    case 'DELETE_USER':
      return {
        ...state,
        users: state.users.filter(user => user.id !== action.payload),
      };
    case 'LOAD_USERS':
      return { ...state, users: action.payload };
    case 'ADD_ACTIVITY_LOG':
      return { ...state, activityLogs: [...state.activityLogs, action.payload] };
    case 'LOAD_ACTIVITY_LOGS':
      return { ...state, activityLogs: action.payload };
    default:
      return state;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load data from MySQL database on app start
  React.useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // Check if user is already logged in
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const { user } = await apiClient.getCurrentUser();
          dispatch({ type: 'LOGIN', payload: user });
          await loadAppData();
        } catch (error) {
          // Token is invalid, clear it
          apiClient.clearToken();
          // Fall back to mock data if database connection fails
          console.log('Database not available, using mock data');
          loadMockData();
        }
      } else {
        // No token, try to load from database anyway to test connection
        try {
          // Just test the connection without authentication
          await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/health`);
          console.log('Database connection available');
        } catch (error) {
          console.log('Database not available, using mock data');
          loadMockData();
        }
      }
    } catch (error) {
      console.error('Error initializing app:', error);
      // Fall back to mock data
      loadMockData();
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const loadAppData = async () => {
    try {
      // Load IT check entries
      const entries = await apiClient.getITCheckEntries();
      dispatch({ type: 'LOAD_ENTRIES', payload: entries });

      // Load users (global-admin only)
      try {
        const users = await apiClient.getUsers();
        dispatch({ type: 'LOAD_USERS', payload: users });
      } catch (error) {
        // User doesn't have permission to view users
        console.log('User does not have permission to view users');
      }

      // Load activity logs (global-admin only)
      try {
        const logs = await apiClient.getActivityLogs();
        dispatch({ type: 'LOAD_ACTIVITY_LOGS', payload: logs });
      } catch (error) {
        // User doesn't have permission to view activity logs
        console.log('User does not have permission to view activity logs');
      }
    } catch (error) {
      console.error('Error loading app data:', error);
      // Fall back to mock data if database fails
      loadMockData();
    }
  };

  const migrateLocalDataToDatabase = async () => {
    alert('Data migration is no longer needed. All data is now stored in MySQL automatically.');
  };

  const loadMockData = () => {
    // Fallback to empty data if database is unavailable
    dispatch({ type: 'LOAD_ENTRIES', payload: [] });
    dispatch({ type: 'LOAD_USERS', payload: [] });
    dispatch({ type: 'LOAD_ACTIVITY_LOGS', payload: [] });
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await apiClient.login(username, password);
      dispatch({ type: 'LOGIN', payload: response.user });
      await loadAppData();
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    dispatch({ type: 'LOGOUT' });
  };

  const addEntry = async (entryData: Omit<ITCheckEntry, 'id' | 'addedBy' | 'timestamp'>) => {
    if (!state.currentUser) return;

    try {
      await apiClient.createITCheckEntry(entryData);
      const entries = await apiClient.getITCheckEntries();
      dispatch({ type: 'LOAD_ENTRIES', payload: entries });
    } catch (error) {
      console.error('Error adding entry:', error);
      throw error;
    }
  };

  const updateEntry = async (entry: ITCheckEntry) => {
    try {
      await apiClient.updateITCheckEntry(entry.id, entry);
      const entries = await apiClient.getITCheckEntries();
      dispatch({ type: 'LOAD_ENTRIES', payload: entries });
    } catch (error) {
      console.error('Error updating entry:', error);
      throw error;
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      await apiClient.deleteITCheckEntry(id);
      const entries = await apiClient.getITCheckEntries();
      dispatch({ type: 'LOAD_ENTRIES', payload: entries });
    } catch (error) {
      console.error('Error deleting entry:', error);
      throw error;
    }
  };

  const addUser = async (userData: Omit<User, 'id'>) => {
    try {
      await apiClient.createUser(userData);
      const users = await apiClient.getUsers();
      dispatch({ type: 'LOAD_USERS', payload: users });
    } catch (error) {
      console.error('Error adding user:', error);
      throw error;
    }
  };

  const updateUser = async (user: User) => {
    try {
      await apiClient.updateUser(user.id, user);
      const users = await apiClient.getUsers();
      dispatch({ type: 'LOAD_USERS', payload: users });
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await apiClient.deleteUser(id);
      const users = await apiClient.getUsers();
      dispatch({ type: 'LOAD_USERS', payload: users });
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };

  const logActivity = (action: ActivityLog['action'], targetId?: string, targetName?: string, details?: string) => {
    // Activity logging is handled automatically by the backend middleware
    // No need to manually log activities
  };

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        login,
        logout,
        addEntry,
        updateEntry,
        deleteEntry,
        addUser,
        updateUser,
        deleteUser,
        logActivity,
        migrateLocalDataToDatabase,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};