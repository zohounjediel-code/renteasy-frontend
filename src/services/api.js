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
});

// Injecte automatiquement le token JWT dans chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('renteasy_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirige vers /connexion si le token est expiré
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('renteasy_token');
      localStorage.removeItem('renteasy_user');
      window.location.href = '/connexion';
    }
    return Promise.reject(error);
  }
);

export default api;
