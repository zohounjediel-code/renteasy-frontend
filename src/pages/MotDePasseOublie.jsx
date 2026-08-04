import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function MotDePasseOublie() {
  const [email, setEmail] = useState('');
  const [envoye, setEnvoye] = useState(false);
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);
  const navigate = useNavigate();

  async function handleEnvoi() {
    if (!email) return;
    setErreur('');
    setChargement(true);
    try {
      // La réponse est volontairement identique que l'email existe ou non côté serveur — on
      // affiche donc toujours ce même message de confirmation, jamais une erreur "email inconnu".
      await api.post('/auth/mot-de-passe-oublie', { email });
      setEnvoye(true);
    } catch (err) {
      setErreur("Impossible de contacter le serveur. Vérifiez votre connexion et réessayez dans un instant.");
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

        {envoye ? (
          <>
            <p style={styles.sousTitre}>Email envoyé</p>
            <p style={{ color: '#333', fontSize: '14px', lineHeight: '1.6' }}>
              Si un compte existe avec l'adresse <strong>{email}</strong>, un lien de réinitialisation vient de lui être envoyé. Vérifiez votre boîte de réception (et vos spams).
            </p>
            <button style={styles.bouton} onClick={() => navigate('/connexion')}>Retour à la connexion</button>
          </>
        ) : (
          <>
            <p style={styles.sousTitre}>Mot de passe oublié</p>
            <p style={{ color: '#666', fontSize: '13px', marginTop: 0, marginBottom: '20px' }}>
              Indiquez l'adresse email de votre compte, nous vous enverrons un lien pour choisir un nouveau mot de passe.
            </p>

            <div style={styles.form}>
              <label style={styles.label}>Adresse email</label>
              <input
                style={styles.input}
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEnvoi()}
              />

              {erreur && <p style={styles.erreur}>{erreur}</p>}

              <button
                style={{ ...styles.bouton, opacity: chargement ? 0.7 : 1 }}
                onClick={handleEnvoi}
                disabled={chargement || !email}
              >
                {chargement ? 'Envoi...' : 'Envoyer le lien'}
              </button>
            </div>

            <p style={styles.lienRetour}>
              <span style={styles.lien} onClick={() => navigate('/connexion')}>← Retour à la connexion</span>
            </p>
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
  sousTitre: { color: '#666', fontSize: '14px', marginBottom: '8px', marginTop: '20px', fontWeight: '600' },
  form: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#333' },
  input: { padding: '12px 16px', borderRadius: '8px', border: '1.5px solid #ddd', fontSize: '15px', outline: 'none', marginBottom: '8px' },
  erreur: { color: '#e03131', fontSize: '13px', background: '#fff5f5', padding: '10px', borderRadius: '6px', margin: '4px 0' },
  bouton: { background: 'linear-gradient(135deg, #e8a020, #c47f10)', color: '#fff', border: 'none', borderRadius: '8px', padding: '14px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginTop: '8px', width: '100%' },
  lienRetour: { textAlign: 'center', marginTop: '16px', marginBottom: 0 },
  lien: { color: '#e8a020', fontWeight: '600', cursor: 'pointer', fontSize: '13px' },
};
