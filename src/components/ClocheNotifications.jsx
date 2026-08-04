import { useEffect, useState, useRef } from 'react';
import api from '../services/api';

export default function ClocheNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [nonLues, setNonLues] = useState(0);
  const [ouvert, setOuvert] = useState(false);
  const ref = useRef(null);

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

  async function chargerNotifications() {
    try {
      const r = await api.get('/notifications');
      setNotifications(r.data.notifications);
      setNonLues(r.data.non_lues);
    } catch (e) {
      console.error(e);
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
    demande: '#e8a020',
    approbation: '#2e7d32',
    annulation: '#c62828',
    paiement: '#1565c0',
    info: '#555',
  };

  return (
    <div style={styles.conteneur} ref={ref}>
      <button style={styles.bouton} onClick={() => setOuvert(!ouvert)}>
        🔔
        {nonLues > 0 && (
          <span style={styles.badge}>{nonLues > 9 ? '9+' : nonLues}</span>
        )}
      </button>

      {ouvert && (
        <div style={styles.dropdown}>
          <div style={styles.dropdownEntete}>
            <span style={styles.dropdownTitre}>Notifications</span>
            {nonLues > 0 && (
              <button style={styles.toutLire} onClick={marquerToutesLues}>
                Tout marquer comme lu
              </button>
            )}
          </div>

          <div style={styles.liste}>
            {notifications.length === 0 ? (
              <p style={styles.vide}>Aucune notification</p>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  style={{ ...styles.item, background: n.lue ? '#fff' : '#f8f9ff' }}
                  onClick={() => !n.lue && marquerLue(n.id)}
                >
                  <div style={{ ...styles.point, background: COULEURS_TYPE[n.type] || '#555', opacity: n.lue ? 0.3 : 1 }} />
                  <div style={styles.itemContenu}>
                    <div style={styles.itemTitre}>{n.titre}</div>
                    <div style={styles.itemMessage}>{n.message}</div>
                    <div style={styles.itemDate}>
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

const styles = {
  conteneur: { position: 'relative' },
  bouton: { background: 'transparent', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer', position: 'relative', padding: '4px 8px' },
  badge: { position: 'absolute', top: '-2px', right: '-2px', background: '#c62828', color: '#fff', borderRadius: '50%', fontSize: '10px', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' },
  dropdown: { position: 'absolute', right: 0, top: '40px', width: '360px', background: '#fff', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.15)', zIndex: 1000, overflow: 'hidden' },
  dropdownEntete: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid #f0f0f0' },
  dropdownTitre: { fontWeight: '700', color: '#1a3a5c', fontSize: '15px' },
  toutLire: { background: 'none', border: 'none', color: '#e8a020', fontSize: '12px', cursor: 'pointer', fontWeight: '600' },
  liste: { maxHeight: '400px', overflowY: 'auto' },
  vide: { textAlign: 'center', color: '#888', padding: '24px', fontSize: '14px' },
  item: { display: 'flex', gap: '12px', padding: '14px 16px', borderBottom: '1px solid #f5f5f5', cursor: 'pointer', transition: 'background 0.1s' },
  point: { width: '8px', height: '8px', borderRadius: '50%', marginTop: '5px', flexShrink: 0 },
  itemContenu: { flex: 1 },
  itemTitre: { fontWeight: '600', fontSize: '13px', color: '#222', marginBottom: '2px' },
  itemMessage: { fontSize: '12px', color: '#666', lineHeight: '1.4', marginBottom: '4px' },
  itemDate: { fontSize: '11px', color: '#aaa' },
};
