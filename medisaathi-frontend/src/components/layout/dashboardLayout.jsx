import { useState }    from 'react';
import { Menu, Bell }  from 'lucide-react';
import Sidebar         from './sidebar.jsx';
import { useAuth }     from '../../context/authContext.jsx';
import Avatar          from '../ui/avatar.jsx';

const DashboardLayout = ({ children, title, subtitle }) => {
  const { user }               = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 h-16 flex items-center justify-between px-4 sm:px-6 shrink-0 shadow-sm">

          {/* Left: hamburger + title */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              {title && (
                <h1 className="text-lg font-semibold text-gray-800 leading-none">{title}</h1>
              )}
              {subtitle && (
                <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Right: user info */}
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors relative">
              <Bell className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Avatar name={user?.name} size="sm" />
              <span className="text-sm font-medium text-gray-700 hidden sm:block">
                {user?.name}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;