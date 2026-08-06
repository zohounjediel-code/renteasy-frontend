import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Contact() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nom: '', email: '', sujet: '', message: '' });
  const [envoye, setEnvoye] = useState(false);
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);

  function majChamp(champ, valeur) {
    setForm((f) => ({ ...f, [champ]: valeur }));
  }

  async function handleEnvoi() {
    if (!form.nom || !form.email || !form.message) return;
    setErreur('');
    setChargement(true);
    try {
      await api.post('/contact', form);
      setEnvoye(true);
    } catch (err) {
      setErreur(err.response?.data?.message || "Impossible d'envoyer le message. Réessayez dans un instant.");
    } finally {
      setChargement(false);
    }
  }

  const champCls = 'rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30';

  return (
    <div className="min-h-screen bg-slate-50 px-5 py-10">
      <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 sm:p-10 shadow-card">
        <div className="mb-6">
          <span className="mb-4 inline-block cursor-pointer text-sm font-semibold text-accent-600 hover:text-accent-700" onClick={() => navigate(-1)}>← Retour</span>
          <h1 className="text-2xl font-extrabold text-slate-900">Contact &amp; Support</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Une question, un litige de paiement, ou une demande concernant vos données
            personnelles ? Écrivez-nous, nous répondons dans les meilleurs délais.
          </p>
        </div>

        {envoye ? (
          <div className="rounded-xl border border-brand-200 bg-brand-50 p-5 text-center text-sm leading-relaxed text-brand-800">
            ✅ Votre message a bien été envoyé. Nous vous répondrons à l'adresse indiquée.
            <div>
              <button className="mt-4 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700" onClick={() => navigate('/connexion')}>Retour à la connexion</button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-slate-700">Nom</label>
            <input className={champCls} value={form.nom} onChange={(e) => majChamp('nom', e.target.value)} placeholder="Votre nom" />

            <label className="mt-2 text-sm font-semibold text-slate-700">Adresse email</label>
            <input className={champCls} type="email" value={form.email} onChange={(e) => majChamp('email', e.target.value)} placeholder="votre@email.com" />

            <label className="mt-2 text-sm font-semibold text-slate-700">Sujet</label>
            <input className={champCls} value={form.sujet} onChange={(e) => majChamp('sujet', e.target.value)} placeholder="Objet de votre message (optionnel)" />

            <label className="mt-2 text-sm font-semibold text-slate-700">Message</label>
            <textarea className={`${champCls} resize-y`} value={form.message} onChange={(e) => majChamp('message', e.target.value)} placeholder="Décrivez votre demande..." rows={6} />

            {erreur && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{erreur}</p>}

            <button
              className="mt-4 rounded-xl bg-brand-600 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
              onClick={handleEnvoi}
              disabled={chargement || !form.nom || !form.email || !form.message}
            >
              {chargement ? 'Envoi...' : 'Envoyer le message'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
