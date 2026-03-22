import { Navigate, Outlet, useLocation } from 'react-router-dom';

/**
 * Route guard that checks for an auth token in localStorage.
 * If no token is found the user is redirected to the admin login page.
 * Wrap admin <Route> elements with this as a layout route.
 */
const RequireAuth = () => {
  const location = useLocation();
  const token = localStorage.getItem('auth_token');

  if (!token) {
    // Preserve the attempted URL so we could redirect back after login in the future
    return <Navigate to="/admin" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default RequireAuth;
