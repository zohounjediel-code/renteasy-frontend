import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ClocheNotifications from '../components/ClocheNotifications';
import Chat from '../components/Chat';

const champLabel = 'mt-3 mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500';
const champInput = 'w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30';

export default function AdminAgents() {
  const [agents, setAgents] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [agentSelectionne, setAgentSelectionne] = useState(null);
  const [proprietairesAgent, setProprietairesAgent] = useState([]);
  const [modalCreer, setModalCreer] = useState(false);
  const [afficherChat, setAfficherChat] = useState(false);
  const [form, setForm] = useState({ nom: '', email: '', telephone: '', mot_de_passe: '', ville: '' });
  const [envoi, setEnvoi] = useState(false);
  const [succes, setSucces] = useState('');
  const [erreur, setErreur] = useState('');
  const { deconnecter } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { chargerAgents(); }, []);

  async function chargerAgents() {
    try {
      const r = await api.get('/superadmin/agents');
      setAgents(r.data);
    } catch (e) {
      console.error(e);
    } finally {
      setChargement(false);
    }
  }

  async function voirProprietaires(agent) {
    setAgentSelectionne(agent);
    setAfficherChat(false);
    try {
      const r = await api.get('/agent/mes-proprietaires', { params: { agent_id: agent.id } });
      setProprietairesAgent(r.data);
    } catch (e) {
      console.error(e);
    }
  }

  async function creerAgent() {
    setErreur(''); setSucces('');
    if (!form.nom || !form.email || !form.telephone || !form.mot_de_passe) {
      setErreur('Tous les champs obligatoires doivent être remplis');
      return;
    }
    setEnvoi(true);
    try {
      await api.post('/auth/creer-agent', form);
      setSucces('Agent créé avec succès !');
      setForm({ nom: '', email: '', telephone: '', mot_de_passe: '', ville: '' });
      setModalCreer(false);
      chargerAgents();
    } catch (e) {
      setErreur(e.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-50">
      <nav className="re-nav sticky top-0 z-[100] flex h-[60px] items-center justify-between border-b border-slate-100 bg-white/95 px-6 backdrop-blur">
        <div className="flex items-center gap-2 text-lg text-slate-900">
          🛡️ <strong>RentEasy</strong> <span className="text-accent-600">Bénin</span>
          <span className="rounded-full bg-red-500 px-2.5 py-0.5 text-[10px] font-extrabold tracking-wide text-white">Admin</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button className="whitespace-nowrap rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50" onClick={() => navigate('/admin/dashboard')}>Dashboard</button>
          <button className="whitespace-nowrap rounded-lg border border-brand-600 bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700">Agents</button>
          <button className="whitespace-nowrap rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50" onClick={() => navigate('/superadmin/utilisateurs')}>Utilisateurs</button>
          <button className="rounded-lg bg-accent-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent-600" onClick={() => { setModalCreer(true); setErreur(''); }}>+ Créer agent</button>
          <button className="whitespace-nowrap rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700 hover:bg-brand-100" onClick={() => navigate('/profil')}>👤 Mon profil</button>
          <ClocheNotifications />
          <button className="whitespace-nowrap rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50" onClick={deconnecter}>Déconnexion</button>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-7">
        {succes && <div className="mb-4 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">{succes}</div>}

        <div className={`grid gap-6 ${agentSelectionne ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {/* Liste agents */}
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Gestion des agents</h2>
            <p className="mt-1 text-[13px] text-slate-500">{agents.length} agent(s) enregistré(s)</p>

            {chargement ? (
              <p className="p-5 text-slate-400">Chargement...</p>
            ) : (
              <div className="mt-4 flex flex-col gap-3">
                {agents.map(a => (
                  <div
                    key={a.id}
                    className={`flex flex-col gap-3 rounded-2xl p-4 shadow-card transition ${agentSelectionne?.id === a.id ? 'border border-accent-300 bg-accent-50' : 'border border-slate-100 bg-white'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-500 text-lg font-extrabold text-white">{a.nom.charAt(0)}</div>
                      <div className="flex-1">
                        <div className="text-[15px] font-bold text-slate-900">{a.nom}</div>
                        <div className="mt-0.5 text-xs text-slate-400">{a.email}</div>
                        <div className="mt-0.5 text-xs text-slate-400">{a.telephone}</div>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${a.actif ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-600'}`}>
                        {a.actif ? '● Actif' : '○ Inactif'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-500">🏘️ {a.nb_proprietaires} propriétaire(s)</span>
                      <span className={`rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs ${parseInt(a.demandes_en_attente) > 0 ? 'text-accent-600' : 'text-slate-500'}`}>
                        ⏳ {a.demandes_en_attente} en attente
                      </span>
                      <span className={`rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs ${a.taux_recouvrement >= 80 ? 'text-emerald-600' : a.taux_recouvrement >= 50 ? 'text-accent-600' : 'text-red-600'}`}>
                        📊 {a.taux_recouvrement}% recouvrement
                      </span>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-emerald-600">
                        💰 {parseInt(a.revenus_collectes || 0).toLocaleString('fr-FR')} FCFA ce mois
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        className="flex-1 rounded-xl bg-accent-500 px-4 py-2 text-[13px] font-bold text-white hover:bg-accent-600"
                        onClick={() => voirProprietaires(a)}
                      >
                        👥 Voir propriétaires
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Détail agent sélectionné */}
          {agentSelectionne && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-bold text-accent-600">
                  {afficherChat ? `💬 Chat avec ${agentSelectionne.nom}` : `👥 Propriétaires de ${agentSelectionne.nom}`}
                </h3>
                <div className="flex gap-2">
                  <button
                    className={`rounded-lg border px-3.5 py-1.5 text-[13px] font-semibold ${!afficherChat ? 'border-accent-400 bg-accent-50 text-accent-700' : 'border-slate-200 text-slate-400'}`}
                    onClick={() => setAfficherChat(false)}
                  >
                    👥 Propriétaires
                  </button>
                  <button
                    className={`rounded-lg border px-3.5 py-1.5 text-[13px] font-semibold ${afficherChat ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-400'}`}
                    onClick={() => setAfficherChat(true)}
                  >
                    💬 Message
                  </button>
                  <button className="px-2 py-1 text-lg text-slate-400 hover:text-slate-600" onClick={() => setAgentSelectionne(null)}>✕</button>
                </div>
              </div>

              {afficherChat ? (
                <Chat interlocuteur={agentSelectionne} contexte="proprietaire" />
              ) : (
                <div className="flex flex-col gap-2.5">
                  {proprietairesAgent.length === 0 ? (
                    <div className="rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 p-10 text-center text-slate-400 shadow-card">Aucun propriétaire assigné à cet agent</div>
                  ) : (
                    proprietairesAgent.map(p => (
                      <div key={p.id} className="flex items-center gap-3 rounded-xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 p-3.5 shadow-card">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-700">{p.nom.charAt(0)}</div>
                        <div className="flex-1">
                          <div className="font-semibold text-slate-900">{p.nom}</div>
                          <div className="text-xs text-slate-400">{p.email} · {p.telephone}</div>
                        </div>
                        <button className="shrink-0 rounded-lg border border-brand-300 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50" onClick={() => navigate(`/agent/proprietaires/${p.id}`)}>
                          🔍 Voir le compte
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal créer agent */}
      {modalCreer && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/50 p-5 backdrop-blur-sm">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-7 shadow-2xl">
            <h3 className="mb-4 text-xl font-bold text-slate-900">👔 Nouveau compte Agent</h3>
            {['nom', 'email', 'telephone', 'mot_de_passe', 'ville'].map(champ => (
              <div key={champ}>
                <label className={champLabel}>{champ === 'mot_de_passe' ? 'Mot de passe *' : champ === 'nom' ? 'Nom complet *' : champ.charAt(0).toUpperCase() + champ.slice(1) + (champ !== 'ville' ? ' *' : '')}</label>
                <input className={champInput} type={champ === 'mot_de_passe' ? 'password' : 'text'} value={form[champ]} onChange={e => setForm({ ...form, [champ]: e.target.value })} placeholder={champ === 'telephone' ? '+22997001122' : ''} />
              </div>
            ))}
            {erreur && <p className="mt-2 text-[13px] text-red-600">{erreur}</p>}
            <div className="mt-5 flex gap-3">
              <button className="flex-1 rounded-xl border border-slate-200 px-5 py-2.5 text-sm text-slate-600 hover:bg-slate-50" onClick={() => setModalCreer(false)}>Annuler</button>
              <button className="flex-1 rounded-xl bg-accent-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-accent-600 disabled:opacity-60" onClick={creerAgent} disabled={envoi}>{envoi ? 'Création...' : '✅ Créer'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
