import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Users, BarChart3,
  Hospital, LogOut, X, ChevronRight
} from 'lucide-react';
import { useAuth }  from '../../context/authContext.jsx';
import { useToast } from '../../context/toastContext.jsx';
import { ROLES }    from '../../utils/constants.js';
import Avatar       from '../ui/avatar.jsx';
import logo         from '../../assets/logo.png';

// Nav items per role
const NAV_ITEMS = {
  [ROLES.SUPER_ADMIN]: [
    { label: 'Dashboard',    path: '/superadmin',           icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Hospitals',    path: '/superadmin/hospitals', icon: <Hospital        className="w-5 h-5" /> },
    { label: 'Analytics',    path: '/superadmin/analytics', icon: <BarChart3       className="w-5 h-5" /> },
  ],
  [ROLES.OVERALL_ADMIN]: [
    { label: 'Dashboard',    path: '/admin',                icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'My Hospital',  path: '/my-hospital',          icon: <Hospital        className="w-5 h-5" /> },
    { label: 'Branches',     path: '/admin/branches',       icon: <Building2       className="w-5 h-5" /> },
    { label: 'Staff',        path: '/admin/staff',          icon: <Users           className="w-5 h-5" /> },
    { label: 'Analytics',    path: '/admin/analytics',      icon: <BarChart3       className="w-5 h-5" /> },
  ],
  [ROLES.BRANCH_ADMIN]: [
    { label: 'Dashboard',    path: '/admin',                icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'My Hospital',  path: '/my-hospital',          icon: <Hospital        className="w-5 h-5" /> },
    { label: 'Branches',     path: '/admin/branches',       icon: <Building2       className="w-5 h-5" /> },
    { label: 'Staff',        path: '/admin/staff',          icon: <Users           className="w-5 h-5" /> },
    { label: 'Analytics',    path: '/admin/analytics',      icon: <BarChart3       className="w-5 h-5" /> },
  ],
  [ROLES.STAFF]: [
    { label: 'Queue',        path: '/staff',                icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'My Hospital',  path: '/my-hospital',          icon: <Hospital        className="w-5 h-5" /> },
  ],
};

const ROLE_LABELS = {
  super_admin:   'Super Admin',
  overall_admin: 'Overall Admin',
  branch_admin:  'Branch Admin',
  staff:         'Staff',
};

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { success }      = useToast();
  const navigate         = useNavigate();

  const navItems = NAV_ITEMS[user?.role] || [];

  const handleLogout = async () => {
    await logout();
    success('Logged out successfully');
    navigate('/');
  };

  return (
    <>
      {/* Overlay — mobile only */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-brand-900 text-white z-40
        flex flex-col transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:h-screen
      `}>

        {/* Logo + close */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-brand-800">
          <div className="flex items-center gap-2">
            <img src={logo} alt="MediSaathi" className="w-8 h-8 object-contain" />
            <span className="font-bold text-lg">MediSaathi</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-brand-300 hover:text-white hover:bg-brand-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User info */}
        <div className="px-5 py-4 border-b border-brand-800">
          <div className="flex items-center gap-3">
            <Avatar name={user?.name} size="md" />
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-brand-300">{ROLE_LABELS[user?.role]}</p>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path.split('/').length <= 2}
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl
                text-sm font-medium transition-all duration-150
                ${isActive
                  ? 'bg-brand-600 text-white'
                  : 'text-brand-200 hover:bg-brand-800 hover:text-white'
                }
              `}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                {item.label}
              </div>
              <ChevronRight className="w-4 h-4 opacity-40" />
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-brand-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-brand-200 hover:bg-red-500/20 hover:text-red-300 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;