import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const TYPES_BIEN = ['appartement', 'maison', 'studio', 'chambre', 'commerce'];

export default function Biens() {
  const [biens, setBiens] = useState([]);
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);
  const [chargement, setChargement] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');
  const [form, setForm] = useState({
    adresse: '', ville: '', quartier: '', type_bien: 'appartement', loyer_mensuel: ''
  });
  const navigate = useNavigate();

  useEffect(() => { chargerBiens(); }, []);

  async function chargerBiens() {
    try {
      const r = await api.get('/biens');
      setBiens(r.data);
    } catch (e) {
      console.error(e);
    } finally {
      setChargement(false);
    }
  }

  async function ajouterBien() {
    setErreur('');
    if (!form.adresse || !form.ville || !form.loyer_mensuel) {
      setErreur('Adresse, ville et loyer sont obligatoires');
      return;
    }
    setEnvoi(true);
    try {
      await api.post('/biens', { ...form, loyer_mensuel: parseInt(form.loyer_mensuel) });
      setForm({ adresse: '', ville: '', quartier: '', type_bien: 'appartement', loyer_mensuel: '' });
      setAfficherFormulaire(false);
      chargerBiens();
    } catch (e) {
      setErreur(e.response?.data?.message || 'Erreur lors de l\'ajout');
    } finally {
      setEnvoi(false);
    }
  }

  function formaterMontant(n) {
    return parseInt(n).toLocaleString('fr-FR') + ' FCFA';
  }

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <div style={styles.navLogo} onClick={() => navigate('/dashboard')}>🏠 <strong>RentEasy</strong> <span style={styles.navBenin}>Bénin</span></div>
        <div style={styles.navMenu}>
          <button style={styles.navBtnActif}>Mes biens</button>
          <button style={styles.navBtn} onClick={() => navigate('/locataires')}>Locataires</button>
          <button style={styles.navBtn} onClick={() => navigate('/paiements')}>Paiements</button>
          <button style={styles.navBtn} onClick={() => navigate('/dashboard')}>Dashboard</button>
        </div>
      </nav>

      <div style={styles.contenu}>
        <div style={styles.entete}>
          <h2 style={styles.titre}>Mes biens immobiliers</h2>
          <button style={styles.boutonPrimaire} onClick={() => setAfficherFormulaire(!afficherFormulaire)}>
            {afficherFormulaire ? '✕ Annuler' : '+ Ajouter un bien'}
          </button>
        </div>

        {/* Formulaire d'ajout */}
        {afficherFormulaire && (
          <div style={styles.formulaire}>
            <h3 style={styles.formulaireTitre}>Nouveau bien</h3>
            <div style={styles.grille2}>
              <div>
                <label style={styles.label}>Adresse *</label>
                <input style={styles.input} placeholder="Rue 123, Quartier..." value={form.adresse} onChange={e => setForm({ ...form, adresse: e.target.value })} />
              </div>
              <div>
                <label style={styles.label}>Ville *</label>
                <input style={styles.input} placeholder="Cotonou" value={form.ville} onChange={e => setForm({ ...form, ville: e.target.value })} />
              </div>
              <div>
                <label style={styles.label}>Quartier</label>
                <input style={styles.input} placeholder="Fidjrosse" value={form.quartier} onChange={e => setForm({ ...form, quartier: e.target.value })} />
              </div>
              <div>
                <label style={styles.label}>Type de bien *</label>
                <select style={styles.input} value={form.type_bien} onChange={e => setForm({ ...form, type_bien: e.target.value })}>
                  {TYPES_BIEN.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label style={styles.label}>Loyer mensuel (FCFA) *</label>
                <input style={styles.input} type="number" placeholder="80000" value={form.loyer_mensuel} onChange={e => setForm({ ...form, loyer_mensuel: e.target.value })} />
              </div>
            </div>
            {erreur && <p style={styles.erreur}>{erreur}</p>}
            <button style={styles.boutonPrimaire} onClick={ajouterBien} disabled={envoi}>
              {envoi ? 'Enregistrement...' : 'Enregistrer le bien'}
            </button>
          </div>
        )}

        {/* Liste des biens */}
        {chargement ? (
          <p style={styles.vide}>Chargement...</p>
        ) : biens.length === 0 ? (
          <div style={styles.vide}>
            <p>🏘️ Vous n'avez pas encore de bien enregistré.</p>
            <p>Cliquez sur "Ajouter un bien" pour commencer.</p>
          </div>
        ) : (
          <div style={styles.grilleBiens}>
            {biens.map(b => (
              <div key={b.id} style={styles.carteBien} onClick={() => navigate(`/biens/${b.id}`)}>
                <div style={styles.carteBienEntete}>
                  <span style={styles.typeBien}>{b.type_bien}</span>
                  <span style={{ ...styles.statutBadge, background: b.statut === 'occupe' ? '#e8f5e9' : '#fff3e0', color: b.statut === 'occupe' ? '#2e7d32' : '#e65100' }}>
                    {b.statut === 'occupe' ? '● Occupé' : '○ Libre'}
                  </span>
                </div>
                <p style={styles.carteBienAdresse}>{b.adresse}</p>
                <p style={styles.carteBienVille}>{b.quartier ? `${b.quartier}, ` : ''}{b.ville}</p>
                <p style={styles.carteBienLoyer}>{formaterMontant(b.loyer_mensuel)} / mois</p>
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
  formulaire: { background: '#fff', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  formulaireTitre: { margin: '0 0 16px', color: '#1a3a5c' },
  grille2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#333', display: 'block', marginBottom: '4px' },
  input: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #ddd', fontSize: '14px', boxSizing: 'border-box' },
  erreur: { color: '#c62828', background: '#fff5f5', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' },
  vide: { textAlign: 'center', color: '#888', padding: '40px', background: '#fff', borderRadius: '12px' },
  grilleBiens: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' },
  carteBien: { background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', cursor: 'pointer', transition: 'transform 0.2s', border: '1px solid #eee' },
  carteBienEntete: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  typeBien: { fontSize: '12px', fontWeight: '600', color: '#1a3a5c', textTransform: 'uppercase', letterSpacing: '0.5px' },
  statutBadge: { fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '20px' },
  carteBienAdresse: { fontSize: '15px', fontWeight: '600', color: '#222', margin: '0 0 4px' },
  carteBienVille: { fontSize: '13px', color: '#888', margin: '0 0 12px' },
  carteBienLoyer: { fontSize: '16px', fontWeight: '700', color: '#e8a020', margin: 0 },
};
