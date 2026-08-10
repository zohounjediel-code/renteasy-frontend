import axios from 'axios';

// Sans schéma (http:// ou https://), une baseURL axios est traitée par le navigateur comme un
// chemin RELATIF au site courant plutôt qu'une adresse absolue vers l'API — toutes les requêtes
// partent alors vers le domaine du frontend lui-même (ex: Vercel), qui répond avec sa page HTML
// au lieu d'une vraie réponse API. Cause réelle rencontrée : REACT_APP_API_URL configurée sur
// Vercel sans le "https://" devant. On normalise ici en dernier recours, pour que l'app reste
// fonctionnelle même si cette variable est mal renseignée.
function normaliserUrlApi(url) {
  if (!url) return 'http://localhost:5000/api';
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

// En production, on appelle systématiquement /api en relatif (proxié vers Railway par le
// rewrite de vercel.json) plutôt que le domaine Railway en direct. Safari sur iOS bloque ou
// expire très agressivement les cookies "cross-site" (SameSite=None) via l'Intelligent Tracking
// Prevention, même avec Secure — la connexion réussissait un instant puis le cookie était rejeté
// dès la requête suivante, renvoyant aussitôt vers /connexion. Passer par le même domaine que le
// frontend rend le cookie "first-party" aux yeux du navigateur, ce qui contourne totalement ce
// blocage (aucun souci en dev local, où frontend et backend ne sont de toute façon jamais servis
// depuis le même domaine).
const baseURL = process.env.NODE_ENV === 'production' ? '/api' : normaliserUrlApi(process.env.REACT_APP_API_URL);

const api = axios.create({
  baseURL,
  // Toujours nécessaire même en same-origin proxié : sans ça, axios n'envoie pas le cookie sur
  // les requêtes XHR/fetch (le navigateur ne le fait pas non plus par défaut pour du cross-origin,
  // et withCredentials ne fait pas de mal en same-origin).
  withCredentials: true,
});

// Redirige vers /connexion si le cookie de session est absent ou expiré
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('renteasy_user');
      window.location.href = '/connexion';
    }
    return Promise.reject(error);
  }
);

export default api;
