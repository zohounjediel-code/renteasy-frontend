import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Inscription() {
  const [role, setRole] = useState('proprietaire');
  const [form, setForm] = useState({ nom: '', email: '', telephone: '', mot_de_passe: '', confirmer_mot_de_passe: '', ville: '' });
  const [cguAcceptees, setCguAcceptees] = useState(false);
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);
  const { inscrire } = useAuth();
  const navigate = useNavigate();

  async function handleInscription() {
    setErreur('');
    if (!form.nom || !form.email || !form.telephone || !form.mot_de_passe) {
      setErreur('Tous les champs obligatoires doivent être remplis');
      return;
    }
    if (form.mot_de_passe !== form.confirmer_mot_de_passe) {
      setErreur('Les mots de passe ne correspondent pas');
      return;
    }
    if (form.mot_de_passe.length < 8) {
      setErreur('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    if (!cguAcceptees) {
      setErreur("Vous devez accepter les conditions générales d'utilisation pour continuer");
      return;
    }

    setChargement(true);
    try {
      const utilisateur = await inscrire({ ...form, role, cgu_acceptees: true });
      redirigerSelonRole(utilisateur.role, navigate);
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur lors de l\'inscription');
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
        <p style={s.sousTitre}>Créer un compte</p>

        {/* Choix du rôle */}
        <div style={s.roleGrid} className="re-role-grid">
          <div
            style={{ ...s.roleCard, border: role === 'proprietaire' ? '2px solid #e8a020' : '2px solid #eee', background: role === 'proprietaire' ? '#fff8ee' : '#fff' }}
            onClick={() => setRole('proprietaire')}
          >
            <div style={s.roleIcone}>🏘️</div>
            <div style={s.roleLabel}>Propriétaire</div>
            <div style={s.roleDesc}>Je gère des biens en location</div>
          </div>
          <div
            style={{ ...s.roleCard, border: role === 'locataire' ? '2px solid #1a3a5c' : '2px solid #eee', background: role === 'locataire' ? '#f0f4ff' : '#fff' }}
            onClick={() => setRole('locataire')}
          >
            <div style={s.roleIcone}>🏠</div>
            <div style={s.roleLabel}>Locataire</div>
            <div style={s.roleDesc}>Je loue un bien immobilier</div>
          </div>
        </div>

        <div style={s.form}>
          <label style={s.label}>Nom complet *</label>
          <input style={s.input} placeholder="Jean Koffi" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} />

          <label style={s.label}>Email *</label>
          <input style={s.input} type="email" placeholder="votre@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />

          <label style={s.label}>Téléphone *</label>
          <input style={s.input} placeholder="+22997001122" value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} />

          <label style={s.label}>Ville</label>
          <input style={s.input} placeholder="Cotonou" value={form.ville} onChange={e => setForm({ ...form, ville: e.target.value })} />

          <label style={s.label}>Mot de passe *</label>
          <input style={s.input} type="password" placeholder="••••••••" value={form.mot_de_passe} onChange={e => setForm({ ...form, mot_de_passe: e.target.value })} />

          <label style={s.label}>Confirmer le mot de passe *</label>
          <input style={s.input} type="password" placeholder="••••••••" value={form.confirmer_mot_de_passe} onChange={e => setForm({ ...form, confirmer_mot_de_passe: e.target.value })} onKeyDown={e => e.key === 'Enter' && handleInscription()} />

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

          <button style={{ ...s.bouton, opacity: chargement ? 0.7 : 1 }} onClick={handleInscription} disabled={chargement || !cguAcceptees}>
            {chargement ? 'Inscription...' : 'Créer mon compte'}
          </button>
        </div>

        <p style={s.lienConnexion}>
          Déjà un compte ?{' '}
          <span style={s.lien} onClick={() => navigate('/connexion')}>Se connecter</span>
        </p>
      </div>
    </div>
  );
}

export function redirigerSelonRole(role, navigate) {
  const roles = (role || '').split(',').map(r => r.trim());
  if (roles.includes('super_admin')) return navigate('/superadmin/dashboard');
  if (roles.includes('admin')) return navigate('/admin/dashboard');
  if (roles.includes('agent')) return navigate('/agent/dashboard');

  // Un compte peut avoir les deux espaces (propriétaire ET locataire) activés. Dans ce cas,
  // on respecte le dernier espace dans lequel la personne se trouvait avant sa déconnexion,
  // plutôt que de toujours privilégier l'espace propriétaire par défaut.
  if (roles.includes('proprietaire') && roles.includes('locataire')) {
    const dernierEspace = localStorage.getItem('renteasy_dernier_espace');
    if (dernierEspace === 'locataire') return navigate('/locataire/dashboard');
    if (dernierEspace === 'proprietaire') return navigate('/dashboard');
  }

  if (roles.includes('proprietaire')) return navigate('/dashboard');
  if (roles.includes('locataire')) return navigate('/locataire/dashboard');
  return navigate('/connexion');
}

const s = {
  page: { minHeight: '100vh', background: 'linear-gradient(135deg,#1a3a5c 0%,#0d2137 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Segoe UI',sans-serif", padding: '20px' },
  card: { background: '#fff', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '460px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  logo: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' },
  logoText: { fontSize: '26px', fontWeight: '700', color: '#1a3a5c', margin: 0 },
  logoBenin: { color: '#e8a020' },
  sousTitre: { color: '#666', fontSize: '14px', marginBottom: '20px', marginTop: '4px' },
  roleGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' },
  roleCard: { borderRadius: '10px', padding: '16px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' },
  roleIcone: { fontSize: '28px', marginBottom: '6px' },
  roleLabel: { fontWeight: '700', fontSize: '14px', color: '#1a3a5c' },
  roleDesc: { fontSize: '11px', color: '#888', marginTop: '4px' },
  form: { display: 'flex', flexDirection: 'column', gap: '4px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#333', marginTop: '8px' },
  input: { padding: '11px 14px', borderRadius: '8px', border: '1.5px solid #ddd', fontSize: '14px', outline: 'none' },
  erreur: { color: '#e03131', fontSize: '13px', background: '#fff5f5', padding: '10px', borderRadius: '6px' },
  cguLigne: { display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: '#555', marginTop: '10px', cursor: 'pointer', lineHeight: '1.4' },
  cguCase: { marginTop: '2px', cursor: 'pointer', flexShrink: 0 },
  bouton: { background: 'linear-gradient(135deg,#e8a020,#c47f10)', color: '#fff', border: 'none', borderRadius: '8px', padding: '14px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginTop: '12px' },
  lienConnexion: { textAlign: 'center', color: '#888', fontSize: '13px', marginTop: '20px', marginBottom: 0 },
  lien: { color: '#e8a020', fontWeight: '600', cursor: 'pointer' },
};
