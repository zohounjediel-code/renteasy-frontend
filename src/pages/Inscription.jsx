import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Inscription() {
  const [role, setRole] = useState('proprietaire');
  const [form, setForm] = useState({ nom: '', email: '', telephone: '', mot_de_passe: '', confirmer_mot_de_passe: '', ville: '' });
  const [cguAcceptees, setCguAcceptees] = useState(false);
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);
  const [afficherMotDePasse, setAfficherMotDePasse] = useState(false);
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-900 via-brand-800 to-slate-900 px-4 py-10">
      <div className="w-full max-w-lg rounded-3xl bg-white p-8 sm:p-10 shadow-2xl">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🏠</span>
          <h1 className="text-2xl font-extrabold text-slate-900">RentEasy <span className="text-accent-600">Bénin</span></h1>
        </div>
        <p className="mt-1 mb-5 text-sm text-slate-500">Créer un compte</p>

        {/* Choix du rôle */}
        <div className="grid grid-cols-2 gap-3">
          <div
            className={`cursor-pointer rounded-2xl border-2 p-4 text-center transition ${role === 'proprietaire' ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-white'}`}
            onClick={() => setRole('proprietaire')}
          >
            <div className="text-2xl">🏘️</div>
            <div className="mt-1 text-sm font-bold text-slate-900">Propriétaire</div>
            <div className="mt-1 text-xs text-slate-500">Je gère des biens en location</div>
          </div>
          <div
            className={`cursor-pointer rounded-2xl border-2 p-4 text-center transition ${role === 'locataire' ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-white'}`}
            onClick={() => setRole('locataire')}
          >
            <div className="text-2xl">🏠</div>
            <div className="mt-1 text-sm font-bold text-slate-900">Locataire</div>
            <div className="mt-1 text-xs text-slate-500">Je loue un bien immobilier</div>
          </div>
        </div>

        <div className="mt-2 flex flex-col gap-1">
          <label className="mt-2 text-sm font-semibold text-slate-700">Nom complet *</label>
          <input className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30" placeholder="Jean Koffi" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} />

          <label className="mt-2 text-sm font-semibold text-slate-700">Email *</label>
          <input className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30" type="email" autoComplete="email" placeholder="votre@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />

          <label className="mt-2 text-sm font-semibold text-slate-700">Téléphone *</label>
          <input className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30" placeholder="+22997001122" value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} />

          <label className="mt-2 text-sm font-semibold text-slate-700">Ville</label>
          <input className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30" placeholder="Cotonou" value={form.ville} onChange={e => setForm({ ...form, ville: e.target.value })} />

          <label className="mt-2 flex items-center justify-between text-sm font-semibold text-slate-700">
            Mot de passe *
            <span className="cursor-pointer text-xs font-medium text-slate-400 hover:text-slate-600" onClick={() => setAfficherMotDePasse(v => !v)}>
              {afficherMotDePasse ? '🙈 Masquer' : '👁️ Afficher'}
            </span>
          </label>
          <input className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30" type={afficherMotDePasse ? 'text' : 'password'} autoComplete="new-password" placeholder="••••••••" value={form.mot_de_passe} onChange={e => setForm({ ...form, mot_de_passe: e.target.value })} />

          <label className="mt-2 text-sm font-semibold text-slate-700">Confirmer le mot de passe *</label>
          <input className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30" type={afficherMotDePasse ? 'text' : 'password'} autoComplete="new-password" placeholder="••••••••" value={form.confirmer_mot_de_passe} onChange={e => setForm({ ...form, confirmer_mot_de_passe: e.target.value })} onKeyDown={e => e.key === 'Enter' && handleInscription()} />

          {erreur && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{erreur}</p>}

          <label className="mt-3 flex cursor-pointer items-start gap-2 text-xs leading-relaxed text-slate-600">
            <input
              type="checkbox"
              checked={cguAcceptees}
              onChange={e => setCguAcceptees(e.target.checked)}
              className="mt-0.5 shrink-0 cursor-pointer accent-brand-600"
            />
            <span>
              J'accepte les{' '}
              <span className="font-semibold text-accent-600 hover:text-accent-700" onClick={(e) => { e.preventDefault(); window.open('/cgu', '_blank'); }}>
                conditions générales d'utilisation et la politique de confidentialité
              </span>
            </span>
          </label>

          <button className="mt-3 rounded-xl bg-brand-600 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60" onClick={handleInscription} disabled={chargement || !cguAcceptees}>
            {chargement ? 'Inscription...' : 'Créer mon compte'}
          </button>
        </div>

        <p className="mt-5 text-center text-sm text-slate-500">
          Déjà un compte ?{' '}
          <span className="cursor-pointer font-semibold text-accent-600 hover:text-accent-700" onClick={() => navigate('/connexion')}>Se connecter</span>
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
