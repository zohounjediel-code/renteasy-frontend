import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function KPICard({ titre, valeur, sous, couleur, icone }) {
  return (
    <div style={{ ...styles.kpiCard, borderTop: `4px solid ${couleur}` }}>
      <div style={styles.kpiIcone}>{icone}</div>
      <div style={{ ...styles.kpiValeur, color: couleur }}>{valeur}</div>
      <div style={styles.kpiTitre}>{titre}</div>
      {sous && <div style={styles.kpiSous}>{sous}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [chargement, setChargement] = useState(true);
  const { utilisateur, deconnecter } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard')
      .then((r) => setData(r.data))
      .catch(console.error)
      .finally(() => setChargement(false));
  }, []);

  function formaterMontant(n) {
    return parseInt(n || 0).toLocaleString('fr-FR') + ' FCFA';
  }

  function formaterDate(d) {
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  if (chargement) {
    return (
      <div style={styles.chargement}>
        <div style={styles.spinner} />
        <p>Chargement du tableau de bord...</p>
      </div>
    );
  }

  const biens = data?.biens || {};
  const mois = data?.mois_en_cours || {};
  const impayes = data?.impayes || [];
  const paiements = data?.derniers_paiements || [];

  return (
    <div style={styles.page}>
      {/* Barre de navigation */}
      <nav style={styles.nav}>
        <div style={styles.navLogo}>🏠 <strong>RentEasy</strong> <span style={styles.navBenin}>Bénin</span></div>
        <div style={styles.navMenu}>
          <button style={styles.navBtn} onClick={() => navigate('/biens')}>Mes biens</button>
          <button style={styles.navBtn} onClick={() => navigate('/locataires')}>Locataires</button>
          <button style={styles.navBtnActif}>Dashboard</button>
          <button style={styles.navDeconnexion} onClick={deconnecter}>Déconnexion</button>
        </div>
      </nav>

      <div style={styles.contenu}>
        {/* En-tête */}
        <div style={styles.entete}>
          <div>
            <h2 style={styles.titre}>Bonjour, {utilisateur?.nom} 👋</h2>
            <p style={styles.sousTitre}>Tableau de bord — {mois.mois}</p>
          </div>
        </div>

        {/* KPIs */}
        <div style={styles.kpiGrid}>
          <KPICard
            titre="Biens gérés"
            valeur={biens.total_biens || 0}
            sous={`${biens.biens_occupes || 0} occupés · ${biens.biens_libres || 0} libres`}
            couleur="#1a3a5c"
            icone="🏘️"
          />
          <KPICard
            titre="Loyers collectés"
            valeur={formaterMontant(mois.montant_total_collecte)}
            sous={`sur ${formaterMontant(mois.montant_total_du)} attendus`}
            couleur="#2e7d32"
            icone="💰"
          />
          <KPICard
            titre="Taux de recouvrement"
            valeur={`${mois.taux_recouvrement || 0}%`}
            sous={`${mois.echeances_payees || 0} / ${mois.total_echeances || 0} échéances`}
            couleur="#e8a020"
            icone="📊"
          />
          <KPICard
            titre="Impayés en retard"
            valeur={impayes.length}
            sous="à relancer"
            couleur="#c62828"
            icone="⚠️"
          />
        </div>

        <div style={styles.grille2col}>
          {/* Impayés */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitre}>⚠️ Impayés en retard</h3>
            {impayes.length === 0 ? (
              <p style={styles.vide}>Aucun impayé en retard 🎉</p>
            ) : (
              impayes.map((e) => (
                <div key={e.id} style={styles.ligne}>
                  <div>
                    <div style={styles.ligneNom}>{e.locataire_nom}</div>
                    <div style={styles.ligneInfo}>{e.adresse} · {e.ville}</div>
                    <div style={styles.ligneInfo}>Échéance : {formaterDate(e.date_limite)}</div>
                  </div>
                  <div style={styles.montantRouge}>{formaterMontant(e.montant_du)}</div>
                </div>
              ))
            )}
          </div>

          {/* Derniers paiements */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitre}>✅ Derniers paiements</h3>
            {paiements.length === 0 ? (
              <p style={styles.vide}>Aucun paiement enregistré ce mois</p>
            ) : (
              paiements.map((p) => (
                <div key={p.id} style={styles.ligne}>
                  <div>
                    <div style={styles.ligneNom}>{p.locataire_nom}</div>
                    <div style={styles.ligneInfo}>{p.adresse}</div>
                    <div style={styles.ligneInfo}>{formaterDate(p.date_paiement)} · {p.methode.replace('_', ' ')}</div>
                  </div>
                  <div style={styles.montantVert}>{formaterMontant(p.montant)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#f5f7fa', fontFamily: "'Segoe UI', sans-serif" },
  chargement: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '16px', color: '#666' },
  spinner: { width: '40px', height: '40px', border: '4px solid #ddd', borderTop: '4px solid #e8a020', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  nav: { background: '#1a3a5c', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px' },
  navLogo: { color: '#fff', fontSize: '18px' },
  navBenin: { color: '#e8a020' },
  navMenu: { display: 'flex', gap: '8px', alignItems: 'center' },
  navBtn: { background: 'transparent', border: 'none', color: '#ccc', cursor: 'pointer', padding: '8px 12px', borderRadius: '6px', fontSize: '14px' },
  navBtnActif: { background: '#e8a020', border: 'none', color: '#fff', cursor: 'pointer', padding: '8px 12px', borderRadius: '6px', fontSize: '14px', fontWeight: '600' },
  navDeconnexion: { background: 'transparent', border: '1px solid #c62828', color: '#ff6b6b', cursor: 'pointer', padding: '8px 12px', borderRadius: '6px', fontSize: '14px' },
  contenu: { padding: '24px', maxWidth: '1200px', margin: '0 auto' },
  entete: { marginBottom: '24px' },
  titre: { margin: 0, fontSize: '24px', color: '#1a3a5c' },
  sousTitre: { color: '#666', margin: '4px 0 0' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' },
  kpiCard: { background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  kpiIcone: { fontSize: '28px', marginBottom: '8px' },
  kpiValeur: { fontSize: '28px', fontWeight: '700', marginBottom: '4px' },
  kpiTitre: { fontSize: '13px', color: '#333', fontWeight: '600' },
  kpiSous: { fontSize: '12px', color: '#888', marginTop: '4px' },
  grille2col: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' },
  section: { background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  sectionTitre: { margin: '0 0 16px', fontSize: '16px', color: '#1a3a5c' },
  vide: { color: '#888', fontSize: '14px', textAlign: 'center', padding: '20px 0' },
  ligne: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f0f0f0' },
  ligneNom: { fontWeight: '600', fontSize: '14px', color: '#222' },
  ligneInfo: { fontSize: '12px', color: '#888', marginTop: '2px' },
  montantRouge: { color: '#c62828', fontWeight: '700', fontSize: '14px', whiteSpace: 'nowrap' },
  montantVert: { color: '#2e7d32', fontWeight: '700', fontSize: '14px', whiteSpace: 'nowrap' },
};
