import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const LABELS_TYPE_RAPPEL = {
  avant_3j: { label: '⏳ Avant échéance (J-3)', couleur: '#06b6d4' },
  jour_j: { label: '📅 Jour J', couleur: '#f59e0b' },
  retard_3j: { label: '⚠️ Retard (J+3)', couleur: '#ef4444' },
  retard_7j: { label: '🚨 Retard (J+7)', couleur: '#b91c1c' },
};

export default function SuperAdminRappels() {
  const [rappels, setRappels] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [filtreType, setFiltreType] = useState('tous');
  const [recherche, setRecherche] = useState('');
  const { deconnecter } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { chargerRappels(); }, []);

  async function chargerRappels() {
    try {
      const r = await api.get('/superadmin/rappels-echeances');
      setRappels(r.data);
    } catch (e) {
      console.error(e);
    } finally {
      setChargement(false);
    }
  }

  function formaterMontant(n) {
    return parseInt(n || 0).toLocaleString('fr-FR') + ' FCFA';
  }
  function formaterDateHeure(d) {
    return new Date(d).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
  }
  function formaterDate(d) {
    return new Date(d).toLocaleDateString('fr-FR');
  }

  const rappelsFiltres = rappels.filter(r => {
    const matchType = filtreType === 'tous' || r.type_rappel === filtreType;
    const matchRecherche = !recherche ||
      r.locataire_nom?.toLowerCase().includes(recherche.toLowerCase()) ||
      r.proprietaire_nom?.toLowerCase().includes(recherche.toLowerCase()) ||
      r.adresse?.toLowerCase().includes(recherche.toLowerCase()) ||
      String(r.numero_bien).toLowerCase().includes(recherche.toLowerCase());
    return matchType && matchRecherche;
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
          <button style={{ ...s.navBtn, ...s.navBtnActif }}>Rappels</button>
          <button style={s.navBtn} onClick={() => navigate('/superadmin/erreurs')}>Erreurs</button>
          <button style={s.navDeconnexion} onClick={deconnecter}>Déconnexion</button>
        </div>
      </nav>

      <div style={s.contenu}>
        <div style={s.entete}>
          <div>
            <h2 style={s.titre}>Rappels d'échéances</h2>
            <p style={s.sousTitre}>Historique des relances automatiques envoyées aux locataires (et aux propriétaires en cas de retard).</p>
          </div>
          <span style={s.compteur}>{rappelsFiltres.length} rappel(s)</span>
        </div>

        <div style={s.filtres}>
          <input
            style={s.recherche}
            placeholder="🔍 Locataire, propriétaire, adresse, N° bien..."
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
          />
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              style={{ ...s.filtreBouton, background: filtreType === 'tous' ? '#7c3aed' : 'rgba(255,255,255,0.05)', color: filtreType === 'tous' ? '#fff' : '#9ca3af', border: filtreType === 'tous' ? '1px solid #7c3aed' : '1px solid rgba(255,255,255,0.1)' }}
              onClick={() => setFiltreType('tous')}
            >
              Tous
            </button>
            {Object.entries(LABELS_TYPE_RAPPEL).map(([valeur, info]) => (
              <button
                key={valeur}
                style={{ ...s.filtreBouton, background: filtreType === valeur ? '#7c3aed' : 'rgba(255,255,255,0.05)', color: filtreType === valeur ? '#fff' : '#9ca3af', border: filtreType === valeur ? '1px solid #7c3aed' : '1px solid rgba(255,255,255,0.1)' }}
                onClick={() => setFiltreType(valeur)}
              >
                {info.label}
              </button>
            ))}
          </div>
        </div>

        {chargement ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '40px' }}>Chargement...</p>
        ) : rappelsFiltres.length === 0 ? (
          <div style={s.vide}>Aucun rappel envoyé pour l'instant</div>
        ) : (
          <div style={s.tableau}>
            <div style={s.tableauEntete}>
              <span>Envoyé le</span>
              <span>Type</span>
              <span>Bien</span>
              <span>Locataire</span>
              <span>Propriétaire</span>
              <span>Montant / échéance</span>
            </div>
            {rappelsFiltres.map(r => {
              const info = LABELS_TYPE_RAPPEL[r.type_rappel] || { label: r.type_rappel, couleur: '#6b7280' };
              return (
                <div key={r.id} style={s.tableauLigne}>
                  <div style={{ color: '#9ca3af', fontSize: '13px' }}>{formaterDateHeure(r.envoye_le)}</div>
                  <div>
                    <span style={{ ...s.badgeType, color: info.couleur, background: `${info.couleur}22` }}>{info.label}</span>
                  </div>
                  <div>
                    <div style={s.cellPrincipal}>{r.adresse}</div>
                    <div style={s.cellSous}>{r.ville} · N° {r.numero_bien}</div>
                  </div>
                  <div style={{ fontSize: '13px' }}>{r.locataire_nom}</div>
                  <div style={{ fontSize: '13px' }}>{r.proprietaire_nom}</div>
                  <div>
                    <div style={s.cellPrincipal}>{formaterMontant(r.montant_du)}</div>
                    <div style={s.cellSous}>Échéance du {formaterDate(r.date_limite)}</div>
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
  sousTitre: { color: '#6b7280', margin: '6px 0 0', fontSize: '13px', maxWidth: '600px' },
  compteur: { background: 'rgba(124,58,237,0.2)', color: '#a78bfa', padding: '6px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: '600', border: '1px solid rgba(124,58,237,0.3)' },
  filtres: { display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' },
  recherche: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', padding: '10px 16px', borderRadius: '8px', fontSize: '14px', width: '320px', outline: 'none' },
  filtreBouton: { padding: '6px 16px', borderRadius: '20px', fontSize: '13px', cursor: 'pointer', fontWeight: '600' },
  vide: { textAlign: 'center', color: '#6b7280', padding: '60px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' },
  tableau: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden', overflowX: 'auto' },
  tableauEntete: { display: 'grid', gridTemplateColumns: '1.1fr 1.3fr 1.6fr 1.1fr 1.1fr 1.3fr', minWidth: '700px', padding: '14px 20px', background: 'rgba(124,58,237,0.1)', fontSize: '11px', fontWeight: '700', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.5px' },
  tableauLigne: { display: 'grid', gridTemplateColumns: '1.1fr 1.3fr 1.6fr 1.1fr 1.1fr 1.3fr', minWidth: '700px', padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '14px', alignItems: 'center' },
  cellPrincipal: { fontWeight: '600', color: '#e2e8f0', fontSize: '14px' },
  cellSous: { color: '#6b7280', fontSize: '12px', marginTop: '2px' },
  badgeType: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap' },
};
