import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ClocheNotifications from '../components/ClocheNotifications';
import Chat from '../components/Chat';
import BoutonActiverRole from '../components/BoutonActiverRole';

export default function MonAgent() {
  const [agent, setAgent] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [delegationActive, setDelegationActive] = useState(false);
  const [envoiDelegation, setEnvoiDelegation] = useState(false);
  const [messageDelegation, setMessageDelegation] = useState('');
  const { utilisateur, deconnecter } = useAuth();
  const navigate = useNavigate();
  const estAussiLocataire = (utilisateur?.role || '').includes('locataire');
  const [journal, setJournal] = useState(null);
  const [chargementJournal, setChargementJournal] = useState(true);

  useEffect(() => {
    api.get('/proprietaire/mon-agent')
      .then(r => setAgent(r.data))
      .catch(e => setErreur(e.response?.data?.message || 'Erreur de chargement'))
      .finally(() => setChargement(false));
    api.get('/profil')
      .then(r => setDelegationActive(!!r.data.autorise_agent_gestion))
      .catch(console.error);
    api.get('/profil/journal-agent')
      .then(r => setJournal(r.data))
      .catch(console.error)
      .finally(() => setChargementJournal(false));
  }, []);

  async function basculerDelegation() {
    setEnvoiDelegation(true);
    setMessageDelegation('');
    const nouvelEtat = !delegationActive;
    try {
      const r = await api.patch('/profil/delegation-agent', { autorise: nouvelEtat });
      setDelegationActive(r.data.autorise_agent_gestion);
      setMessageDelegation(r.data.message);
    } catch (e) {
      setMessageDelegation(e.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setEnvoiDelegation(false);
    }
  }

  return (
    <div style={s.page}>
      <nav style={s.nav} className="re-nav">
        <div style={s.navLogo}>🏠 <strong>RentEasy</strong> <span style={s.navBenin}>Bénin</span></div>
        <div style={s.navMenu}>
          <button style={s.navBtn} onClick={() => navigate('/biens')}>Mes biens</button>
          <button style={s.navBtn} onClick={() => navigate('/locataires')}>Locataires</button>
          <button style={s.navBtn} onClick={() => navigate('/paiements')}>Paiements</button>
          <button style={s.navBtn} onClick={() => navigate('/dashboard')}>Dashboard</button>
          <button style={s.navBtnActif}>Mon agent</button>
          {estAussiLocataire && (
            <button style={s.navBtnBasculer} onClick={() => navigate('/locataire/dashboard')}>🔄 Espace locataire</button>
          )}
          <button style={s.navBtnProfil} onClick={() => navigate('/profil')}>👤 Mon profil</button>
          <ClocheNotifications />
          <button style={s.navDeconnexion} onClick={deconnecter}>Déconnexion</button>
        </div>
      </nav>

      <div style={s.contenu}>
        <h2 style={s.titre}>Mon agent RentEasy</h2>
        <p style={s.sousTitre}>Votre agent attitré, disponible pour toutes vos demandes</p>

        <BoutonActiverRole />

        {chargement ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '40px' }}>Chargement...</p>
        ) : erreur ? (
          <div style={s.vide}>
            <p style={{ fontSize: '32px' }}>👔</p>
            <p>{erreur}</p>
            <p style={{ color: '#6b7280', fontSize: '13px' }}>Contactez l'administration RentEasy pour vous assigner un agent.</p>
          </div>
        ) : agent && (
          <div style={s.layout}>
            {/* Carte agent */}
            <div style={s.agentCard}>
              <div style={s.agentEntete}>
                <div style={s.agentAvatar}>{agent.nom.charAt(0).toUpperCase()}</div>
                <div>
                  <div style={s.agentNom}>{agent.nom}</div>
                  <div style={s.agentRole}>Agent RentEasy Bénin</div>
                </div>
                <span style={s.agentBadgeActif}>● En ligne</span>
              </div>

              <div style={s.agentInfos}>
                <p style={s.infoTitre}>📞 Contact direct</p>
                <div style={s.infoLigne}>
                  <span style={s.infoLabel}>Téléphone</span>
                  <a href={`tel:${agent.telephone}`} style={s.infoVal}>{agent.telephone}</a>
                </div>
                <div style={s.infoLigne}>
                  <span style={s.infoLabel}>Email</span>
                  <a href={`mailto:${agent.email}`} style={s.infoVal}>{agent.email}</a>
                </div>
                {agent.ville && (
                  <div style={s.infoLigne}>
                    <span style={s.infoLabel}>Ville</span>
                    <span style={s.infoVal}>{agent.ville}</span>
                  </div>
                )}
              </div>

              <div style={s.delegationBox}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                  <div>
                    <p style={s.infoTitre}>🤝 Délégation de gestion</p>
                    <p style={s.delegationTexte}>
                      Autorisez votre agent à ajouter des biens, créer des contrats et ajouter des locataires
                      en votre nom. Chaque action de l'agent reste tracée et vous pouvez révoquer cette
                      autorisation à tout moment.
                    </p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={delegationActive}
                    onClick={basculerDelegation}
                    disabled={envoiDelegation}
                    style={{ ...s.interrupteur, background: delegationActive ? '#10b981' : 'rgba(255,255,255,0.15)' }}
                  >
                    <span style={{ ...s.interrupteurBille, transform: delegationActive ? 'translateX(18px)' : 'translateX(2px)' }} />
                  </button>
                </div>
                <p style={{ ...s.delegationStatut, color: delegationActive ? '#10b981' : '#9ca3af' }}>
                  {delegationActive ? '✅ Délégation active' : '⛔ Délégation désactivée'}
                </p>
                {messageDelegation && <p style={s.delegationMessage}>{messageDelegation}</p>}
              </div>

              <div style={s.actions}>
                <a href={`tel:${agent.telephone}`} style={s.btnAppeler}>📞 Appeler</a>
                <a href={`mailto:${agent.email}`} style={s.btnEmail}>✉️ Email</a>
              </div>
            </div>

            {/* Zone de chat */}
            <div>
              <p style={s.chatTitre}>💬 Discussion avec votre agent</p>
              <Chat interlocuteur={agent} contexte="proprietaire" />
            </div>
          </div>
        )}

        {agent && (
          <div style={{ marginTop: '28px' }}>
            <p style={s.chatTitre}>🕓 Historique d'activité de votre agent</p>
            <p style={{ color: '#6b7280', fontSize: '12px', margin: '-6px 0 14px' }}>
              Toutes les actions effectuées par votre agent en votre nom, horodatées.
            </p>
            {chargementJournal ? (
              <p style={{ color: '#6b7280', fontSize: '13px' }}>Chargement...</p>
            ) : !journal || journal.length === 0 ? (
              <p style={{ color: '#6b7280', fontSize: '13px' }}>Aucune action enregistrée pour l'instant.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '380px', overflowY: 'auto' }}>
                {journal.map(j => (
                  <div key={j.id} style={s.journalLigne}>
                    <span style={s.journalIcone}>{ICONES_ACTION[j.type_action] || '🤝'}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, color: '#e2e8f0', fontSize: '13px' }}>{j.description}</p>
                      <p style={{ margin: '2px 0 0', color: '#6b7280', fontSize: '11px' }}>
                        {new Date(j.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const ICONES_ACTION = {
  creation_bien: '🏠',
  ajout_photos: '📷',
  ajout_locataire: '🧑',
  creation_contrat: '📝',
  approbation_demande: '✍️',
  refus_demande: '✕',
};

const s = {
  page: { minHeight: '100vh', background: 'linear-gradient(135deg,#0a0a0f 0%,#0d1117 100%)', fontFamily: "'Segoe UI',sans-serif", color: '#e2e8f0' },
  nav: { background: 'rgba(10,10,20,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(124,58,237,0.2)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px', position: 'sticky', top: 0, zIndex: 100 },
  navLogo: { color: '#e2e8f0', fontSize: '18px' },
  navBenin: { color: '#f59e0b' },
  navMenu: { display: 'flex', gap: '6px', alignItems: 'center' },
  navBtn: { background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af', cursor: 'pointer', padding: '7px 12px', borderRadius: '6px', fontSize: '13px' },
  navBtnActif: { background: 'rgba(124,58,237,0.2)', border: '1px solid #7c3aed', color: '#c4b5fd', cursor: 'pointer', padding: '7px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '600' },
  navBtnBasculer: { background: 'linear-gradient(135deg,#f59e0b,#d97706)', border: 'none', color: '#000', cursor: 'pointer', padding: '7px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '700' },
  navBtnProfil: { background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa', cursor: 'pointer', padding: '7px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '600' },
  navDeconnexion: { background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', cursor: 'pointer', padding: '7px 12px', borderRadius: '6px', fontSize: '13px' },
  contenu: { padding: '28px 24px', maxWidth: '1100px', margin: '0 auto' },
  titre: { margin: 0, fontSize: '26px', fontWeight: '800', background: 'linear-gradient(135deg,#c4b5fd,#f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  sousTitre: { color: '#6b7280', margin: '4px 0 20px', fontSize: '14px' },
  vide: { textAlign: 'center', color: '#9ca3af', padding: '60px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' },
  layout: { display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px', alignItems: 'start' },
  agentCard: { background: 'linear-gradient(135deg,rgba(124,58,237,0.1),rgba(91,33,182,0.05))', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '16px', padding: '24px', position: 'sticky', top: '84px' },
  agentEntete: { display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px', position: 'relative' },
  agentAvatar: { width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '22px', flexShrink: 0 },
  agentNom: { fontWeight: '800', color: '#e2e8f0', fontSize: '18px' },
  agentRole: { color: '#a78bfa', fontSize: '13px', marginTop: '2px' },
  agentBadgeActif: { background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', position: 'absolute', top: 0, right: 0, border: '1px solid rgba(16,185,129,0.3)' },
  agentInfos: { background: 'rgba(0,0,0,0.2)', borderRadius: '10px', padding: '16px', marginBottom: '16px' },
  infoTitre: { color: '#a78bfa', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 12px' },
  infoLigne: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  infoLabel: { color: '#6b7280', fontSize: '13px' },
  infoVal: { color: '#c4b5fd', fontSize: '13px', fontWeight: '600', textDecoration: 'none' },
  actions: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  btnAppeler: { background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', textAlign: 'center', textDecoration: 'none', display: 'block' },
  btnEmail: { background: 'rgba(124,58,237,0.2)', color: '#c4b5fd', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '8px', padding: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', textAlign: 'center', textDecoration: 'none', display: 'block' },
  chatTitre: { color: '#a78bfa', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 12px' },
  delegationBox: { background: 'rgba(0,0,0,0.2)', borderRadius: '10px', padding: '16px', marginBottom: '16px' },
  delegationTexte: { color: '#9ca3af', fontSize: '12px', lineHeight: '1.5', margin: 0 },
  delegationStatut: { fontSize: '12px', fontWeight: '700', margin: '10px 0 0' },
  delegationMessage: { color: '#c4b5fd', fontSize: '12px', margin: '8px 0 0', fontStyle: 'italic' },
  interrupteur: { width: '40px', height: '22px', borderRadius: '20px', border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background 0.2s' },
  interrupteurBille: { position: 'absolute', top: '2px', left: 0, width: '18px', height: '18px', borderRadius: '50%', background: '#fff', transition: 'transform 0.2s', display: 'block' },
  journalLigne: { display: 'flex', gap: '12px', alignItems: 'flex-start', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '10px 14px' },
  journalIcone: { fontSize: '16px', flexShrink: 0 },
};
