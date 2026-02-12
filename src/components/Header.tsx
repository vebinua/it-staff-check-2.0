import React from 'react';
import { LogOut, User, Shield, Settings, Activity } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface HeaderProps {
  onNavigate: (page: 'dashboard' | 'users' | 'activity') => void;
  currentPage: 'dashboard' | 'users' | 'activity';
}

export function Header({ onNavigate, currentPage }: HeaderProps) {
  const { state, logout, migrateLocalDataToDatabase } = useApp();
  const [showMigrationModal, setShowMigrationModal] = React.useState(false);

  const isAdmin = state.currentUser?.role === 'admin';
  const isGlobalAdmin = state.currentUser?.role === 'global-admin';

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Shield className="w-5 h-5 text-blue-600 mr-3" />
            <h1 className="text-xl font-semibold text-gray-900">
              IT Asset Management System
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-gray-500" />
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
                <span className="text-gray-700 font-medium text-sm">
                  {state.currentUser?.name}
                </span>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                state.currentUser?.role === 'global-admin'
                  ? 'bg-blue-100 text-blue-800'
                  : state.currentUser?.role === 'module-admin'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {state.currentUser?.role?.toUpperCase()}
              </span>
            </div>
            
            {isGlobalAdmin && (
              <button
                onClick={() => onNavigate('users')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors h-9 text-sm ${
                  currentPage === 'users'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                title="Manage Users"
              >
                <Settings className="w-5 h-5" />
                <span>Users</span>
              </button>
            )}

            {isGlobalAdmin && (
              <button
                onClick={() => onNavigate('activity')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors h-9 text-sm ${
                  currentPage === 'activity'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                title="View Activity Log"
              >
                <Activity className="w-5 h-5" />
                <span>Activity</span>
              </button>
            )}

            <button
              onClick={logout}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors h-9 text-sm"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {showMigrationModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Migrate Local Data</h3>
            <p className="text-sm text-gray-600 mb-6">
              This will transfer your local sample data to the MySQL database.
              Make sure your database is connected first.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowMigrationModal(false)}
                className="h-10 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowMigrationModal(false);
                  await migrateLocalDataToDatabase();
                }}
                className="h-10 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Migrate Data
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}