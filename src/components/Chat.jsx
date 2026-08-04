import { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Chat({ interlocuteur, onFermer, contexte = 'proprietaire' }) {
  const [messages, setMessages] = useState([]);
  const [contenu, setContenu] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const { utilisateur } = useAuth();
  const bottomRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!interlocuteur?.id) return;
    chargerMessages();
    // Polling toutes les 5s pour les nouveaux messages
    intervalRef.current = setInterval(chargerMessages, 5000);
    return () => clearInterval(intervalRef.current);
  }, [interlocuteur?.id, contexte]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function chargerMessages() {
    try {
      const r = await api.get(`/messages/${interlocuteur.id}`, { params: { contexte } });
      setMessages(r.data);
    } catch (e) {
      console.error(e);
    }
  }

  async function envoyer() {
    if (!contenu.trim()) return;
    setEnvoi(true);
    try {
      await api.post('/messages', {
        destinataire_id: interlocuteur.id,
        contenu: contenu.trim(),
        contexte,
      });
      setContenu('');
      chargerMessages();
    } catch (e) {
      console.error(e);
    } finally {
      setEnvoi(false);
    }
  }

  function formaterHeure(d) {
    return new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
  function formaterJour(d) {
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  }

  let dernierJour = null;

  return (
    <div style={s.conteneur}>
      {/* En-tête */}
      <div style={s.entete}>
        <div style={s.avatar}>{interlocuteur.nom?.charAt(0).toUpperCase()}</div>
        <div>
          <div style={s.interlocuteurNom}>{interlocuteur.nom}</div>
          <div style={s.interlocuteurRole}>{interlocuteur.role?.includes('agent') ? 'Agent RentEasy' : 'Propriétaire'}</div>
        </div>
        {onFermer && (
          <button style={s.btnFermer} onClick={onFermer}>✕</button>
        )}
      </div>

      {/* Messages */}
      <div style={s.messages}>
        {messages.length === 0 && (
          <div style={s.vide}>
            <p>💬</p>
            <p>Aucun message. Démarrez la conversation !</p>
          </div>
        )}
        {messages.map(m => {
          const estMoi = m.expediteur_id === utilisateur?.id;
          const jour = formaterJour(m.created_at);
          const afficherJour = jour !== dernierJour;
          dernierJour = jour;

          return (
            <div key={m.id}>
              {afficherJour && (
                <div style={s.separateurJour}>{jour}</div>
              )}
              <div style={{ ...s.messageWrapper, justifyContent: estMoi ? 'flex-end' : 'flex-start' }}>
                {!estMoi && (
                  <div style={s.avatarPetit}>{m.expediteur_nom?.charAt(0)}</div>
                )}
                <div style={{ ...s.bulle, background: estMoi ? 'linear-gradient(135deg,#7c3aed,#5b21b6)' : 'rgba(255,255,255,0.07)', borderRadius: estMoi ? '16px 16px 4px 16px' : '16px 16px 16px 4px', alignSelf: estMoi ? 'flex-end' : 'flex-start' }}>
                  <div style={s.bulleTexte}>{m.contenu}</div>
                  <div style={s.bulleHeure}>{formaterHeure(m.created_at)}</div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Saisie */}
      <div style={s.saisie}>
        <input
          style={s.champMessage}
          placeholder="Écrire un message..."
          value={contenu}
          onChange={e => setContenu(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && envoyer()}
        />
        <button style={s.btnEnvoyer} onClick={envoyer} disabled={envoi || !contenu.trim()}>
          {envoi ? '...' : '➤'}
        </button>
      </div>
    </div>
  );
}

const s = {
  conteneur: { display: 'flex', flexDirection: 'column', height: '500px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '16px', overflow: 'hidden' },
  entete: { display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', background: 'rgba(124,58,237,0.1)', borderBottom: '1px solid rgba(124,58,237,0.2)', position: 'relative' },
  avatar: { width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '16px', flexShrink: 0 },
  interlocuteurNom: { fontWeight: '700', color: '#e2e8f0', fontSize: '15px' },
  interlocuteurRole: { color: '#a78bfa', fontSize: '12px' },
  btnFermer: { background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '18px', marginLeft: 'auto', padding: '4px 8px' },
  messages: { flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' },
  vide: { textAlign: 'center', color: '#6b7280', padding: '40px 20px', margin: 'auto' },
  separateurJour: { textAlign: 'center', color: '#6b7280', fontSize: '12px', margin: '8px 0', background: 'rgba(255,255,255,0.04)', padding: '4px 12px', borderRadius: '20px', width: 'fit-content', alignSelf: 'center', marginLeft: 'auto', marginRight: 'auto' },
  messageWrapper: { display: 'flex', alignItems: 'flex-end', gap: '8px' },
  avatarPetit: { width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(245,158,11,0.3)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '12px', flexShrink: 0 },
  bulle: { maxWidth: '70%', padding: '10px 14px', border: '1px solid rgba(255,255,255,0.08)' },
  bulleTexte: { color: '#e2e8f0', fontSize: '14px', lineHeight: '1.5', wordBreak: 'break-word' },
  bulleHeure: { color: 'rgba(255,255,255,0.4)', fontSize: '10px', marginTop: '4px', textAlign: 'right' },
  saisie: { display: 'flex', gap: '10px', padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)' },
  champMessage: { flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', padding: '10px 14px', borderRadius: '24px', fontSize: '14px', outline: 'none' },
  btnEnvoyer: { background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: '#fff', border: 'none', borderRadius: '50%', width: '42px', height: '42px', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
};
