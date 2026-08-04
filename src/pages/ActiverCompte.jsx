import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';

export default function ActiverCompte() {
  const [searchParams] = useSearchParams();
  const [motDePasse, setMotDePasse] = useState('');
  const [confirmer, setConfirmer] = useState('');
  const [cguAcceptees, setCguAcceptees] = useState(false);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState(false);
  const [chargement, setChargement] = useState(false);
  const token = searchParams.get('token');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setErreur('Lien d\'activation invalide.');
    }
  }, [token]);

  async function handleActivation() {
    setErreur('');
    if (!motDePasse || motDePasse.length < 8) {
      setErreur('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    if (motDePasse !== confirmer) {
      setErreur('Les mots de passe ne correspondent pas');
      return;
    }
    if (!cguAcceptees) {
      setErreur("Vous devez accepter les conditions générales d'utilisation pour continuer");
      return;
    }
    setChargement(true);
    try {
      const r = await api.post('/auth/activer-compte', { token, mot_de_passe: motDePasse, cgu_acceptees: true });
      localStorage.setItem('renteasy_token', r.data.token);
      localStorage.setItem('renteasy_user', JSON.stringify(r.data.utilisateur));
      setSucces(true);
      setTimeout(() => navigate('/locataire/dashboard'), 2000);
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur lors de l\'activation');
    } finally {
      setChargement(false);
    }
  }

  return (
    <div style={s.page} className="re-auth-page">
      <div style={s.card} className="re-auth-card">
        <div style={s.logo}>
          <span style={{ fontSize: '32px' }}>🏠</span>
          <h1 style={s.logoText}>RentEasy <span style={s.logoBenin}>Bénin</span></h1>
        </div>

        {succes ? (
          <div style={s.succes}>
            <p style={{ fontSize: '32px', margin: '0 0 8px' }}>✅</p>
            <p style={{ fontWeight: '700', color: '#2e7d32' }}>Compte activé avec succès !</p>
            <p style={{ color: '#888', fontSize: '14px' }}>Redirection vers votre espace locataire...</p>
          </div>
        ) : (
          <>
            <p style={s.titre}>Activer votre compte</p>
            <p style={s.sousTitre}>Définissez votre mot de passe pour accéder à votre espace locataire.</p>

            <label style={s.label}>Mot de passe *</label>
            <input style={s.input} type="password" placeholder="••••••••" value={motDePasse} onChange={e => setMotDePasse(e.target.value)} />

            <label style={s.label}>Confirmer le mot de passe *</label>
            <input style={s.input} type="password" placeholder="••••••••" value={confirmer} onChange={e => setConfirmer(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleActivation()} />

            {erreur && <p style={s.erreur}>{erreur}</p>}

            <label style={s.cguLigne}>
              <input
                type="checkbox"
                checked={cguAcceptees}
                onChange={e => setCguAcceptees(e.target.checked)}
                style={s.cguCase}
              />
              <span>
                J'accepte les{' '}
                <span style={s.lien} onClick={(e) => { e.preventDefault(); window.open('/cgu', '_blank'); }}>
                  conditions générales d'utilisation et la politique de confidentialité
                </span>
              </span>
            </label>

            <button style={{ ...s.bouton, opacity: chargement ? 0.7 : 1 }} onClick={handleActivation} disabled={chargement || !token || !cguAcceptees}>
              {chargement ? 'Activation...' : 'Activer mon compte'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: 'linear-gradient(135deg,#1a3a5c 0%,#0d2137 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Segoe UI',sans-serif", padding: '20px' },
  card: { background: '#fff', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  logo: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' },
  logoText: { fontSize: '26px', fontWeight: '700', color: '#1a3a5c', margin: 0 },
  logoBenin: { color: '#e8a020' },
  titre: { fontSize: '20px', fontWeight: '700', color: '#1a3a5c', margin: '0 0 4px' },
  sousTitre: { color: '#888', fontSize: '14px', marginBottom: '20px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#333', display: 'block', marginTop: '12px', marginBottom: '4px' },
  input: { width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1.5px solid #ddd', fontSize: '14px', boxSizing: 'border-box' },
  erreur: { color: '#e03131', fontSize: '13px', background: '#fff5f5', padding: '10px', borderRadius: '6px', marginTop: '8px' },
  cguLigne: { display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: '#555', marginTop: '14px', cursor: 'pointer', lineHeight: '1.4' },
  cguCase: { marginTop: '2px', cursor: 'pointer', flexShrink: 0 },
  lien: { color: '#e8a020', fontWeight: '600', cursor: 'pointer' },
  bouton: { background: 'linear-gradient(135deg,#1a3a5c,#0d2137)', color: '#fff', border: 'none', borderRadius: '8px', padding: '14px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginTop: '16px', width: '100%' },
  succes: { textAlign: 'center', padding: '20px 0' },
};
