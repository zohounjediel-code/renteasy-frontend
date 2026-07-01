import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Connexion() {
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);
  const { connecter } = useAuth();
  const navigate = useNavigate();

  async function handleConnexion() {
    setErreur('');
    setChargement(true);
    try {
      await connecter(email, motDePasse);
      navigate('/dashboard');
    } catch (err) {
      setErreur(err.response?.data?.message || 'Identifiants incorrects');
    } finally {
      setChargement(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🏠</span>
          <h1 style={styles.logoText}>RentEasy <span style={styles.logoBenin}>Bénin</span></h1>
        </div>
        <p style={styles.sousTitre}>Gestion & recouvrement de loyers</p>

        {/* Formulaire */}
        <div style={styles.form}>
          <label style={styles.label}>Adresse email</label>
          <input
            style={styles.input}
            type="email"
            placeholder="votre@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label style={styles.label}>Mot de passe</label>
          <input
            style={styles.input}
            type="password"
            placeholder="••••••••"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConnexion()}
          />

          {erreur && <p style={styles.erreur}>{erreur}</p>}

          <button
            style={{ ...styles.bouton, opacity: chargement ? 0.7 : 1 }}
            onClick={handleConnexion}
            disabled={chargement}
          >
            {chargement ? 'Connexion...' : 'Se connecter'}
          </button>
        </div>

        <p style={styles.footer}>
          © 2026 RentEasy Bénin · Cotonou, Bénin
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1a3a5c 0%, #0d2137 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Segoe UI', sans-serif",
    padding: '20px',
  },
  card: {
    background: '#fff',
    borderRadius: '16px',
    padding: '40px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '4px',
  },
  logoIcon: { fontSize: '32px' },
  logoText: {
    fontSize: '26px',
    fontWeight: '700',
    color: '#1a3a5c',
    margin: 0,
  },
  logoBenin: { color: '#e8a020' },
  sousTitre: {
    color: '#666',
    fontSize: '14px',
    marginBottom: '32px',
    marginTop: '4px',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#333' },
  input: {
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1.5px solid #ddd',
    fontSize: '15px',
    outline: 'none',
    marginBottom: '8px',
    transition: 'border-color 0.2s',
  },
  erreur: {
    color: '#e03131',
    fontSize: '13px',
    background: '#fff5f5',
    padding: '10px',
    borderRadius: '6px',
    margin: '4px 0',
  },
  bouton: {
    background: 'linear-gradient(135deg, #e8a020, #c47f10)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '14px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'opacity 0.2s',
  },
  footer: {
    textAlign: 'center',
    color: '#aaa',
    fontSize: '12px',
    marginTop: '24px',
    marginBottom: 0,
  },
};
