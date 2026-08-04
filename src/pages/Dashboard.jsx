import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ClocheNotifications from '../components/ClocheNotifications';
import BoutonActiverRole from '../components/BoutonActiverRole';

function KPICard({ titre, valeur, sous, couleur, icone }) {
  return (
    <div style={{ ...s.kpiCard, borderTop: `3px solid ${couleur}` }}>
      <div style={s.kpiIcone}>{icone}</div>
      <div style={{ ...s.kpiValeur, color: couleur }}>{valeur}</div>
      <div style={s.kpiTitre}>{titre}</div>
      {sous && <div style={s.kpiSous}>{sous}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [chargement, setChargement] = useState(true);
  const { utilisateur, deconnecter } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const estAussiLocataire = (utilisateur?.role || '').includes('locataire');

  // Un admin/super_admin peut consulter le tableau de bord d'un propriétaire précis via
  // ?proprietaire_id= (repris depuis AgentProprietaireDetail) — le propriétaire lui-même
  // n'a jamais ce paramètre et continue de voir ses propres données comme avant.
  const parametres = new URLSearchParams(location.search);
  const proprietaireIdConsulte = parametres.get('proprietaire_id');
  const proprietaireNomConsulte = parametres.get('proprietaire_nom');
  const enConsultationAdmin = !!proprietaireIdConsulte;

  // Ajoute ?proprietaire_id= (et le nom, pour le conserver d'un onglet à l'autre) aux liens
  // de navigation, pour que l'admin reste sur le même propriétaire en changeant de page.
  function lienConsultation(chemin) {
    if (!enConsultationAdmin) return chemin;
    const p = new URLSearchParams({ proprietaire_id: proprietaireIdConsulte });
    if (proprietaireNomConsulte) p.set('proprietaire_nom', proprietaireNomConsulte);
    return `${chemin}?${p.toString()}`;
  }

  useEffect(() => {
    const params = enConsultationAdmin ? { proprietaire_id: proprietaireIdConsulte } : {};
    api.get('/dashboard', { params })
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setChargement(false));
  }, [proprietaireIdConsulte]);

  function formaterMontant(n) {
    return parseInt(n || 0).toLocaleString('fr-FR') + ' FCFA';
  }
  function formaterDate(d) {
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  if (chargement) return (
    <div style={s.loading}>
      <div style={s.spinner} />
      <p style={{ color: '#a78bfa' }}>Chargement...</p>
    </div>
  );

  const biens = data?.biens || {};
  const mois = data?.mois_en_cours || {};
  const impayes = data?.impayes || [];
  const paiements = data?.derniers_paiements || [];

  return (
    <div style={s.page}>
      <nav style={s.nav} className="re-nav">
        <div style={s.navLogo}>🏠 <strong>RentEasy</strong> <span style={s.navBenin}>Bénin</span></div>
        <div style={s.navMenu}>
          <button style={s.navBtn} onClick={() => navigate(lienConsultation('/biens'))}>Mes biens</button>
          <button style={s.navBtn} onClick={() => navigate(lienConsultation('/locataires'))}>Locataires</button>
          <button style={s.navBtn} onClick={() => navigate(lienConsultation('/paiements'))}>Paiements</button>
          <button style={s.navBtnActif}>Dashboard</button>
          {!enConsultationAdmin && (
            <button style={s.navBtn} onClick={() => navigate('/proprietaire/mon-agent')}>👔 Mon agent</button>
          )}
          {estAussiLocataire && !enConsultationAdmin && (
            <button style={s.navBtnBasculer} onClick={() => navigate('/locataire/dashboard')}>🔄 Espace locataire</button>
          )}
          <button style={s.navBtnProfil} onClick={() => navigate('/profil')}>👤 Mon profil</button>
          <ClocheNotifications />
          <button style={s.navDeconnexion} onClick={deconnecter}>Déconnexion</button>
        </div>
      </nav>

      <div style={s.contenu}>
        {enConsultationAdmin && (
          <div style={s.bandeauConsultation}>
            🛡️ Vous consultez le compte de <strong>{proprietaireNomConsulte || 'ce propriétaire'}</strong> en tant qu'administrateur.
          </div>
        )}

        <div style={s.entete}>
          <div>
            <h2 style={s.titre}>{enConsultationAdmin ? `Tableau de bord de ${proprietaireNomConsulte || 'ce propriétaire'}` : `Bonjour, ${utilisateur?.nom} 👋`}</h2>
            <p style={s.sousTitre}>Tableau de bord — {mois.mois}</p>
          </div>
        </div>

        {!enConsultationAdmin && <BoutonActiverRole />}

        <div style={s.kpiGrid}>
          <KPICard titre="Biens gérés" valeur={biens.total_biens || 0} sous={`${biens.biens_occupes || 0} occupés · ${biens.biens_libres || 0} libres`} couleur="#7c3aed" icone="🏘️" />
          <KPICard titre="Loyers collectés" valeur={formaterMontant(mois.montant_total_collecte)} sous={`sur ${formaterMontant(mois.montant_total_du)} attendus`} couleur="#10b981" icone="💰" />
          <KPICard titre="Taux de recouvrement" valeur={`${mois.taux_recouvrement || 0}%`} sous={`${mois.echeances_payees || 0} / ${mois.total_echeances || 0} échéances`} couleur="#f59e0b" icone="📊" />
          <KPICard titre="Impayés en retard" valeur={impayes.length} sous="à relancer" couleur="#ef4444" icone="⚠️" />
        </div>

        <div style={s.grille2}>
          <div style={s.section}>
            <h3 style={s.sectionTitre}>⚠️ Impayés en retard</h3>
            {impayes.length === 0 ? (
              <p style={s.vide}>Aucun impayé en retard 🎉</p>
            ) : (
              impayes.map(e => (
                <div key={e.id} style={s.ligne}>
                  <div>
                    <div style={s.ligneNom}>{e.locataire_nom}</div>
                    <div style={s.ligneInfo}>{e.adresse} · {e.ville}</div>
                    <div style={s.ligneInfo}>Échéance : {formaterDate(e.date_limite)}</div>
                  </div>
                  <div style={{ color: '#ef4444', fontWeight: '700' }}>{formaterMontant(e.montant_du)}</div>
                </div>
              ))
            )}
          </div>

          <div style={s.section}>
            <h3 style={s.sectionTitre}>✅ Derniers paiements</h3>
            {paiements.length === 0 ? (
              <p style={s.vide}>Aucun paiement ce mois</p>
            ) : (
              paiements.map(p => (
                <div key={p.id} style={s.ligne}>
                  <div>
                    <div style={s.ligneNom}>{p.locataire_nom}</div>
                    <div style={s.ligneInfo}>{p.adresse}</div>
                    <div style={s.ligneInfo}>{formaterDate(p.date_paiement)} · {p.methode?.replace('_', ' ')}</div>
                  </div>
                  <div style={{ color: '#10b981', fontWeight: '700' }}>{formaterMontant(p.montant)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: 'linear-gradient(135deg,#0a0a0f 0%,#0d1117 100%)', fontFamily: "'Segoe UI',sans-serif", color: '#e2e8f0' },
  loading: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '16px', background: '#0a0a0f' },
  spinner: { width: '40px', height: '40px', border: '3px solid #1e1b4b', borderTop: '3px solid #7c3aed', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  nav: { background: 'rgba(10,10,20,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(124,58,237,0.2)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px', position: 'sticky', top: 0, zIndex: 100 },
  navLogo: { color: '#e2e8f0', fontSize: '18px' },
  navBenin: { color: '#f59e0b' },
  navMenu: { display: 'flex', gap: '6px', alignItems: 'center' },
  navBtn: { background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af', cursor: 'pointer', padding: '7px 12px', borderRadius: '6px', fontSize: '13px' },
  navBtnActif: { background: 'rgba(124,58,237,0.2)', border: '1px solid #7c3aed', color: '#c4b5fd', cursor: 'pointer', padding: '7px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '600' },
  navBtnBasculer: { background: 'linear-gradient(135deg,#f59e0b,#d97706)', border: 'none', color: '#000', cursor: 'pointer', padding: '7px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '700' },
  navBtnProfil: { background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa', cursor: 'pointer', padding: '7px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '600' },
  navDeconnexion: { background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', cursor: 'pointer', padding: '7px 12px', borderRadius: '6px', fontSize: '13px' },
  contenu: { padding: '28px 24px', maxWidth: '1200px', margin: '0 auto' },
  bandeauConsultation: { background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.35)', color: '#f59e0b', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px' },
  entete: { marginBottom: '24px' },
  titre: { margin: 0, fontSize: '26px', fontWeight: '800', background: 'linear-gradient(135deg,#c4b5fd,#f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  sousTitre: { color: '#6b7280', margin: '4px 0 0', fontSize: '14px' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '16px', marginBottom: '24px', marginTop: '16px' },
  kpiCard: { background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px' },
  kpiIcone: { fontSize: '28px', marginBottom: '8px' },
  kpiValeur: { fontSize: '28px', fontWeight: '800', marginBottom: '4px' },
  kpiTitre: { fontSize: '13px', color: '#9ca3af', fontWeight: '500' },
  kpiSous: { fontSize: '12px', color: '#6b7280', marginTop: '4px' },
  grille2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: '16px' },
  section: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px' },
  sectionTitre: { margin: '0 0 16px', fontSize: '15px', color: '#c4b5fd', fontWeight: '700' },
  vide: { color: '#6b7280', fontSize: '14px', textAlign: 'center', padding: '20px 0' },
  ligne: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  ligneNom: { fontWeight: '600', fontSize: '14px', color: '#e2e8f0' },
  ligneInfo: { fontSize: '12px', color: '#6b7280', marginTop: '2px' },
};
