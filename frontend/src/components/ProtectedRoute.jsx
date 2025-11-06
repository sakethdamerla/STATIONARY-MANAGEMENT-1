import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, currentUser, requiredPermission, requiredPermissions, superAdminOnly = false }) => {
  // Check if user is authenticated
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Super admin can access everything
  const isSuperAdmin = currentUser?.role === 'Administrator';
  if (isSuperAdmin) {
    return children;
  }

  // Check if route requires super admin only
  if (superAdminOnly) {
    return <Navigate to="/" replace />;
  }

  // Check if sub-admin has required permission(s)
  const permissions = currentUser?.permissions || [];
  
  // Support multiple permissions (OR logic - user needs at least one)
  if (requiredPermissions && Array.isArray(requiredPermissions)) {
    const hasAnyPermission = requiredPermissions.some(perm => permissions.includes(perm));
    if (!hasAnyPermission) {
      return <Navigate to="/" replace />;
    }
  }
  // Support single permission (backward compatibility)
  else if (requiredPermission && !permissions.includes(requiredPermission)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;

