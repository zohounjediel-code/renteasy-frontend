import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ClocheNotifications from '../components/ClocheNotifications';
import Chat from '../components/Chat';

export default function AgentProprietaires() {
  const [proprietaires, setProprietaires] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [interlocuteur, setInterlocuteur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreCategorie, setFiltreCategorie] = useState('tous');
  const { deconnecter } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { chargerProprietaires(); }, []);

  async function chargerProprietaires() {
    try {
      const r = await api.get('/agent/mes-proprietaires');
      setProprietaires(r.data);
    } catch (e) {
      console.error(e);
    } finally {
      setChargement(false);
    }
  }

  function ouvrirChat(p) {
    if (interlocuteur?.id === p.id) {
      setInterlocuteur(null);
      return;
    }
    setInterlocuteur(p);
    // La conversation étant marquée comme lue côté serveur dès son ouverture, on efface
    // immédiatement le badge localement sans attendre un rechargement de la liste.
    setProprietaires(proprietaires.map(pr => pr.id === p.id ? { ...pr, nb_messages_non_lus: 0 } : pr));
  }

  const CATEGORIES = [
    { id: 'tous', label: 'Tous' },
    { id: 'impayes', label: '⚠️ Avec impayés' },
    { id: 'messages', label: '💬 Messages non lus' },
    { id: 'delegation', label: '🤝 Délégation active' },
  ];

  const proprietairesFiltres = proprietaires.filter(p => {
    const texte = recherche.trim().toLowerCase();
    const matchRecherche = !texte
      || p.nom.toLowerCase().includes(texte)
      || (p.telephone || '').toLowerCase().includes(texte)
      || (p.email || '').toLowerCase().includes(texte)
      || (p.ville || '').toLowerCase().includes(texte);

    const matchCategorie =
      filtreCategorie === 'tous' ? true :
      filtreCategorie === 'impayes' ? p.nb_impayes > 0 :
      filtreCategorie === 'messages' ? p.nb_messages_non_lus > 0 :
      filtreCategorie === 'delegation' ? p.autorise_agent_gestion : true;

    return matchRecherche && matchCategorie;
  });

  return (
    <div className="min-h-screen bg-brand-50">
      <nav className="re-nav sticky top-0 z-[100] flex h-[60px] items-center justify-between border-b border-slate-100 bg-white/95 px-6 backdrop-blur">
        <div className="flex items-center gap-2 text-lg text-slate-900">
          ⚡ <strong>RentEasy</strong> <span className="text-accent-600">Bénin</span>
          <span className="rounded-full bg-accent-500 px-2.5 py-0.5 text-[11px] font-extrabold text-white">Agent</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button className="whitespace-nowrap rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50" onClick={() => navigate('/agent/dashboard')}>Tableau de bord</button>
          <button className="whitespace-nowrap rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50" onClick={() => navigate('/agent/demandes')}>Demandes</button>
          <button className="whitespace-nowrap rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50" onClick={() => navigate('/agent/recouvrements')}>Recouvrements</button>
          <button className="whitespace-nowrap rounded-lg border border-brand-600 bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700">Mes propriétaires</button>
          <button className="whitespace-nowrap rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700 hover:bg-brand-100" onClick={() => navigate('/profil')}>👤 Mon profil</button>
          <button className="whitespace-nowrap rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50" onClick={deconnecter}>Déconnexion</button>
          <ClocheNotifications />
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-7">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[380px_1fr]">
          {/* Liste propriétaires */}
          <div className="flex flex-col">
            <h2 className="text-xl font-extrabold text-slate-900">Mes propriétaires</h2>
            <p className="mt-1 text-[13px] text-slate-500">{proprietaires.length} propriétaire(s) assigné(s)</p>

            <input
              className="mt-4 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
              type="text"
              placeholder="🔍 Rechercher par nom, téléphone, email, ville..."
              value={recherche}
              onChange={e => setRecherche(e.target.value)}
            />

            <div className="mt-3 flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <button
                  key={c.id}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold ${filtreCategorie === c.id ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-500'}`}
                  onClick={() => setFiltreCategorie(c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {chargement ? (
              <p className="p-5 text-slate-400">Chargement...</p>
            ) : proprietaires.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 p-10 text-center text-slate-400 shadow-card">
                <p>👤</p>
                <p>Aucun propriétaire assigné pour l'instant.</p>
              </div>
            ) : proprietairesFiltres.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 p-10 text-center text-slate-400 shadow-card">
                <p>🔍</p>
                <p>Aucun propriétaire ne correspond à cette recherche/filtre.</p>
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-3">
                {proprietairesFiltres.map(p => (
                  <div
                    key={p.id}
                    className={`flex flex-col gap-3 rounded-2xl p-4 shadow-card transition ${interlocuteur?.id === p.id ? 'border border-brand-400 bg-brand-50' : 'border border-slate-100 bg-white'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-600 text-lg font-bold text-white">{p.nom.charAt(0).toUpperCase()}</div>
                        {p.nb_impayes > 0 && (
                          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-red-600 px-1 text-[11px] font-extrabold leading-none text-white" title={`${p.nb_impayes} échéance(s) impayée(s) ou partiellement payée(s)`}>
                            {p.nb_impayes}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-[15px] font-bold text-slate-900">{p.nom}</div>
                        <div className="mt-0.5 text-xs text-slate-400">{p.telephone}</div>
                        <div className="mt-0.5 text-xs text-slate-400">{p.email}</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-500">🏘️ {p.nb_biens} bien(s)</span>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-500">📋 {p.nb_contrats} contrat(s)</span>
                      {p.ville && <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-500">📍 {p.ville}</span>}
                      {p.nb_impayes > 0 && (
                        <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600">⚠️ {p.nb_impayes} impayé(s)</span>
                      )}
                    </div>
                    <button
                      className={`relative w-full rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white ${interlocuteur?.id === p.id ? 'bg-brand-800' : 'bg-brand-600 hover:bg-brand-700'}`}
                      onClick={() => ouvrirChat(p)}
                    >
                      {interlocuteur?.id === p.id ? '✕ Fermer le chat' : '💬 Message'}
                      {p.nb_messages_non_lus > 0 && (
                        <span className="absolute -right-1.5 -top-1.5 flex h-[19px] min-w-[19px] items-center justify-center rounded-full border-2 border-slate-50 bg-red-600 px-1 text-[11px] font-extrabold leading-none text-white">{p.nb_messages_non_lus}</span>
                      )}
                    </button>
                    <button className="w-full rounded-xl border border-brand-300 px-4 py-2.5 text-[13px] font-semibold text-brand-700 hover:bg-brand-50" onClick={() => navigate(`/agent/proprietaires/${p.id}`)}>
                      🔍 Voir le compte
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Zone de chat */}
          <div className="lg:sticky lg:top-[84px]">
            {interlocuteur ? (
              <Chat
                interlocuteur={interlocuteur}
                onFermer={() => setInterlocuteur(null)}
                contexte="proprietaire"
              />
            ) : (
              <div className="flex h-[500px] flex-col items-center justify-center rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 p-10 text-center shadow-card">
                <p className="mb-4 text-5xl">💬</p>
                <p className="text-[15px] text-slate-400">Sélectionnez un propriétaire pour démarrer une conversation</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
