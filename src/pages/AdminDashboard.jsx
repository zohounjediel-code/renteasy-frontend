import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ClocheNotifications from '../components/ClocheNotifications';

function StatCard({ icone, valeur, label, couleur, sous }) {
  return (
    <div style={{ ...s.statCard, borderTop: `3px solid ${couleur}` }}>
      <div style={s.statIcone}>{icone}</div>
      <div style={{ ...s.statVal, color: couleur }}>{valeur}</div>
      <div style={s.statLabel}>{label}</div>
      {sous && <div style={s.statSous}>{sous}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const [agents, setAgents] = useState([]);
  const [demandes, setDemandes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [modalCreerAgent, setModalCreerAgent] = useState(false);
  const [form, setForm] = useState({ nom: '', email: '', telephone: '', mot_de_passe: '', ville: '' });
  const [envoi, setEnvoi] = useState(false);
  const [succes, setSucces] = useState('');
  const [erreur, setErreur] = useState('');
  const { utilisateur, deconnecter } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { chargerDonnees(); }, []);

  async function chargerDonnees() {
    try {
      const [rAgents, rDemandes] = await Promise.all([
        api.get('/superadmin/agents'),
        api.get('/demandes'),
      ]);
      setAgents(rAgents.data);
      setDemandes(rDemandes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setChargement(false);
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
      setSucces('Compte agent créé avec succès !');
      setForm({ nom: '', email: '', telephone: '', mot_de_passe: '', ville: '' });
      setModalCreerAgent(false);
      chargerDonnees();
    } catch (e) {
      setErreur(e.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setEnvoi(false);
    }
  }

  const demandesEnAttente = demandes.filter(d => d.statut === 'en_attente').length;
  const totalProprietaires = agents.reduce((acc, a) => acc + parseInt(a.nb_proprietaires || 0), 0);
  const totalBiens = agents.reduce((acc, a) => acc + parseInt(a.nb_biens || 0), 0);
  const totalRevenus = agents.reduce((acc, a) => acc + parseInt(a.revenus_collectes || 0), 0);
  const agentsTriesParRecouvrement = [...agents].sort((a, b) => (b.taux_recouvrement || 0) - (a.taux_recouvrement || 0));

  return (
    <div style={s.page}>
      <nav style={s.nav} className="re-nav">
        <div style={s.navLogo}>
          🛡️ <strong>RentEasy</strong> <span style={s.navBenin}>Bénin</span>
          <span style={s.adminBadge}>Admin</span>
        </div>
        <div style={s.navMenu}>
          <button style={s.navBtnActif}>Dashboard</button>
          <button style={s.navBtn} onClick={() => navigate('/admin/agents')}>Agents</button>
          <button style={s.navBtn} onClick={() => navigate('/superadmin/utilisateurs')}>Utilisateurs</button>
          <button style={s.navBtn} onClick={() => navigate('/agent/demandes')}>Demandes</button>
          <button style={s.navBtn} onClick={() => navigate('/superadmin/rapport-regional')}>📊 Rapport régional</button>
          <button style={s.navBtn} onClick={() => { setModalCreerAgent(true); setErreur(''); setSucces(''); }}>+ Créer agent</button>
          <button style={s.navBtnProfil} onClick={() => navigate('/profil')}>👤 Mon profil</button>
          <ClocheNotifications />
          <button style={s.navDeconnexion} onClick={deconnecter}>Déconnexion</button>
        </div>
      </nav>

      <div style={s.contenu}>
        <div style={s.entete}>
          <div>
            <h2 style={s.titre}>Bonjour, {utilisateur?.nom} 🛡️</h2>
            <p style={s.sousTitre}>Tableau de bord administrateur</p>
          </div>
          <button style={s.btnCreer} onClick={() => { setModalCreerAgent(true); setErreur(''); setSucces(''); }}>
            + Créer un agent
          </button>
        </div>

        {succes && <div style={s.succes}>{succes}</div>}

        {/* KPIs */}
        <div style={s.statsGrid}>
          <StatCard icone="👔" valeur={agents.length} label="Agents actifs" couleur="#f59e0b" />
          <StatCard icone="🏘️" valeur={totalProprietaires} label="Propriétaires gérés" couleur="#7c3aed" />
          <StatCard icone="🏠" valeur={totalBiens} label="Biens gérés" couleur="#3b82f6" />
          <StatCard icone="💰" valeur={`${totalRevenus.toLocaleString('fr-FR')} FCFA`} label="Revenus collectés ce mois" couleur="#10b981" />
          <StatCard icone="⏳" valeur={demandesEnAttente} label="Demandes en attente" couleur="#ef4444" sous="tous agents confondus" />
        </div>

        {/* Agents */}
        <p style={s.sectionTitre}>👔 Vue comparative des agents</p>
        {chargement ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>Chargement...</p>
        ) : agents.length === 0 ? (
          <div style={s.vide}>
            <p>Aucun agent enregistré.</p>
            <button style={s.btnCreer} onClick={() => setModalCreerAgent(true)}>+ Créer le premier agent</button>
          </div>
        ) : (
          <div style={s.tableau}>
            <div style={{ ...s.tableauEntete, gridTemplateColumns: '1.6fr 1.6fr 0.9fr 0.9fr 1.3fr 1.1fr 0.9fr', minWidth: '760px' }}>
              <span>Agent</span>
              <span>Contact</span>
              <span>Propriétaires</span>
              <span>Biens gérés</span>
              <span>Recouvrement</span>
              <span>En attente</span>
              <span>Statut</span>
            </div>
            {agentsTriesParRecouvrement.map(a => (
              <div key={a.id} style={{ ...s.tableauLigne, gridTemplateColumns: '1.6fr 1.6fr 0.9fr 0.9fr 1.3fr 1.1fr 0.9fr', minWidth: '760px' }}>
                <div style={s.agentNom}>{a.nom}</div>
                <div>
                  <div style={{ color: '#a78bfa', fontSize: '13px' }}>{a.email}</div>
                  <div style={{ color: '#6b7280', fontSize: '12px' }}>{a.telephone}</div>
                </div>
                <div style={{ color: '#f59e0b', fontWeight: '700', fontSize: '18px' }}>{a.nb_proprietaires}</div>
                <div style={{ color: '#3b82f6', fontWeight: '700', fontSize: '18px' }}>{a.nb_biens}</div>
                <div style={{ color: a.taux_recouvrement >= 80 ? '#10b981' : a.taux_recouvrement >= 50 ? '#f59e0b' : '#ef4444', fontWeight: '700' }}>
                  {a.taux_recouvrement}% <span style={{ color: '#6b7280', fontWeight: '400', fontSize: '11px' }}>({a.echeances_payees}/{a.total_echeances})</span>
                </div>
                <div>
                  {parseInt(a.demandes_en_attente) > 0 ? (
                    <span style={s.badgeAttente}>{a.demandes_en_attente}</span>
                  ) : (
                    <span style={s.badgeOk}>0</span>
                  )}
                </div>
                <span style={{ ...s.badgeStatut, background: a.actif ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: a.actif ? '#10b981' : '#ef4444', border: `1px solid ${a.actif ? '#10b98130' : '#ef444430'}` }}>
                  {a.actif ? '● Actif' : '○ Inactif'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Dernières demandes */}
        {demandes.length > 0 && (
          <>
            <p style={{ ...s.sectionTitre, marginTop: '28px' }}>📋 Dernières demandes de contrats</p>
            <div style={s.tableau}>
              <div style={{ ...s.tableauEntete, gridTemplateColumns: '2fr 1.5fr 1.5fr 1fr 1fr', minWidth: '600px' }}>
                <span>Propriétaire</span>
                <span>Bien</span>
                <span>Type</span>
                <span>Agent</span>
                <span>Statut</span>
              </div>
              {demandes.slice(0, 8).map(d => (
                <div key={d.id} style={{ ...s.tableauLigne, gridTemplateColumns: '2fr 1.5fr 1.5fr 1fr 1fr', minWidth: '600px' }}>
                  <div style={{ color: '#e2e8f0', fontWeight: '600' }}>{d.proprietaire_nom}</div>
                  <div style={{ color: '#9ca3af', fontSize: '13px' }}>{d.adresse}</div>
                  <span style={{ background: d.type_demande === 'modification' ? 'rgba(99,102,241,0.15)' : 'rgba(239,68,68,0.15)', color: d.type_demande === 'modification' ? '#818cf8' : '#ef4444', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>
                    {d.type_demande}
                  </span>
                  <div style={{ color: '#f59e0b', fontSize: '13px' }}>{d.agent_nom || '—'}</div>
                  <span style={{ background: d.statut === 'en_attente' ? 'rgba(245,158,11,0.15)' : d.statut === 'approuvee' ? 'rgba(16,185,129,0.15)' : 'rgba(107,114,128,0.15)', color: d.statut === 'en_attente' ? '#f59e0b' : d.statut === 'approuvee' ? '#10b981' : '#6b7280', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>
                    {d.statut}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal créer agent */}
      {modalCreerAgent && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h3 style={s.modalTitre}>👔 Nouveau compte Agent</h3>
            <p style={s.modalSous}>Le compte sera immédiatement actif après création.</p>
            {['nom', 'email', 'telephone', 'mot_de_passe', 'ville'].map(champ => (
              <div key={champ}>
                <label style={s.label}>
                  {champ === 'mot_de_passe' ? 'Mot de passe *' : champ === 'nom' ? 'Nom complet *' : champ.charAt(0).toUpperCase() + champ.slice(1) + (champ !== 'ville' ? ' *' : '')}
                </label>
                <input
                  style={s.input}
                  type={champ === 'mot_de_passe' ? 'password' : 'text'}
                  value={form[champ]}
                  onChange={e => setForm({ ...form, [champ]: e.target.value })}
                  placeholder={champ === 'telephone' ? '+22997001122' : champ === 'ville' ? 'Cotonou (optionnel)' : ''}
                />
              </div>
            ))}
            {erreur && <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '8px' }}>{erreur}</p>}
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button style={s.btnAnnuler} onClick={() => setModalCreerAgent(false)}>Annuler</button>
              <button style={s.btnValider} onClick={creerAgent} disabled={envoi}>
                {envoi ? 'Création...' : '✅ Créer le compte'}
              </button>
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
  contenu: { padding: '28px 24px', maxWidth: '1200px', margin: '0 auto' },
  entete: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  titre: { margin: 0, fontSize: '26px', fontWeight: '800', background: 'linear-gradient(135deg,#fca5a5,#f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  sousTitre: { color: '#6b7280', margin: '4px 0 0', fontSize: '14px' },
  btnCreer: { background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#000', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  succes: { background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '16px', marginBottom: '28px' },
  statCard: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px' },
  statIcone: { fontSize: '28px', marginBottom: '8px' },
  statVal: { fontSize: '28px', fontWeight: '800', marginBottom: '4px' },
  statLabel: { fontSize: '13px', color: '#9ca3af', fontWeight: '500' },
  statSous: { fontSize: '12px', color: '#6b7280', marginTop: '4px' },
  sectionTitre: { color: '#fbbf24', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 12px' },
  vide: { textAlign: 'center', color: '#6b7280', padding: '40px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' },
  tableau: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden', overflowX: 'auto' },
  tableauEntete: { display: 'grid', padding: '12px 20px', background: 'rgba(245,158,11,0.08)', fontSize: '11px', fontWeight: '700', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.5px' },
  tableauLigne: { display: 'grid', padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '14px', alignItems: 'center' },
  agentNom: { fontWeight: '700', color: '#e2e8f0', fontSize: '15px' },
  badgeAttente: { background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', border: '1px solid rgba(239,68,68,0.3)' },
  badgeOk: { background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '700' },
  badgeStatut: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', display: 'inline-block' },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#0f0a1e', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '460px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' },
  modalTitre: { margin: '0 0 4px', color: '#fbbf24', fontSize: '20px', fontWeight: '700' },
  modalSous: { color: '#9ca3af', fontSize: '14px', marginBottom: '16px' },
  label: { fontSize: '12px', fontWeight: '600', color: '#9ca3af', display: 'block', marginBottom: '4px', marginTop: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', padding: '10px 12px', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' },
  btnAnnuler: { background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', cursor: 'pointer', flex: 1 },
  btnValider: { background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#000', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', flex: 1 },
};
