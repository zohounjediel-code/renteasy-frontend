import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function SuperAdminBiens() {
  const [biens, setBiens] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [filtre, setFiltre] = useState('tous');
  const { deconnecter } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { chargerBiens(); }, []);

  async function chargerBiens() {
    try {
      const r = await api.get('/superadmin/biens');
      setBiens(r.data);
    } catch (e) {
      console.error(e);
    } finally {
      setChargement(false);
    }
  }

  function formaterMontant(n) {
    return parseInt(n || 0).toLocaleString('fr-FR') + ' FCFA';
  }

  const STATUT = {
    libre: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', label: '● Libre' },
    occupe: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', label: '● Occupé' },
  };

  const biensFiltres = biens.filter(b => {
    const matchFiltre = filtre === 'tous' || b.statut === filtre;
    const matchRecherche = !recherche ||
      b.proprietaire_nom?.toLowerCase().includes(recherche.toLowerCase()) ||
      b.adresse?.toLowerCase().includes(recherche.toLowerCase()) ||
      String(b.numero_bien).toLowerCase().includes(recherche.toLowerCase());
    return matchFiltre && matchRecherche;
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
          <button style={{ ...s.navBtn, ...s.navBtnActif }}>Biens</button>
          <button style={s.navBtn} onClick={() => navigate('/superadmin/locataires')}>Locataires</button>
          <button style={s.navBtn} onClick={() => navigate('/superadmin/journal')}>Journal</button>
          <button style={s.navBtn} onClick={() => navigate('/superadmin/parametres')}>Paramètres</button>
          <button style={s.navBtn} onClick={() => navigate('/superadmin/moderation')}>Modération</button>
          <button style={s.navBtn} onClick={() => navigate('/superadmin/rapport-financier')}>Rapport financier</button>
          <button style={s.navBtn} onClick={() => navigate('/superadmin/rappels')}>Rappels</button>
          <button style={s.navBtn} onClick={() => navigate('/superadmin/erreurs')}>Erreurs</button>
          <button style={s.navDeconnexion} onClick={deconnecter}>Déconnexion</button>
        </div>
      </nav>

      <div style={s.contenu}>
        <div style={s.entete}>
          <h2 style={s.titre}>Tous les biens</h2>
          <span style={s.compteur}>{biensFiltres.length} bien(s)</span>
        </div>

        <div style={s.filtres}>
          <input
            style={s.recherche}
            placeholder="🔍 Propriétaire, adresse, numéro de bien..."
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            {['tous', 'libre', 'occupe'].map(f => (
              <button
                key={f}
                style={{ ...s.filtreBouton, background: filtre === f ? '#7c3aed' : 'rgba(255,255,255,0.05)', color: filtre === f ? '#fff' : '#9ca3af', border: filtre === f ? '1px solid #7c3aed' : '1px solid rgba(255,255,255,0.1)' }}
                onClick={() => setFiltre(f)}
              >
                {f === 'tous' ? 'Tous' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {chargement ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '40px' }}>Chargement...</p>
        ) : biensFiltres.length === 0 ? (
          <div style={s.vide}>Aucun bien trouvé</div>
        ) : (
          <div style={s.tableau}>
            <div style={s.tableauEntete}>
              <span>Bien</span>
              <span>Propriétaire</span>
              <span>Agent</span>
              <span>Type</span>
              <span>Loyer</span>
              <span>Statut</span>
            </div>
            {biensFiltres.map(b => {
              const st = STATUT[b.statut] || { bg: 'rgba(107,114,128,0.1)', color: '#6b7280', label: b.statut };
              return (
                <div key={b.id} style={s.tableauLigne}>
                  <div>
                    <div style={s.cellPrincipal}>{b.adresse || b.lieu_depot}</div>
                    <div style={s.cellSous}>{b.ville} · N° {b.numero_bien}</div>
                  </div>
                  <div>
                    <div style={s.cellPrincipal}>{b.proprietaire_nom}</div>
                    <div style={s.cellSous}>{b.proprietaire_telephone}</div>
                  </div>
                  <div style={{ color: '#9ca3af', fontSize: '13px' }}>{b.agent_nom || '—'}</div>
                  <div style={{ color: '#9ca3af', fontSize: '13px', textTransform: 'capitalize' }}>{b.type_bien}</div>
                  <div style={{ color: '#f59e0b', fontWeight: '700' }}>{formaterMontant(b.loyer_mensuel)}</div>
                  <div>
                    <span style={{ ...st, padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                      {st.label}
                    </span>
                  </div>
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
  nav: { background: 'rgba(10,10,20,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(124,58,237,0.3)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' },
  navLogo: { display: 'flex', alignItems: 'center', gap: '10px', color: '#e2e8f0', fontSize: '18px', fontWeight: '700', cursor: 'pointer' },
  navBenin: { color: '#f59e0b' },
  superBadge: { background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: '#fff', fontSize: '10px', padding: '3px 10px', borderRadius: '20px', fontWeight: '800', letterSpacing: '1px' },
  navMenu: { display: 'flex', gap: '8px', alignItems: 'center' },
  navBtn: { background: 'transparent', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa', cursor: 'pointer', padding: '7px 14px', borderRadius: '6px', fontSize: '13px' },
  navBtnActif: { background: 'rgba(124,58,237,0.2)', border: '1px solid #7c3aed', color: '#c4b5fd' },
  navDeconnexion: { background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', cursor: 'pointer', padding: '7px 14px', borderRadius: '6px', fontSize: '13px' },
  contenu: { padding: '32px 24px', maxWidth: '1300px', margin: '0 auto' },
  entete: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  titre: { margin: 0, fontSize: '24px', fontWeight: '800', background: 'linear-gradient(135deg,#c4b5fd,#f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  compteur: { background: 'rgba(124,58,237,0.2)', color: '#a78bfa', padding: '6px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: '600', border: '1px solid rgba(124,58,237,0.3)' },
  filtres: { display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' },
  recherche: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', padding: '10px 16px', borderRadius: '8px', fontSize: '14px', width: '320px', outline: 'none' },
  filtreBouton: { padding: '6px 16px', borderRadius: '20px', fontSize: '13px', cursor: 'pointer', fontWeight: '600' },
  vide: { textAlign: 'center', color: '#6b7280', padding: '60px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' },
  tableau: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden', overflowX: 'auto' },
  tableauEntete: { display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1.2fr 1fr', minWidth: '680px', padding: '14px 20px', background: 'rgba(124,58,237,0.1)', fontSize: '11px', fontWeight: '700', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.5px' },
  tableauLigne: { display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1.2fr 1fr', minWidth: '680px', padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '14px', alignItems: 'center' },
  cellPrincipal: { fontWeight: '600', color: '#e2e8f0', fontSize: '14px' },
  cellSous: { color: '#6b7280', fontSize: '12px', marginTop: '2px' },
};
