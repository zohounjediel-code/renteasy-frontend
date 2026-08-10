import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { redirigerSelonRole } from './Inscription';

export default function Connexion() {
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);
  const { connecter } = useAuth();
  const navigate = useNavigate();

  async function handleConnexion() {
    setErreur('');
    setChargement(true);
    try {
      const utilisateur = await connecter(email, motDePasse);
      redirigerSelonRole(utilisateur.role, navigate);
    } catch (err) {
      // err.response existe uniquement si le serveur a répondu (ex: 401 "Identifiants incorrects").
      // Si err.response est absent, c'est que le serveur est injoignable (en panne, réseau coupé, etc.) :
      // afficher "Identifiants incorrects" dans ce cas induirait la personne en erreur sur son mot de passe.
      if (err.response) {
        setErreur(err.response.data?.message || 'Identifiants incorrects');
      } else {
        setErreur("Impossible de contacter le serveur. Vérifiez votre connexion et réessayez dans un instant.");
      }
    } finally {
      setChargement(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-900 via-brand-800 to-slate-900 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 sm:p-10 shadow-2xl">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-2xl">🏠</span>
          <h1 className="text-2xl font-extrabold text-slate-900">RentEasy <span className="text-accent-600">Bénin</span></h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">Gestion &amp; recouvrement de loyers</p>

        <div className="mt-8 flex flex-col gap-1">
          <label className="text-sm font-semibold text-slate-700">Adresse email</label>
          <input
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
            type="email"
            autoComplete="username"
            placeholder="votre@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label className="mt-3 text-sm font-semibold text-slate-700">Mot de passe</label>
          <input
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConnexion()}
          />
          <p className="mt-1.5 cursor-pointer text-right text-xs font-semibold text-accent-600 hover:text-accent-700" onClick={() => navigate('/mot-de-passe-oublie')}>
            Mot de passe oublié ?
          </p>

          {erreur && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{erreur}</p>}

          <button
            className="mt-2 rounded-xl bg-brand-600 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
            onClick={handleConnexion}
            disabled={chargement}
          >
            {chargement ? 'Connexion...' : 'Se connecter'}
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Pas encore de compte ?{' '}
          <span className="cursor-pointer font-semibold text-accent-600 hover:text-accent-700" onClick={() => navigate('/inscription')}>S'inscrire</span>
        </p>
        <p className="mt-2 text-center text-xs text-slate-400">© 2026 RentEasy Bénin · Cotonou, Bénin</p>
      </div>
    </div>
  );
}
