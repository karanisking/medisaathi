import { useState }          from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, User, ChevronDown } from 'lucide-react';
import { useAuth }  from '../../context/authContext.jsx';
import { useToast } from '../../context/toastContext.jsx';
import Avatar       from '../ui/avatar.jsx';
import { ROLES }    from '../../utils/constants.js';
import logo         from '../../assets/logo.png';

const ROLE_LABELS = {
  super_admin:   'Super Admin',
  overall_admin: 'Overall Admin',
  branch_admin:  'Branch Admin',
  staff:         'Staff',
  patient:       'Patient',
};

const CAN_SEE_HOSPITALS     = [ROLES.PATIENT, ROLES.SUPER_ADMIN];
const CAN_SEE_MY_HOSPITAL   = [ROLES.OVERALL_ADMIN, ROLES.BRANCH_ADMIN, ROLES.STAFF];

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { success } = useToast();
  const navigate     = useNavigate();
  const [menuOpen, setMenuOpen]     = useState(false);
  const [dropOpen, setDropOpen]     = useState(false);

  const handleLogout = async () => {
    await logout();
    success('Logged out successfully');
    navigate('/');
    setDropOpen(false);
  };

  const getDashboardLink = () => {
    const map = {
      super_admin:   '/superadmin',
      overall_admin: '/admin',
      branch_admin:  '/admin',
      staff:         '/staff',
      patient:       '/my-token',
    };
    return map[user?.role] || '/';
  };

  const showHospitalsLink   = !isAuthenticated || CAN_SEE_HOSPITALS.includes(user?.role);
const showMyHospitalLink  = isAuthenticated && CAN_SEE_MY_HOSPITAL.includes(user?.role);

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="MediSaathi" className="h-9 w-9 object-contain" />
            <span className="text-xl font-bold text-brand-700 hidden sm:block">
              MediSaathi
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6">

{showHospitalsLink && (
  <Link to="/hospitals" className="text-sm text-gray-600 hover:text-brand-600 font-medium transition-colors">
    Hospitals
  </Link>
)}

{showMyHospitalLink && (
  <Link to="/my-hospital" className="text-sm text-gray-600 hover:text-brand-600 font-medium transition-colors">
    My Hospital
  </Link>
)}

{isAuthenticated && user?.role === ROLES.PATIENT && (
  <Link to="/my-token" className="text-sm text-gray-600 hover:text-brand-600 font-medium transition-colors">
    My Token
  </Link>
)}

{isAuthenticated && user?.role !== ROLES.PATIENT && (
  <Link to={getDashboardLink()} className="text-sm text-gray-600 hover:text-brand-600 font-medium transition-colors">
    Dashboard
  </Link>
)}

</div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setDropOpen(!dropOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <Avatar name={user?.name} size="sm" />
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-800 leading-none">{user?.name}</p>
                    <p className="text-xs text-gray-400">{ROLE_LABELS[user?.role]}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
                </button>

                {dropOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setDropOpen(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-20 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-50">
                        <p className="text-sm font-medium text-gray-800">{user?.name}</p>
                        <p className="text-xs text-gray-400">{user?.email}</p>
                      </div>
                      <button
                        onClick={() => { navigate(getDashboardLink()); setDropOpen(false); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        Dashboard
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-sm font-medium text-brand-600 hover:text-brand-700 px-4 py-2 rounded-xl hover:bg-brand-50 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 px-4 py-2 rounded-xl transition-colors"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
  <div className="md:hidden border-t border-gray-100 py-3 space-y-1">

    {showHospitalsLink && (
      <Link to="/hospitals" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
        Hospitals
      </Link>
    )}

    {showMyHospitalLink && (
      <Link to="/my-hospital" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
        My Hospital
      </Link>
    )}

    {isAuthenticated && user?.role === ROLES.PATIENT && (
      <Link to="/my-token" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
        My Token
      </Link>
    )}

    {isAuthenticated && user?.role !== ROLES.PATIENT && (
      <Link to={getDashboardLink()} onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
        Dashboard
      </Link>
    )}

  </div>
)}
      </div>
    </nav>
  );
};

export default Navbar;