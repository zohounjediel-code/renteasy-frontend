import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// Description des champs attendus par opérateur — "secret: true" affiche le champ masqué
// (comme un mot de passe) et ne l'envoie au serveur que s'il a été réellement modifié.
const CHAMPS_OPERATEUR = {
  mtn: [
    { cle: 'base_url', label: 'URL de base', secret: false, placeholder: 'https://sandbox.momodeveloper.mtn.com' },
    { cle: 'target_env', label: 'Environnement cible', secret: false, placeholder: 'sandbox ou production' },
    { cle: 'subscription_key', label: 'Subscription Key (Collection)', secret: true },
    { cle: 'api_user', label: 'API User (Collection)', secret: false },
    { cle: 'api_key', label: 'API Key (Collection)', secret: true },
    { cle: 'disbursement_subscription_key', label: 'Subscription Key (Disbursement / retraits)', secret: true },
    { cle: 'disbursement_api_user', label: 'API User (Disbursement)', secret: false },
    { cle: 'disbursement_api_key', label: 'API Key (Disbursement)', secret: true },
  ],
  moov: [
    { cle: 'base_url', label: 'URL de base', secret: false },
    { cle: 'api_key', label: 'API Key', secret: true },
  ],
  celtiis: [
    { cle: 'base_url', label: 'URL de base', secret: false },
    { cle: 'api_key', label: 'API Key', secret: true },
  ],
  sms: [
    { cle: 'username', label: 'Nom d\'utilisateur Africa\'s Talking', secret: false },
    { cle: 'api_key', label: 'API Key', secret: true },
    { cle: 'expediteur', label: 'Nom de l\'expéditeur (optionnel)', secret: false, placeholder: 'RentEasy' },
  ],
};

const NOMS_OPERATEUR = { mtn: '📱 MTN Mobile Money', moov: '📱 Moov Money', celtiis: '📱 Celtiis Pay', sms: '✉️ SMS (Africa\'s Talking)' };

export default function SuperAdminParametres() {
  const [plateforme, setPlateforme] = useState([]);
  const [operateurs, setOperateurs] = useState([]);
  const [editCles, setEditCles] = useState({}); // { mtn: { base_url: '...', ... }, ... }
  const [tauxCommission, setTauxCommission] = useState('');
  const [chargement, setChargement] = useState(true);
  const [envoiCommission, setEnvoiCommission] = useState(false);
  const [envoiOperateur, setEnvoiOperateur] = useState(null);
  const [message, setMessage] = useState(null);
  const { deconnecter } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { chargerParametres(); }, []);

  async function chargerParametres() {
    try {
      const r = await api.get('/superadmin/parametres');
      setPlateforme(r.data.plateforme);
      setOperateurs(r.data.operateurs);
      const taux = r.data.plateforme.find(p => p.cle === 'taux_commission');
      setTauxCommission(taux ? (parseFloat(taux.valeur) * 100).toString() : '');
      const buffer = {};
      r.data.operateurs.forEach(o => { buffer[o.operateur] = { ...o.cles }; });
      setEditCles(buffer);
    } catch (e) {
      console.error(e);
    } finally {
      setChargement(false);
    }
  }

  function afficherMessage(texte, succes) {
    setMessage({ texte, succes });
    setTimeout(() => setMessage(null), 4000);
  }

  async function enregistrerCommission() {
    const valeur = parseFloat(tauxCommission);
    if (isNaN(valeur) || valeur < 0 || valeur > 100) {
      afficherMessage('Le taux doit être un pourcentage entre 0 et 100.', false);
      return;
    }
    setEnvoiCommission(true);
    try {
      await api.patch('/superadmin/parametres/commission', { taux: valeur / 100 });
      afficherMessage('Taux de commission mis à jour.', true);
      chargerParametres();
    } catch (e) {
      afficherMessage(e.response?.data?.message || 'Erreur lors de la mise à jour.', false);
    } finally {
      setEnvoiCommission(false);
    }
  }

  async function enregistrerOperateur(operateur, actif) {
    setEnvoiOperateur(operateur);
    try {
      await api.patch(`/superadmin/parametres/operateurs/${operateur}`, {
        actif,
        cles: editCles[operateur],
      });
      afficherMessage(`Configuration ${NOMS_OPERATEUR[operateur]} mise à jour.`, true);
      chargerParametres();
    } catch (e) {
      afficherMessage(e.response?.data?.message || 'Erreur lors de la mise à jour.', false);
    } finally {
      setEnvoiOperateur(null);
    }
  }

  function changerChamp(operateur, cle, valeur) {
    setEditCles(prev => ({ ...prev, [operateur]: { ...prev[operateur], [cle]: valeur } }));
  }

  if (chargement) {
    return <div style={s.loading}><p style={{ color: '#a78bfa' }}>Chargement...</p></div>;
  }

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
          <button style={{ ...s.navBtn, ...s.navBtnActif }}>Paramètres</button>
          <button style={s.navBtn} onClick={() => navigate('/superadmin/moderation')}>Modération</button>
          <button style={s.navBtn} onClick={() => navigate('/superadmin/rapport-financier')}>Rapport financier</button>
          <button style={s.navBtn} onClick={() => navigate('/superadmin/rappels')}>Rappels</button>
          <button style={s.navBtn} onClick={() => navigate('/superadmin/erreurs')}>Erreurs</button>
          <button style={s.navDeconnexion} onClick={deconnecter}>Déconnexion</button>
        </div>
      </nav>

      <div style={s.contenu}>
        <div style={s.entete}>
          <h2 style={s.titre}>Paramètres de la plateforme</h2>
        </div>

        {message && (
          <div style={{ ...s.bandeau, background: message.succes ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: message.succes ? '#10b981' : '#ef4444', border: `1px solid ${message.succes ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
            {message.texte}
          </div>
        )}

        {/* Commission */}
        <div style={s.carte}>
          <h3 style={s.carteTitre}>💰 Commission RentEasy</h3>
          <p style={s.carteSousTitre}>Pourcentage prélevé sur chaque paiement de loyer, quel que soit le mode de paiement.</p>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '16px' }}>
            <div style={s.inputGroupe}>
              <input
                style={s.input}
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={tauxCommission}
                onChange={e => setTauxCommission(e.target.value)}
              />
              <span style={s.suffixe}>%</span>
            </div>
            <button style={s.btnValider} onClick={enregistrerCommission} disabled={envoiCommission}>
              {envoiCommission ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>

        {/* Opérateurs Mobile Money */}
        <p style={s.sectionTitre}>🔑 Opérateurs Mobile Money</p>
        {operateurs.map(o => (
          <div key={o.operateur} style={s.carte}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={s.carteTitre}>{NOMS_OPERATEUR[o.operateur] || o.operateur}</h3>
              <label style={s.toggleLigne}>
                <input
                  type="checkbox"
                  checked={o.actif}
                  onChange={e => enregistrerOperateur(o.operateur, e.target.checked)}
                  disabled={envoiOperateur === o.operateur}
                />
                <span style={{ color: o.actif ? '#10b981' : '#6b7280', fontSize: '13px', fontWeight: '600' }}>
                  {o.actif ? 'Actif' : 'Inactif'}
                </span>
              </label>
            </div>
            <p style={s.carteSousTitre}>
              Une valeur masquée (••••) n'est jamais modifiée tant que tu ne la remplaces pas explicitement.
            </p>
            <div style={s.grilleChamps}>
              {(CHAMPS_OPERATEUR[o.operateur] || []).map(champ => (
                <div key={champ.cle} style={s.champGroupe}>
                  <label style={s.champLabel}>{champ.label}</label>
                  <input
                    style={s.input}
                    type={champ.secret ? 'password' : 'text'}
                    placeholder={champ.placeholder || ''}
                    value={editCles[o.operateur]?.[champ.cle] || ''}
                    onChange={e => changerChamp(o.operateur, champ.cle, e.target.value)}
                  />
                </div>
              ))}
            </div>
            <button
              style={{ ...s.btnValider, marginTop: '16px' }}
              onClick={() => enregistrerOperateur(o.operateur, o.actif)}
              disabled={envoiOperateur === o.operateur}
            >
              {envoiOperateur === o.operateur ? 'Enregistrement...' : `Enregistrer ${NOMS_OPERATEUR[o.operateur] || o.operateur}`}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: 'linear-gradient(135deg,#0a0a0f 0%,#0f0a1e 50%,#0a0f0a 100%)', fontFamily: "'Segoe UI',sans-serif", color: '#e2e8f0' },
  loading: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f' },
  nav: { background: 'rgba(10,10,20,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(124,58,237,0.3)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' },
  navLogo: { display: 'flex', alignItems: 'center', gap: '10px', color: '#e2e8f0', fontSize: '18px', fontWeight: '700', cursor: 'pointer' },
  navBenin: { color: '#f59e0b' },
  superBadge: { background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: '#fff', fontSize: '10px', padding: '3px 10px', borderRadius: '20px', fontWeight: '800', letterSpacing: '1px' },
  navMenu: { display: 'flex', gap: '8px', alignItems: 'center' },
  navBtn: { background: 'transparent', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa', cursor: 'pointer', padding: '7px 14px', borderRadius: '6px', fontSize: '13px' },
  navBtnActif: { background: 'rgba(124,58,237,0.2)', border: '1px solid #7c3aed', color: '#c4b5fd' },
  navDeconnexion: { background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', cursor: 'pointer', padding: '7px 14px', borderRadius: '6px', fontSize: '13px' },
  contenu: { padding: '32px 24px', maxWidth: '900px', margin: '0 auto' },
  entete: { marginBottom: '24px' },
  titre: { margin: 0, fontSize: '24px', fontWeight: '800', background: 'linear-gradient(135deg,#c4b5fd,#f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  bandeau: { padding: '12px 16px', borderRadius: '8px', fontSize: '14px', marginBottom: '20px', fontWeight: '600' },
  sectionTitre: { color: '#a78bfa', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', margin: '32px 0 12px' },
  carte: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px', marginBottom: '16px' },
  carteTitre: { margin: 0, fontSize: '16px', fontWeight: '700', color: '#e2e8f0' },
  carteSousTitre: { color: '#6b7280', fontSize: '13px', margin: '6px 0 0' },
  inputGroupe: { position: 'relative', display: 'flex', alignItems: 'center' },
  input: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: '#e2e8f0', padding: '10px 14px', borderRadius: '8px', fontSize: '14px', width: '100%', outline: 'none', boxSizing: 'border-box' },
  suffixe: { position: 'absolute', right: '14px', color: '#6b7280', fontSize: '14px', pointerEvents: 'none' },
  btnValider: { background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' },
  toggleLigne: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' },
  grilleChamps: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '14px', marginTop: '16px' },
  champGroupe: { display: 'flex', flexDirection: 'column', gap: '6px' },
  champLabel: { fontSize: '12px', color: '#9ca3af', fontWeight: '600' },
};
