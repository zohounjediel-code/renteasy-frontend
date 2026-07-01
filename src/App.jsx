import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Connexion from './pages/Connexion';
import Dashboard from './pages/Dashboard';
import Biens from './pages/Biens';
import Locataires from './pages/Locataires';
import Paiements from './pages/Paiements';

function RouteProtegee({ children }) {
  const { utilisateur } = useAuth();
  return utilisateur ? children : <Navigate to="/connexion" replace />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/connexion" element={<Connexion />} />
          <Route path="/dashboard" element={<RouteProtegee><Dashboard /></RouteProtegee>} />
          <Route path="/biens" element={<RouteProtegee><Biens /></RouteProtegee>} />
          <Route path="/locataires" element={<RouteProtegee><Locataires /></RouteProtegee>} />
          <Route path="/paiements" element={<RouteProtegee><Paiements /></RouteProtegee>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
