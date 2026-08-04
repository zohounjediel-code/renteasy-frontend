import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const ROLES_LABELS = {
  proprietaire: { label: 'Propriétaire', couleur: '#7c3aed' },
  locataire: { label: 'Locataire', couleur: '#a78bfa' },
  agent: { label: 'Agent', couleur: '#f59e0b' },
  admin: { label: 'Admin', couleur: '#ef4444' },
  super_admin: { label: 'Super Admin', couleur: '#10b981' },
};

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
    <div style={s.page}>
      <nav style={s.nav} className="re-nav">
        <div style={s.navLogo} onClick={() => navigate(estSuperAdmin ? '/superadmin/dashboard' : '/admin/dashboard')}>
          <span>⚡</span> RentEasy <span style={s.navBenin}>Bénin</span>
          <span style={s.superBadge}>{estSuperAdmin ? 'SUPER ADMIN' : 'ADMIN'}</span>
        </div>
        <div style={s.navMenu}>
          <button style={s.navBtn} onClick={() => navigate(estSuperAdmin ? '/superadmin/dashboard' : '/admin/dashboard')}>Dashboard</button>
          {!estSuperAdmin && <button style={s.navBtn} onClick={() => navigate('/admin/agents')}>Agents</button>}
          <button style={{ ...s.navBtn, ...s.navBtnActif }}>Utilisateurs</button>
          {estSuperAdmin && <button style={s.navBtn} onClick={() => navigate('/superadmin/contrats')}>Contrats</button>}
          {estSuperAdmin && <button style={s.navBtn} onClick={() => navigate('/superadmin/journal')}>Journal</button>}
          {estSuperAdmin && <button style={s.navBtn} onClick={() => navigate('/superadmin/parametres')}>Paramètres</button>}
          {estSuperAdmin && <button style={s.navBtn} onClick={() => navigate('/superadmin/moderation')}>Modération</button>}
          {estSuperAdmin && <button style={s.navBtn} onClick={() => navigate('/superadmin/rapport-financier')}>Rapport financier</button>}
          {estSuperAdmin && <button style={s.navBtn} onClick={() => navigate('/superadmin/rappels')}>Rappels</button>}
          {estSuperAdmin && <button style={s.navBtn} onClick={() => navigate('/superadmin/erreurs')}>Erreurs</button>}
          <button style={s.navDeconnexion} onClick={deconnecter}>Déconnexion</button>
        </div>
      </nav>

      <div style={s.contenu}>
        <div style={s.entete}>
          <h2 style={s.titre}>Gestion des utilisateurs</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            {estSuperAdmin && (
              <button style={s.btnAdmin} onClick={() => { setModal('creer-admin'); setForm({ nom: '', email: '', telephone: '', mot_de_passe: '', ville: '' }); setErreur(''); }}>
                + Créer Admin
              </button>
            )}
            <button style={s.btnAgent} onClick={() => { setModal('creer-agent'); setForm({ nom: '', email: '', telephone: '', mot_de_passe: '', ville: '' }); setErreur(''); }}>
              + Créer Agent
            </button>
          </div>
        </div>

        {message && <div style={s.succes}>{message}</div>}
        {erreur && <div style={s.erreur}>{erreur}</div>}

        {/* Filtres */}
        <div style={s.filtres}>
          <input style={s.recherche} placeholder="🔍 Rechercher par nom ou email..." value={recherche} onChange={e => setRecherche(e.target.value)} />
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['', 'proprietaire', 'locataire', 'agent', 'admin', 'super_admin'].map(r => (
              <button
                key={r}
                style={{ ...s.filtreBouton, background: filtreRole === r ? '#7c3aed' : 'rgba(255,255,255,0.05)', color: filtreRole === r ? '#fff' : '#9ca3af', border: filtreRole === r ? '1px solid #7c3aed' : '1px solid rgba(255,255,255,0.1)' }}
                onClick={() => setFiltreRole(r)}
              >
                {r === '' ? 'Tous' : ROLES_LABELS[r]?.label || r}
              </button>
            ))}
          </div>
        </div>

        {/* Tableau */}
        {chargement ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '40px' }}>Chargement...</p>
        ) : (
          <div style={s.tableau}>
            <div style={s.tableauEntete}>
              <span>Utilisateur</span>
              <span>Contact</span>
              <span>Rôle(s)</span>
              <span>Agent assigné</span>
              <span>Statut</span>
              <span>Actions</span>
            </div>
            {utilisateursFiltres.map(u => (
              <div key={u.id} style={s.tableauLigne}>
                <div>
                  <div style={s.userNom}>{u.nom}</div>
                  <div style={s.userDate}>{new Date(u.created_at).toLocaleDateString('fr-FR')}</div>
                </div>
                <div>
                  <div style={{ color: '#a78bfa', fontSize: '13px' }}>{u.email}</div>
                  <div style={{ color: '#6b7280', fontSize: '12px' }}>{u.telephone}</div>
                </div>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {u.role.split(',').map(r => {
                    const rl = ROLES_LABELS[r.trim()] || { label: r, couleur: '#666' };
                    return (
                      <span key={r} style={{ background: `${rl.couleur}20`, color: rl.couleur, padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', border: `1px solid ${rl.couleur}40` }}>
                        {rl.label}
                      </span>
                    );
                  })}
                </div>
                <div style={{ color: '#9ca3af', fontSize: '13px' }}>{u.agent_nom || '—'}</div>
                <div>
                  <span style={{ background: u.actif ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: u.actif ? '#10b981' : '#ef4444', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', border: `1px solid ${u.actif ? '#10b98130' : '#ef444430'}` }}>
                    {u.actif ? '● Actif' : '○ Inactif'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button
                    style={{ ...s.btnAction, background: u.actif ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: u.actif ? '#ef4444' : '#10b981', border: `1px solid ${u.actif ? '#ef444440' : '#10b98140'}` }}
                    onClick={() => toggleCompte(u)}
                    disabled={u.role.includes('super_admin') || (!estSuperAdmin && u.role.includes('admin'))}
                    title={!estSuperAdmin && u.role.includes('admin') ? 'Seul un super admin peut désactiver un compte admin' : undefined}
                  >
                    {u.actif ? 'Désactiver' : 'Activer'}
                  </button>
                  {estSuperAdmin && u.role.includes('admin') && !u.role.includes('super_admin') && (
                    <button
                      style={{ ...s.btnAction, background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.4)' }}
                      onClick={() => demarrerRetrogradation(u)}
                      title="Retour au rôle propriétaire"
                    >
                      Rétrograder
                    </button>
                  )}
                  {estSuperAdmin && u.role.includes('proprietaire') && (
                    <button
                      style={{ ...s.btnAction, background: 'rgba(124,58,237,0.1)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.3)' }}
                      onClick={() => { setUserSelectionne(u); setModal('reassigner'); }}
                    >
                      Réassigner
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {(modal === 'creer-admin' || modal === 'creer-agent') && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h3 style={s.modalTitre}>
              {modal === 'creer-admin' ? '🛡️ Nouveau compte Admin' : '👔 Nouveau compte Agent'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {['nom', 'email', 'telephone', 'mot_de_passe', 'ville'].map(champ => (
                <div key={champ}>
                  <label style={s.label}>{champ === 'mot_de_passe' ? 'Mot de passe *' : champ === 'nom' ? 'Nom complet *' : champ.charAt(0).toUpperCase() + champ.slice(1) + (champ !== 'ville' ? ' *' : '')}</label>
                  <input
                    style={s.input}
                    type={champ === 'mot_de_passe' ? 'password' : 'text'}
                    value={form[champ]}
                    onChange={e => setForm({ ...form, [champ]: e.target.value })}
                    placeholder={champ === 'telephone' ? '+22997001122' : champ === 'ville' ? 'Cotonou' : ''}
                  />
                </div>
              ))}
            </div>
            {erreur && <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '8px' }}>{erreur}</p>}
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button style={s.btnAnnuler} onClick={() => setModal(null)}>Annuler</button>
              <button style={{ ...s.btnValider, flex: 1 }} onClick={() => creerCompte(modal === 'creer-admin' ? 'admin' : 'agent')} disabled={envoi}>
                {envoi ? 'Création...' : `Créer le compte ${modal === 'creer-admin' ? 'Admin' : 'Agent'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === 'reassigner' && userSelectionne && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h3 style={s.modalTitre}>🔄 Réassigner {userSelectionne.nom}</h3>
            <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '16px' }}>Choisissez le nouvel agent :</p>
            {agents.map(a => (
              <div key={a.id} style={s.agentItem} onClick={() => reassigner(a.id)}>
                <div>
                  <div style={{ fontWeight: '600', color: '#e2e8f0' }}>{a.nom}</div>
                  <div style={{ color: '#6b7280', fontSize: '12px' }}>{a.nb_proprietaires} propriétaire(s)</div>
                </div>
                <button style={s.btnChoisir}>Choisir →</button>
              </div>
            ))}
            <button style={{ ...s.btnAnnuler, width: '100%', marginTop: '12px' }} onClick={() => setModal(null)}>Annuler</button>
          </div>
        </div>
      )}

      {modal === 'reassigner-agents-admin' && userSelectionne && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h3 style={s.modalTitre}>🔁 Réassigner les agents de {userSelectionne.nom}</h3>
            <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '16px' }}>
              {userSelectionne.nom} gère encore {admins.find(a => a.id === userSelectionne.id)?.nb_agents_geres || 0} agent(s).
              Choisis l'admin à qui les confier avant de {actionAdminEnCours === 'retrograder' ? 'rétrograder' : 'désactiver'} ce compte.
            </p>
            {admins.filter(a => a.id !== userSelectionne.id).map(a => (
              <div key={a.id} style={s.agentItem} onClick={() => executerActionAdmin(userSelectionne.id, actionAdminEnCours, a.id)}>
                <div>
                  <div style={{ fontWeight: '600', color: '#e2e8f0' }}>{a.nom}{a.role.includes('super_admin') ? ' (Super Admin)' : ''}</div>
                  <div style={{ color: '#6b7280', fontSize: '12px' }}>{a.nb_agents_geres} agent(s) actuellement</div>
                </div>
                <button style={s.btnChoisir}>Choisir →</button>
              </div>
            ))}
            <button
              style={{ ...s.btnAnnuler, width: '100%', marginTop: '12px' }}
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

const s = {
  page: { minHeight: '100vh', background: 'linear-gradient(135deg,#0a0a0f 0%,#0f0a1e 50%,#0a0f0a 100%)', fontFamily: "'Segoe UI',sans-serif", color: '#e2e8f0' },
  nav: { background: 'rgba(10,10,20,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(124,58,237,0.3)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' },
  navLogo: { display: 'flex', alignItems: 'center', gap: '10px', color: '#e2e8f0', fontSize: '18px', fontWeight: '700', cursor: 'pointer' },
  navBenin: { color: '#f59e0b' },
  superBadge: { background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: '#fff', fontSize: '10px', padding: '3px 10px', borderRadius: '20px', fontWeight: '800', letterSpacing: '1px' },
  navMenu: { display: 'flex', gap: '8px', alignItems: 'center' },
  navBtn: { background: 'transparent', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa', cursor: 'pointer', padding: '7px 14px', borderRadius: '6px', fontSize: '13px' },
  navBtnActif: { background: 'rgba(124,58,237,0.2)', border: '1px solid #7c3aed', color: '#c4b5fd' },
  navBtnProfil: { background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa', cursor: 'pointer', padding: '7px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '600' },
  navDeconnexion: { background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', cursor: 'pointer', padding: '7px 14px', borderRadius: '6px', fontSize: '13px' },
  contenu: { padding: '32px 24px', maxWidth: '1300px', margin: '0 auto' },
  entete: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  titre: { margin: 0, fontSize: '24px', fontWeight: '800', background: 'linear-gradient(135deg,#c4b5fd,#f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  btnAdmin: { background: 'linear-gradient(135deg,#ef4444,#b91c1c)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 18px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  btnAgent: { background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#000', border: 'none', borderRadius: '8px', padding: '10px 18px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
  succes: { background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  erreur: { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  filtres: { display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' },
  recherche: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', padding: '10px 16px', borderRadius: '8px', fontSize: '14px', width: '280px', outline: 'none' },
  filtreBouton: { padding: '6px 14px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' },
  tableau: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden', overflowX: 'auto' },
  tableauEntete: { display: 'grid', gridTemplateColumns: '1.5fr 2fr 1.5fr 1.2fr 1fr 1.5fr', minWidth: '700px', padding: '14px 20px', background: 'rgba(124,58,237,0.1)', fontSize: '11px', fontWeight: '700', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.5px' },
  tableauLigne: { display: 'grid', gridTemplateColumns: '1.5fr 2fr 1.5fr 1.2fr 1fr 1.5fr', minWidth: '700px', padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '14px', alignItems: 'center' },
  userNom: { fontWeight: '700', color: '#e2e8f0', fontSize: '14px' },
  userDate: { color: '#6b7280', fontSize: '11px', marginTop: '2px' },
  btnAction: { padding: '5px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#0f0a1e', border: '1px solid rgba(124,58,237,0.4)', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' },
  modalTitre: { margin: '0 0 20px', color: '#c4b5fd', fontSize: '20px', fontWeight: '700' },
  label: { fontSize: '12px', fontWeight: '600', color: '#9ca3af', display: 'block', marginBottom: '4px', marginTop: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', padding: '10px 12px', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' },
  btnAnnuler: { background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', cursor: 'pointer' },
  btnValider: { background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  agentItem: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '14px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' },
  btnChoisir: { background: 'rgba(124,58,237,0.2)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '6px', padding: '6px 14px', fontSize: '13px', cursor: 'pointer', fontWeight: '600' },
};
