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

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [agents, setAgents] = useState([]);
  const [onglet, setOnglet] = useState('overview');
  const [chargement, setChargement] = useState(true);
  const { utilisateur, deconnecter } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    chargerDonnees();
  }, []);

  async function chargerDonnees() {
    try {
      const [rStats, rAgents] = await Promise.all([
        api.get('/superadmin/stats'),
        api.get('/superadmin/agents'),
      ]);
      setStats(rStats.data);
      setAgents(rAgents.data);
    } catch (e) {
      console.error(e);
    } finally {
      setChargement(false);
    }
  }

  function formaterMontant(n) {
    return parseInt(n || 0).toLocaleString('fr-FR') + ' FCFA';
  }

  if (chargement) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-brand-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
        <p className="text-brand-700">Chargement...</p>
      </div>
    );
  }

  const u = stats?.users || {};
  const b = stats?.biens || {};
  const c = stats?.contrats || {};
  const p = stats?.paiements || {};
  const d = stats?.demandes || {};

  return (
    <div className="min-h-screen bg-brand-50">
      {/* Nav */}
      <nav className="re-nav sticky top-0 z-[100] flex h-16 flex-wrap items-center justify-between border-b border-slate-100 bg-white/95 px-6 backdrop-blur">
        <div className="flex items-center gap-2.5 text-lg font-bold text-slate-900">
          <span className="text-xl">⚡</span>
          <span>RentEasy <span className="text-accent-600">Bénin</span></span>
          <span className="rounded-full bg-purple-600 px-2.5 py-0.5 text-[10px] font-extrabold tracking-wide text-white">SUPER ADMIN</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button className={`rounded-lg border px-3.5 py-1.5 text-[13px] ${onglet === 'overview' ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-500'}`} onClick={() => setOnglet('overview')}>Vue globale</button>
          <button className={`rounded-lg border px-3.5 py-1.5 text-[13px] ${onglet === 'agents' ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-500'}`} onClick={() => setOnglet('agents')}>Agents</button>
          <button className="whitespace-nowrap rounded-lg border border-slate-200 px-3.5 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50" onClick={() => navigate('/superadmin/utilisateurs')}>Utilisateurs</button>
          <button className="whitespace-nowrap rounded-lg border border-slate-200 px-3.5 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50" onClick={() => navigate('/superadmin/contrats')}>Contrats</button>
          <button className="whitespace-nowrap rounded-lg border border-slate-200 px-3.5 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50" onClick={() => navigate('/superadmin/biens')}>Biens</button>
          <button className="whitespace-nowrap rounded-lg border border-slate-200 px-3.5 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50" onClick={() => navigate('/superadmin/locataires')}>Locataires</button>
          <button className="whitespace-nowrap rounded-lg border border-slate-200 px-3.5 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50" onClick={() => navigate('/superadmin/journal')}>Journal</button>
          <button className="whitespace-nowrap rounded-lg border border-slate-200 px-3.5 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50" onClick={() => navigate('/superadmin/parametres')}>Paramètres</button>
          <button className="whitespace-nowrap rounded-lg border border-slate-200 px-3.5 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50" onClick={() => navigate('/superadmin/moderation')}>Modération</button>
          <button className="whitespace-nowrap rounded-lg border border-slate-200 px-3.5 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50" onClick={() => navigate('/superadmin/rapport-financier')}>Rapport financier</button>
          <button className="whitespace-nowrap rounded-lg border border-slate-200 px-3.5 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50" onClick={() => navigate('/superadmin/rappels')}>Rappels</button>
          <button className="whitespace-nowrap rounded-lg border border-slate-200 px-3.5 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50" onClick={() => navigate('/superadmin/erreurs')}>Erreurs</button>
          <button className="whitespace-nowrap rounded-lg border border-slate-200 px-3.5 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50" onClick={() => navigate('/superadmin/rapport-regional')}>📊 Rapport régional</button>
          <button className="whitespace-nowrap rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700 hover:bg-brand-100" onClick={() => navigate('/profil')}>👤 Mon profil</button>
          <button className="whitespace-nowrap rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50" onClick={deconnecter}>Déconnexion</button>
          <ClocheNotifications />
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* En-tête */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-extrabold text-slate-900">Bonjour, {utilisateur?.nom} ⚡</h1>
            <p className="mt-1.5 text-sm text-slate-500">Tableau de bord — Supervision globale RentEasy Bénin</p>
          </div>
          <div className="flex gap-3">
            <button className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700" onClick={() => navigate('/superadmin/utilisateurs?action=creer-admin')}>
              + Créer un Admin
            </button>
            <button className="rounded-xl bg-accent-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-600" onClick={() => navigate('/superadmin/utilisateurs?action=creer-agent')}>
              + Créer un Agent
            </button>
          </div>
        </div>

        {onglet === 'overview' && (
          <>
            {/* KPIs utilisateurs */}
            <p className="my-3 text-xs font-bold uppercase tracking-wide text-purple-600">👥 Utilisateurs</p>
            <div className="mb-2 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
              <StatCard icone="🏘️" valeur={u.total_proprietaires || 0} label="Propriétaires" couleur="border-t-purple-500" sous={`${u.comptes_inactifs || 0} inactif(s)`} />
              <StatCard icone="🏠" valeur={u.total_locataires || 0} label="Locataires" couleur="border-t-purple-300" />
              <StatCard icone="👔" valeur={u.total_agents || 0} label="Agents" couleur="border-t-accent-500" />
              <StatCard icone="🛡️" valeur={u.total_admins || 0} label="Admins" couleur="border-t-red-500" />
            </div>

            {/* KPIs plateforme */}
            <p className="my-3 mt-6 text-xs font-bold uppercase tracking-wide text-purple-600">🏗️ Plateforme</p>
            <div className="mb-2 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
              <StatCard icone="🏘️" valeur={b.total_biens || 0} label="Biens gérés" couleur="border-t-cyan-500" sous={`${b.biens_occupes || 0} occupés · ${b.biens_libres || 0} libres`} />
              <StatCard icone="📋" valeur={c.contrats_actifs || 0} label="Contrats actifs" couleur="border-t-emerald-500" sous={`${c.contrats_resilies || 0} résiliés`} />
              <StatCard icone="💰" valeur={formaterMontant(p.volume_total)} label="Volume collecté" couleur="border-t-accent-500" />
              <StatCard icone="🏦" valeur={formaterMontant(p.commissions_totales)} label="Commissions RentEasy" couleur="border-t-purple-500" sous={`${p.total_paiements || 0} paiements`} />
            </div>

            {/* Demandes en attente */}
            {d.demandes_en_attente > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-4 rounded-2xl border border-accent-200 bg-accent-50 p-5">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="m-0 text-[15px] font-bold text-accent-700">{d.demandes_en_attente} demande(s) de contrat en attente</p>
                  <p className="mt-1 text-[13px] text-accent-800">Des agents ont des demandes non traitées</p>
                </div>
                <button className="ml-auto rounded-xl bg-accent-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-accent-600" onClick={() => navigate('/superadmin/contrats')}>
                  Voir les demandes →
                </button>
              </div>
            )}
          </>
        )}

        {onglet === 'agents' && (
          <>
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-purple-600">👔 Performance des agents</p>
            {agents.length === 0 ? (
              <div className="rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 p-10 text-center text-slate-400 shadow-card">Aucun agent enregistré</div>
            ) : (
              <>
              <p className="mb-1.5 text-[11px] text-slate-400 sm:hidden">↔ Faites glisser pour voir toutes les colonnes</p>
              <div className="overflow-x-auto rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 shadow-card">
                <div className="grid min-w-[760px] grid-cols-[1.3fr_1.8fr_0.9fr_1.4fr_1.4fr_1.1fr_0.9fr] bg-purple-50 px-5 py-3.5 text-[11px] font-bold uppercase tracking-wide text-purple-700">
                  <span>Agent</span>
                  <span>Contact</span>
                  <span>Propriétaires</span>
                  <span>Recouvrement</span>
                  <span>Revenus ce mois</span>
                  <span>En attente</span>
                  <span>Statut</span>
                </div>
                {agents.map(a => (
                  <div key={a.id} className="grid min-w-[760px] grid-cols-[1.3fr_1.8fr_0.9fr_1.4fr_1.4fr_1.1fr_0.9fr] items-center border-t border-slate-50 px-5 py-4 text-sm">
                    <div>
                      <div className="text-[15px] font-bold text-slate-900">{a.nom}</div>
                    </div>
                    <div>
                      <div className="text-[13px] text-brand-600">{a.email}</div>
                      <div className="text-xs text-slate-400">{a.telephone}</div>
                    </div>
                    <div className="text-lg font-bold text-accent-600">{a.nb_proprietaires}</div>
                    <div className={`font-bold ${a.taux_recouvrement >= 80 ? 'text-emerald-600' : a.taux_recouvrement >= 50 ? 'text-accent-600' : 'text-red-600'}`}>
                      {a.taux_recouvrement}% <span className="text-[11px] font-normal text-slate-400">({a.echeances_payees}/{a.total_echeances})</span>
                    </div>
                    <div className="font-semibold text-emerald-600">{parseInt(a.revenus_collectes || 0).toLocaleString('fr-FR')} FCFA</div>
                    <div>
                      {a.demandes_en_attente > 0 ? (
                        <span className="rounded-full bg-accent-50 px-2.5 py-1 text-xs font-semibold text-accent-700">{a.demandes_en_attente} en attente</span>
                      ) : (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">À jour</span>
                      )}
                    </div>
                    <div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${a.actif ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                        {a.actif ? '● Actif' : '○ Inactif'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
