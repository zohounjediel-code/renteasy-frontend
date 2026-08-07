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
    const { utilisateur } = reponse.data;
    localStorage.setItem('renteasy_user', JSON.stringify(utilisateur));
    setUtilisateur(utilisateur);
    return utilisateur;
  }

  async function inscrire(donnees) {
    const reponse = await api.post('/auth/inscription', donnees);
    const { utilisateur } = reponse.data;
    localStorage.setItem('renteasy_user', JSON.stringify(utilisateur));
    setUtilisateur(utilisateur);
    return utilisateur;
  }

  // Le cookie httpOnly n'est pas visible en JS, donc pas question de le "vider" côté client :
  // il faut que le serveur envoie l'ordre de suppression (même nom, mêmes attributs de cookie).
  async function deconnecter() {
    try {
      await api.post('/auth/deconnexion');
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem('renteasy_user');
    setUtilisateur(null);
  }

  return (
    <AuthContext.Provider value={{ utilisateur, setUtilisateur, connecter, inscrire, deconnecter }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
