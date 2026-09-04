import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute() {
  // Lees direct de status uit onze Redux authSlice
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  // Als de gebruiker is ingelogd -> toon de pagina (<Outlet />)
  // Zo niet -> stuur direct door naar de login pagina (/auth)
  return isAuthenticated ? <Outlet /> : <Navigate to="/auth" replace />;
}