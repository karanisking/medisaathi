import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/authContext.jsx';
import { ROLES } from '../utils/constants.js';

import ProtectedRoute from './protectedRoutes.jsx';
import RoleRoute from './roleRoutes.jsx';

// Public pages
import Home from '../pages/public/home.jsx';
import HospitalList from '../pages/public/hospitalList.jsx';
import HospitalDetail from '../pages/public/hospitalDetail.jsx';
import BranchDetail from '../pages/public/branchDetail.jsx';

// Auth pages
import Login from '../pages/auth/login.jsx';
import Register from '../pages/auth/register.jsx';

// Patient pages
import MyToken from '../pages/patient/myToken.jsx';
import JoinQueue from '../pages/patient/joinQueue.jsx';

// Staff pages
import StaffDashboard from '../pages/staff/staffDashboard.jsx';

// Admin pages
import AdminDashboard from '../pages/admin/adminDashboard.jsx';
import ManageBranches from '../pages/admin/manageBranches.jsx';
import ManageStaff from '../pages/admin/manageStaff.jsx';
import Analytics from '../pages/admin/analytics.jsx';

// Super admin pages
import SuperAdminDashboard from '../pages/superadmin/superadminDashboard.jsx';
import ManageHospitals from '../pages/superadmin/manageHospitals.jsx';
import PlatformAnalytics from '../pages/superadmin/platformAnalytics.jsx';

import NotFound from '../pages/not-found.jsx';
import ManageAdmins from '../pages/superadmin/manageAdmins.jsx';
import MyHospital from '../pages/admin/myHospital.jsx';

const AppRoutes = () => {
  const { user, isAuthenticated } = useAuth();



  return (
    <Routes>

      {/* ── Public ── */}
      <Route path="/" element={<Home />} />
      <Route path="/hospitals" element={
        isAuthenticated && [ROLES.OVERALL_ADMIN, ROLES.BRANCH_ADMIN, ROLES.STAFF].includes(user?.role)
          ? <Navigate to="/my-hospital" replace />
          : <HospitalList />
      } />
      <Route path="/hospitals/:id" element={<HospitalDetail />} />
      <Route path="/branches/:id" element={<BranchDetail />} />

      {/* ── Auth — redirect to dashboard if already logged in ── */}
      <Route path="/login" element={
        isAuthenticated
          ? <Navigate to={getDashboard(user?.role)} replace />
          : <Login />
      } />
      <Route path="/register" element={
        isAuthenticated
          ? <Navigate to={getDashboard(user?.role)} replace />
          : <Register />
      } />

      <Route path="/my-hospital" element={
        <ProtectedRoute>
          <RoleRoute allowedRoles={[
            ROLES.OVERALL_ADMIN,
            ROLES.BRANCH_ADMIN,
            ROLES.STAFF,
          ]}>
            <MyHospital />
          </RoleRoute>
        </ProtectedRoute>
      } />

      {/* ── Patient ── */}
      <Route path="/my-token" element={
        <ProtectedRoute>
          <RoleRoute allowedRoles={[ROLES.PATIENT]}>
            <MyToken />
          </RoleRoute>
        </ProtectedRoute>
      } />
      <Route path="/join/:branchId" element={
        <ProtectedRoute>
          <RoleRoute allowedRoles={[ROLES.PATIENT]}>
            <JoinQueue />
          </RoleRoute>
        </ProtectedRoute>
      } />

      {/* ── Staff ── */}
      <Route path="/staff" element={
        <ProtectedRoute>
          <RoleRoute allowedRoles={[ROLES.STAFF]}>
            <StaffDashboard />
          </RoleRoute>
        </ProtectedRoute>
      } />

      {/* ── Admin ── */}
      <Route path="/admin" element={
        <ProtectedRoute>
          <RoleRoute allowedRoles={[ROLES.OVERALL_ADMIN, ROLES.BRANCH_ADMIN]}>
            <AdminDashboard />
          </RoleRoute>
        </ProtectedRoute>
      } />
      <Route path="/admin/branches" element={
        <ProtectedRoute>
          <RoleRoute allowedRoles={[ROLES.OVERALL_ADMIN, ROLES.BRANCH_ADMIN]}>
            <ManageBranches />
          </RoleRoute>
        </ProtectedRoute>
      } />
      <Route path="/admin/staff" element={
        <ProtectedRoute>
          <RoleRoute allowedRoles={[ROLES.OVERALL_ADMIN, ROLES.BRANCH_ADMIN]}>
            <ManageStaff />
          </RoleRoute>
        </ProtectedRoute>
      } />
      <Route path="/admin/analytics" element={
        <ProtectedRoute>
          <RoleRoute allowedRoles={[ROLES.OVERALL_ADMIN, ROLES.BRANCH_ADMIN]}>
            <Analytics />
          </RoleRoute>
        </ProtectedRoute>
      } />

      {/* ── Super Admin ── */}
      <Route path="/superadmin" element={
        <ProtectedRoute>
          <RoleRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <SuperAdminDashboard />
          </RoleRoute>
        </ProtectedRoute>
      } />
      <Route path="/superadmin/hospitals" element={
        <ProtectedRoute>
          <RoleRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <ManageHospitals />
          </RoleRoute>
        </ProtectedRoute>
      } />
      <Route path="/superadmin/hospitals/:hospitalId/admins" element={
        <ProtectedRoute>
          <RoleRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <ManageAdmins />
          </RoleRoute>
        </ProtectedRoute>
      } />
      <Route path="/superadmin/analytics" element={
        <ProtectedRoute>
          <RoleRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <PlatformAnalytics />
          </RoleRoute>
        </ProtectedRoute>
      } />

      {/* ── 404 ── */}
      <Route path="*" element={<NotFound />} />

    </Routes>
  );
};

const getDashboard = (role) => {
  const map = {
    super_admin: '/superadmin',
    overall_admin: '/admin',
    branch_admin: '/admin',
    staff: '/staff',
    patient: '/my-token',
  };
  return map[role] || '/';
};

export default AppRoutes;