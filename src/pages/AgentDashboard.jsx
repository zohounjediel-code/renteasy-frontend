import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ClocheNotifications from '../components/ClocheNotifications';

function formaterMontant(n) {
  return `${parseInt(n || 0).toLocaleString('fr-FR')} FCFA`;
}

export default function AgentDashboard() {
  const [perf, setPerf] = useState(null);
  const [chargement, setChargement] = useState(true);
  const { deconnecter, utilisateur } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/agent/performance')
      .then(r => setPerf(r.data))
      .finally(() => setChargement(false));
  }, []);

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <div style={s.navLogo}>
          ⚡ <strong>RentEasy</strong> <span style={s.navBenin}>Bénin</span>
          <span style={s.agentBadge}>Agent</span>
        </div>
        <div style={s.navMenu}>
          <button style={{ ...s.navBtn, ...s.navBtnActif }}>Tableau de bord</button>
          <button style={s.navBtn} onClick={() => navigate('/agent/demandes')}>Demandes</button>
          <button style={s.navBtn} onClick={() => navigate('/agent/recouvrements')}>Recouvrements</button>
          <button style={s.navBtn} onClick={() => navigate('/agent/proprietaires')}>Mes propriétaires</button>
          <button style={s.navBtnProfil} onClick={() => navigate('/profil')}>👤 Mon profil</button>
          <ClocheNotifications />
          <button style={s.navDeconnexion} onClick={deconnecter}>Déconnexion</button>
        </div>
      </nav>

      <div style={s.contenu}>
        <h2 style={s.titre}>Bonjour {utilisateur?.nom?.split(' ')[0]} 👋</h2>
        <p style={s.sousTitre}>Voici la performance de votre portefeuille{perf ? ` — ${perf.mois}` : ''}.</p>

        {chargement ? (
          <p style={{ color: '#6b7280', padding: '20px' }}>Chargement...</p>
        ) : !perf ? (
          <p style={{ color: '#ef4444' }}>Impossible de charger vos statistiques.</p>
        ) : (
          <>
            <div style={s.grilleStats}>
              <div style={s.carteStat} onClick={() => navigate('/agent/proprietaires')} role="button">
                <p style={s.statIcone}>👤</p>
                <p style={s.statVal}>{perf.nb_proprietaires}</p>
                <p style={s.statLabel}>Propriétaire(s) géré(s)</p>
                <p style={s.statSous}>{perf.nb_proprietaires_delegation} en délégation active</p>
              </div>

              <div style={s.carteStat}>
                <p style={s.statIcone}>📊</p>
                <p style={{ ...s.statVal, color: perf.taux_recouvrement >= 80 ? '#10b981' : perf.taux_recouvrement >= 50 ? '#f59e0b' : '#ef4444' }}>
                  {perf.taux_recouvrement}%
                </p>
                <p style={s.statLabel}>Taux de recouvrement</p>
                <p style={s.statSous}>{perf.echeances_payees} / {perf.total_echeances} échéances payées ce mois</p>
              </div>

              <div style={s.carteStat}>
                <p style={s.statIcone}>💰</p>
                <p style={s.statVal}>{formaterMontant(perf.revenus_collectes)}</p>
                <p style={s.statLabel}>Revenus collectés ce mois</p>
                <p style={s.statSous}>Sur l'ensemble de votre portefeuille</p>
              </div>

              <div
                style={{ ...s.carteStat, ...(perf.demandes_en_attente > 0 ? s.carteStatAlerte : {}) }}
                onClick={() => navigate(perf.demandes_marche_en_attente > 0 ? '/agent/proprietaires' : '/agent/demandes')}
                role="button"
              >
                <p style={s.statIcone}>📨</p>
                <p style={{ ...s.statVal, color: perf.demandes_en_attente > 0 ? '#f59e0b' : '#e2e8f0' }}>{perf.demandes_en_attente}</p>
                <p style={s.statLabel}>Demande(s) en attente</p>
                <p style={s.statSous}>{perf.demandes_modification_en_attente} modification(s) · {perf.demandes_marche_en_attente} nouvelle(s) location(s)</p>
              </div>
            </div>

            <div style={s.grilleSecondaire}>
              <div style={s.carteSecondaire}>
                <p style={s.statLabel}>Biens sous gestion</p>
                <p style={s.statValPetit}>{perf.nb_biens}</p>
              </div>
              <div style={s.carteSecondaire}>
                <p style={s.statLabel}>Contrats actifs</p>
                <p style={s.statValPetit}>{perf.nb_contrats_actifs}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: 'linear-gradient(135deg,#0a0a0f 0%,#0d1117 100%)', fontFamily: "'Segoe UI',sans-serif", color: '#e2e8f0' },
  nav: { background: 'rgba(10,10,20,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(124,58,237,0.2)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px', position: 'sticky', top: 0, zIndex: 100, flexWrap: 'wrap' },
  navLogo: { color: '#e2e8f0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' },
  navBenin: { color: '#f59e0b' },
  agentBadge: { background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#000', fontSize: '11px', padding: '3px 10px', borderRadius: '20px', fontWeight: '800' },
  navMenu: { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' },
  navBtn: { background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af', cursor: 'pointer', padding: '7px 12px', borderRadius: '6px', fontSize: '13px' },
  navBtnActif: { background: 'rgba(124,58,237,0.2)', border: '1px solid #7c3aed', color: '#c4b5fd' },
  navBtnProfil: { background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa', cursor: 'pointer', padding: '7px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '600' },
  navDeconnexion: { background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', cursor: 'pointer', padding: '7px 12px', borderRadius: '6px', fontSize: '13px' },
  contenu: { padding: '28px 24px', maxWidth: '1100px', margin: '0 auto' },
  titre: { margin: 0, fontSize: '24px', fontWeight: '800', color: '#e2e8f0' },
  sousTitre: { color: '#6b7280', margin: '6px 0 28px', fontSize: '14px' },
  grilleStats: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' },
  carteStat: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '20px', cursor: 'pointer', transition: 'border 0.2s' },
  carteStatAlerte: { border: '1px solid rgba(245,158,11,0.4)', background: 'rgba(245,158,11,0.06)' },
  statIcone: { fontSize: '20px', margin: '0 0 8px' },
  statVal: { fontSize: '28px', fontWeight: '800', margin: '0 0 4px', color: '#e2e8f0' },
  statLabel: { color: '#c4b5fd', fontSize: '13px', fontWeight: '600', margin: 0 },
  statSous: { color: '#6b7280', fontSize: '12px', margin: '6px 0 0' },
  grilleSecondaire: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginTop: '16px' },
  carteSecondaire: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px' },
  statValPetit: { fontSize: '20px', fontWeight: '700', color: '#e2e8f0', margin: '4px 0 0' },
};
