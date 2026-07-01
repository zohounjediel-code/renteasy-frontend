import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const METHODES = [
  { value: 'mtn_momo', label: 'MTN Mobile Money' },
  { value: 'moov_money', label: 'Moov Money' },
  { value: 'celtiis_pay', label: 'Celtiis Pay' },
  { value: 'especes', label: 'Espèces' },
  { value: 'virement', label: 'Virement bancaire' },
];

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
  const [modalPaiement, setModalPaiement] = useState(null);
  const [formPaiement, setFormPaiement] = useState({ montant: '', methode: 'mtn_momo', telephone_payeur: '', reference_transaction: '' });
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');
  const navigate = useNavigate();

  useEffect(() => { chargerDonnees(); }, []);

  async function chargerDonnees() {
    try {
      const r = await api.get('/contrats');
      setContrats(r.data);
      // Récupère toutes les échéances de tous les contrats
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

  async function enregistrerPaiement() {
    setErreur(''); setSucces('');
    if (!formPaiement.montant || !formPaiement.methode) {
      setErreur('Montant et méthode sont obligatoires');
      return;
    }

    const estMobileMoney = ['mtn_momo', 'moov_money', 'celtiis_pay'].includes(formPaiement.methode);
    if (estMobileMoney && !formPaiement.telephone_payeur) {
      setErreur('Le numéro de téléphone est obligatoire pour un paiement Mobile Money');
      return;
    }

    setEnvoi(true);
    try {
      if (estMobileMoney) {
        // Initiation Mobile Money
        await api.post('/mobilemoney/initier', {
          echeance_id: modalPaiement.id,
          methode: formPaiement.methode,
          telephone_payeur: formPaiement.telephone_payeur,
        });
        setSucces('Demande envoyée ! Le locataire va recevoir une notification sur son téléphone.');
      } else {
        // Paiement manuel (espèces ou virement)
        await api.post('/paiements', {
          echeance_id: modalPaiement.id,
          montant: parseInt(formPaiement.montant),
          methode: formPaiement.methode,
          reference_transaction: formPaiement.reference_transaction || undefined,
        });
        setSucces('Paiement enregistré avec succès ! La quittance PDF a été générée.');
      }
      setModalPaiement(null);
      setFormPaiement({ montant: '', methode: 'mtn_momo', telephone_payeur: '', reference_transaction: '' });
      chargerDonnees();
    } catch (e) {
      setErreur(e.response?.data?.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setEnvoi(false);
    }
  }

  function ouvrirModal(echeance) {
    setModalPaiement(echeance);
    setFormPaiement({ montant: echeance.montant_du.toString(), methode: 'mtn_momo', telephone_payeur: echeance.locataire_telephone || '', reference_transaction: '' });
    setErreur('');
    setSucces('');
  }

  function formaterMontant(n) {
    return parseInt(n).toLocaleString('fr-FR') + ' FCFA';
  }

  function formaterDate(d) {
    return new Date(d).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }

  const estMobileMoney = ['mtn_momo', 'moov_money', 'celtiis_pay'].includes(formPaiement.methode);

  const echeancesFiltrees = filtre === 'tous'
    ? echeances
    : echeances.filter(e => e.statut === filtre);

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <div style={styles.navLogo} onClick={() => navigate('/dashboard')}>🏠 <strong>RentEasy</strong> <span style={styles.navBenin}>Bénin</span></div>
        <div style={styles.navMenu}>
          <button style={styles.navBtn} onClick={() => navigate('/biens')}>Mes biens</button>
          <button style={styles.navBtn} onClick={() => navigate('/locataires')}>Locataires</button>
          <button style={styles.navBtnActif}>Paiements</button>
          <button style={styles.navBtn} onClick={() => navigate('/dashboard')}>Dashboard</button>
        </div>
      </nav>

      <div style={styles.contenu}>
        <div style={styles.entete}>
          <h2 style={styles.titre}>Échéances & Paiements</h2>
        </div>

        {succes && <div style={styles.succes}>{succes}</div>}

        {/* Filtres */}
        <div style={styles.filtres}>
          {['tous', 'en_attente', 'payee', 'impayee', 'partielle'].map(f => (
            <button
              key={f}
              style={{ ...styles.filtreBouton, background: filtre === f ? '#1a3a5c' : '#fff', color: filtre === f ? '#fff' : '#555' }}
              onClick={() => setFiltre(f)}
            >
              {f === 'tous' ? 'Toutes' : STATUT_COULEURS[f]?.label || f}
            </button>
          ))}
        </div>

        {/* Liste des échéances */}
        {chargement ? (
          <p style={styles.vide}>Chargement...</p>
        ) : echeancesFiltrees.length === 0 ? (
          <div style={styles.vide}>
            <p>Aucune échéance trouvée pour ce filtre.</p>
          </div>
        ) : (
          <div style={styles.tableau}>
            <div style={styles.tableauEntete}>
              <span>Mois</span>
              <span>Locataire</span>
              <span>Bien</span>
              <span>Montant</span>
              <span>Statut</span>
              <span>Action</span>
            </div>
            {echeancesFiltrees.map(e => {
              const statutInfo = STATUT_COULEURS[e.statut] || { bg: '#f5f5f5', color: '#666', label: e.statut };
              return (
                <div key={e.id} style={styles.tableauLigne}>
                  <span style={styles.mois}>{formaterDate(e.mois_concerne)}</span>
                  <span>{e.locataire_nom}</span>
                  <span style={{ color: '#888', fontSize: '13px' }}>{e.adresse}</span>
                  <span style={{ fontWeight: '700', color: '#1a3a5c' }}>{formaterMontant(e.montant_du)}</span>
                  <span>
                    <span style={{ ...styles.statutBadge, background: statutInfo.bg, color: statutInfo.color }}>
                      {statutInfo.label}
                    </span>
                  </span>
                  <span>
                    {e.statut !== 'payee' && (
                      <button style={styles.boutonPayer} onClick={() => ouvrirModal(e)}>
                        💳 Payer
                      </button>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal paiement */}
      {modalPaiement && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitre}>Enregistrer un paiement</h3>
            <p style={styles.modalSous}>
              {modalPaiement.locataire_nom} · {formaterDate(modalPaiement.mois_concerne)}
            </p>

            <label style={styles.label}>Montant (FCFA) *</label>
            <input style={styles.input} type="number" value={formPaiement.montant} onChange={e => setFormPaiement({ ...formPaiement, montant: e.target.value })} />

            <label style={styles.label}>Méthode de paiement *</label>
            <select style={styles.input} value={formPaiement.methode} onChange={e => setFormPaiement({ ...formPaiement, methode: e.target.value })}>
              {METHODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>

            {estMobileMoney && (
              <>
                <label style={styles.label}>Téléphone du payeur *</label>
                <input style={styles.input} placeholder="+22997001122" value={formPaiement.telephone_payeur} onChange={e => setFormPaiement({ ...formPaiement, telephone_payeur: e.target.value })} />
              </>
            )}

            {!estMobileMoney && (
              <>
                <label style={styles.label}>Référence (optionnel)</label>
                <input style={styles.input} placeholder="Reçu N°..." value={formPaiement.reference_transaction} onChange={e => setFormPaiement({ ...formPaiement, reference_transaction: e.target.value })} />
              </>
            )}

            {erreur && <p style={styles.erreur}>{erreur}</p>}

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button style={styles.boutonAnnuler} onClick={() => setModalPaiement(null)}>Annuler</button>
              <button style={styles.boutonPrimaire} onClick={enregistrerPaiement} disabled={envoi}>
                {envoi ? 'Traitement...' : estMobileMoney ? '📱 Envoyer la demande' : '✅ Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#f5f7fa', fontFamily: "'Segoe UI', sans-serif" },
  nav: { background: '#1a3a5c', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px' },
  navLogo: { color: '#fff', fontSize: '18px', cursor: 'pointer' },
  navBenin: { color: '#e8a020' },
  navMenu: { display: 'flex', gap: '8px', alignItems: 'center' },
  navBtn: { background: 'transparent', border: 'none', color: '#ccc', cursor: 'pointer', padding: '8px 12px', borderRadius: '6px', fontSize: '14px' },
  navBtnActif: { background: '#e8a020', border: 'none', color: '#fff', cursor: 'pointer', padding: '8px 12px', borderRadius: '6px', fontSize: '14px', fontWeight: '600' },
  contenu: { padding: '24px', maxWidth: '1200px', margin: '0 auto' },
  entete: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  titre: { margin: 0, fontSize: '24px', color: '#1a3a5c' },
  boutonPrimaire: { background: 'linear-gradient(135deg, #e8a020, #c47f10)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  boutonAnnuler: { background: '#f5f5f5', color: '#333', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', cursor: 'pointer', flex: 1 },
  succes: { background: '#e8f5e9', color: '#2e7d32', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  filtres: { display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' },
  filtreBouton: { border: '1.5px solid #ddd', borderRadius: '20px', padding: '6px 16px', fontSize: '13px', cursor: 'pointer', fontWeight: '500' },
  vide: { textAlign: 'center', color: '#888', padding: '40px', background: '#fff', borderRadius: '12px' },
  tableau: { background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  tableauEntete: { display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 2fr 1.3fr 1.5fr 1fr', padding: '12px 20px', background: '#f8f9fa', fontSize: '12px', fontWeight: '700', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' },
  tableauLigne: { display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 2fr 1.3fr 1.5fr 1fr', padding: '14px 20px', borderBottom: '1px solid #f0f0f0', fontSize: '14px', alignItems: 'center' },
  mois: { fontWeight: '600', color: '#222', textTransform: 'capitalize' },
  statutBadge: { fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '20px' },
  boutonPayer: { background: '#1a3a5c', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#fff', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '460px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  modalTitre: { margin: '0 0 4px', color: '#1a3a5c', fontSize: '20px' },
  modalSous: { color: '#888', fontSize: '14px', marginBottom: '20px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#333', display: 'block', marginBottom: '4px', marginTop: '12px' },
  input: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #ddd', fontSize: '14px', boxSizing: 'border-box' },
  erreur: { color: '#c62828', background: '#fff5f5', padding: '10px', borderRadius: '6px', fontSize: '13px', marginTop: '8px' },
};
