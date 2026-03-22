import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/authContext.jsx';

// Redirect to correct dashboard if role doesn't match
const ROLE_HOME = {
  super_admin:   '/superadmin',
  overall_admin: '/admin',
  branch_admin:  '/admin',
  staff:         '/staff',
  patient:       '/my-token',
};

const RoleRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (!allowedRoles.includes(user.role)) {
    const redirect = ROLE_HOME[user.role] || '/';
    return <Navigate to={redirect} replace />;
  }

  return children;
};

export default RoleRoute;