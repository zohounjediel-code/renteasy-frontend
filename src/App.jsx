import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Connexion from './pages/Connexion';
import Dashboard from './pages/Dashboard';

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
          <Route path="/dashboard" element={
            <RouteProtegee><Dashboard /></RouteProtegee>
          } />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
