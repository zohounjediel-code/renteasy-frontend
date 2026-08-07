import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const ROLES_LABELS = {
  proprietaire: { label: 'Propriétaire', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  locataire: { label: 'Locataire', cls: 'bg-purple-50 text-purple-500 border-purple-100' },
  agent: { label: 'Agent', cls: 'bg-accent-50 text-accent-700 border-accent-200' },
  admin: { label: 'Admin', cls: 'bg-red-50 text-red-600 border-red-200' },
  super_admin: { label: 'Super Admin', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

const champLabel = 'mt-3 mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500';
const champInput = 'w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30';
const overlay = 'fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/50 p-5 backdrop-blur-sm';
const modal = 'w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-7 shadow-2xl';
const btnAnnuler = 'rounded-xl border border-slate-200 px-5 py-2.5 text-sm text-slate-600 hover:bg-slate-50';
const agentItem = 'mb-2 flex cursor-pointer items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3.5 hover:bg-slate-100';
const btnChoisir = 'rounded-lg border border-brand-300 bg-white px-3.5 py-1.5 text-[13px] font-semibold text-brand-700';

export default function SuperAdminUtilisateurs() {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [agents, setAgents] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [actionAdminEnCours, setActionAdminEnCours] = useState(null); // 'desactiver' | 'retrograder'
  const [filtreRole, setFiltreRole] = useState('');
  const [recherche, setRecherche] = useState('');
  const [chargement, setChargement] = useState(true);
  const [modal, setModal] = useState(null); // 'creer-admin' | 'creer-agent' | 'reassigner'
  const [userSelectionne, setUserSelectionne] = useState(null);
  const [form, setForm] = useState({ nom: '', email: '', telephone: '', mot_de_passe: '', ville: '' });
  const [envoi, setEnvoi] = useState(false);
  const [message, setMessage] = useState('');
  const [erreur, setErreur] = useState('');
  const [searchParams] = useSearchParams();
  const { deconnecter, utilisateur } = useAuth();
  const navigate = useNavigate();
  const estSuperAdmin = (utilisateur?.role || '').includes('super_admin');

  useEffect(() => {
    chargerDonnees();
    const action = searchParams.get('action');
    if (action) setModal(action);
  }, []);

  async function chargerDonnees() {
    try {
      const [rUsers, rAgents] = await Promise.all([
        api.get('/superadmin/utilisateurs'),
        api.get('/superadmin/agents'),
      ]);
      setUtilisateurs(rUsers.data);
      setAgents(rAgents.data);
      if (estSuperAdmin) {
        const rAdmins = await api.get('/superadmin/admins');
        setAdmins(rAdmins.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setChargement(false);
    }
  }

  async function creerCompte(role) {
    setErreur(''); setMessage('');
    if (!form.nom || !form.email || !form.telephone || !form.mot_de_passe) {
      setErreur('Tous les champs obligatoires doivent être remplis');
      return;
    }
    setEnvoi(true);
    try {
      const route = role === 'admin' ? '/auth/creer-admin' : '/auth/creer-agent';
      await api.post(route, form);
      setMessage(`Compte ${role} créé avec succès !`);
      setForm({ nom: '', email: '', telephone: '', mot_de_passe: '', ville: '' });
      setModal(null);
      chargerDonnees();
    } catch (e) {
      setErreur(e.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setEnvoi(false);
    }
  }

  function estAdminGerantAgents(user) {
    return user.role.includes('admin') && !user.role.includes('super_admin') && (admins.find(a => a.id === user.id)?.nb_agents_geres || 0) > 0;
  }

  async function toggleCompte(user) {
    setErreur(''); setMessage('');
    // Désactiver un admin qui gère encore des agents : il faut d'abord dire à qui ils reviennent
    if (user.actif && estAdminGerantAgents(user)) {
      setUserSelectionne(user);
      setActionAdminEnCours('desactiver');
      setModal('reassigner-agents-admin');
      return;
    }
    try {
      const r = await api.patch(`/superadmin/utilisateurs/${user.id}/toggle`);
      setMessage(r.data.message);
      chargerDonnees();
    } catch (e) {
      setErreur(e.response?.data?.message || 'Erreur');
    }
  }

  function demarrerRetrogradation(user) {
    setErreur(''); setMessage('');
    if (estAdminGerantAgents(user)) {
      setUserSelectionne(user);
      setActionAdminEnCours('retrograder');
      setModal('reassigner-agents-admin');
    } else {
      executerActionAdmin(user.id, 'retrograder', null);
    }
  }

  async function executerActionAdmin(userId, action, nouvelAdminId) {
    try {
      const route = action === 'retrograder' ? `/superadmin/utilisateurs/${userId}/retrograder` : `/superadmin/utilisateurs/${userId}/toggle`;
      const r = await api.patch(route, nouvelAdminId ? { nouvel_admin_id: nouvelAdminId } : {});
      setMessage(r.data.message);
      setModal(null);
      setUserSelectionne(null);
      setActionAdminEnCours(null);
      chargerDonnees();
    } catch (e) {
      setErreur(e.response?.data?.message || 'Erreur');
    }
  }

  async function reassigner(agentId) {
    try {
      await api.patch(`/superadmin/utilisateurs/${userSelectionne.id}/reassigner-agent`, { agent_id: agentId });
      setMessage('Propriétaire réassigné avec succès');
      setModal(null);
      setUserSelectionne(null);
      chargerDonnees();
    } catch (e) {
      setErreur(e.response?.data?.message || 'Erreur');
    }
  }

  const utilisateursFiltres = utilisateurs.filter(u => {
    const matchRole = !filtreRole || u.role.includes(filtreRole);
    const matchRecherche = !recherche || u.nom.toLowerCase().includes(recherche.toLowerCase()) || u.email.toLowerCase().includes(recherche.toLowerCase());
    return matchRole && matchRecherche;
  });

  return (
    <div className="min-h-screen bg-brand-50">
      <nav className="re-nav sticky top-0 z-[100] flex h-16 items-center justify-between border-b border-slate-100 bg-white/95 px-6 backdrop-blur">
        <div className="flex cursor-pointer items-center gap-2.5 text-lg font-bold text-slate-900" onClick={() => navigate(estSuperAdmin ? '/superadmin/dashboard' : '/admin/dashboard')}>
          <span>⚡</span> RentEasy <span className="text-accent-600">Bénin</span>
          <span className="rounded-full bg-purple-600 px-2.5 py-0.5 text-[10px] font-extrabold tracking-wide text-white">{estSuperAdmin ? 'SUPER ADMIN' : 'ADMIN'}</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button className="whitespace-nowrap rounded-lg border border-slate-200 px-3.5 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50" onClick={() => navigate(estSuperAdmin ? '/superadmin/dashboard' : '/admin/dashboard')}>Dashboard</button>
          {!estSuperAdmin && <button className="whitespace-nowrap rounded-lg border border-slate-200 px-3.5 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50" onClick={() => navigate('/admin/agents')}>Agents</button>}
          <button className="whitespace-nowrap rounded-lg border border-brand-600 bg-brand-50 px-3.5 py-1.5 text-[13px] font-semibold text-brand-700">Utilisateurs</button>
          {estSuperAdmin && <button className="whitespace-nowrap rounded-lg border border-slate-200 px-3.5 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50" onClick={() => navigate('/superadmin/contrats')}>Contrats</button>}
          {estSuperAdmin && <button className="whitespace-nowrap rounded-lg border border-slate-200 px-3.5 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50" onClick={() => navigate('/superadmin/journal')}>Journal</button>}
          {estSuperAdmin && <button className="whitespace-nowrap rounded-lg border border-slate-200 px-3.5 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50" onClick={() => navigate('/superadmin/parametres')}>Paramètres</button>}
          {estSuperAdmin && <button className="whitespace-nowrap rounded-lg border border-slate-200 px-3.5 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50" onClick={() => navigate('/superadmin/moderation')}>Modération</button>}
          {estSuperAdmin && <button className="whitespace-nowrap rounded-lg border border-slate-200 px-3.5 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50" onClick={() => navigate('/superadmin/rapport-financier')}>Rapport financier</button>}
          {estSuperAdmin && <button className="whitespace-nowrap rounded-lg border border-slate-200 px-3.5 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50" onClick={() => navigate('/superadmin/rappels')}>Rappels</button>}
          {estSuperAdmin && <button className="whitespace-nowrap rounded-lg border border-slate-200 px-3.5 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50" onClick={() => navigate('/superadmin/erreurs')}>Erreurs</button>}
          <button className="whitespace-nowrap rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50" onClick={deconnecter}>Déconnexion</button>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-extrabold text-slate-900">Gestion des utilisateurs</h2>
          <div className="flex gap-2.5">
            {estSuperAdmin && (
              <button className="rounded-xl bg-red-600 px-4.5 py-2.5 text-[13px] font-semibold text-white hover:bg-red-700" onClick={() => { setModal('creer-admin'); setForm({ nom: '', email: '', telephone: '', mot_de_passe: '', ville: '' }); setErreur(''); }}>
                + Créer Admin
              </button>
            )}
            <button className="rounded-xl bg-accent-500 px-4.5 py-2.5 text-[13px] font-bold text-white hover:bg-accent-600" onClick={() => { setModal('creer-agent'); setForm({ nom: '', email: '', telephone: '', mot_de_passe: '', ville: '' }); setErreur(''); }}>
              + Créer Agent
            </button>
          </div>
        </div>

        {message && <div className="mb-4 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">{message}</div>}
        {erreur && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{erreur}</div>}

        {/* Filtres */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <input className="w-[280px] rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30" placeholder="🔍 Rechercher par nom ou email..." value={recherche} onChange={e => setRecherche(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            {['', 'proprietaire', 'locataire', 'agent', 'admin', 'super_admin'].map(r => (
              <button
                key={r}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold ${filtreRole === r ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 bg-white text-slate-500'}`}
                onClick={() => setFiltreRole(r)}
              >
                {r === '' ? 'Tous' : ROLES_LABELS[r]?.label || r}
              </button>
            ))}
          </div>
        </div>

        {/* Tableau */}
        {chargement ? (
          <p className="py-10 text-center text-slate-400">Chargement...</p>
        ) : (
          <>
          <p className="mb-1.5 text-[11px] text-slate-400 sm:hidden">↔ Faites glisser pour voir toutes les colonnes</p>
          <div className="overflow-x-auto rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 shadow-card">
            <div className="grid min-w-[700px] grid-cols-[1.5fr_2fr_1.5fr_1.2fr_1fr_1.5fr] bg-purple-50 px-5 py-3.5 text-[11px] font-bold uppercase tracking-wide text-purple-700">
              <span>Utilisateur</span>
              <span>Contact</span>
              <span>Rôle(s)</span>
              <span>Agent assigné</span>
              <span>Statut</span>
              <span>Actions</span>
            </div>
            {utilisateursFiltres.map(u => (
              <div key={u.id} className="grid min-w-[700px] grid-cols-[1.5fr_2fr_1.5fr_1.2fr_1fr_1.5fr] items-center border-t border-slate-50 px-5 py-3.5 text-sm">
                <div>
                  <div className="text-sm font-bold text-slate-900">{u.nom}</div>
                  <div className="mt-0.5 text-[11px] text-slate-400">{new Date(u.created_at).toLocaleDateString('fr-FR')}</div>
                </div>
                <div>
                  <div className="text-[13px] text-brand-600">{u.email}</div>
                  <div className="text-xs text-slate-400">{u.telephone}</div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {u.role.split(',').map(r => {
                    const rl = ROLES_LABELS[r.trim()] || { label: r, cls: 'bg-slate-100 text-slate-500 border-slate-200' };
                    return (
                      <span key={r} className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${rl.cls}`}>
                        {rl.label}
                      </span>
                    );
                  })}
                </div>
                <div className="text-[13px] text-slate-400">{u.agent_nom || '—'}</div>
                <div>
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${u.actif ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-600'}`}>
                    {u.actif ? '● Actif' : '○ Inactif'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${u.actif ? 'border-red-200 bg-red-50 text-red-600' : 'border-emerald-200 bg-emerald-50 text-emerald-700'} disabled:opacity-40`}
                    onClick={() => toggleCompte(u)}
                    disabled={u.role.includes('super_admin') || (!estSuperAdmin && u.role.includes('admin'))}
                    title={!estSuperAdmin && u.role.includes('admin') ? 'Seul un super admin peut désactiver un compte admin' : undefined}
                  >
                    {u.actif ? 'Désactiver' : 'Activer'}
                  </button>
                  {estSuperAdmin && u.role.includes('admin') && !u.role.includes('super_admin') && (
                    <button
                      className="rounded-lg border border-accent-200 bg-accent-50 px-2.5 py-1.5 text-xs font-semibold text-accent-700"
                      onClick={() => demarrerRetrogradation(u)}
                      title="Retour au rôle propriétaire"
                    >
                      Rétrograder
                    </button>
                  )}
                  {estSuperAdmin && u.role.includes('proprietaire') && (
                    <button
                      className="rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1.5 text-xs font-semibold text-purple-700"
                      onClick={() => { setUserSelectionne(u); setModal('reassigner'); }}
                    >
                      Réassigner
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          </>
        )}
      </div>

      {/* Modals */}
      {(modal === 'creer-admin' || modal === 'creer-agent') && (
        <div className={overlay}>
          <div className={modal === 'creer-admin' || modal === 'creer-agent' ? 'w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-7 shadow-2xl' : ''}>
            <h3 className="mb-5 text-xl font-bold text-slate-900">
              {modal === 'creer-admin' ? '🛡️ Nouveau compte Admin' : '👔 Nouveau compte Agent'}
            </h3>
            <div className="flex flex-col gap-1">
              {['nom', 'email', 'telephone', 'mot_de_passe', 'ville'].map(champ => (
                <div key={champ}>
                  <label className={champLabel}>{champ === 'mot_de_passe' ? 'Mot de passe *' : champ === 'nom' ? 'Nom complet *' : champ.charAt(0).toUpperCase() + champ.slice(1) + (champ !== 'ville' ? ' *' : '')}</label>
                  <input
                    className={champInput}
                    type={champ === 'mot_de_passe' ? 'password' : 'text'}
                    value={form[champ]}
                    onChange={e => setForm({ ...form, [champ]: e.target.value })}
                    placeholder={champ === 'telephone' ? '+22997001122' : champ === 'ville' ? 'Cotonou' : ''}
                  />
                </div>
              ))}
            </div>
            {erreur && <p className="mt-2 text-[13px] text-red-600">{erreur}</p>}
            <div className="mt-5 flex gap-3">
              <button className={btnAnnuler} onClick={() => setModal(null)}>Annuler</button>
              <button className="flex-1 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60" onClick={() => creerCompte(modal === 'creer-admin' ? 'admin' : 'agent')} disabled={envoi}>
                {envoi ? 'Création...' : `Créer le compte ${modal === 'creer-admin' ? 'Admin' : 'Agent'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === 'reassigner' && userSelectionne && (
        <div className={overlay}>
          <div className={modal === 'reassigner' ? 'w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-7 shadow-2xl' : ''}>
            <h3 className="mb-4 text-xl font-bold text-slate-900">🔄 Réassigner {userSelectionne.nom}</h3>
            <p className="mb-4 text-sm text-slate-400">Choisissez le nouvel agent :</p>
            {agents.map(a => (
              <div key={a.id} className={agentItem} onClick={() => reassigner(a.id)}>
                <div>
                  <div className="font-semibold text-slate-900">{a.nom}</div>
                  <div className="text-xs text-slate-400">{a.nb_proprietaires} propriétaire(s)</div>
                </div>
                <button className={btnChoisir}>Choisir →</button>
              </div>
            ))}
            <button className={`${btnAnnuler} mt-3 w-full`} onClick={() => setModal(null)}>Annuler</button>
          </div>
        </div>
      )}

      {modal === 'reassigner-agents-admin' && userSelectionne && (
        <div className={overlay}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-7 shadow-2xl">
            <h3 className="mb-4 text-xl font-bold text-slate-900">🔁 Réassigner les agents de {userSelectionne.nom}</h3>
            <p className="mb-4 text-sm text-slate-400">
              {userSelectionne.nom} gère encore {admins.find(a => a.id === userSelectionne.id)?.nb_agents_geres || 0} agent(s).
              Choisis l'admin à qui les confier avant de {actionAdminEnCours === 'retrograder' ? 'rétrograder' : 'désactiver'} ce compte.
            </p>
            {admins.filter(a => a.id !== userSelectionne.id).map(a => (
              <div key={a.id} className={agentItem} onClick={() => executerActionAdmin(userSelectionne.id, actionAdminEnCours, a.id)}>
                <div>
                  <div className="font-semibold text-slate-900">{a.nom}{a.role.includes('super_admin') ? ' (Super Admin)' : ''}</div>
                  <div className="text-xs text-slate-400">{a.nb_agents_geres} agent(s) actuellement</div>
                </div>
                <button className={btnChoisir}>Choisir →</button>
              </div>
            ))}
            <button
              className={`${btnAnnuler} mt-3 w-full`}
              onClick={() => { setModal(null); setUserSelectionne(null); setActionAdminEnCours(null); }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
