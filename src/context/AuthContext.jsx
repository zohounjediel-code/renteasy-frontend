import { createContext, useContext, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [utilisateur, setUtilisateur] = useState(() => {
    const saved = localStorage.getItem('renteasy_user');
    return saved ? JSON.parse(saved) : null;
  });

  async function connecter(email, motDePasse) {
    const reponse = await api.post('/auth/connexion', { email, mot_de_passe: motDePasse });
    const { utilisateur, token } = reponse.data;
    localStorage.setItem('renteasy_token', token);
    localStorage.setItem('renteasy_user', JSON.stringify(utilisateur));
    setUtilisateur(utilisateur);
    return utilisateur;
  }

  function deconnecter() {
    localStorage.removeItem('renteasy_token');
    localStorage.removeItem('renteasy_user');
    setUtilisateur(null);
  }

  return (
    <AuthContext.Provider value={{ utilisateur, connecter, deconnecter }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
