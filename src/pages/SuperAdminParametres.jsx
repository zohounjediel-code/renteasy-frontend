import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// Description des champs attendus par opérateur — "secret: true" affiche le champ masqué
// (comme un mot de passe) et ne l'envoie au serveur que s'il a été réellement modifié.
const CHAMPS_OPERATEUR = {
  mtn: [
    { cle: 'base_url', label: 'URL de base', secret: false, placeholder: 'https://sandbox.momodeveloper.mtn.com' },
    { cle: 'target_env', label: 'Environnement cible', secret: false, placeholder: 'sandbox ou production' },
    { cle: 'subscription_key', label: 'Subscription Key (Collection)', secret: true },
    { cle: 'api_user', label: 'API User (Collection)', secret: false },
    { cle: 'api_key', label: 'API Key (Collection)', secret: true },
    { cle: 'disbursement_subscription_key', label: 'Subscription Key (Disbursement / retraits)', secret: true },
    { cle: 'disbursement_api_user', label: 'API User (Disbursement)', secret: false },
    { cle: 'disbursement_api_key', label: 'API Key (Disbursement)', secret: true },
  ],
  moov: [
    { cle: 'base_url', label: 'URL de base', secret: false },
    { cle: 'api_key', label: 'API Key', secret: true },
  ],
  celtiis: [
    { cle: 'base_url', label: 'URL de base', secret: false },
    { cle: 'api_key', label: 'API Key', secret: true },
  ],
  sms: [
    { cle: 'username', label: 'Nom d\'utilisateur Africa\'s Talking', secret: false },
    { cle: 'api_key', label: 'API Key', secret: true },
    { cle: 'expediteur', label: 'Nom de l\'expéditeur (optionnel)', secret: false, placeholder: 'RentEasy' },
  ],
};

const NOMS_OPERATEUR = { mtn: '📱 MTN Mobile Money', moov: '📱 Moov Money', celtiis: '📱 Celtiis Pay', sms: '✉️ SMS (Africa\'s Talking)' };

const navBtn = 'rounded-lg border border-slate-200 px-3.5 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50';
const navBtnActif = 'rounded-lg border border-brand-600 bg-brand-50 px-3.5 py-1.5 text-[13px] font-semibold text-brand-700';
const champInput = 'w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30';

export default function SuperAdminParametres() {
  const [plateforme, setPlateforme] = useState([]);
  const [operateurs, setOperateurs] = useState([]);
  const [editCles, setEditCles] = useState({}); // { mtn: { base_url: '...', ... }, ... }
  const [tauxCommission, setTauxCommission] = useState('');
  const [chargement, setChargement] = useState(true);
  const [envoiCommission, setEnvoiCommission] = useState(false);
  const [envoiOperateur, setEnvoiOperateur] = useState(null);
  const [message, setMessage] = useState(null);
  const { deconnecter } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { chargerParametres(); }, []);

  async function chargerParametres() {
    try {
      const r = await api.get('/superadmin/parametres');
      setPlateforme(r.data.plateforme);
      setOperateurs(r.data.operateurs);
      const taux = r.data.plateforme.find(p => p.cle === 'taux_commission');
      setTauxCommission(taux ? (parseFloat(taux.valeur) * 100).toString() : '');
      const buffer = {};
      r.data.operateurs.forEach(o => { buffer[o.operateur] = { ...o.cles }; });
      setEditCles(buffer);
    } catch (e) {
      console.error(e);
    } finally {
      setChargement(false);
    }
  }

  function afficherMessage(texte, succes) {
    setMessage({ texte, succes });
    setTimeout(() => setMessage(null), 4000);
  }

  async function enregistrerCommission() {
    const valeur = parseFloat(tauxCommission);
    if (isNaN(valeur) || valeur < 0 || valeur > 100) {
      afficherMessage('Le taux doit être un pourcentage entre 0 et 100.', false);
      return;
    }
    setEnvoiCommission(true);
    try {
      await api.patch('/superadmin/parametres/commission', { taux: valeur / 100 });
      afficherMessage('Taux de commission mis à jour.', true);
      chargerParametres();
    } catch (e) {
      afficherMessage(e.response?.data?.message || 'Erreur lors de la mise à jour.', false);
    } finally {
      setEnvoiCommission(false);
    }
  }

  async function enregistrerOperateur(operateur, actif) {
    setEnvoiOperateur(operateur);
    try {
      await api.patch(`/superadmin/parametres/operateurs/${operateur}`, {
        actif,
        cles: editCles[operateur],
      });
      afficherMessage(`Configuration ${NOMS_OPERATEUR[operateur]} mise à jour.`, true);
      chargerParametres();
    } catch (e) {
      afficherMessage(e.response?.data?.message || 'Erreur lors de la mise à jour.', false);
    } finally {
      setEnvoiOperateur(null);
    }
  }

  function changerChamp(operateur, cle, valeur) {
    setEditCles(prev => ({ ...prev, [operateur]: { ...prev[operateur], [cle]: valeur } }));
  }

  if (chargement) {
    return <div className="flex min-h-screen items-center justify-center bg-brand-50"><p className="text-brand-700">Chargement...</p></div>;
  }

  return (
    <div className="min-h-screen bg-brand-50">
      <nav className="re-nav sticky top-0 z-[100] flex h-16 items-center justify-between border-b border-slate-100 bg-white/95 px-6 backdrop-blur">
        <div className="flex cursor-pointer items-center gap-2.5 text-lg font-bold text-slate-900" onClick={() => navigate('/superadmin/dashboard')}>
          ⚡ RentEasy <span className="text-accent-600">Bénin</span>
          <span className="rounded-full bg-purple-600 px-2.5 py-0.5 text-[10px] font-extrabold tracking-wide text-white">SUPER ADMIN</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button className={navBtn} onClick={() => navigate('/superadmin/dashboard')}>Dashboard</button>
          <button className={navBtn} onClick={() => navigate('/superadmin/utilisateurs')}>Utilisateurs</button>
          <button className={navBtn} onClick={() => navigate('/superadmin/contrats')}>Contrats</button>
          <button className={navBtn} onClick={() => navigate('/superadmin/biens')}>Biens</button>
          <button className={navBtn} onClick={() => navigate('/superadmin/locataires')}>Locataires</button>
          <button className={navBtn} onClick={() => navigate('/superadmin/journal')}>Journal</button>
          <button className={navBtnActif}>Paramètres</button>
          <button className={navBtn} onClick={() => navigate('/superadmin/moderation')}>Modération</button>
          <button className={navBtn} onClick={() => navigate('/superadmin/rapport-financier')}>Rapport financier</button>
          <button className={navBtn} onClick={() => navigate('/superadmin/rappels')}>Rappels</button>
          <button className={navBtn} onClick={() => navigate('/superadmin/erreurs')}>Erreurs</button>
          <button className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50" onClick={deconnecter}>Déconnexion</button>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-extrabold text-slate-900">Paramètres de la plateforme</h2>
        </div>

        {message && (
          <div className={`mb-5 rounded-xl px-4 py-3 text-sm font-semibold ${message.succes ? 'border border-brand-200 bg-brand-50 text-brand-800' : 'border border-red-200 bg-red-50 text-red-600'}`}>
            {message.texte}
          </div>
        )}

        {/* Commission */}
        <div className="mb-4 rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 p-5 shadow-card">
          <h3 className="text-base font-bold text-slate-900">💰 Commission RentEasy</h3>
          <p className="mt-1.5 text-[13px] text-slate-500">Pourcentage prélevé sur chaque paiement de loyer, quel que soit le mode de paiement.</p>
          <div className="mt-4 flex items-center gap-3">
            <div className="relative flex flex-1 items-center">
              <input
                className={champInput}
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={tauxCommission}
                onChange={e => setTauxCommission(e.target.value)}
              />
              <span className="pointer-events-none absolute right-3.5 text-sm text-slate-400">%</span>
            </div>
            <button className="whitespace-nowrap rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60" onClick={enregistrerCommission} disabled={envoiCommission}>
              {envoiCommission ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>

        {/* Opérateurs Mobile Money */}
        <p className="my-6 text-xs font-bold uppercase tracking-wide text-purple-600">🔑 Opérateurs Mobile Money</p>
        {operateurs.map(o => (
          <div key={o.operateur} className="mb-4 rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 p-5 shadow-card">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">{NOMS_OPERATEUR[o.operateur] || o.operateur}</h3>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  className="accent-brand-600"
                  checked={o.actif}
                  onChange={e => enregistrerOperateur(o.operateur, e.target.checked)}
                  disabled={envoiOperateur === o.operateur}
                />
                <span className={`text-[13px] font-semibold ${o.actif ? 'text-brand-700' : 'text-slate-400'}`}>
                  {o.actif ? 'Actif' : 'Inactif'}
                </span>
              </label>
            </div>
            <p className="mt-1.5 text-[13px] text-slate-500">
              Une valeur masquée (••••) n'est jamais modifiée tant que tu ne la remplaces pas explicitement.
            </p>
            <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3.5">
              {(CHAMPS_OPERATEUR[o.operateur] || []).map(champ => (
                <div key={champ.cle} className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500">{champ.label}</label>
                  <input
                    className={champInput}
                    type={champ.secret ? 'password' : 'text'}
                    placeholder={champ.placeholder || ''}
                    value={editCles[o.operateur]?.[champ.cle] || ''}
                    onChange={e => changerChamp(o.operateur, champ.cle, e.target.value)}
                  />
                </div>
              ))}
            </div>
            <button
              className="mt-4 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              onClick={() => enregistrerOperateur(o.operateur, o.actif)}
              disabled={envoiOperateur === o.operateur}
            >
              {envoiOperateur === o.operateur ? 'Enregistrement...' : `Enregistrer ${NOMS_OPERATEUR[o.operateur] || o.operateur}`}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
