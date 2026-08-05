import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Connexion from './pages/Connexion';
import Inscription from './pages/Inscription';
import ActiverCompte from './pages/ActiverCompte';
import MotDePasseOublie from './pages/MotDePasseOublie';
import ReinitialiserMotDePasse from './pages/ReinitialiserMotDePasse';
import CGU from './pages/CGU';
import Contact from './pages/Contact';
import Dashboard from './pages/Dashboard';
import Biens from './pages/Biens';
import Locataires from './pages/Locataires';
import Paiements from './pages/Paiements';
import AgentDemandes from './pages/AgentDemandes';
import AgentDashboard from './pages/AgentDashboard';
import AgentRecouvrements from './pages/AgentRecouvrements';
import LocataireDashboard from './pages/LocataireDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminAgents from './pages/AdminAgents';
import AgentProprietaires from './pages/AgentProprietaires';
import AgentProprietaireDetail from './pages/AgentProprietaireDetail';
import MonAgent from './pages/MonAgent';
import Marche from './pages/Marche';
import Profil from './pages/Profil';
import SuperAdminUtilisateurs from './pages/SuperAdminUtilisateurs';
import SuperAdminContrats from './pages/SuperAdminContrats';
import SuperAdminBiens from './pages/SuperAdminBiens';
import SuperAdminLocataires from './pages/SuperAdminLocataires';
import SuperAdminJournal from './pages/SuperAdminJournal';
import SuperAdminParametres from './pages/SuperAdminParametres';
import SuperAdminModeration from './pages/SuperAdminModeration';
import SuperAdminRapportFinancier from './pages/SuperAdminRapportFinancier';
import SuperAdminRappels from './pages/SuperAdminRappels';
import SuperAdminErreurs from './pages/SuperAdminErreurs';
import RapportRegional from './pages/RapportRegional';

// Chemins propres à chacun des deux espaces qu'un même compte peut avoir (propriétaire / locataire).
// /marche et /profil sont communs aux deux et ne doivent pas modifier l'espace mémorisé.
const CHEMINS_ESPACE_PROPRIETAIRE = ['/dashboard', '/biens', '/locataires', '/paiements', '/proprietaire'];
const CHEMINS_ESPACE_LOCATAIRE = ['/locataire'];

function RouteProtegee({ children, rolesAutorises }) {
  const { utilisateur } = useAuth();
  const location = useLocation();

  // Retient dans quel espace (propriétaire ou locataire) l'utilisateur se trouve actuellement,
  // afin qu'à sa prochaine connexion il retrouve automatiquement le même espace qu'au moment
  // où il s'est déconnecté, au lieu de toujours atterrir sur l'espace propriétaire par défaut.
  useEffect(() => {
    if (!utilisateur) return;
    const chemin = location.pathname;
    if (CHEMINS_ESPACE_PROPRIETAIRE.some(p => chemin.startsWith(p))) {
      localStorage.setItem('renteasy_dernier_espace', 'proprietaire');
    } else if (CHEMINS_ESPACE_LOCATAIRE.some(p => chemin.startsWith(p))) {
      localStorage.setItem('renteasy_dernier_espace', 'locataire');
    }
  }, [location.pathname, utilisateur]);

  if (!utilisateur) return <Navigate to="/connexion" replace />;

  if (rolesAutorises) {
    const roles = (utilisateur.role || '').split(',').map(r => r.trim());
    const aAcces = rolesAutorises.some(r => roles.includes(r));
    if (!aAcces) return <Navigate to="/connexion" replace />;
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/connexion" element={<Connexion />} />
          <Route path="/inscription" element={<Inscription />} />
          <Route path="/activer-compte" element={<ActiverCompte />} />
          <Route path="/mot-de-passe-oublie" element={<MotDePasseOublie />} />
          <Route path="/reinitialiser-mot-de-passe" element={<ReinitialiserMotDePasse />} />
          <Route path="/cgu" element={<CGU />} />
          <Route path="/contact" element={<Contact />} />

          {/* Propriétaire */}
          <Route path="/dashboard" element={<RouteProtegee rolesAutorises={['proprietaire','admin','super_admin']}><Dashboard /></RouteProtegee>} />
          <Route path="/biens" element={<RouteProtegee rolesAutorises={['proprietaire','admin','super_admin']}><Biens /></RouteProtegee>} />
          <Route path="/locataires" element={<RouteProtegee rolesAutorises={['proprietaire','admin','super_admin']}><Locataires /></RouteProtegee>} />
          <Route path="/paiements" element={<RouteProtegee rolesAutorises={['proprietaire','admin','super_admin']}><Paiements /></RouteProtegee>} />

          {/* Agent */}
          <Route path="/agent/dashboard" element={<RouteProtegee rolesAutorises={['agent','admin','super_admin']}><AgentDashboard /></RouteProtegee>} />
          <Route path="/agent/demandes" element={<RouteProtegee rolesAutorises={['agent','admin','super_admin']}><AgentDemandes /></RouteProtegee>} />
          <Route path="/agent/recouvrements" element={<RouteProtegee rolesAutorises={['agent','admin','super_admin']}><AgentRecouvrements /></RouteProtegee>} />

          {/* Admin */}
          <Route path="/admin/dashboard" element={<RouteProtegee rolesAutorises={['admin','super_admin']}><AdminDashboard /></RouteProtegee>} />
          <Route path="/admin/agents" element={<RouteProtegee rolesAutorises={['admin','super_admin']}><AdminAgents /></RouteProtegee>} />
          <Route path="/agent/proprietaires" element={<RouteProtegee rolesAutorises={['agent','admin','super_admin']}><AgentProprietaires /></RouteProtegee>} />
          <Route path="/agent/proprietaires/:proprietaireId" element={<RouteProtegee rolesAutorises={['agent','admin','super_admin']}><AgentProprietaireDetail /></RouteProtegee>} />
          <Route path="/proprietaire/mon-agent" element={<RouteProtegee rolesAutorises={['proprietaire','super_admin']}><MonAgent /></RouteProtegee>} />

          {/* Super Admin */}
          <Route path="/superadmin/dashboard" element={<RouteProtegee rolesAutorises={['super_admin']}><SuperAdminDashboard /></RouteProtegee>} />
          <Route path="/superadmin/utilisateurs" element={<RouteProtegee rolesAutorises={['admin','super_admin']}><SuperAdminUtilisateurs /></RouteProtegee>} />
          <Route path="/superadmin/contrats" element={<RouteProtegee rolesAutorises={['super_admin']}><SuperAdminContrats /></RouteProtegee>} />
          <Route path="/superadmin/biens" element={<RouteProtegee rolesAutorises={['super_admin']}><SuperAdminBiens /></RouteProtegee>} />
          <Route path="/superadmin/locataires" element={<RouteProtegee rolesAutorises={['super_admin']}><SuperAdminLocataires /></RouteProtegee>} />
          <Route path="/superadmin/journal" element={<RouteProtegee rolesAutorises={['super_admin']}><SuperAdminJournal /></RouteProtegee>} />
          <Route path="/superadmin/parametres" element={<RouteProtegee rolesAutorises={['super_admin']}><SuperAdminParametres /></RouteProtegee>} />
          <Route path="/superadmin/moderation" element={<RouteProtegee rolesAutorises={['super_admin']}><SuperAdminModeration /></RouteProtegee>} />
          <Route path="/superadmin/rapport-financier" element={<RouteProtegee rolesAutorises={['super_admin']}><SuperAdminRapportFinancier /></RouteProtegee>} />
          <Route path="/superadmin/rappels" element={<RouteProtegee rolesAutorises={['super_admin']}><SuperAdminRappels /></RouteProtegee>} />
          <Route path="/superadmin/erreurs" element={<RouteProtegee rolesAutorises={['super_admin']}><SuperAdminErreurs /></RouteProtegee>} />
          <Route path="/superadmin/rapport-regional" element={<RouteProtegee rolesAutorises={['admin','super_admin']}><RapportRegional /></RouteProtegee>} />

          {/* Locataire */}
          <Route path="/locataire/dashboard" element={<RouteProtegee rolesAutorises={['locataire']}><LocataireDashboard /></RouteProtegee>} />
          <Route path="/profil" element={<RouteProtegee rolesAutorises={['proprietaire','locataire','agent','admin','super_admin']}><Profil /></RouteProtegee>} />
          <Route path="/marche" element={<RouteProtegee rolesAutorises={['locataire','proprietaire','agent','admin','super_admin']}><Marche /></RouteProtegee>} />

          {/* Redirection par défaut */}
          <Route path="*" element={<Navigate to="/connexion" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
