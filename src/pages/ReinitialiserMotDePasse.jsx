import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';

export default function ReinitialiserMotDePasse() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [motDePasse, setMotDePasse] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState(false);
  const [chargement, setChargement] = useState(false);
  const navigate = useNavigate();

  async function handleReinitialisation() {
    setErreur('');
    if (motDePasse.length < 8) {
      setErreur('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (motDePasse !== confirmation) {
      setErreur('Les deux mots de passe ne correspondent pas.');
      return;
    }
    setChargement(true);
    try {
      await api.post('/auth/reinitialiser-mot-de-passe', { token, nouveau_mot_de_passe: motDePasse });
      setSucces(true);
    } catch (err) {
      setErreur(err.response?.data?.message || 'Impossible de réinitialiser le mot de passe. Le lien est peut-être expiré.');
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

        {!token ? (
          <>
            <p className="mt-5 text-lg font-bold text-slate-900">Lien invalide</p>
            <p className="mt-2 text-sm text-slate-600">Ce lien de réinitialisation est incomplet. Redemandez-en un nouveau.</p>
            <button className="mt-5 w-full rounded-xl bg-brand-600 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700" onClick={() => navigate('/mot-de-passe-oublie')}>Redemander un lien</button>
          </>
        ) : succes ? (
          <>
            <p className="mt-5 text-lg font-bold text-slate-900">Mot de passe mis à jour</p>
            <p className="mt-2 text-sm text-slate-600">Vous pouvez désormais vous connecter avec votre nouveau mot de passe.</p>
            <button className="mt-5 w-full rounded-xl bg-brand-600 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700" onClick={() => navigate('/connexion')}>Se connecter</button>
          </>
        ) : (
          <>
            <p className="mt-5 text-lg font-bold text-slate-900">Choisir un nouveau mot de passe</p>

            <div className="mt-4 flex flex-col gap-1">
              <label className="text-sm font-semibold text-slate-700">Nouveau mot de passe</label>
              <input
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
                type="password"
                placeholder="8 caractères minimum"
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
              />

              <label className="mt-2 text-sm font-semibold text-slate-700">Confirmer le mot de passe</label>
              <input
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
                type="password"
                placeholder="••••••••"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleReinitialisation()}
              />

              {erreur && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{erreur}</p>}

              <button
                className="mt-2 rounded-xl bg-brand-600 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
                onClick={handleReinitialisation}
                disabled={chargement || !motDePasse || !confirmation}
              >
                {chargement ? 'Enregistrement...' : 'Réinitialiser mon mot de passe'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
