import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ClocheNotifications from '../components/ClocheNotifications';

function StatCard({ icone, valeur, label, couleur, sous }) {
  return (
    <div style={{ ...s.statCard, borderTop: `3px solid ${couleur}` }}>
      <div style={s.statIcone}>{icone}</div>
      <div style={{ ...s.statValeur, color: couleur }}>{valeur}</div>
      <div style={s.statLabel}>{label}</div>
      {sous && <div style={s.statSous}>{sous}</div>}
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
      <div style={s.loading}>
        <div style={s.loadingSpinner} />
        <p style={{ color: '#a78bfa' }}>Chargement...</p>
      </div>
    );
  }

  const u = stats?.users || {};
  const b = stats?.biens || {};
  const c = stats?.contrats || {};
  const p = stats?.paiements || {};
  const d = stats?.demandes || {};

  return (
    <div style={s.page}>
      {/* Nav */}
      <nav style={s.nav} className="re-nav">
        <div style={s.navLogo}>
          <span style={s.navIcone}>⚡</span>
          <span>RentEasy <span style={s.navBenin}>Bénin</span></span>
          <span style={s.superBadge}>SUPER ADMIN</span>
        </div>
        <div style={s.navMenu}>
          <button style={{ ...s.navBtn, ...(onglet === 'overview' ? s.navBtnActif : {}) }} onClick={() => setOnglet('overview')}>Vue globale</button>
          <button style={{ ...s.navBtn, ...(onglet === 'agents' ? s.navBtnActif : {}) }} onClick={() => setOnglet('agents')}>Agents</button>
          <button style={s.navBtn} onClick={() => navigate('/superadmin/utilisateurs')}>Utilisateurs</button>
          <button style={s.navBtn} onClick={() => navigate('/superadmin/contrats')}>Contrats</button>
          <button style={s.navBtn} onClick={() => navigate('/superadmin/biens')}>Biens</button>
          <button style={s.navBtn} onClick={() => navigate('/superadmin/locataires')}>Locataires</button>
          <button style={s.navBtn} onClick={() => navigate('/superadmin/journal')}>Journal</button>
          <button style={s.navBtn} onClick={() => navigate('/superadmin/parametres')}>Paramètres</button>
          <button style={s.navBtn} onClick={() => navigate('/superadmin/moderation')}>Modération</button>
          <button style={s.navBtn} onClick={() => navigate('/superadmin/rapport-financier')}>Rapport financier</button>
          <button style={s.navBtn} onClick={() => navigate('/superadmin/rappels')}>Rappels</button>
          <button style={s.navBtn} onClick={() => navigate('/superadmin/erreurs')}>Erreurs</button>
          <button style={s.navBtn} onClick={() => navigate('/superadmin/rapport-regional')}>📊 Rapport régional</button>
          <button style={s.navBtnProfil} onClick={() => navigate('/profil')}>👤 Mon profil</button>
          <ClocheNotifications />
          <button style={s.navDeconnexion} onClick={deconnecter}>Déconnexion</button>
        </div>
      </nav>

      <div style={s.contenu}>
        {/* En-tête */}
        <div style={s.entete}>
          <div>
            <h1 style={s.titre}>Bonjour, {utilisateur?.nom} ⚡</h1>
            <p style={s.sousTitre}>Tableau de bord — Supervision globale RentEasy Bénin</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button style={s.btnAction} onClick={() => navigate('/superadmin/utilisateurs?action=creer-admin')}>
              + Créer un Admin
            </button>
            <button style={{ ...s.btnAction, background: 'linear-gradient(135deg,#059669,#047857)' }} onClick={() => navigate('/superadmin/utilisateurs?action=creer-agent')}>
              + Créer un Agent
            </button>
          </div>
        </div>

        {onglet === 'overview' && (
          <>
            {/* KPIs utilisateurs */}
            <p style={s.sectionTitre}>👥 Utilisateurs</p>
            <div style={s.statsGrid}>
              <StatCard icone="🏘️" valeur={u.total_proprietaires || 0} label="Propriétaires" couleur="#7c3aed" sous={`${u.comptes_inactifs || 0} inactif(s)`} />
              <StatCard icone="🏠" valeur={u.total_locataires || 0} label="Locataires" couleur="#a78bfa" />
              <StatCard icone="👔" valeur={u.total_agents || 0} label="Agents" couleur="#f59e0b" />
              <StatCard icone="🛡️" valeur={u.total_admins || 0} label="Admins" couleur="#ef4444" />
            </div>

            {/* KPIs plateforme */}
            <p style={s.sectionTitre}>🏗️ Plateforme</p>
            <div style={s.statsGrid}>
              <StatCard icone="🏘️" valeur={b.total_biens || 0} label="Biens gérés" couleur="#06b6d4" sous={`${b.biens_occupes || 0} occupés · ${b.biens_libres || 0} libres`} />
              <StatCard icone="📋" valeur={c.contrats_actifs || 0} label="Contrats actifs" couleur="#10b981" sous={`${c.contrats_resilies || 0} résiliés`} />
              <StatCard icone="💰" valeur={formaterMontant(p.volume_total)} label="Volume collecté" couleur="#f59e0b" />
              <StatCard icone="🏦" valeur={formaterMontant(p.commissions_totales)} label="Commissions RentEasy" couleur="#7c3aed" sous={`${p.total_paiements || 0} paiements`} />
            </div>

            {/* Demandes en attente */}
            {d.demandes_en_attente > 0 && (
              <div style={s.alerteCard}>
                <span style={{ fontSize: '24px' }}>⚠️</span>
                <div>
                  <p style={s.alerteTitre}>{d.demandes_en_attente} demande(s) de contrat en attente</p>
                  <p style={s.alerteSous}>Des agents ont des demandes non traitées</p>
                </div>
                <button style={s.btnAlerte} onClick={() => navigate('/superadmin/contrats')}>
                  Voir les demandes →
                </button>
              </div>
            )}
          </>
        )}

        {onglet === 'agents' && (
          <>
            <p style={s.sectionTitre}>👔 Performance des agents</p>
            {agents.length === 0 ? (
              <div style={s.vide}>Aucun agent enregistré</div>
            ) : (
              <div style={s.tableau}>
                <div style={s.tableauEntete}>
                  <span>Agent</span>
                  <span>Contact</span>
                  <span>Propriétaires</span>
                  <span>Recouvrement</span>
                  <span>Revenus ce mois</span>
                  <span>En attente</span>
                  <span>Statut</span>
                </div>
                {agents.map(a => (
                  <div key={a.id} style={s.tableauLigne}>
                    <div>
                      <div style={s.agentNom}>{a.nom}</div>
                    </div>
                    <div>
                      <div style={{ color: '#a78bfa', fontSize: '13px' }}>{a.email}</div>
                      <div style={{ color: '#9ca3af', fontSize: '12px' }}>{a.telephone}</div>
                    </div>
                    <div style={{ color: '#f59e0b', fontWeight: '700', fontSize: '18px' }}>{a.nb_proprietaires}</div>
                    <div style={{ color: a.taux_recouvrement >= 80 ? '#10b981' : a.taux_recouvrement >= 50 ? '#f59e0b' : '#ef4444', fontWeight: '700' }}>
                      {a.taux_recouvrement}% <span style={{ color: '#6b7280', fontWeight: '400', fontSize: '11px' }}>({a.echeances_payees}/{a.total_echeances})</span>
                    </div>
                    <div style={{ color: '#10b981', fontWeight: '600' }}>{parseInt(a.revenus_collectes || 0).toLocaleString('fr-FR')} FCFA</div>
                    <div>
                      {a.demandes_en_attente > 0 ? (
                        <span style={s.badgeAttente}>{a.demandes_en_attente} en attente</span>
                      ) : (
                        <span style={s.badgeOk}>À jour</span>
                      )}
                    </div>
                    <div>
                      <span style={{ ...s.badgeStatut, background: a.actif ? '#064e3b' : '#450a0a', color: a.actif ? '#10b981' : '#ef4444' }}>
                        {a.actif ? '● Actif' : '○ Inactif'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: 'linear-gradient(135deg,#0a0a0f 0%,#0f0a1e 50%,#0a0f0a 100%)', fontFamily: "'Segoe UI',sans-serif", color: '#e2e8f0' },
  loading: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f', gap: '16px' },
  loadingSpinner: { width: '40px', height: '40px', border: '3px solid #1e1b4b', borderTop: '3px solid #7c3aed', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  nav: { background: 'rgba(10,10,20,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(124,58,237,0.3)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px', position: 'sticky', top: 0, zIndex: 100 },
  navLogo: { display: 'flex', alignItems: 'center', gap: '10px', color: '#e2e8f0', fontSize: '18px', fontWeight: '700' },
  navIcone: { fontSize: '22px' },
  navBenin: { color: '#f59e0b' },
  superBadge: { background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: '#fff', fontSize: '10px', padding: '3px 10px', borderRadius: '20px', fontWeight: '800', letterSpacing: '1px' },
  navMenu: { display: 'flex', gap: '8px', alignItems: 'center' },
  navBtn: { background: 'transparent', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa', cursor: 'pointer', padding: '7px 14px', borderRadius: '6px', fontSize: '13px', transition: 'all 0.2s' },
  navBtnActif: { background: 'rgba(124,58,237,0.2)', border: '1px solid #7c3aed', color: '#c4b5fd' },
  navBtnProfil: { background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa', cursor: 'pointer', padding: '7px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '600' },
  navDeconnexion: { background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', cursor: 'pointer', padding: '7px 14px', borderRadius: '6px', fontSize: '13px' },
  contenu: { padding: '32px 24px', maxWidth: '1300px', margin: '0 auto' },
  entete: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' },
  titre: { margin: 0, fontSize: '28px', fontWeight: '800', background: 'linear-gradient(135deg,#c4b5fd,#f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  sousTitre: { color: '#6b7280', margin: '6px 0 0', fontSize: '14px' },
  btnAction: { background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  sectionTitre: { color: '#a78bfa', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', margin: '24px 0 12px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '16px', marginBottom: '8px' },
  statCard: { background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px' },
  statIcone: { fontSize: '28px', marginBottom: '8px' },
  statValeur: { fontSize: '28px', fontWeight: '800', marginBottom: '4px' },
  statLabel: { fontSize: '13px', color: '#9ca3af', fontWeight: '500' },
  statSous: { fontSize: '12px', color: '#6b7280', marginTop: '4px' },
  alerteCard: { background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', marginTop: '16px', flexWrap: 'wrap' },
  alerteTitre: { color: '#f59e0b', fontWeight: '700', fontSize: '15px', margin: 0 },
  alerteSous: { color: '#92400e', fontSize: '13px', margin: '4px 0 0' },
  btnAlerte: { background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#000', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', marginLeft: 'auto' },
  vide: { textAlign: 'center', color: '#6b7280', padding: '40px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' },
  tableau: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden', overflowX: 'auto' },
  tableauEntete: { display: 'grid', gridTemplateColumns: '1.3fr 1.8fr 0.9fr 1.4fr 1.4fr 1.1fr 0.9fr', minWidth: '760px', padding: '14px 20px', background: 'rgba(124,58,237,0.1)', fontSize: '11px', fontWeight: '700', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.5px' },
  tableauLigne: { display: 'grid', gridTemplateColumns: '1.3fr 1.8fr 0.9fr 1.4fr 1.4fr 1.1fr 0.9fr', minWidth: '760px', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '14px', alignItems: 'center' },
  agentNom: { fontWeight: '700', color: '#e2e8f0', fontSize: '15px' },
  badgeAttente: { background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  badgeOk: { background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  badgeStatut: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
};
