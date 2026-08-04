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

function formaterMontant(n) {
  return parseInt(n || 0).toLocaleString('fr-FR') + ' FCFA';
}

export default function RapportRegional() {
  const [rapport, setRapport] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [regionOuverte, setRegionOuverte] = useState(null);
  const { utilisateur, deconnecter } = useAuth();
  const navigate = useNavigate();
  const estSuperAdmin = (utilisateur?.role || '').includes('super_admin');

  useEffect(() => {
    api.get('/superadmin/rapport-regional')
      .then(r => {
        setRapport(r.data);
        if (r.data.length > 0) setRegionOuverte(r.data[0].region);
      })
      .catch(console.error)
      .finally(() => setChargement(false));
  }, []);

  if (chargement) {
    return (
      <div style={s.loading}>
        <div style={s.loadingSpinner} />
        <p style={{ color: '#a78bfa' }}>Chargement...</p>
      </div>
    );
  }

  const totalGeneral = rapport.reduce((acc, r) => ({
    revenus_collectes: acc.revenus_collectes + r.totaux.revenus_collectes,
    commissions_generees: acc.commissions_generees + r.totaux.commissions_generees,
    nb_agents: acc.nb_agents + r.totaux.nb_agents,
  }), { revenus_collectes: 0, commissions_generees: 0, nb_agents: 0 });

  return (
    <div style={s.page}>
      <nav style={s.nav} className="re-nav">
        <div style={s.navLogo}>
          <span style={s.navIcone}>⚡</span>
          <span>RentEasy <span style={s.navBenin}>Bénin</span></span>
        </div>
        <div style={s.navMenu}>
          <button style={s.navBtn} onClick={() => navigate(estSuperAdmin ? '/superadmin/dashboard' : '/admin/dashboard')}>← Retour</button>
          <button style={s.navBtnProfil} onClick={() => navigate('/profil')}>👤 Mon profil</button>
          <ClocheNotifications />
          <button style={s.navDeconnexion} onClick={deconnecter}>Déconnexion</button>
        </div>
      </nav>

      <div style={s.contenu}>
        <div style={s.entete}>
          <div>
            <h1 style={s.titre}>Rapport financier régional</h1>
            <p style={s.sousTitre}>Loyers, commissions et recouvrement par région — lecture seule, mois en cours</p>
          </div>
        </div>

        <div style={s.statsGrid}>
          <StatCard icone="🗺️" valeur={rapport.length} label="Régions actives" couleur="#06b6d4" />
          <StatCard icone="👔" valeur={totalGeneral.nb_agents} label="Agents (toutes régions)" couleur="#f59e0b" />
          <StatCard icone="💰" valeur={formaterMontant(totalGeneral.revenus_collectes)} label="Loyers collectés" couleur="#10b981" />
          <StatCard icone="🏦" valeur={formaterMontant(totalGeneral.commissions_generees)} label="Commissions RentEasy" couleur="#7c3aed" />
        </div>

        {rapport.length === 0 ? (
          <div style={s.vide}>Aucune région à afficher — aucun agent enregistré.</div>
        ) : (
          rapport.map(r => {
            const ouverte = regionOuverte === r.region;
            return (
              <div key={r.region} style={s.regionBloc}>
                <button style={s.regionEntete} onClick={() => setRegionOuverte(ouverte ? null : r.region)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '18px' }}>{ouverte ? '▾' : '▸'}</span>
                    <span style={s.regionNom}>📍 {r.region}</span>
                    <span style={s.regionSousInfo}>{r.totaux.nb_agents} agent(s) · {r.totaux.nb_biens} bien(s)</span>
                  </div>
                  <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                    <span style={{ color: '#10b981', fontWeight: '700' }}>{formaterMontant(r.totaux.revenus_collectes)}</span>
                    <span style={{ color: r.totaux.taux_recouvrement >= 80 ? '#10b981' : r.totaux.taux_recouvrement >= 50 ? '#f59e0b' : '#ef4444', fontWeight: '700' }}>
                      {r.totaux.taux_recouvrement}% recouvré
                    </span>
                  </div>
                </button>

                {ouverte && (
                  <div style={s.regionContenu}>
                    <div style={s.statsGridPetit}>
                      <StatCard icone="🏘️" valeur={r.totaux.nb_proprietaires} label="Propriétaires" couleur="#7c3aed" />
                      <StatCard icone="🏠" valeur={r.totaux.nb_biens} label="Biens gérés" couleur="#06b6d4" />
                      <StatCard icone="📋" valeur={r.totaux.nb_contrats_actifs} label="Contrats actifs" couleur="#10b981" />
                      <StatCard icone="🏦" valeur={formaterMontant(r.totaux.commissions_generees)} label="Commissions" couleur="#f59e0b" />
                    </div>

                    <div style={s.tableau}>
                      <div style={s.tableauEntete}>
                        <span>Agent</span>
                        <span>Propriétaires</span>
                        <span>Biens</span>
                        <span>Recouvrement</span>
                        <span>Loyers collectés</span>
                        <span>Commissions</span>
                        <span>Statut</span>
                      </div>
                      {r.agents.map(a => (
                        <div key={a.id} style={s.tableauLigne}>
                          <div style={s.agentNom}>{a.nom}</div>
                          <div style={{ color: '#f59e0b', fontWeight: '700' }}>{a.nb_proprietaires}</div>
                          <div style={{ color: '#06b6d4', fontWeight: '700' }}>{a.nb_biens}</div>
                          <div style={{ color: a.taux_recouvrement >= 80 ? '#10b981' : a.taux_recouvrement >= 50 ? '#f59e0b' : '#ef4444', fontWeight: '700' }}>
                            {a.taux_recouvrement}% <span style={{ color: '#6b7280', fontWeight: '400', fontSize: '11px' }}>({a.echeances_payees}/{a.total_echeances})</span>
                          </div>
                          <div style={{ color: '#10b981', fontWeight: '600' }}>{formaterMontant(a.revenus_collectes)}</div>
                          <div style={{ color: '#7c3aed', fontWeight: '600' }}>{formaterMontant(a.commissions_generees)}</div>
                          <div>
                            <span style={{ ...s.badgeStatut, background: a.actif ? '#064e3b' : '#450a0a', color: a.actif ? '#10b981' : '#ef4444' }}>
                              {a.actif ? '● Actif' : '○ Inactif'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
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
  navMenu: { display: 'flex', gap: '8px', alignItems: 'center' },
  navBtn: { background: 'transparent', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa', cursor: 'pointer', padding: '7px 14px', borderRadius: '6px', fontSize: '13px' },
  navBtnProfil: { background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa', cursor: 'pointer', padding: '7px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '600' },
  navDeconnexion: { background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', cursor: 'pointer', padding: '7px 14px', borderRadius: '6px', fontSize: '13px' },
  contenu: { padding: '32px 24px', maxWidth: '1300px', margin: '0 auto' },
  entete: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' },
  titre: { margin: 0, fontSize: '28px', fontWeight: '800', background: 'linear-gradient(135deg,#c4b5fd,#f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  sousTitre: { color: '#6b7280', margin: '6px 0 0', fontSize: '14px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '16px', marginBottom: '28px' },
  statsGridPetit: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '12px', marginBottom: '16px' },
  statCard: { background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px' },
  statIcone: { fontSize: '24px', marginBottom: '6px' },
  statValeur: { fontSize: '24px', fontWeight: '800', marginBottom: '4px' },
  statLabel: { fontSize: '13px', color: '#9ca3af', fontWeight: '500' },
  statSous: { fontSize: '12px', color: '#6b7280', marginTop: '4px' },
  vide: { textAlign: 'center', color: '#6b7280', padding: '40px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' },
  regionBloc: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', marginBottom: '16px', overflow: 'hidden' },
  regionEntete: { width: '100%', background: 'rgba(124,58,237,0.08)', border: 'none', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', color: '#e2e8f0', flexWrap: 'wrap', gap: '12px', textAlign: 'left' },
  regionNom: { fontSize: '16px', fontWeight: '700', color: '#c4b5fd' },
  regionSousInfo: { fontSize: '12px', color: '#6b7280', fontWeight: '400' },
  regionContenu: { padding: '20px 24px' },
  tableau: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden', overflowX: 'auto' },
  tableauEntete: { display: 'grid', gridTemplateColumns: '1.6fr 1fr 0.8fr 1.3fr 1.3fr 1.2fr 0.9fr', minWidth: '760px', padding: '12px 18px', background: 'rgba(124,58,237,0.1)', fontSize: '11px', fontWeight: '700', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.5px' },
  tableauLigne: { display: 'grid', gridTemplateColumns: '1.6fr 1fr 0.8fr 1.3fr 1.3fr 1.2fr 0.9fr', minWidth: '760px', padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '13px', alignItems: 'center' },
  agentNom: { fontWeight: '700', color: '#e2e8f0', fontSize: '14px' },
  badgeStatut: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
};
