import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ClocheNotifications from '../components/ClocheNotifications';
import Chat from '../components/Chat';

export default function AdminAgents() {
  const [agents, setAgents] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [agentSelectionne, setAgentSelectionne] = useState(null);
  const [proprietairesAgent, setProprietairesAgent] = useState([]);
  const [modalCreer, setModalCreer] = useState(false);
  const [afficherChat, setAfficherChat] = useState(false);
  const [form, setForm] = useState({ nom: '', email: '', telephone: '', mot_de_passe: '', ville: '' });
  const [envoi, setEnvoi] = useState(false);
  const [succes, setSucces] = useState('');
  const [erreur, setErreur] = useState('');
  const { deconnecter } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { chargerAgents(); }, []);

  async function chargerAgents() {
    try {
      const r = await api.get('/superadmin/agents');
      setAgents(r.data);
    } catch (e) {
      console.error(e);
    } finally {
      setChargement(false);
    }
  }

  async function voirProprietaires(agent) {
    setAgentSelectionne(agent);
    setAfficherChat(false);
    try {
      const r = await api.get('/agent/mes-proprietaires', { params: { agent_id: agent.id } });
      setProprietairesAgent(r.data);
    } catch (e) {
      console.error(e);
    }
  }

  async function creerAgent() {
    setErreur(''); setSucces('');
    if (!form.nom || !form.email || !form.telephone || !form.mot_de_passe) {
      setErreur('Tous les champs obligatoires doivent être remplis');
      return;
    }
    setEnvoi(true);
    try {
      await api.post('/auth/creer-agent', form);
      setSucces('Agent créé avec succès !');
      setForm({ nom: '', email: '', telephone: '', mot_de_passe: '', ville: '' });
      setModalCreer(false);
      chargerAgents();
    } catch (e) {
      setErreur(e.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div style={s.page}>
      <nav style={s.nav} className="re-nav">
        <div style={s.navLogo}>
          🛡️ <strong>RentEasy</strong> <span style={s.navBenin}>Bénin</span>
          <span style={s.adminBadge}>Admin</span>
        </div>
        <div style={s.navMenu}>
          <button style={s.navBtn} onClick={() => navigate('/admin/dashboard')}>Dashboard</button>
          <button style={s.navBtnActif}>Agents</button>
          <button style={s.navBtn} onClick={() => navigate('/superadmin/utilisateurs')}>Utilisateurs</button>
          <button style={s.navBtn} onClick={() => { setModalCreer(true); setErreur(''); }}>+ Créer agent</button>
          <button style={s.navBtnProfil} onClick={() => navigate('/profil')}>👤 Mon profil</button>
          <ClocheNotifications />
          <button style={s.navDeconnexion} onClick={deconnecter}>Déconnexion</button>
        </div>
      </nav>

      <div style={s.contenu}>
        {succes && <div style={s.succes}>{succes}</div>}

        <div style={s.layout}>
          {/* Liste agents */}
          <div>
            <h2 style={s.titre}>Gestion des agents</h2>
            <p style={s.sousTitre}>{agents.length} agent(s) enregistré(s)</p>

            {chargement ? (
              <p style={{ color: '#6b7280', padding: '20px' }}>Chargement...</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                {agents.map(a => (
                  <div
                    key={a.id}
                    style={{ ...s.agentCard, border: agentSelectionne?.id === a.id ? '1px solid #f59e0b' : '1px solid rgba(255,255,255,0.08)', background: agentSelectionne?.id === a.id ? 'rgba(245,158,11,0.05)' : 'rgba(255,255,255,0.02)' }}
                  >
                    <div style={s.agentEntete}>
                      <div style={s.agentAvatar}>{a.nom.charAt(0)}</div>
                      <div style={{ flex: 1 }}>
                        <div style={s.agentNom}>{a.nom}</div>
                        <div style={s.agentDetail}>{a.email}</div>
                        <div style={s.agentDetail}>{a.telephone}</div>
                      </div>
                      <span style={{ ...s.statutBadge, background: a.actif ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: a.actif ? '#10b981' : '#ef4444', border: `1px solid ${a.actif ? '#10b98130' : '#ef444430'}` }}>
                        {a.actif ? '● Actif' : '○ Inactif'}
                      </span>
                    </div>

                    <div style={s.agentStats}>
                      <span style={s.statBadge}>🏘️ {a.nb_proprietaires} propriétaire(s)</span>
                      <span style={{ ...s.statBadge, color: parseInt(a.demandes_en_attente) > 0 ? '#f59e0b' : '#6b7280' }}>
                        ⏳ {a.demandes_en_attente} en attente
                      </span>
                      <span style={{ ...s.statBadge, color: a.taux_recouvrement >= 80 ? '#10b981' : a.taux_recouvrement >= 50 ? '#f59e0b' : '#ef4444' }}>
                        📊 {a.taux_recouvrement}% recouvrement
                      </span>
                      <span style={{ ...s.statBadge, color: '#10b981' }}>
                        💰 {parseInt(a.revenus_collectes || 0).toLocaleString('fr-FR')} FCFA ce mois
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        style={s.btnVoir}
                        onClick={() => voirProprietaires(a)}
                      >
                        👥 Voir propriétaires
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Détail agent sélectionné */}
          {agentSelectionne && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, color: '#fbbf24', fontSize: '16px' }}>
                  {afficherChat ? `💬 Chat avec ${agentSelectionne.nom}` : `👥 Propriétaires de ${agentSelectionne.nom}`}
                </h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    style={{ ...s.btnToggle, background: !afficherChat ? 'rgba(245,158,11,0.2)' : 'transparent', color: !afficherChat ? '#f59e0b' : '#6b7280', border: `1px solid ${!afficherChat ? '#f59e0b' : 'rgba(255,255,255,0.08)'}` }}
                    onClick={() => setAfficherChat(false)}
                  >
                    👥 Propriétaires
                  </button>
                  <button
                    style={{ ...s.btnToggle, background: afficherChat ? 'rgba(124,58,237,0.2)' : 'transparent', color: afficherChat ? '#a78bfa' : '#6b7280', border: `1px solid ${afficherChat ? '#7c3aed' : 'rgba(255,255,255,0.08)'}` }}
                    onClick={() => setAfficherChat(true)}
                  >
                    💬 Message
                  </button>
                  <button style={s.btnFermer} onClick={() => setAgentSelectionne(null)}>✕</button>
                </div>
              </div>

              {afficherChat ? (
                <Chat interlocuteur={agentSelectionne} contexte="proprietaire" />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {proprietairesAgent.length === 0 ? (
                    <div style={s.vide}>Aucun propriétaire assigné à cet agent</div>
                  ) : (
                    proprietairesAgent.map(p => (
                      <div key={p.id} style={s.propCard}>
                        <div style={s.propAvatar}>{p.nom.charAt(0)}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', color: '#e2e8f0' }}>{p.nom}</div>
                          <div style={{ color: '#9ca3af', fontSize: '12px' }}>{p.email} · {p.telephone}</div>
                        </div>
                        <button style={s.btnVoirCompte} onClick={() => navigate(`/agent/proprietaires/${p.id}`)}>
                          🔍 Voir le compte
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal créer agent */}
      {modalCreer && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h3 style={s.modalTitre}>👔 Nouveau compte Agent</h3>
            {['nom', 'email', 'telephone', 'mot_de_passe', 'ville'].map(champ => (
              <div key={champ}>
                <label style={s.label}>{champ === 'mot_de_passe' ? 'Mot de passe *' : champ === 'nom' ? 'Nom complet *' : champ.charAt(0).toUpperCase() + champ.slice(1) + (champ !== 'ville' ? ' *' : '')}</label>
                <input style={s.input} type={champ === 'mot_de_passe' ? 'password' : 'text'} value={form[champ]} onChange={e => setForm({ ...form, [champ]: e.target.value })} placeholder={champ === 'telephone' ? '+22997001122' : ''} />
              </div>
            ))}
            {erreur && <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '8px' }}>{erreur}</p>}
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button style={s.btnAnnuler} onClick={() => setModalCreer(false)}>Annuler</button>
              <button style={s.btnValider} onClick={creerAgent} disabled={envoi}>{envoi ? 'Création...' : '✅ Créer'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: 'linear-gradient(135deg,#0a0a0f 0%,#0d1117 100%)', fontFamily: "'Segoe UI',sans-serif", color: '#e2e8f0' },
  nav: { background: 'rgba(10,10,20,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(245,158,11,0.2)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px', position: 'sticky', top: 0, zIndex: 100 },
  navLogo: { color: '#e2e8f0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' },
  navBenin: { color: '#f59e0b' },
  adminBadge: { background: 'linear-gradient(135deg,#ef4444,#b91c1c)', color: '#fff', fontSize: '10px', padding: '3px 10px', borderRadius: '20px', fontWeight: '800', letterSpacing: '1px' },
  navMenu: { display: 'flex', gap: '8px', alignItems: 'center' },
  navBtn: { background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af', cursor: 'pointer', padding: '7px 12px', borderRadius: '6px', fontSize: '13px' },
  navBtnActif: { background: 'rgba(239,68,68,0.2)', border: '1px solid #ef4444', color: '#fca5a5', cursor: 'pointer', padding: '7px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '600' },
  navBtnProfil: { background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa', cursor: 'pointer', padding: '7px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '600' },
  navDeconnexion: { background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', cursor: 'pointer', padding: '7px 12px', borderRadius: '6px', fontSize: '13px' },
  contenu: { padding: '28px 24px', maxWidth: '1300px', margin: '0 auto' },
  layout: { display: 'grid', gridTemplateColumns: agentSelectionne => agentSelectionne ? '1fr 1fr' : '1fr', gap: '24px' },
  titre: { margin: 0, fontSize: '24px', fontWeight: '800', background: 'linear-gradient(135deg,#fca5a5,#f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  sousTitre: { color: '#6b7280', margin: '4px 0 0', fontSize: '13px' },
  succes: { background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  agentCard: { borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', transition: 'all 0.2s' },
  agentEntete: { display: 'flex', alignItems: 'center', gap: '12px' },
  agentAvatar: { width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '18px', flexShrink: 0 },
  agentNom: { fontWeight: '700', color: '#e2e8f0', fontSize: '15px' },
  agentDetail: { color: '#9ca3af', fontSize: '12px', marginTop: '2px' },
  agentStats: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  statBadge: { background: 'rgba(255,255,255,0.05)', color: '#9ca3af', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', border: '1px solid rgba(255,255,255,0.08)' },
  statutBadge: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', flexShrink: 0 },
  btnVoir: { background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#000', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', flex: 1 },
  btnToggle: { padding: '6px 14px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: '600' },
  btnFermer: { background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '18px', padding: '4px 8px' },
  vide: { textAlign: 'center', color: '#6b7280', padding: '40px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' },
  propCard: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '14px', display: 'flex', alignItems: 'center', gap: '12px' },
  propAvatar: { width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(124,58,237,0.3)', color: '#a78bfa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '14px', flexShrink: 0 },
  btnVoirCompte: { background: 'transparent', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.4)', borderRadius: '8px', padding: '7px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', flexShrink: 0 },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#0f0a1e', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '460px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' },
  modalTitre: { margin: '0 0 16px', color: '#fbbf24', fontSize: '20px', fontWeight: '700' },
  label: { fontSize: '12px', fontWeight: '600', color: '#9ca3af', display: 'block', marginBottom: '4px', marginTop: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', padding: '10px 12px', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' },
  btnAnnuler: { background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', cursor: 'pointer', flex: 1 },
  btnValider: { background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#000', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', flex: 1 },
};
