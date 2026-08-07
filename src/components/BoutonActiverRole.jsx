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
    <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-accent-200 bg-accent-50 px-5 py-4">
      {succes && <p className="text-sm text-brand-700">{succes}</p>}
      {erreur && <p className="text-sm text-red-600">{erreur}</p>}
      <button className="self-start rounded-xl bg-accent-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-accent-600 disabled:opacity-60" onClick={activerRole} disabled={chargement}>
        {chargement ? 'Activation...' : roleACiver === 'proprietaire'
          ? '🏘️ Activer mon espace propriétaire'
          : '🏠 Activer mon espace locataire'
        }
      </button>
      <p className="m-0 text-xs text-accent-800">
        Activez votre espace {roleACiver} pour gérer vos {roleACiver === 'proprietaire' ? 'biens et locataires' : 'échéances et paiements'}.
      </p>
    </div>
  );
}
