import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Locataires() {
  const [locataires, setLocataires] = useState([]);
  const [biens, setBiens] = useState([]);
  const [afficherFormLocataire, setAfficherFormLocataire] = useState(false);
  const [afficherFormContrat, setAfficherFormContrat] = useState(false);
  const [chargement, setChargement] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');
  const [formLocataire, setFormLocataire] = useState({ nom: '', telephone: '', email: '', numero_piece_identite: '' });
  const [formContrat, setFormContrat] = useState({ bien_id: '', locataire_id: '', date_debut: '', jour_echeance: '5', loyer_mensuel: '' });
  const navigate = useNavigate();

  useEffect(() => {
    chargerDonnees();
  }, []);

  async function chargerDonnees() {
    try {
      const [rLoc, rBiens] = await Promise.all([api.get('/locataires'), api.get('/biens')]);
      setLocataires(rLoc.data);
      setBiens(rBiens.data.filter(b => b.statut === 'libre'));
    } catch (e) {
      console.error(e);
    } finally {
      setChargement(false);
    }
  }

  async function ajouterLocataire() {
    setErreur(''); setSucces('');
    if (!formLocataire.nom || !formLocataire.telephone) {
      setErreur('Nom et téléphone sont obligatoires');
      return;
    }
    setEnvoi(true);
    try {
      await api.post('/locataires', formLocataire);
      setFormLocataire({ nom: '', telephone: '', email: '', numero_piece_identite: '' });
      setAfficherFormLocataire(false);
      setSucces('Locataire ajouté avec succès !');
      chargerDonnees();
    } catch (e) {
      setErreur(e.response?.data?.message || 'Erreur lors de l\'ajout');
    } finally {
      setEnvoi(false);
    }
  }

  async function creerContrat() {
    setErreur(''); setSucces('');
    if (!formContrat.bien_id || !formContrat.locataire_id || !formContrat.date_debut || !formContrat.loyer_mensuel) {
      setErreur('Tous les champs sont obligatoires');
      return;
    }
    setEnvoi(true);
    try {
      await api.post('/contrats', {
        ...formContrat,
        jour_echeance: parseInt(formContrat.jour_echeance),
        loyer_mensuel: parseInt(formContrat.loyer_mensuel),
      });
      setFormContrat({ bien_id: '', locataire_id: '', date_debut: '', jour_echeance: '5', loyer_mensuel: '' });
      setAfficherFormContrat(false);
      setSucces('Contrat créé ! Les échéances des 12 prochains mois ont été générées automatiquement.');
      chargerDonnees();
    } catch (e) {
      setErreur(e.response?.data?.message || 'Erreur lors de la création du contrat');
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <div style={styles.navLogo} onClick={() => navigate('/dashboard')}>🏠 <strong>RentEasy</strong> <span style={styles.navBenin}>Bénin</span></div>
        <div style={styles.navMenu}>
          <button style={styles.navBtn} onClick={() => navigate('/biens')}>Mes biens</button>
          <button style={styles.navBtnActif}>Locataires</button>
          <button style={styles.navBtn} onClick={() => navigate('/paiements')}>Paiements</button>
          <button style={styles.navBtn} onClick={() => navigate('/dashboard')}>Dashboard</button>
        </div>
      </nav>

      <div style={styles.contenu}>
        <div style={styles.entete}>
          <h2 style={styles.titre}>Locataires</h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button style={styles.boutonSecondaire} onClick={() => { setAfficherFormContrat(!afficherFormContrat); setAfficherFormLocataire(false); }}>
              {afficherFormContrat ? '✕ Annuler' : '📋 Nouveau contrat'}
            </button>
            <button style={styles.boutonPrimaire} onClick={() => { setAfficherFormLocataire(!afficherFormLocataire); setAfficherFormContrat(false); }}>
              {afficherFormLocataire ? '✕ Annuler' : '+ Ajouter locataire'}
            </button>
          </div>
        </div>

        {succes && <div style={styles.succes}>{succes}</div>}

        {/* Formulaire nouveau locataire */}
        {afficherFormLocataire && (
          <div style={styles.formulaire}>
            <h3 style={styles.formulaireTitre}>Nouveau locataire</h3>
            <div style={styles.grille2}>
              <div>
                <label style={styles.label}>Nom complet *</label>
                <input style={styles.input} placeholder="Jean Koffi" value={formLocataire.nom} onChange={e => setFormLocataire({ ...formLocataire, nom: e.target.value })} />
              </div>
              <div>
                <label style={styles.label}>Téléphone *</label>
                <input style={styles.input} placeholder="+22997001122" value={formLocataire.telephone} onChange={e => setFormLocataire({ ...formLocataire, telephone: e.target.value })} />
              </div>
              <div>
                <label style={styles.label}>Email</label>
                <input style={styles.input} placeholder="email@exemple.com" value={formLocataire.email} onChange={e => setFormLocataire({ ...formLocataire, email: e.target.value })} />
              </div>
              <div>
                <label style={styles.label}>N° pièce d'identité</label>
                <input style={styles.input} placeholder="CIP ou passeport" value={formLocataire.numero_piece_identite} onChange={e => setFormLocataire({ ...formLocataire, numero_piece_identite: e.target.value })} />
              </div>
            </div>
            {erreur && <p style={styles.erreur}>{erreur}</p>}
            <button style={styles.boutonPrimaire} onClick={ajouterLocataire} disabled={envoi}>
              {envoi ? 'Enregistrement...' : 'Enregistrer le locataire'}
            </button>
          </div>
        )}

        {/* Formulaire nouveau contrat */}
        {afficherFormContrat && (
          <div style={styles.formulaire}>
            <h3 style={styles.formulaireTitre}>Nouveau contrat de location</h3>
            {biens.length === 0 && (
              <div style={styles.alerte}>⚠️ Aucun bien libre disponible. Ajoutez un bien libre avant de créer un contrat.</div>
            )}
            <div style={styles.grille2}>
              <div>
                <label style={styles.label}>Bien immobilier *</label>
                <select style={styles.input} value={formContrat.bien_id} onChange={e => setFormContrat({ ...formContrat, bien_id: e.target.value })}>
                  <option value="">Sélectionner un bien libre...</option>
                  {biens.map(b => <option key={b.id} value={b.id}>{b.adresse}, {b.ville}</option>)}
                </select>
              </div>
              <div>
                <label style={styles.label}>Locataire *</label>
                <select style={styles.input} value={formContrat.locataire_id} onChange={e => setFormContrat({ ...formContrat, locataire_id: e.target.value })}>
                  <option value="">Sélectionner un locataire...</option>
                  {locataires.map(l => <option key={l.id} value={l.id}>{l.nom} · {l.telephone}</option>)}
                </select>
              </div>
              <div>
                <label style={styles.label}>Date de début *</label>
                <input style={styles.input} type="date" value={formContrat.date_debut} onChange={e => setFormContrat({ ...formContrat, date_debut: e.target.value })} />
              </div>
              <div>
                <label style={styles.label}>Jour d'échéance (1-28)</label>
                <input style={styles.input} type="number" min="1" max="28" value={formContrat.jour_echeance} onChange={e => setFormContrat({ ...formContrat, jour_echeance: e.target.value })} />
              </div>
              <div>
                <label style={styles.label}>Loyer mensuel (FCFA) *</label>
                <input style={styles.input} type="number" placeholder="80000" value={formContrat.loyer_mensuel} onChange={e => setFormContrat({ ...formContrat, loyer_mensuel: e.target.value })} />
              </div>
            </div>
            {erreur && <p style={styles.erreur}>{erreur}</p>}
            <button style={styles.boutonPrimaire} onClick={creerContrat} disabled={envoi || biens.length === 0}>
              {envoi ? 'Création...' : 'Créer le contrat'}
            </button>
          </div>
        )}

        {/* Liste locataires */}
        {chargement ? (
          <p style={styles.vide}>Chargement...</p>
        ) : locataires.length === 0 ? (
          <div style={styles.vide}>
            <p>👤 Aucun locataire enregistré.</p>
            <p>Ajoutez un locataire, puis créez un contrat pour lier ce locataire à un bien.</p>
          </div>
        ) : (
          <div style={styles.tableau}>
            <div style={styles.tableauEntete}>
              <span>Nom</span>
              <span>Téléphone</span>
              <span>Email</span>
              <span>N° pièce</span>
            </div>
            {locataires.map(l => (
              <div key={l.id} style={styles.tableauLigne}>
                <span style={styles.nomLocataire}>{l.nom}</span>
                <span>{l.telephone}</span>
                <span style={{ color: '#888' }}>{l.email || '—'}</span>
                <span style={{ color: '#888' }}>{l.numero_piece_identite || '—'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
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
  boutonSecondaire: { background: '#fff', color: '#1a3a5c', border: '1.5px solid #1a3a5c', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  formulaire: { background: '#fff', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  formulaireTitre: { margin: '0 0 16px', color: '#1a3a5c' },
  grille2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#333', display: 'block', marginBottom: '4px' },
  input: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #ddd', fontSize: '14px', boxSizing: 'border-box' },
  erreur: { color: '#c62828', background: '#fff5f5', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' },
  succes: { background: '#e8f5e9', color: '#2e7d32', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  alerte: { background: '#fff3e0', color: '#e65100', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' },
  vide: { textAlign: 'center', color: '#888', padding: '40px', background: '#fff', borderRadius: '12px' },
  tableau: { background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  tableauEntete: { display: 'grid', gridTemplateColumns: '2fr 1.5fr 2fr 1.5fr', padding: '12px 20px', background: '#f8f9fa', fontSize: '12px', fontWeight: '700', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' },
  tableauLigne: { display: 'grid', gridTemplateColumns: '2fr 1.5fr 2fr 1.5fr', padding: '14px 20px', borderBottom: '1px solid #f0f0f0', fontSize: '14px', alignItems: 'center' },
  nomLocataire: { fontWeight: '600', color: '#222' },
};
