import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';

export default function ReinitialiserMotDePasse() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [motDePasse, setMotDePasse] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState(false);
  const [chargement, setChargement] = useState(false);
  const navigate = useNavigate();

  async function handleReinitialisation() {
    setErreur('');
    if (motDePasse.length < 8) {
      setErreur('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (motDePasse !== confirmation) {
      setErreur('Les deux mots de passe ne correspondent pas.');
      return;
    }
    setChargement(true);
    try {
      await api.post('/auth/reinitialiser-mot-de-passe', { token, nouveau_mot_de_passe: motDePasse });
      setSucces(true);
    } catch (err) {
      setErreur(err.response?.data?.message || 'Impossible de réinitialiser le mot de passe. Le lien est peut-être expiré.');
    } finally {
      setChargement(false);
    }
  }

  return (
    <div style={styles.page} className="re-auth-page">
      <div style={styles.card} className="re-auth-card">
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🏠</span>
          <h1 style={styles.logoText}>RentEasy <span style={styles.logoBenin}>Bénin</span></h1>
        </div>

        {!token ? (
          <>
            <p style={styles.sousTitre}>Lien invalide</p>
            <p style={{ color: '#666', fontSize: '14px' }}>Ce lien de réinitialisation est incomplet. Redemandez-en un nouveau.</p>
            <button style={styles.bouton} onClick={() => navigate('/mot-de-passe-oublie')}>Redemander un lien</button>
          </>
        ) : succes ? (
          <>
            <p style={styles.sousTitre}>Mot de passe mis à jour</p>
            <p style={{ color: '#333', fontSize: '14px' }}>Vous pouvez désormais vous connecter avec votre nouveau mot de passe.</p>
            <button style={styles.bouton} onClick={() => navigate('/connexion')}>Se connecter</button>
          </>
        ) : (
          <>
            <p style={styles.sousTitre}>Choisir un nouveau mot de passe</p>

            <div style={styles.form}>
              <label style={styles.label}>Nouveau mot de passe</label>
              <input
                style={styles.input}
                type="password"
                placeholder="8 caractères minimum"
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
              />

              <label style={styles.label}>Confirmer le mot de passe</label>
              <input
                style={styles.input}
                type="password"
                placeholder="••••••••"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleReinitialisation()}
              />

              {erreur && <p style={styles.erreur}>{erreur}</p>}

              <button
                style={{ ...styles.bouton, opacity: chargement ? 0.7 : 1 }}
                onClick={handleReinitialisation}
                disabled={chargement || !motDePasse || !confirmation}
              >
                {chargement ? 'Enregistrement...' : 'Réinitialiser mon mot de passe'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: 'linear-gradient(135deg, #1a3a5c 0%, #0d2137 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Segoe UI', sans-serif", padding: '20px' },
  card: { background: '#fff', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  logo: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' },
  logoIcon: { fontSize: '32px' },
  logoText: { fontSize: '26px', fontWeight: '700', color: '#1a3a5c', margin: 0 },
  logoBenin: { color: '#e8a020' },
  sousTitre: { color: '#666', fontSize: '14px', marginBottom: '16px', marginTop: '20px', fontWeight: '600' },
  form: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#333' },
  input: { padding: '12px 16px', borderRadius: '8px', border: '1.5px solid #ddd', fontSize: '15px', outline: 'none', marginBottom: '8px' },
  erreur: { color: '#e03131', fontSize: '13px', background: '#fff5f5', padding: '10px', borderRadius: '6px', margin: '4px 0' },
  bouton: { background: 'linear-gradient(135deg, #e8a020, #c47f10)', color: '#fff', border: 'none', borderRadius: '8px', padding: '14px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginTop: '8px', width: '100%' },
};
