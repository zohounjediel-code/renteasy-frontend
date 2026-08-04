import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const LABELS_MOTIFS = {
  photos_non_conformes: 'Photos non conformes au bien',
  coordonnees_trompeuses: 'Coordonnées trompeuses',
  annonce_en_double: 'Annonce en double',
  bien_indisponible: 'Bien déjà loué / indisponible',
  contenu_inapproprie: 'Contenu inapproprié',
  autre: 'Autre',
};

export default function SuperAdminModeration() {
  const [annonces, setAnnonces] = useState([]);
  const [signalements, setSignalements] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [filtre, setFiltre] = useState('signalements');
  const [modalRetrait, setModalRetrait] = useState(null);
  const [raison, setRaison] = useState('');
  const [envoi, setEnvoi] = useState(null);
  const { deconnecter } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { chargerDonnees(); }, []);

  async function chargerDonnees() {
    try {
      const [rAnnonces, rSignalements] = await Promise.all([
        api.get('/superadmin/marche'),
        api.get('/superadmin/signalements'),
      ]);
      setAnnonces(rAnnonces.data);
      setSignalements(rSignalements.data);
    } catch (e) {
      console.error(e);
    } finally {
      setChargement(false);
    }
  }

  function formaterMontant(n) {
    return parseInt(n || 0).toLocaleString('fr-FR') + ' FCFA';
  }
  function formaterDate(d) {
    return new Date(d).toLocaleDateString('fr-FR');
  }

  async function confirmerRetrait() {
    if (!raison.trim()) return;
    setEnvoi(modalRetrait.id);
    try {
      await api.patch(`/superadmin/marche/${modalRetrait.id}/moderer`, { masquer: true, raison: raison.trim() });
      setModalRetrait(null);
      setRaison('');
      chargerDonnees();
    } catch (e) {
      console.error(e);
    } finally {
      setEnvoi(null);
    }
  }

  async function republier(id) {
    setEnvoi(id);
    try {
      await api.patch(`/superadmin/marche/${id}/moderer`, { masquer: false });
      chargerDonnees();
    } catch (e) {
      console.error(e);
    } finally {
      setEnvoi(null);
    }
  }

  // Ouvre la même modale de retrait que depuis la grille d'annonces, mais à partir d'une ligne
  // de signalement — masquer l'annonce résout automatiquement CE signalement et tous les autres
  // en attente sur le même bien (cf. modererAnnonce côté backend).
  function ouvrirRetraitDepuisSignalement(s) {
    setModalRetrait({ id: s.bien_id, adresse: s.adresse, proprietaire_nom: s.proprietaire_nom });
    setRaison(`Signalement d'un utilisateur : ${LABELS_MOTIFS[s.motif] || s.motif}${s.description ? ` — ${s.description}` : ''}`);
  }

  async function rejeterSignalement(id) {
    setEnvoi(id);
    try {
      await api.patch(`/superadmin/signalements/${id}`, { action: 'rejete' });
      chargerDonnees();
    } catch (e) {
      console.error(e);
    } finally {
      setEnvoi(null);
    }
  }

  const annoncesFiltrees = annonces.filter(a => {
    if (filtre === 'masquees') return a.moderation_masque;
    if (filtre === 'publiees') return !a.moderation_masque;
    return true;
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
          <button style={{ ...s.navBtn, ...s.navBtnActif }}>Modération</button>
          <button style={s.navBtn} onClick={() => navigate('/superadmin/rapport-financier')}>Rapport financier</button>
          <button style={s.navBtn} onClick={() => navigate('/superadmin/rappels')}>Rappels</button>
          <button style={s.navBtn} onClick={() => navigate('/superadmin/erreurs')}>Erreurs</button>
          <button style={s.navDeconnexion} onClick={deconnecter}>Déconnexion</button>
        </div>
      </nav>

      <div style={s.contenu}>
        <div style={s.entete}>
          <div>
            <h2 style={s.titre}>Modération du marché</h2>
            <p style={s.sousTitre}>Signalements des utilisateurs et annonces publiées par les propriétaires — retire une annonce inappropriée avec un motif, ou remets-en une en ligne.</p>
          </div>
          <span style={s.compteur}>{filtre === 'signalements' ? `${signalements.length} signalement(s)` : `${annoncesFiltrees.length} annonce(s)`}</span>
        </div>

        <div style={s.filtres}>
          {[
            { valeur: 'signalements', label: `🚩 Signalements${signalements.length > 0 ? ` (${signalements.length})` : ''}` },
            { valeur: 'publiees', label: '✅ En ligne' },
            { valeur: 'masquees', label: '🚫 Retirées' },
            { valeur: 'toutes', label: 'Toutes' },
          ].map(f => (
            <button
              key={f.valeur}
              style={{ ...s.filtreBouton, background: filtre === f.valeur ? '#7c3aed' : 'rgba(255,255,255,0.05)', color: filtre === f.valeur ? '#fff' : '#9ca3af', border: filtre === f.valeur ? '1px solid #7c3aed' : '1px solid rgba(255,255,255,0.1)' }}
              onClick={() => setFiltre(f.valeur)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filtre === 'signalements' ? (
          chargement ? (
            <p style={{ color: '#6b7280', textAlign: 'center', padding: '40px' }}>Chargement...</p>
          ) : signalements.length === 0 ? (
            <div style={s.vide}>Aucun signalement en attente 🎉</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {signalements.map(sig => (
                <div key={sig.id} style={s.carteSignalement}>
                  <div style={{ flex: 1 }}>
                    <div style={s.carteAdresse}>{sig.adresse} <span style={s.carteSous}>· {sig.ville} · N° {sig.numero_bien}</span></div>
                    <div style={{ marginTop: '6px' }}>
                      <span style={s.badgeMotif}>{LABELS_MOTIFS[sig.motif] || sig.motif}</span>
                      {sig.moderation_masque && <span style={{ ...s.badgeMasque, marginLeft: '8px' }}>🚫 Déjà retirée</span>}
                    </div>
                    {sig.description && <p style={s.descriptionSignalement}>« {sig.description} »</p>}
                    <div style={s.carteSous}>
                      Signalé par {sig.signale_par_nom} ({sig.signale_par_role}) le {formaterDate(sig.created_at)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    {!sig.moderation_masque && (
                      <button style={s.btnRetirer} onClick={() => ouvrirRetraitDepuisSignalement(sig)}>
                        🚫 Retirer l'annonce
                      </button>
                    )}
                    <button style={s.btnRejeter} onClick={() => rejeterSignalement(sig.id)} disabled={envoi === sig.id}>
                      {envoi === sig.id ? '...' : 'Rejeter'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : chargement ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '40px' }}>Chargement...</p>
        ) : annoncesFiltrees.length === 0 ? (
          <div style={s.vide}>Aucune annonce trouvée</div>
        ) : (
          <div style={s.grille}>
            {annoncesFiltrees.map(a => (
              <div key={a.id} style={{ ...s.carte, borderColor: a.moderation_masque ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)' }}>
                {a.photos?.[0] && <img src={a.photos[0]} alt="" style={s.photo} />}
                <div style={s.carteCorps}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div>
                      <div style={s.carteAdresse}>{a.adresse}</div>
                      <div style={s.carteSous}>{a.ville} · {a.quartier} · N° {a.numero_bien}</div>
                    </div>
                    {a.moderation_masque && <span style={s.badgeMasque}>🚫 Retirée</span>}
                  </div>
                  <div style={s.cartePrix}>{formaterMontant(a.loyer_mensuel)}</div>
                  <div style={s.carteProprio}>👤 {a.proprietaire_nom} · {a.proprietaire_telephone}</div>
                  {a.description_marche && <p style={s.carteDescription}>{a.description_marche}</p>}
                  <div style={s.carteDate}>Publiée le {formaterDate(a.created_at)}</div>

                  {a.moderation_masque && (
                    <div style={s.encartMotif}>
                      <div style={s.encartMotifTitre}>Motif du retrait ({a.moderation_par_nom}, {formaterDate(a.moderation_le)})</div>
                      <div>{a.moderation_raison}</div>
                    </div>
                  )}

                  <div style={{ marginTop: '14px' }}>
                    {a.moderation_masque ? (
                      <button style={s.btnRepublier} onClick={() => republier(a.id)} disabled={envoi === a.id}>
                        {envoi === a.id ? 'En cours...' : '↩️ Remettre en ligne'}
                      </button>
                    ) : (
                      <button style={{ ...s.btnRetirer, width: '100%' }} onClick={() => setModalRetrait(a)} disabled={envoi === a.id}>
                        🚫 Retirer du marché
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalRetrait && (
        <div style={s.overlay} onClick={() => setModalRetrait(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 8px' }}>Retirer cette annonce</h3>
            <p style={{ color: '#9ca3af', fontSize: '14px', margin: '0 0 16px' }}>
              {modalRetrait.adresse} — {modalRetrait.proprietaire_nom} sera notifié par email avec le motif ci-dessous.
            </p>
            <textarea
              style={s.textarea}
              rows={4}
              placeholder="Motif du retrait (obligatoire) — ex : photos non conformes au bien, coordonnées trompeuses, annonce en doublon..."
              value={raison}
              onChange={e => setRaison(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button style={s.btnAnnuler} onClick={() => { setModalRetrait(null); setRaison(''); }}>Annuler</button>
              <button style={s.btnConfirmerRetrait} onClick={confirmerRetrait} disabled={!raison.trim() || envoi === modalRetrait.id}>
                {envoi === modalRetrait.id ? 'Retrait...' : 'Confirmer le retrait'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: 'linear-gradient(135deg,#0a0a0f 0%,#0f0a1e 50%,#0a0f0a 100%)', fontFamily: "'Segoe UI',sans-serif", color: '#e2e8f0' },
  nav: { background: 'rgba(10,10,20,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(124,58,237,0.3)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' },
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
  sousTitre: { color: '#6b7280', margin: '6px 0 0', fontSize: '13px', maxWidth: '560px' },
  compteur: { background: 'rgba(124,58,237,0.2)', color: '#a78bfa', padding: '6px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: '600', border: '1px solid rgba(124,58,237,0.3)' },
  filtres: { display: 'flex', gap: '8px', marginBottom: '20px' },
  filtreBouton: { padding: '6px 16px', borderRadius: '20px', fontSize: '13px', cursor: 'pointer', fontWeight: '600' },
  vide: { textAlign: 'center', color: '#6b7280', padding: '60px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' },
  grille: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: '16px' },
  carte: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden' },
  photo: { width: '100%', height: '160px', objectFit: 'cover' },
  carteCorps: { padding: '16px' },
  carteAdresse: { fontWeight: '700', fontSize: '15px', color: '#e2e8f0' },
  carteSous: { color: '#6b7280', fontSize: '12px', marginTop: '2px' },
  cartePrix: { color: '#f59e0b', fontWeight: '700', fontSize: '16px', marginTop: '10px' },
  carteProprio: { color: '#a78bfa', fontSize: '13px', marginTop: '6px' },
  carteDescription: { color: '#9ca3af', fontSize: '13px', margin: '10px 0 0', lineHeight: '1.4' },
  carteDate: { color: '#6b7280', fontSize: '11px', marginTop: '10px' },
  badgeMasque: { background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap' },
  encartMotif: { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', padding: '10px 12px', marginTop: '12px', fontSize: '12px', color: '#fca5a5' },
  encartMotifTitre: { fontWeight: '700', marginBottom: '4px', color: '#ef4444' },
  btnRetirer: { background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '8px', padding: '9px 14px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' },
  btnRejeter: { background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '9px 14px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' },
  carteSignalement: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '12px', padding: '16px 20px' },
  badgeMotif: { background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' },
  descriptionSignalement: { color: '#9ca3af', fontSize: '13px', fontStyle: 'italic', margin: '8px 0' },
  btnRepublier: { width: '100%', background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '8px', padding: '9px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modal: { background: '#14121f', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '12px', padding: '24px', maxWidth: '440px', width: '100%', maxHeight: '90vh', overflowY: 'auto', color: '#e2e8f0' },
  textarea: { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: '#e2e8f0', padding: '10px', borderRadius: '8px', fontSize: '14px', resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
  btnAnnuler: { flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: '#9ca3af', borderRadius: '8px', padding: '10px', fontSize: '14px', cursor: 'pointer' },
  btnConfirmerRetrait: { flex: 1, background: 'linear-gradient(135deg,#ef4444,#b91c1c)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
};
