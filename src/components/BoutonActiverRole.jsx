import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function BoutonActiverRole({ roleActuel }) {
  const [chargement, setChargement] = useState(false);
  const [succes, setSucces] = useState('');
  const [erreur, setErreur] = useState('');
  const { utilisateur, setUtilisateur } = useAuth();
  const navigate = useNavigate();

  const roles = (utilisateur?.role || '').split(',').map(r => r.trim());
  const peutActiverProprietaire = !roles.includes('proprietaire') && roles.includes('locataire');
  const peutActiverLocataire = !roles.includes('locataire') && roles.includes('proprietaire');

  const roleACiver = peutActiverProprietaire ? 'proprietaire' : peutActiverLocataire ? 'locataire' : null;

  if (!roleACiver) return null;

  async function activerRole() {
    setChargement(true); setErreur(''); setSucces('');
    try {
      const r = await api.post('/auth/ajouter-role', { role: roleACiver });
      // Mettre à jour le token et l'utilisateur
      localStorage.setItem('renteasy_token', r.data.token);
      localStorage.setItem('renteasy_user', JSON.stringify(r.data.utilisateur));
      setSucces(r.data.message);
      setTimeout(() => {
        if (roleACiver === 'proprietaire') navigate('/dashboard');
        else navigate('/locataire/dashboard');
        window.location.reload();
      }, 1500);
    } catch (e) {
      setErreur(e.response?.data?.message || 'Erreur lors de l\'activation');
    } finally {
      setChargement(false);
    }
  }

  return (
    <div style={s.conteneur}>
      {succes && <p style={s.succes}>{succes}</p>}
      {erreur && <p style={s.erreur}>{erreur}</p>}
      <button style={s.bouton} onClick={activerRole} disabled={chargement}>
        {chargement ? 'Activation...' : roleACiver === 'proprietaire'
          ? '🏘️ Activer mon espace propriétaire'
          : '🏠 Activer mon espace locataire'
        }
      </button>
      <p style={s.info}>
        Activez votre espace {roleACiver} pour gérer vos {roleACiver === 'proprietaire' ? 'biens et locataires' : 'échéances et paiements'}.
      </p>
    </div>
  );
}

const s = {
  conteneur: { background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '12px', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px' },
  bouton: { background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px 20px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  info: { color: '#9ca3af', fontSize: '12px', margin: 0 },
  succes: { color: '#10b981', fontSize: '13px', margin: 0 },
  erreur: { color: '#ef4444', fontSize: '13px', margin: 0 },
};
