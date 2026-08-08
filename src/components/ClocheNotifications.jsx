import { useEffect, useState, useRef } from 'react';
import api from '../services/api';

export default function ClocheNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [nonLues, setNonLues] = useState(0);
  const [ouvert, setOuvert] = useState(false);
  const [position, setPosition] = useState(null);
  const [chargement, setChargement] = useState(true);
  const ref = useRef(null);
  const boutonRef = useRef(null);

  useEffect(() => {
    chargerNotifications();
    const interval = setInterval(chargerNotifications, 30000); // refresh toutes les 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOuvert(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // La cloche peut se retrouver n'importe où après le retour à la ligne de la nav sur mobile :
  // le panneau est donc positionné en `fixed` d'après la position réelle du bouton à l'ouverture,
  // plutôt qu'ancré en absolu à son coin (qui déborderait de l'écran selon l'endroit où il tombe).
  function ouvrirPanneau() {
    if (!ouvert && boutonRef.current) {
      const rect = boutonRef.current.getBoundingClientRect();
      const largeur = Math.min(360, window.innerWidth - 32);
      // Aligne le panneau sur le bord droit du bouton, mais le ramène dans l'écran
      // (marge mini 16px de chaque côté) si le bouton est loin du bord droit — ce qui
      // arrive souvent sur mobile une fois que la nav est passée à la ligne.
      let right = window.innerWidth - rect.right;
      const left = window.innerWidth - right - largeur;
      if (left < 16) right = window.innerWidth - largeur - 16;
      right = Math.max(16, right);
      setPosition({ top: rect.bottom + 8, right, width: largeur });
    }
    const seOuvre = !ouvert;
    setOuvert(seOuvre);
    // Recharge à chaque ouverture : un éventuel échec silencieux du chargement initial ou du
    // polling ne doit jamais laisser le panneau bloqué sur "Aucune notification" indéfiniment.
    if (seOuvre) chargerNotifications();
  }

  async function chargerNotifications() {
    try {
      const r = await api.get('/notifications');
      setNotifications(r.data.notifications);
      setNonLues(r.data.non_lues);
    } catch (e) {
      console.error(e);
    } finally {
      setChargement(false);
    }
  }

  async function marquerLue(id) {
    await api.patch(`/notifications/${id}/lire`);
    chargerNotifications();
  }

  async function marquerToutesLues() {
    await api.patch('/notifications/lire-tout');
    chargerNotifications();
  }

  const COULEURS_TYPE = {
    demande: 'bg-accent-500',
    approbation: 'bg-brand-600',
    annulation: 'bg-red-600',
    paiement: 'bg-blue-600',
    info: 'bg-slate-400',
  };

  return (
    <div className="relative" ref={ref}>
      <button ref={boutonRef} className="relative rounded-lg px-2 py-1.5 text-lg text-slate-500 hover:bg-slate-100" onClick={ouvrirPanneau}>
        🔔
        {nonLues > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">{nonLues > 9 ? '9+' : nonLues}</span>
        )}
      </button>

      {ouvert && position && (
        <div
          className="fixed z-[1000] overflow-hidden rounded-2xl bg-white shadow-2xl"
          style={{ top: position.top, right: position.right, width: position.width }}
        >
          <div className="flex items-center justify-between border-b border-slate-100 p-4">
            <span className="text-[15px] font-bold text-slate-900">Notifications</span>
            {nonLues > 0 && (
              <button className="text-xs font-semibold text-accent-600 hover:text-accent-700" onClick={marquerToutesLues}>
                Tout marquer comme lu
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {chargement ? (
              <p className="p-6 text-center text-sm text-slate-400">Chargement…</p>
            ) : notifications.length === 0 ? (
              <p className="p-6 text-center text-sm text-slate-400">Aucune notification</p>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`flex cursor-pointer gap-3 border-b border-slate-50 px-4 py-3.5 hover:bg-slate-50 ${n.lue ? 'bg-white' : 'bg-brand-50/40'}`}
                  onClick={() => !n.lue && marquerLue(n.id)}
                >
                  <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${COULEURS_TYPE[n.type] || 'bg-slate-400'} ${n.lue ? 'opacity-30' : ''}`} />
                  <div className="flex-1">
                    <div className="mb-0.5 text-[13px] font-semibold text-slate-800">{n.titre}</div>
                    <div className="mb-1 text-xs leading-relaxed text-slate-500">{n.message}</div>
                    <div className="text-[11px] text-slate-400">
                      {new Date(n.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
