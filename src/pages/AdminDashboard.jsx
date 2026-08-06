import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ClocheNotifications from '../components/ClocheNotifications';

function StatCard({ icone, valeur, label, couleur, sous }) {
  return (
    <div className={`rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 p-5 shadow-card border-t-[3px] ${couleur}`}>
      <div className="mb-2 text-2xl">{icone}</div>
      <div className="mb-1 text-2xl font-extrabold text-slate-900">{valeur}</div>
      <div className="text-[13px] font-medium text-slate-500">{label}</div>
      {sous && <div className="mt-1 text-xs text-slate-400">{sous}</div>}
    </div>
  );
}

const champLabel = 'mt-3 mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500';
const champInput = 'w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30';

export default function AdminDashboard() {
  const [agents, setAgents] = useState([]);
  const [demandes, setDemandes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [modalCreerAgent, setModalCreerAgent] = useState(false);
  const [form, setForm] = useState({ nom: '', email: '', telephone: '', mot_de_passe: '', ville: '' });
  const [envoi, setEnvoi] = useState(false);
  const [succes, setSucces] = useState('');
  const [erreur, setErreur] = useState('');
  const { utilisateur, deconnecter } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { chargerDonnees(); }, []);

  async function chargerDonnees() {
    try {
      const [rAgents, rDemandes] = await Promise.all([
        api.get('/superadmin/agents'),
        api.get('/demandes'),
      ]);
      setAgents(rAgents.data);
      setDemandes(rDemandes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setChargement(false);
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
      setSucces('Compte agent créé avec succès !');
      setForm({ nom: '', email: '', telephone: '', mot_de_passe: '', ville: '' });
      setModalCreerAgent(false);
      chargerDonnees();
    } catch (e) {
      setErreur(e.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setEnvoi(false);
    }
  }

  const demandesEnAttente = demandes.filter(d => d.statut === 'en_attente').length;
  const totalProprietaires = agents.reduce((acc, a) => acc + parseInt(a.nb_proprietaires || 0), 0);
  const totalBiens = agents.reduce((acc, a) => acc + parseInt(a.nb_biens || 0), 0);
  const totalRevenus = agents.reduce((acc, a) => acc + parseInt(a.revenus_collectes || 0), 0);
  const agentsTriesParRecouvrement = [...agents].sort((a, b) => (b.taux_recouvrement || 0) - (a.taux_recouvrement || 0));

  return (
    <div className="min-h-screen bg-brand-50">
      <nav className="re-nav sticky top-0 z-[100] flex h-[60px] items-center justify-between border-b border-slate-100 bg-white/95 px-6 backdrop-blur">
        <div className="flex items-center gap-2 text-lg text-slate-900">
          🛡️ <strong>RentEasy</strong> <span className="text-accent-600">Bénin</span>
          <span className="rounded-full bg-red-500 px-2.5 py-0.5 text-[10px] font-extrabold tracking-wide text-white">Admin</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button className="rounded-lg border border-brand-600 bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700">Dashboard</button>
          <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50" onClick={() => navigate('/admin/agents')}>Agents</button>
          <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50" onClick={() => navigate('/superadmin/utilisateurs')}>Utilisateurs</button>
          <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50" onClick={() => navigate('/agent/demandes')}>Demandes</button>
          <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50" onClick={() => navigate('/superadmin/rapport-regional')}>📊 Rapport régional</button>
          <button className="rounded-lg bg-accent-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent-600" onClick={() => { setModalCreerAgent(true); setErreur(''); setSucces(''); }}>+ Créer agent</button>
          <button className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700 hover:bg-brand-100" onClick={() => navigate('/profil')}>👤 Mon profil</button>
          <ClocheNotifications />
          <button className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50" onClick={deconnecter}>Déconnexion</button>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-7">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Bonjour, {utilisateur?.nom} 🛡️</h2>
            <p className="mt-1 text-sm text-slate-500">Tableau de bord administrateur</p>
          </div>
          <button className="rounded-xl bg-accent-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-accent-600" onClick={() => { setModalCreerAgent(true); setErreur(''); setSucces(''); }}>
            + Créer un agent
          </button>
        </div>

        {succes && <div className="mb-4 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">{succes}</div>}

        {/* KPIs */}
        <div className="mb-7 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
          <StatCard icone="👔" valeur={agents.length} label="Agents actifs" couleur="border-t-accent-500" />
          <StatCard icone="🏘️" valeur={totalProprietaires} label="Propriétaires gérés" couleur="border-t-purple-500" />
          <StatCard icone="🏠" valeur={totalBiens} label="Biens gérés" couleur="border-t-blue-500" />
          <StatCard icone="💰" valeur={`${totalRevenus.toLocaleString('fr-FR')} FCFA`} label="Revenus collectés ce mois" couleur="border-t-emerald-500" />
          <StatCard icone="⏳" valeur={demandesEnAttente} label="Demandes en attente" couleur="border-t-red-500" sous="tous agents confondus" />
        </div>

        {/* Agents */}
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-accent-600">👔 Vue comparative des agents</p>
        {chargement ? (
          <p className="py-5 text-center text-slate-400">Chargement...</p>
        ) : agents.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 p-10 text-center text-slate-400 shadow-card">
            <p>Aucun agent enregistré.</p>
            <button className="rounded-xl bg-accent-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-accent-600" onClick={() => setModalCreerAgent(true)}>+ Créer le premier agent</button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 shadow-card">
            <div className="grid min-w-[760px] grid-cols-[1.6fr_1.6fr_0.9fr_0.9fr_1.3fr_1.1fr_0.9fr] bg-accent-50 px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-accent-700">
              <span>Agent</span>
              <span>Contact</span>
              <span>Propriétaires</span>
              <span>Biens gérés</span>
              <span>Recouvrement</span>
              <span>En attente</span>
              <span>Statut</span>
            </div>
            {agentsTriesParRecouvrement.map(a => (
              <div key={a.id} className="grid min-w-[760px] grid-cols-[1.6fr_1.6fr_0.9fr_0.9fr_1.3fr_1.1fr_0.9fr] items-center border-t border-slate-50 px-5 py-3.5 text-sm">
                <div className="text-[15px] font-bold text-slate-900">{a.nom}</div>
                <div>
                  <div className="text-[13px] text-brand-600">{a.email}</div>
                  <div className="text-xs text-slate-400">{a.telephone}</div>
                </div>
                <div className="text-lg font-bold text-accent-600">{a.nb_proprietaires}</div>
                <div className="text-lg font-bold text-blue-600">{a.nb_biens}</div>
                <div className={`font-bold ${a.taux_recouvrement >= 80 ? 'text-emerald-600' : a.taux_recouvrement >= 50 ? 'text-accent-600' : 'text-red-600'}`}>
                  {a.taux_recouvrement}% <span className="text-[11px] font-normal text-slate-400">({a.echeances_payees}/{a.total_echeances})</span>
                </div>
                <div>
                  {parseInt(a.demandes_en_attente) > 0 ? (
                    <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600">{a.demandes_en_attente}</span>
                  ) : (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">0</span>
                  )}
                </div>
                <span className={`inline-block w-fit rounded-full border px-2.5 py-1 text-xs font-semibold ${a.actif ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-600'}`}>
                  {a.actif ? '● Actif' : '○ Inactif'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Dernières demandes */}
        {demandes.length > 0 && (
          <>
            <p className="mb-3 mt-7 text-xs font-bold uppercase tracking-wide text-accent-600">📋 Dernières demandes de contrats</p>
            <div className="overflow-x-auto rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 shadow-card">
              <div className="grid min-w-[600px] grid-cols-[2fr_1.5fr_1.5fr_1fr_1fr] bg-accent-50 px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-accent-700">
                <span>Propriétaire</span>
                <span>Bien</span>
                <span>Type</span>
                <span>Agent</span>
                <span>Statut</span>
              </div>
              {demandes.slice(0, 8).map(d => (
                <div key={d.id} className="grid min-w-[600px] grid-cols-[2fr_1.5fr_1.5fr_1fr_1fr] items-center border-t border-slate-50 px-5 py-3.5 text-sm">
                  <div className="font-semibold text-slate-900">{d.proprietaire_nom}</div>
                  <div className="text-[13px] text-slate-400">{d.adresse}</div>
                  <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${d.type_demande === 'modification' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-600'}`}>
                    {d.type_demande}
                  </span>
                  <div className="text-[13px] text-accent-600">{d.agent_nom || '—'}</div>
                  <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${d.statut === 'en_attente' ? 'bg-accent-50 text-accent-700' : d.statut === 'approuvee' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {d.statut}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal créer agent */}
      {modalCreerAgent && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/50 p-5 backdrop-blur-sm">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-7 shadow-2xl">
            <h3 className="mb-1 text-xl font-bold text-slate-900">👔 Nouveau compte Agent</h3>
            <p className="mb-4 text-sm text-slate-400">Le compte sera immédiatement actif après création.</p>
            {['nom', 'email', 'telephone', 'mot_de_passe', 'ville'].map(champ => (
              <div key={champ}>
                <label className={champLabel}>
                  {champ === 'mot_de_passe' ? 'Mot de passe *' : champ === 'nom' ? 'Nom complet *' : champ.charAt(0).toUpperCase() + champ.slice(1) + (champ !== 'ville' ? ' *' : '')}
                </label>
                <input
                  className={champInput}
                  type={champ === 'mot_de_passe' ? 'password' : 'text'}
                  value={form[champ]}
                  onChange={e => setForm({ ...form, [champ]: e.target.value })}
                  placeholder={champ === 'telephone' ? '+22997001122' : champ === 'ville' ? 'Cotonou (optionnel)' : ''}
                />
              </div>
            ))}
            {erreur && <p className="mt-2 text-[13px] text-red-600">{erreur}</p>}
            <div className="mt-5 flex gap-3">
              <button className="flex-1 rounded-xl border border-slate-200 px-5 py-2.5 text-sm text-slate-600 hover:bg-slate-50" onClick={() => setModalCreerAgent(false)}>Annuler</button>
              <button className="flex-1 rounded-xl bg-accent-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-accent-600 disabled:opacity-60" onClick={creerAgent} disabled={envoi}>
                {envoi ? 'Création...' : '✅ Créer le compte'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
