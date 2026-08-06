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
    <div className="flex h-[500px] flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card">
      {/* En-tête */}
      <div className="relative flex items-center gap-3 border-b border-slate-100 bg-brand-50 px-5 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-base font-bold text-white">{interlocuteur.nom?.charAt(0).toUpperCase()}</div>
        <div>
          <div className="text-[15px] font-bold text-slate-900">{interlocuteur.nom}</div>
          <div className="text-xs text-brand-600">{interlocuteur.role?.includes('agent') ? 'Agent RentEasy' : 'Propriétaire'}</div>
        </div>
        {onFermer && (
          <button className="ml-auto px-2 py-1 text-lg text-slate-400 hover:text-slate-600" onClick={onFermer}>✕</button>
        )}
      </div>

      {/* Messages */}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="m-auto text-center text-slate-400">
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
                <div className="mx-auto my-2 w-fit rounded-full bg-slate-100 px-3 py-1 text-center text-xs text-slate-400">{jour}</div>
              )}
              <div className={`flex items-end gap-2 ${estMoi ? 'justify-end' : 'justify-start'}`}>
                {!estMoi && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-100 text-xs font-bold text-accent-700">{m.expediteur_nom?.charAt(0)}</div>
                )}
                <div className={`max-w-[70%] px-3.5 py-2.5 ${estMoi ? 'self-end rounded-[16px_16px_4px_16px] bg-brand-600 text-white' : 'self-start rounded-[16px_16px_16px_4px] border border-slate-100 bg-slate-50 text-slate-800'}`}>
                  <div className="break-words text-sm leading-relaxed">{m.contenu}</div>
                  <div className={`mt-1 text-right text-[10px] ${estMoi ? 'text-white/70' : 'text-slate-400'}`}>{formaterHeure(m.created_at)}</div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Saisie */}
      <div className="flex gap-2.5 border-t border-slate-100 bg-slate-50 px-4 py-3.5">
        <input
          className="flex-1 rounded-full border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
          placeholder="Écrire un message..."
          value={contenu}
          onChange={e => setContenu(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && envoyer()}
        />
        <button className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-brand-600 text-lg text-white hover:bg-brand-700 disabled:opacity-60" onClick={envoyer} disabled={envoi || !contenu.trim()}>
          {envoi ? '...' : '➤'}
        </button>
      </div>
    </div>
  );
}
