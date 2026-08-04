import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function SuperAdminErreurs() {
  const [erreurs, setErreurs] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [erreurDepliee, setErreurDepliee] = useState(null);
  const { deconnecter } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { chargerErreurs(); }, []);

  async function chargerErreurs() {
    try {
      const r = await api.get('/superadmin/erreurs');
      setErreurs(r.data);
    } catch (e) {
      console.error(e);
    } finally {
      setChargement(false);
    }
  }

  function formaterDateHeure(d) {
    return new Date(d).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'medium' });
  }

  const erreursFiltrees = erreurs.filter(e => {
    if (!recherche) return true;
    const r = recherche.toLowerCase();
    return e.message?.toLowerCase().includes(r) || e.route?.toLowerCase().includes(r);
  });

  return (
    <div style={s.page}>
      <nav style={s.nav} className="re-nav">
        <div style={s.navLogo} onClick={() => navigate('/superadmin/dashboard')}>
          ⚡ RentEasy <span style={s.navBenin}>Bénin</span>
          <span style={s.superBadge}>SUPER ADMIN</span>
        </div>
        <div style={s.navMenu}>
          <button style={s.navBtn} onClick={() => navigate('/superadmin/dashboard')}>Dashboard</button>
          <button style={s.navBtn} onClick={() => navigate('/superadmin/utilisateurs')}>Utilisateurs</button>
          <button style={s.navBtn} onClick={() => navigate('/superadmin/contrats')}>Contrats</button>
          <button style={s.navBtn} onClick={() => navigate('/superadmin/biens')}>Biens</button>
          <button style={s.navBtn} onClick={() => navigate('/superadmin/locataires')}>Locataires</button>
          <button style={s.navBtn} onClick={() => navigate('/superadmin/journal')}>Journal</button>
          <button style={s.navBtn} onClick={() => navigate('/superadmin/parametres')}>Paramètres</button>
          <button style={s.navBtn} onClick={() => navigate('/superadmin/moderation')}>Modération</button>
          <button style={s.navBtn} onClick={() => navigate('/superadmin/rapport-financier')}>Rapport financier</button>
          <button style={s.navBtn} onClick={() => navigate('/superadmin/rappels')}>Rappels</button>
          <button style={{ ...s.navBtn, ...s.navBtnActif }}>Erreurs</button>
          <button style={s.navDeconnexion} onClick={deconnecter}>Déconnexion</button>
        </div>
      </nav>

      <div style={s.contenu}>
        <div style={s.entete}>
          <div>
            <h2 style={s.titre}>Erreurs serveur</h2>
            <p style={s.sousTitre}>
              Historique des erreurs 500, exceptions non attrapées et rejets de promesse non gérés — chaque nouvelle erreur déclenche aussi une alerte email (au maximum une toutes les 30 minutes par erreur identique).
            </p>
          </div>
          <span style={s.compteur}>{erreursFiltrees.length} erreur(s)</span>
        </div>

        <div style={s.filtres}>
          <input
            style={s.recherche}
            placeholder="🔍 Message, route..."
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
          />
          <button style={s.btnActualiser} onClick={chargerErreurs}>↻ Actualiser</button>
        </div>

        {chargement ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '40px' }}>Chargement...</p>
        ) : erreursFiltrees.length === 0 ? (
          <div style={s.vide}>Aucune erreur enregistrée 🎉</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {erreursFiltrees.map(err => {
              const depliee = erreurDepliee === err.id;
              return (
                <div key={err.id} style={s.carteErreur}>
                  <div style={s.carteEnTete} onClick={() => setErreurDepliee(depliee ? null : err.id)}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {err.statut_http && <span style={s.badgeStatut}>{err.statut_http}</span>}
                        {err.methode && <span style={s.badgeMethode}>{err.methode}</span>}
                        {err.route && <span style={s.route}>{err.route}</span>}
                      </div>
                      <div style={s.message}>{err.message}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                      <span style={s.date}>{formaterDateHeure(err.created_at)}</span>
                      <span style={{ color: '#7c3aed', fontSize: '12px' }}>{depliee ? '▲' : '▼'}</span>
                    </div>
                  </div>
                  {depliee && err.stack && (
                    <pre style={s.stack}>{err.stack}</pre>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: 'linear-gradient(135deg,#0a0a0f 0%,#0f0a1e 50%,#0a0f0a 100%)', fontFamily: "'Segoe UI',sans-serif", color: '#e2e8f0' },
  nav: { background: 'rgba(10,10,20,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(124,58,237,0.3)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px', flexWrap: 'wrap' },
  navLogo: { display: 'flex', alignItems: 'center', gap: '10px', color: '#e2e8f0', fontSize: '18px', fontWeight: '700', cursor: 'pointer' },
  navBenin: { color: '#f59e0b' },
  superBadge: { background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: '#fff', fontSize: '10px', padding: '3px 10px', borderRadius: '20px', fontWeight: '800', letterSpacing: '1px' },
  navMenu: { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' },
  navBtn: { background: 'transparent', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa', cursor: 'pointer', padding: '7px 14px', borderRadius: '6px', fontSize: '13px' },
  navBtnActif: { background: 'rgba(124,58,237,0.2)', border: '1px solid #7c3aed', color: '#c4b5fd' },
  navDeconnexion: { background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', cursor: 'pointer', padding: '7px 14px', borderRadius: '6px', fontSize: '13px' },
  contenu: { padding: '32px 24px', maxWidth: '1300px', margin: '0 auto' },
  entete: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' },
  titre: { margin: 0, fontSize: '24px', fontWeight: '800', background: 'linear-gradient(135deg,#c4b5fd,#f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  sousTitre: { color: '#6b7280', margin: '6px 0 0', fontSize: '13px', maxWidth: '640px' },
  compteur: { background: 'rgba(124,58,237,0.2)', color: '#a78bfa', padding: '6px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: '600', border: '1px solid rgba(124,58,237,0.3)' },
  filtres: { display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' },
  recherche: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', padding: '10px 16px', borderRadius: '8px', fontSize: '14px', width: '320px', outline: 'none' },
  btnActualiser: { background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  vide: { textAlign: 'center', color: '#6b7280', padding: '60px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' },
  carteErreur: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', overflow: 'hidden' },
  carteEnTete: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', padding: '14px 18px', cursor: 'pointer' },
  badgeStatut: { background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '800' },
  badgeMethode: { background: 'rgba(124,58,237,0.15)', color: '#a78bfa', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' },
  route: { color: '#6b7280', fontSize: '12px', fontFamily: 'monospace' },
  message: { color: '#e2e8f0', fontSize: '14px', marginTop: '6px', wordBreak: 'break-word' },
  date: { color: '#6b7280', fontSize: '12px', whiteSpace: 'nowrap' },
  stack: { background: '#050508', color: '#f87171', padding: '14px 18px', margin: 0, fontSize: '12px', overflowX: 'auto', borderTop: '1px solid rgba(239,68,68,0.2)', fontFamily: 'monospace', lineHeight: '1.5' },
};
