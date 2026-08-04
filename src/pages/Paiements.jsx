import { useEffect, useState } from 'react';
import ClocheNotifications from '../components/ClocheNotifications';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

const STATUT_COULEURS = {
  payee: { bg: '#e8f5e9', color: '#2e7d32', label: '✅ Payée' },
  en_attente: { bg: '#fff3e0', color: '#e65100', label: '⏳ En attente' },
  impayee: { bg: '#ffebee', color: '#c62828', label: '❌ Impayée' },
  partielle: { bg: '#e3f2fd', color: '#1565c0', label: '⚡ Partielle' },
  en_recouvrement: { bg: '#f3e5f5', color: '#6a1b9a', label: '🔄 En recouvrement' },
};

export default function Paiements() {
  const [echeances, setEcheances] = useState([]);
  const [contrats, setContrats] = useState([]);
  const [filtre, setFiltre] = useState('tous');
  const [chargement, setChargement] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { utilisateur } = useAuth();
  const estAussiLocataire = (utilisateur?.role || '').includes('locataire');

  // Un admin/super_admin peut consulter les paiements d'un propriétaire précis via
  // ?proprietaire_id= (repris depuis AgentProprietaireDetail).
  const parametres = new URLSearchParams(location.search);
  const proprietaireIdConsulte = parametres.get('proprietaire_id');
  const proprietaireNomConsulte = parametres.get('proprietaire_nom');
  const enConsultationAdmin = !!proprietaireIdConsulte;

  function lienConsultation(chemin) {
    if (!enConsultationAdmin) return chemin;
    const p = new URLSearchParams({ proprietaire_id: proprietaireIdConsulte });
    if (proprietaireNomConsulte) p.set('proprietaire_nom', proprietaireNomConsulte);
    return `${chemin}?${p.toString()}`;
  }

  useEffect(() => { chargerDonnees(); }, [proprietaireIdConsulte]);

  async function chargerDonnees() {
    try {
      const params = enConsultationAdmin ? { proprietaire_id: proprietaireIdConsulte } : {};
      const r = await api.get('/contrats', { params });
      setContrats(r.data);
      // Récupère toutes les échéances de tous les contrats (obtenirContrat autorise déjà
      // admin/super_admin sur n'importe quel contrat, sans besoin de proprietaire_id ici)
      const echeancesPromises = r.data.map(c => api.get(`/contrats/${c.id}`));
      const resultats = await Promise.all(echeancesPromises);
      const toutesEcheances = resultats.flatMap(r =>
        r.data.echeances.map(e => ({
          ...e,
          adresse: r.data.adresse,
          locataire_nom: r.data.locataire_nom,
          locataire_telephone: r.data.locataire_telephone,
        }))
      );
      toutesEcheances.sort((a, b) => new Date(a.mois_concerne) - new Date(b.mois_concerne));
      setEcheances(toutesEcheances);
    } catch (e) {
      console.error(e);
    } finally {
      setChargement(false);
    }
  }

  function formaterMontant(n) {
    return parseInt(n).toLocaleString('fr-FR') + ' FCFA';
  }

  function formaterDate(d) {
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  const maintenant = new Date();
  const moisCourantDebut = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
  const moisCourantFin = new Date(maintenant.getFullYear(), maintenant.getMonth() + 1, 0, 23, 59, 59);

  function estMoisCourant(dateStr) {
    const d = new Date(dateStr);
    return d >= moisCourantDebut && d <= moisCourantFin;
  }
  function estMoisCourantOuPasse(dateStr) {
    return new Date(dateStr) <= moisCourantFin;
  }

  const echeancesFiltrees = echeances.filter(e => {
    if (filtre === 'impayee' || filtre === 'partielle' || filtre === 'en_recouvrement') {
      return e.statut === filtre && estMoisCourantOuPasse(e.mois_concerne);
    }
    if (filtre === 'tous') return estMoisCourant(e.mois_concerne);
    return e.statut === filtre && estMoisCourant(e.mois_concerne);
  });

  return (
    <div style={styles.page}>
      <nav style={styles.nav} className="re-nav">
        <div style={styles.navLogo} onClick={() => navigate(lienConsultation('/dashboard'))}>🏠 <strong>RentEasy</strong> <span style={styles.navBenin}>Bénin</span></div>
        <div style={styles.navMenu}>
          <button style={styles.navBtn} onClick={() => navigate(lienConsultation('/biens'))}>Mes biens</button>
          <button style={styles.navBtn} onClick={() => navigate(lienConsultation('/locataires'))}>Locataires</button>
          <button style={styles.navBtnActif}>Paiements</button>
          {estAussiLocataire && !enConsultationAdmin && (
            <button style={styles.navBtnBasculer} onClick={() => navigate('/locataire/dashboard')}>🔄 Espace locataire</button>
          )}
          <button style={styles.navBtnProfil} onClick={() => navigate('/profil')}>👤 Mon profil</button>
          <ClocheNotifications />
          <button style={styles.navBtn} onClick={() => navigate(lienConsultation('/dashboard'))}>Dashboard</button>
        </div>
      </nav>

      <div style={styles.contenu}>
        {enConsultationAdmin && (
          <div style={styles.bandeauConsultation}>
            🛡️ Vous consultez le compte de <strong>{proprietaireNomConsulte || 'ce propriétaire'}</strong> en tant qu'administrateur.
          </div>
        )}
        <div style={styles.entete}>
          <h2 style={styles.titre}>Échéances & Paiements</h2>
        </div>

        {/* Filtres */}
        <div style={styles.filtres}>
          {['tous', 'en_attente', 'payee', 'impayee', 'partielle', 'en_recouvrement'].map(f => (
            <button
              key={f}
              style={{ ...styles.filtreBouton, background: filtre === f ? '#1a3a5c' : '#fff', color: filtre === f ? '#fff' : '#555' }}
              onClick={() => setFiltre(f)}
            >
              {f === 'tous' ? 'Toutes' : STATUT_COULEURS[f]?.label || f}
            </button>
          ))}
        </div>
        <p style={{ color: '#6b7280', fontSize: '12px', margin: '-8px 0 16px' }}>
          {filtre === 'impayee' || filtre === 'partielle' || filtre === 'en_recouvrement'
            ? 'Échéances de cette catégorie, mois en cours et passés.'
            : 'Échéances du mois en cours uniquement.'}
        </p>

        {/* Liste des échéances */}
        {chargement ? (
          <p style={styles.vide}>Chargement...</p>
        ) : echeancesFiltrees.length === 0 ? (
          <div style={styles.vide}>
            <p>Aucune échéance trouvée pour ce filtre.</p>
          </div>
        ) : (
          <div style={styles.tableau}>
            <div style={{ ...styles.tableauEntete, gridTemplateColumns: '1.2fr 1.5fr 2fr 1.3fr 1.5fr', minWidth: '640px' }}>
              <span>Période</span>
              <span>Locataire</span>
              <span>Bien</span>
              <span>Montant</span>
              <span>Statut</span>
            </div>
            {echeancesFiltrees.map(e => {
              const statutInfo = STATUT_COULEURS[e.statut] || { bg: '#f5f5f5', color: '#9ca3af', label: e.statut };
              return (
                <div key={e.id} style={{ ...styles.tableauLigne, gridTemplateColumns: '1.2fr 1.5fr 2fr 1.3fr 1.5fr', minWidth: '640px' }}>
                  <span style={styles.mois}>{formaterDate(e.mois_concerne)}</span>
                  <span>{e.locataire_nom}</span>
                  <span style={{ color: '#6b7280', fontSize: '13px' }}>{e.adresse}</span>
                  <span style={{ fontWeight: '700', color: '#c4b5fd' }}>
                    {formaterMontant(e.statut === 'partielle' ? e.montant_restant : e.montant_du)}
                    {e.statut === 'partielle' && <span style={{ fontSize: '11px', color: '#6b7280', display: 'block', fontWeight: '400' }}>reste sur {formaterMontant(e.montant_du)}</span>}
                  </span>
                  <span>
                    <span style={{ ...styles.statutBadge, background: statutInfo.bg, color: statutInfo.color }}>
                      {statutInfo.label}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
    page: { minHeight: '100vh', background: 'linear-gradient(135deg,#0a0a0f 0%,#0d1117 100%)', fontFamily: "'Segoe UI',sans-serif", color: '#e2e8f0' },
    nav: { background: 'rgba(10,10,20,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(124,58,237,0.2)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px', position: 'sticky', top: 0, zIndex: 100 },
    navLogo: { color: '#e2e8f0', fontSize: '18px', cursor: 'pointer' },
    navBenin: { color: '#f59e0b' },
  navMenu: { display: 'flex', gap: '8px', alignItems: 'center' },
    navBtn: { background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af', cursor: 'pointer', padding: '7px 12px', borderRadius: '6px', fontSize: '13px' },
    navBtnProfil: { background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa', cursor: 'pointer', padding: '7px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '600' },
  navBtnActif: { background: 'rgba(124,58,237,0.2)', border: '1px solid #7c3aed', color: '#c4b5fd', cursor: 'pointer', padding: '7px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '600' },
  contenu: { padding: '24px', maxWidth: '1200px', margin: '0 auto' },
  bandeauConsultation: { background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.35)', color: '#f59e0b', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px' },
  entete: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    titre: { margin: 0, fontSize: '24px', fontWeight: '800', background: 'linear-gradient(135deg,#c4b5fd,#f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
    boutonPrimaire: { background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  boutonAnnuler: { background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', cursor: 'pointer', flex: 1 },
    succes: { background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  filtres: { display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' },
  filtreBouton: { border: '1.5px solid #ddd', borderRadius: '20px', padding: '6px 16px', fontSize: '13px', cursor: 'pointer', fontWeight: '500' },
    vide: { textAlign: 'center', color: '#6b7280', padding: '40px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' },
    tableau: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden', overflowX: 'auto' },
  tableauEntete: { display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 2fr 1.3fr 1.5fr 1fr', padding: '12px 20px', background: 'rgba(255,255,255,0.03)', fontSize: '12px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' },
  tableauLigne: { display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 2fr 1.3fr 1.5fr 1fr', padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '14px', alignItems: 'center' },
  mois: { fontWeight: '600', color: '#e2e8f0', textTransform: 'capitalize' },
  statutBadge: { fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '20px' },
  boutonPayer: { background: '#1a3a5c', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' },
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modal: { background: '#0f0a1e', border: '1px solid rgba(124,58,237,0.4)', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '460px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' },
  modalTitre: { margin: '0 0 4px', color: '#c4b5fd', fontSize: '20px' },
  modalSous: { color: '#6b7280', fontSize: '14px', marginBottom: '20px' },
    label: { fontSize: '13px', fontWeight: '600', color: '#9ca3af', display: 'block', marginBottom: '4px', marginTop: '12px' },
    input: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '14px', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', color: '#e2e8f0', outline: 'none' },
    option: { background: '#0f0a1e', color: '#e2e8f0' },
    erreur: { color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '10px', borderRadius: '6px', fontSize: '13px', marginTop: '8px', border: '1px solid rgba(239,68,68,0.2)' },
};
