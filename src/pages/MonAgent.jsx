import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ClocheNotifications from '../components/ClocheNotifications';
import Chat from '../components/Chat';
import BoutonActiverRole from '../components/BoutonActiverRole';

const ICONES_ACTION = {
  creation_bien: '🏠',
  ajout_photos: '📷',
  ajout_locataire: '🧑',
  creation_contrat: '📝',
  approbation_demande: '✍️',
  refus_demande: '✕',
};

export default function MonAgent() {
  const [agent, setAgent] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [delegationActive, setDelegationActive] = useState(false);
  const [envoiDelegation, setEnvoiDelegation] = useState(false);
  const [messageDelegation, setMessageDelegation] = useState('');
  const { utilisateur, deconnecter } = useAuth();
  const navigate = useNavigate();
  const estAussiLocataire = (utilisateur?.role || '').includes('locataire');
  const [journal, setJournal] = useState(null);
  const [chargementJournal, setChargementJournal] = useState(true);

  useEffect(() => {
    api.get('/proprietaire/mon-agent')
      .then(r => setAgent(r.data))
      .catch(e => setErreur(e.response?.data?.message || 'Erreur de chargement'))
      .finally(() => setChargement(false));
    api.get('/profil')
      .then(r => setDelegationActive(!!r.data.autorise_agent_gestion))
      .catch(console.error);
    api.get('/profil/journal-agent')
      .then(r => setJournal(r.data))
      .catch(console.error)
      .finally(() => setChargementJournal(false));
  }, []);

  async function basculerDelegation() {
    setEnvoiDelegation(true);
    setMessageDelegation('');
    const nouvelEtat = !delegationActive;
    try {
      const r = await api.patch('/profil/delegation-agent', { autorise: nouvelEtat });
      setDelegationActive(r.data.autorise_agent_gestion);
      setMessageDelegation(r.data.message);
    } catch (e) {
      setMessageDelegation(e.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setEnvoiDelegation(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-50">
      <nav className="re-nav sticky top-0 z-[100] flex h-[60px] items-center justify-between border-b border-slate-100 bg-white/95 px-6 backdrop-blur">
        <div className="text-lg text-slate-900">🏠 <strong>RentEasy</strong> <span className="text-accent-600">Bénin</span></div>
        <div className="flex items-center gap-1.5">
          <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50" onClick={() => navigate('/biens')}>Mes biens</button>
          <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50" onClick={() => navigate('/locataires')}>Locataires</button>
          <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50" onClick={() => navigate('/paiements')}>Paiements</button>
          <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50" onClick={() => navigate('/dashboard')}>Dashboard</button>
          <button className="rounded-lg border border-brand-600 bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700">Mon agent</button>
          {estAussiLocataire && (
            <button className="rounded-lg bg-accent-500 px-3 py-1.5 text-sm font-bold text-white hover:bg-accent-600" onClick={() => navigate('/locataire/dashboard')}>🔄 Espace locataire</button>
          )}
          <button className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700 hover:bg-brand-100" onClick={() => navigate('/profil')}>👤 Mon profil</button>
          <ClocheNotifications />
          <button className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50" onClick={deconnecter}>Déconnexion</button>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-6 py-7">
        <h2 className="text-2xl font-extrabold text-slate-900">Mon agent RentEasy</h2>
        <p className="mb-5 mt-1 text-sm text-slate-500">Votre agent attitré, disponible pour toutes vos demandes</p>

        <div className="mb-5"><BoutonActiverRole /></div>

        {chargement ? (
          <p className="py-10 text-center text-slate-400">Chargement...</p>
        ) : erreur ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 p-14 text-center text-slate-400 shadow-card">
            <p className="text-3xl">👔</p>
            <p>{erreur}</p>
            <p className="text-[13px] text-slate-400">Contactez l'administration RentEasy pour vous assigner un agent.</p>
          </div>
        ) : agent && (
          <div className="grid grid-cols-[340px_1fr] items-start gap-6">
            {/* Carte agent */}
            <div className="sticky top-[84px] rounded-2xl border border-brand-200 bg-brand-50 p-6">
              <div className="relative mb-5 flex items-center gap-3.5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xl font-extrabold text-white">{agent.nom.charAt(0).toUpperCase()}</div>
                <div>
                  <div className="text-lg font-extrabold text-slate-900">{agent.nom}</div>
                  <div className="mt-0.5 text-[13px] text-brand-600">Agent RentEasy Bénin</div>
                </div>
                <span className="absolute right-0 top-0 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">● En ligne</span>
              </div>

              <div className="mb-4 rounded-xl bg-white p-4 shadow-card">
                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-brand-700">📞 Contact direct</p>
                <div className="flex items-center justify-between border-b border-slate-100 py-2">
                  <span className="text-[13px] text-slate-400">Téléphone</span>
                  <a href={`tel:${agent.telephone}`} className="text-[13px] font-semibold text-brand-700 no-underline">{agent.telephone}</a>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 py-2">
                  <span className="text-[13px] text-slate-400">Email</span>
                  <a href={`mailto:${agent.email}`} className="text-[13px] font-semibold text-brand-700 no-underline">{agent.email}</a>
                </div>
                {agent.ville && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-[13px] text-slate-400">Ville</span>
                    <span className="text-[13px] font-semibold text-brand-700">{agent.ville}</span>
                  </div>
                )}
              </div>

              <div className="mb-4 rounded-xl bg-white p-4 shadow-card">
                <div className="flex items-start justify-between gap-2.5">
                  <div>
                    <p className="mb-3 text-xs font-bold uppercase tracking-wide text-brand-700">🤝 Délégation de gestion</p>
                    <p className="m-0 text-xs leading-relaxed text-slate-500">
                      Autorisez votre agent à ajouter des biens, créer des contrats et ajouter des locataires
                      en votre nom. Chaque action de l'agent reste tracée et vous pouvez révoquer cette
                      autorisation à tout moment.
                    </p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={delegationActive}
                    onClick={basculerDelegation}
                    disabled={envoiDelegation}
                    className={`relative h-[22px] w-10 shrink-0 rounded-full transition ${delegationActive ? 'bg-brand-600' : 'bg-slate-200'}`}
                  >
                    <span className={`absolute top-0.5 block h-[18px] w-[18px] rounded-full bg-white transition-transform ${delegationActive ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <p className={`mt-2.5 text-xs font-bold ${delegationActive ? 'text-brand-700' : 'text-slate-400'}`}>
                  {delegationActive ? '✅ Délégation active' : '⛔ Délégation désactivée'}
                </p>
                {messageDelegation && <p className="mt-2 text-xs italic text-slate-500">{messageDelegation}</p>}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <a href={`tel:${agent.telephone}`} className="block rounded-xl bg-brand-600 py-2.5 text-center text-[13px] font-bold text-white no-underline hover:bg-brand-700">📞 Appeler</a>
                <a href={`mailto:${agent.email}`} className="block rounded-xl border border-brand-300 bg-white py-2.5 text-center text-[13px] font-bold text-brand-700 no-underline hover:bg-brand-50">✉️ Email</a>
              </div>
            </div>

            {/* Zone de chat */}
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-brand-700">💬 Discussion avec votre agent</p>
              <Chat interlocuteur={agent} contexte="proprietaire" />
            </div>
          </div>
        )}

        {agent && (
          <div className="mt-7">
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-brand-700">🕓 Historique d'activité de votre agent</p>
            <p className="mb-3.5 text-xs text-slate-400">
              Toutes les actions effectuées par votre agent en votre nom, horodatées.
            </p>
            {chargementJournal ? (
              <p className="text-[13px] text-slate-400">Chargement...</p>
            ) : !journal || journal.length === 0 ? (
              <p className="text-[13px] text-slate-400">Aucune action enregistrée pour l'instant.</p>
            ) : (
              <div className="flex max-h-[380px] flex-col gap-2 overflow-y-auto">
                {journal.map(j => (
                  <div key={j.id} className="flex items-start gap-3 rounded-lg border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 px-3.5 py-2.5 shadow-card">
                    <span className="shrink-0 text-base">{ICONES_ACTION[j.type_action] || '🤝'}</span>
                    <div className="flex-1">
                      <p className="m-0 text-[13px] text-slate-800">{j.description}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {new Date(j.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
