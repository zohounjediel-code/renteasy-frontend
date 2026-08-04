import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ClocheNotifications from '../components/ClocheNotifications';
import Chat from '../components/Chat';

export default function AgentProprietaires() {
  const [proprietaires, setProprietaires] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [interlocuteur, setInterlocuteur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreCategorie, setFiltreCategorie] = useState('tous');
  const { deconnecter } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { chargerProprietaires(); }, []);

  async function chargerProprietaires() {
    try {
      const r = await api.get('/agent/mes-proprietaires');
      setProprietaires(r.data);
    } catch (e) {
      console.error(e);
    } finally {
      setChargement(false);
    }
  }

  function ouvrirChat(p) {
    if (interlocuteur?.id === p.id) {
      setInterlocuteur(null);
      return;
    }
    setInterlocuteur(p);
    // La conversation étant marquée comme lue côté serveur dès son ouverture, on efface
    // immédiatement le badge localement sans attendre un rechargement de la liste.
    setProprietaires(proprietaires.map(pr => pr.id === p.id ? { ...pr, nb_messages_non_lus: 0 } : pr));
  }

  const CATEGORIES = [
    { id: 'tous', label: 'Tous' },
    { id: 'impayes', label: '⚠️ Avec impayés' },
    { id: 'messages', label: '💬 Messages non lus' },
    { id: 'delegation', label: '🤝 Délégation active' },
  ];

  const proprietairesFiltres = proprietaires.filter(p => {
    const texte = recherche.trim().toLowerCase();
    const matchRecherche = !texte
      || p.nom.toLowerCase().includes(texte)
      || (p.telephone || '').toLowerCase().includes(texte)
      || (p.email || '').toLowerCase().includes(texte)
      || (p.ville || '').toLowerCase().includes(texte);

    const matchCategorie =
      filtreCategorie === 'tous' ? true :
      filtreCategorie === 'impayes' ? p.nb_impayes > 0 :
      filtreCategorie === 'messages' ? p.nb_messages_non_lus > 0 :
      filtreCategorie === 'delegation' ? p.autorise_agent_gestion : true;

    return matchRecherche && matchCategorie;
  });

  return (
    <div style={s.page}>
      <nav style={s.nav} className="re-nav">
        <div style={s.navLogo}>
          ⚡ <strong>RentEasy</strong> <span style={s.navBenin}>Bénin</span>
          <span style={s.agentBadge}>Agent</span>
        </div>
        <div style={s.navMenu}>
          <button style={s.navBtn} onClick={() => navigate('/agent/dashboard')}>Tableau de bord</button>
          <button style={s.navBtn} onClick={() => navigate('/agent/demandes')}>Demandes</button>
          <button style={s.navBtn} onClick={() => navigate('/agent/recouvrements')}>Recouvrements</button>
          <button style={{ ...s.navBtn, ...s.navBtnActif }}>Mes propriétaires</button>
          <button style={s.navBtnProfil} onClick={() => navigate('/profil')}>👤 Mon profil</button>
          <ClocheNotifications />
          <button style={s.navDeconnexion} onClick={deconnecter}>Déconnexion</button>
        </div>
      </nav>

      <div style={s.contenu}>
        <div style={s.layout}>
          {/* Liste propriétaires */}
          <div style={s.colListe}>
            <h2 style={s.titre}>Mes propriétaires</h2>
            <p style={s.sousTitre}>{proprietaires.length} propriétaire(s) assigné(s)</p>

            <input
              style={s.recherche}
              type="text"
              placeholder="🔍 Rechercher par nom, téléphone, email, ville..."
              value={recherche}
              onChange={e => setRecherche(e.target.value)}
            />

            <div style={s.filtres}>
              {CATEGORIES.map(c => (
                <button
                  key={c.id}
                  style={{ ...s.filtreBouton, ...(filtreCategorie === c.id ? s.filtreBoutonActif : {}) }}
                  onClick={() => setFiltreCategorie(c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {chargement ? (
              <p style={{ color: '#6b7280', padding: '20px' }}>Chargement...</p>
            ) : proprietaires.length === 0 ? (
              <div style={s.vide}>
                <p>👤</p>
                <p>Aucun propriétaire assigné pour l'instant.</p>
              </div>
            ) : proprietairesFiltres.length === 0 ? (
              <div style={s.vide}>
                <p>🔍</p>
                <p>Aucun propriétaire ne correspond à cette recherche/filtre.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                {proprietairesFiltres.map(p => (
                  <div
                    key={p.id}
                    style={{ ...s.propCard, border: interlocuteur?.id === p.id ? '1px solid #7c3aed' : '1px solid rgba(255,255,255,0.08)', background: interlocuteur?.id === p.id ? 'rgba(124,58,237,0.1)' : 'rgba(255,255,255,0.02)' }}
                  >
                    <div style={s.propEntete}>
                      <div style={{ position: 'relative' }}>
                        <div style={s.propAvatar}>{p.nom.charAt(0).toUpperCase()}</div>
                        {p.nb_impayes > 0 && (
                          <span style={s.badgeImpayes} title={`${p.nb_impayes} échéance(s) impayée(s) ou partiellement payée(s)`}>
                            {p.nb_impayes}
                          </span>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={s.propNom}>{p.nom}</div>
                        <div style={s.propDetail}>{p.telephone}</div>
                        <div style={s.propDetail}>{p.email}</div>
                      </div>
                    </div>
                    <div style={s.propStats}>
                      <span style={s.statBadge}>🏘️ {p.nb_biens} bien(s)</span>
                      <span style={s.statBadge}>📋 {p.nb_contrats} contrat(s)</span>
                      {p.ville && <span style={s.statBadge}>📍 {p.ville}</span>}
                      {p.nb_impayes > 0 && (
                        <span style={s.statBadgeAlerte}>⚠️ {p.nb_impayes} impayé(s)</span>
                      )}
                    </div>
                    <button
                      style={{ ...s.btnMessage, background: interlocuteur?.id === p.id ? 'linear-gradient(135deg,#5b21b6,#4c1d95)' : 'linear-gradient(135deg,#7c3aed,#5b21b6)', position: 'relative' }}
                      onClick={() => ouvrirChat(p)}
                    >
                      {interlocuteur?.id === p.id ? '✕ Fermer le chat' : '💬 Message'}
                      {p.nb_messages_non_lus > 0 && (
                        <span style={s.badgeMessage}>{p.nb_messages_non_lus}</span>
                      )}
                    </button>
                    <button style={s.btnVoirCompte} onClick={() => navigate(`/agent/proprietaires/${p.id}`)}>
                      🔍 Voir le compte
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Zone de chat */}
          <div style={s.colChat}>
            {interlocuteur ? (
              <Chat
                interlocuteur={interlocuteur}
                onFermer={() => setInterlocuteur(null)}
                contexte="proprietaire"
              />
            ) : (
              <div style={s.chatVide}>
                <p style={{ fontSize: '48px', margin: '0 0 16px' }}>💬</p>
                <p style={{ color: '#6b7280', fontSize: '15px' }}>Sélectionnez un propriétaire pour démarrer une conversation</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: 'linear-gradient(135deg,#0a0a0f 0%,#0d1117 100%)', fontFamily: "'Segoe UI',sans-serif", color: '#e2e8f0' },
  nav: { background: 'rgba(10,10,20,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(124,58,237,0.2)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px', position: 'sticky', top: 0, zIndex: 100 },
  navLogo: { color: '#e2e8f0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' },
  navBenin: { color: '#f59e0b' },
  agentBadge: { background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#000', fontSize: '11px', padding: '3px 10px', borderRadius: '20px', fontWeight: '800' },
  navMenu: { display: 'flex', gap: '8px', alignItems: 'center' },
  navBtn: { background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af', cursor: 'pointer', padding: '7px 12px', borderRadius: '6px', fontSize: '13px' },
  navBtnActif: { background: 'rgba(124,58,237,0.2)', border: '1px solid #7c3aed', color: '#c4b5fd', fontWeight: '600' },
  navBtnProfil: { background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa', cursor: 'pointer', padding: '7px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '600' },
  navDeconnexion: { background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', cursor: 'pointer', padding: '7px 12px', borderRadius: '6px', fontSize: '13px' },
  contenu: { padding: '28px 24px', maxWidth: '1300px', margin: '0 auto' },
  layout: { display: 'grid', gridTemplateColumns: '380px 1fr', gap: '24px', alignItems: 'start' },
  colListe: { display: 'flex', flexDirection: 'column' },
  colChat: { position: 'sticky', top: '84px' },
  titre: { margin: 0, fontSize: '22px', fontWeight: '800', background: 'linear-gradient(135deg,#c4b5fd,#f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  sousTitre: { color: '#6b7280', margin: '4px 0 0', fontSize: '13px' },
  vide: { textAlign: 'center', color: '#6b7280', padding: '40px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', marginTop: '16px' },
  recherche: { width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#e2e8f0', fontSize: '14px', outline: 'none', marginTop: '16px' },
  filtres: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' },
  filtreBouton: { background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '6px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
  filtreBoutonActif: { background: 'rgba(124,58,237,0.2)', color: '#c4b5fd', border: '1px solid #7c3aed' },
  propCard: { borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', transition: 'all 0.2s' },
  propEntete: { display: 'flex', alignItems: 'center', gap: '12px' },
  propAvatar: { width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '18px', flexShrink: 0 },
  propNom: { fontWeight: '700', color: '#e2e8f0', fontSize: '15px' },
  propDetail: { color: '#9ca3af', fontSize: '12px', marginTop: '2px' },
  propStats: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  statBadge: { background: 'rgba(255,255,255,0.05)', color: '#9ca3af', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', border: '1px solid rgba(255,255,255,0.08)' },
  statBadgeAlerte: { background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', border: '1px solid rgba(239,68,68,0.35)', fontWeight: '700' },
  badgeImpayes: { position: 'absolute', top: '-4px', right: '-4px', background: '#ef4444', color: '#fff', fontSize: '11px', fontWeight: '800', borderRadius: '999px', minWidth: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', border: '2px solid #0d1117', lineHeight: 1 },
  badgeMessage: { position: 'absolute', top: '-7px', right: '-7px', background: '#ef4444', color: '#fff', fontSize: '11px', fontWeight: '800', borderRadius: '999px', minWidth: '19px', height: '19px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px', border: '2px solid #0a0a0f', lineHeight: 1 },
  btnMessage: { color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', width: '100%' },
  btnVoirCompte: { background: 'transparent', color: '#c4b5fd', border: '1px solid rgba(124,58,237,0.4)', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', width: '100%' },
  chatVide: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', height: '500px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px' },
};
