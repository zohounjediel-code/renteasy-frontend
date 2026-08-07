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

const api = axios.create({
  baseURL: normaliserUrlApi(process.env.REACT_APP_API_URL),
  // Le token JWT vit dans un cookie httpOnly posé par le backend (inaccessible en JS, donc pas
  // volable par une faille XSS) : le navigateur doit être autorisé à l'envoyer sur ces requêtes
  // cross-origin (frontend Vercel, backend Railway ne partagent pas le même domaine).
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
