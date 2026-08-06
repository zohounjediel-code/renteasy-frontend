import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function MotDePasseOublie() {
  const [email, setEmail] = useState('');
  const [envoye, setEnvoye] = useState(false);
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);
  const navigate = useNavigate();

  async function handleEnvoi() {
    if (!email) return;
    setErreur('');
    setChargement(true);
    try {
      // La réponse est volontairement identique que l'email existe ou non côté serveur — on
      // affiche donc toujours ce même message de confirmation, jamais une erreur "email inconnu".
      await api.post('/auth/mot-de-passe-oublie', { email });
      setEnvoye(true);
    } catch (err) {
      setErreur("Impossible de contacter le serveur. Vérifiez votre connexion et réessayez dans un instant.");
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

        {envoye ? (
          <>
            <p className="mt-5 text-lg font-bold text-slate-900">Email envoyé</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Si un compte existe avec l'adresse <strong>{email}</strong>, un lien de réinitialisation vient de lui être envoyé. Vérifiez votre boîte de réception (et vos spams).
            </p>
            <button className="mt-5 w-full rounded-xl bg-brand-600 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700" onClick={() => navigate('/connexion')}>Retour à la connexion</button>
          </>
        ) : (
          <>
            <p className="mt-5 text-lg font-bold text-slate-900">Mot de passe oublié</p>
            <p className="mt-1 mb-5 text-sm text-slate-500">Indiquez l'adresse email de votre compte, nous vous enverrons un lien pour choisir un nouveau mot de passe.</p>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-slate-700">Adresse email</label>
              <input
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEnvoi()}
              />

              {erreur && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{erreur}</p>}

              <button
                className="mt-2 rounded-xl bg-brand-600 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
                onClick={handleEnvoi}
                disabled={chargement || !email}
              >
                {chargement ? 'Envoi...' : 'Envoyer le lien'}
              </button>
            </div>

            <p className="mt-4 text-center">
              <span className="cursor-pointer text-sm font-semibold text-accent-600 hover:text-accent-700" onClick={() => navigate('/connexion')}>← Retour à la connexion</span>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
