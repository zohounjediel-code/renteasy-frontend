import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ActiverCompte() {
  const [searchParams] = useSearchParams();
  const [motDePasse, setMotDePasse] = useState('');
  const [confirmer, setConfirmer] = useState('');
  const [cguAcceptees, setCguAcceptees] = useState(false);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState(false);
  const [chargement, setChargement] = useState(false);
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { setUtilisateur } = useAuth();

  useEffect(() => {
    if (!token) {
      setErreur('Lien d\'activation invalide.');
    }
  }, [token]);

  async function handleActivation() {
    setErreur('');
    if (!motDePasse || motDePasse.length < 8) {
      setErreur('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    if (motDePasse !== confirmer) {
      setErreur('Les mots de passe ne correspondent pas');
      return;
    }
    if (!cguAcceptees) {
      setErreur("Vous devez accepter les conditions générales d'utilisation pour continuer");
      return;
    }
    setChargement(true);
    try {
      const r = await api.post('/auth/activer-compte', { token, mot_de_passe: motDePasse, cgu_acceptees: true });
      localStorage.setItem('renteasy_user', JSON.stringify(r.data.utilisateur));
      setUtilisateur(r.data.utilisateur);
      setSucces(true);
      setTimeout(() => navigate('/locataire/dashboard'), 2000);
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur lors de l\'activation');
    } finally {
      setChargement(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-900 via-brand-800 to-slate-900 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 sm:p-10 shadow-2xl">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🏠</span>
          <h1 className="text-2xl font-extrabold text-slate-900">RentEasy <span className="text-accent-600">Bénin</span></h1>
        </div>

        {succes ? (
          <div className="mt-6 text-center">
            <p className="mb-2 text-4xl">✅</p>
            <p className="font-bold text-brand-700">Compte activé avec succès !</p>
            <p className="text-sm text-slate-500">Redirection vers votre espace locataire...</p>
          </div>
        ) : (
          <>
            <p className="mt-5 text-xl font-bold text-slate-900">Activer votre compte</p>
            <p className="mt-1 text-sm text-slate-500">Définissez votre mot de passe pour accéder à votre espace locataire.</p>

            <label className="mt-4 block text-sm font-semibold text-slate-700">Mot de passe *</label>
            <input className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30" type="password" autoComplete="new-password" placeholder="••••••••" value={motDePasse} onChange={e => setMotDePasse(e.target.value)} />

            <label className="mt-3 block text-sm font-semibold text-slate-700">Confirmer le mot de passe *</label>
            <input className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30" type="password" autoComplete="new-password" placeholder="••••••••" value={confirmer} onChange={e => setConfirmer(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleActivation()} />

            {erreur && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{erreur}</p>}

            <label className="mt-3 flex cursor-pointer items-start gap-2 text-xs leading-relaxed text-slate-600">
              <input
                type="checkbox"
                checked={cguAcceptees}
                onChange={e => setCguAcceptees(e.target.checked)}
                className="mt-0.5 shrink-0 cursor-pointer accent-brand-600"
              />
              <span>
                J'accepte les{' '}
                <span className="font-semibold text-accent-600 hover:text-accent-700" onClick={(e) => { e.preventDefault(); window.open('/cgu', '_blank'); }}>
                  conditions générales d'utilisation et la politique de confidentialité
                </span>
              </span>
            </label>

            <button className="mt-4 w-full rounded-xl bg-brand-600 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60" onClick={handleActivation} disabled={chargement || !token || !cguAcceptees}>
              {chargement ? 'Activation...' : 'Activer mon compte'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
