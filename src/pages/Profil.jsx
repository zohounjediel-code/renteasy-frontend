import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ClocheNotifications from '../components/ClocheNotifications';

const ROLES_LABELS = {
  proprietaire: { label: 'Propriétaire', couleur: '#7c3aed', icone: '🏘️' },
  locataire: { label: 'Locataire', couleur: '#a78bfa', icone: '🏠' },
  agent: { label: 'Agent', couleur: '#f59e0b', icone: '👔' },
  admin: { label: 'Admin', couleur: '#ef4444', icone: '🛡️' },
  super_admin: { label: 'Super Admin', couleur: '#10b981', icone: '⚡' },
};

export default function Profil() {
  const [profil, setProfil] = useState(null);
  const [onglet, setOnglet] = useState('infos');
  const [form, setForm] = useState({ nom: '', telephone: '', ville: '', numero_piece_identite: '' });
  const [formMdp, setFormMdp] = useState({ ancien: '', nouveau: '', confirmer: '' });
  const [chargement, setChargement] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const [succes, setSucces] = useState('');
  const [erreur, setErreur] = useState('');
  const [solde, setSolde] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [modalSolde, setModalSolde] = useState(null); // 'recharge' | 'retrait' | null
  const [formSolde, setFormSolde] = useState({ methode: 'mtn_momo', telephone: '', montant: '' });
  const { utilisateur, setUtilisateur, deconnecter } = useAuth();
  const navigate = useNavigate();

  const roles = (utilisateur?.role || '').split(',').map(r => r.trim());

  useEffect(() => {
    api.get('/profil')
      .then(r => {
        setProfil(r.data);
        setForm({
          nom: r.data.nom || '',
          telephone: r.data.telephone || '',
          ville: r.data.ville || '',
          numero_piece_identite: r.data.numero_piece_identite || '',
        });
      })
      .catch(console.error)
      .finally(() => setChargement(false));
    chargerSolde();
  }, []);

  function chargerSolde() {
    api.get('/solde')
      .then(r => { setSolde(r.data.solde); setTransactions(r.data.transactions); })
      .catch(console.error);
  }

  // Tant qu'une transaction est "en_cours", le serveur la finalise lui-même en arrière-plan
  // (voir utils/cronSolde.js côté backend), mais sans ce rafraîchissement automatique
  // l'utilisateur devait recharger la page pour voir son solde se mettre à jour.
  useEffect(() => {
    if (!transactions.some(t => t.statut === 'en_cours')) return;
    const intervalle = setInterval(chargerSolde, 5000);
    return () => clearInterval(intervalle);
  }, [transactions]);

  function ouvrirModalSolde(type) {
    setModalSolde(type);
    setFormSolde({ methode: 'mtn_momo', telephone: '', montant: '' });
    setErreur(''); setSucces('');
  }

  async function lancerOperationSolde() {
    setErreur(''); setSucces('');
    if (!formSolde.telephone || !formSolde.montant) {
      setErreur('Le numéro de téléphone et le montant sont obligatoires');
      return;
    }
    setEnvoi(true);
    try {
      const endpoint = modalSolde === 'recharge' ? '/solde/recharger' : '/solde/retirer';
      const r = await api.post(endpoint, {
        montant: parseInt(formSolde.montant),
        methode: formSolde.methode,
        telephone: formSolde.telephone,
      });
      setSucces(r.data.message);
      setModalSolde(null);
      chargerSolde();
    } catch (e) {
      setErreur(e.response?.data?.message || "Erreur lors de l'opération");
    } finally {
      setEnvoi(false);
    }
  }

  function formaterMontant(n) {
    return parseInt(n || 0).toLocaleString('fr-FR') + ' FCFA';
  }

  const OPERATEURS = [
    { value: 'mtn_momo', label: 'MTN Mobile Money' },
    { value: 'moov_money', label: 'Moov Money' },
    { value: 'celtiis_pay', label: 'Celtiis Pay' },
  ];

  async function sauvegarderProfil() {
    setSucces(''); setErreur(''); setEnvoi(true);
    try {
      const r = await api.put('/profil', form);
      // Mettre à jour le token et l'utilisateur
      localStorage.setItem('renteasy_token', r.data.token);
      localStorage.setItem('renteasy_user', JSON.stringify(r.data.utilisateur));
      if (setUtilisateur) setUtilisateur(r.data.utilisateur);
      setProfil(r.data.utilisateur);
      setSucces('Profil mis à jour avec succès !');
    } catch (e) {
      setErreur(e.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setEnvoi(false);
    }
  }

  async function changerMotDePasse() {
    setSucces(''); setErreur('');
    if (formMdp.nouveau !== formMdp.confirmer) {
      setErreur('Les mots de passe ne correspondent pas');
      return;
    }
    if (formMdp.nouveau.length < 8) {
      setErreur('Le nouveau mot de passe doit contenir au moins 8 caractères');
      return;
    }
    setEnvoi(true);
    try {
      const r = await api.patch('/profil/mot-de-passe', {
        ancien_mot_de_passe: formMdp.ancien,
        nouveau_mot_de_passe: formMdp.nouveau,
      });
      setSucces(r.data.message);
      setFormMdp({ ancien: '', nouveau: '', confirmer: '' });
    } catch (e) {
      setErreur(e.response?.data?.message || 'Erreur');
    } finally {
      setEnvoi(false);
    }
  }

  function retourDashboard() {
    if (roles.includes('super_admin')) return navigate('/superadmin/dashboard');
    if (roles.includes('admin')) return navigate('/admin/dashboard');
    if (roles.includes('agent')) return navigate('/agent/demandes');
    if (roles.includes('proprietaire')) return navigate('/dashboard');
    return navigate('/locataire/dashboard');
  }

  function formaterDate(d) {
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  return (
    <div style={s.page}>
      <nav style={s.nav} className="re-nav">
        <div style={s.navLogo} onClick={retourDashboard}>
          🏠 <strong>RentEasy</strong> <span style={s.navBenin}>Bénin</span>
        </div>
        <div style={s.navMenu}>
          <button style={s.navBtn} onClick={retourDashboard}>← Dashboard</button>
          <ClocheNotifications />
          <button style={s.navDeconnexion} onClick={deconnecter}>Déconnexion</button>
        </div>
      </nav>

      <div style={s.contenu}>
        {chargement ? (
          <div style={s.loading}><div style={s.spinner} /></div>
        ) : (
          <div style={s.layout}>
            {/* Carte profil gauche */}
            <div style={s.carteGauche}>
              <div style={s.avatarGrand}>{profil?.nom?.charAt(0).toUpperCase()}</div>
              <h2 style={s.profilNom}>{profil?.nom}</h2>
              <p style={s.profilEmail}>{profil?.email}</p>

              {/* Rôles */}
              <div style={s.rolesContainer}>
                {roles.map(r => {
                  const rl = ROLES_LABELS[r] || { label: r, couleur: '#6b7280', icone: '👤' };
                  return (
                    <span key={r} style={{ ...s.roleBadge, background: `${rl.couleur}20`, color: rl.couleur, border: `1px solid ${rl.couleur}40` }}>
                      {rl.icone} {rl.label}
                    </span>
                  );
                })}
              </div>

              <div style={s.soldeCard}>
                <p style={s.soldeLabel}>💰 Solde disponible</p>
                <p style={s.soldeValeur}>{formaterMontant(solde)}</p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button style={s.btnSoldeMini} onClick={() => { setOnglet('solde'); ouvrirModalSolde('recharge'); }}>+ Recharger</button>
                  <button style={{ ...s.btnSoldeMini, background: 'rgba(255,255,255,0.05)', color: '#9ca3af' }} onClick={() => { setOnglet('solde'); ouvrirModalSolde('retrait'); }}>↓ Retirer</button>
                </div>
              </div>

              <div style={s.infoStats}>
                <div style={s.infoStatItem}>
                  <span style={s.infoStatLabel}>Membre depuis</span>
                  <span style={s.infoStatVal}>{formaterDate(profil?.created_at)}</span>
                </div>
                <div style={s.infoStatItem}>
                  <span style={s.infoStatLabel}>Statut</span>
                  <span style={{ ...s.infoStatVal, color: profil?.actif ? '#10b981' : '#ef4444' }}>
                    {profil?.actif ? '● Actif' : '○ Inactif'}
                  </span>
                </div>
                {profil?.ville && (
                  <div style={s.infoStatItem}>
                    <span style={s.infoStatLabel}>Ville</span>
                    <span style={s.infoStatVal}>{profil.ville}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Panneau droite */}
            <div style={s.carteDroite}>
              {/* Onglets */}
              <div style={s.onglets}>
                <button
                  style={{ ...s.onglet, borderBottom: onglet === 'infos' ? '2px solid #7c3aed' : '2px solid transparent', color: onglet === 'infos' ? '#c4b5fd' : '#6b7280' }}
                  onClick={() => { setOnglet('infos'); setSucces(''); setErreur(''); }}
                >
                  👤 Mes informations
                </button>
                <button
                  style={{ ...s.onglet, borderBottom: onglet === 'securite' ? '2px solid #7c3aed' : '2px solid transparent', color: onglet === 'securite' ? '#c4b5fd' : '#6b7280' }}
                  onClick={() => { setOnglet('securite'); setSucces(''); setErreur(''); }}
                >
                  🔒 Sécurité
                </button>
                <button
                  style={{ ...s.onglet, borderBottom: onglet === 'solde' ? '2px solid #7c3aed' : '2px solid transparent', color: onglet === 'solde' ? '#c4b5fd' : '#6b7280' }}
                  onClick={() => { setOnglet('solde'); setSucces(''); setErreur(''); }}
                >
                  💰 Mon solde
                </button>
              </div>

              {succes && <div style={s.succes}>{succes}</div>}
              {erreur && <div style={s.erreurBox}>{erreur}</div>}

              {onglet === 'infos' && (
                <div style={s.formSection}>
                  <p style={s.formTitre}>Modifier mes informations</p>
                  <p style={s.formNote}>⚠️ L'email ne peut pas être modifié. Contactez l'administration si nécessaire.</p>

                  <div style={s.formGrille}>
                    <div>
                      <label style={s.label}>Nom complet</label>
                      <input style={s.input} value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} />
                    </div>
                    <div>
                      <label style={s.label}>Téléphone</label>
                      <input style={s.input} value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} />
                    </div>
                    <div>
                      <label style={s.label}>Ville</label>
                      <input style={s.input} placeholder="Cotonou" value={form.ville} onChange={e => setForm({ ...form, ville: e.target.value })} />
                    </div>
                    <div>
                      <label style={s.label}>N° pièce d'identité</label>
                      <input style={s.input} placeholder="CIP ou passeport" value={form.numero_piece_identite} onChange={e => setForm({ ...form, numero_piece_identite: e.target.value })} />
                    </div>
                  </div>

                  {/* Email en lecture seule */}
                  <div style={{ marginTop: '12px' }}>
                    <label style={s.label}>Adresse email</label>
                    <input style={{ ...s.input, opacity: 0.5, cursor: 'not-allowed' }} value={profil?.email || ''} readOnly />
                  </div>

                  <button style={s.btnSauvegarder} onClick={sauvegarderProfil} disabled={envoi}>
                    {envoi ? 'Sauvegarde...' : '✅ Sauvegarder les modifications'}
                  </button>
                </div>
              )}

              {onglet === 'securite' && (
                <div style={s.formSection}>
                  <p style={s.formTitre}>Changer mon mot de passe</p>

                  <label style={s.label}>Mot de passe actuel</label>
                  <input style={s.input} type="password" placeholder="••••••••" value={formMdp.ancien} onChange={e => setFormMdp({ ...formMdp, ancien: e.target.value })} />

                  <label style={s.label}>Nouveau mot de passe</label>
                  <input style={s.input} type="password" placeholder="8 caractères minimum" value={formMdp.nouveau} onChange={e => setFormMdp({ ...formMdp, nouveau: e.target.value })} />

                  <label style={s.label}>Confirmer le nouveau mot de passe</label>
                  <input style={s.input} type="password" placeholder="••••••••" value={formMdp.confirmer} onChange={e => setFormMdp({ ...formMdp, confirmer: e.target.value })} />

                  <button style={s.btnSauvegarder} onClick={changerMotDePasse} disabled={envoi}>
                    {envoi ? 'Modification...' : '🔒 Changer le mot de passe'}
                  </button>

                  <div style={s.securiteInfo}>
                    <p style={{ margin: '0 0 8px', color: '#a78bfa', fontWeight: '600', fontSize: '13px' }}>🔐 Conseils de sécurité</p>
                    <ul style={{ color: '#6b7280', fontSize: '12px', margin: 0, paddingLeft: '16px', lineHeight: '1.8' }}>
                      <li>Utilisez au moins 8 caractères</li>
                      <li>Combinez majuscules, minuscules et chiffres</li>
                      <li>Ne partagez jamais votre mot de passe</li>
                    </ul>
                  </div>
                </div>
              )}
              {onglet === 'solde' && (
                <div style={s.formSection}>
                  <p style={s.formTitre}>Mon portefeuille</p>
                  <div style={s.soldeGrandCard}>
                    <div>
                      <p style={s.soldeGrandLabel}>Solde disponible</p>
                      <p style={s.soldeGrandValeur}>{formaterMontant(solde)}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button style={{ ...s.btnSauvegarder, width: 'auto', marginTop: 0 }} onClick={() => ouvrirModalSolde('recharge')}>+ Recharger</button>
                      <button style={{ ...s.btnSauvegarder, width: 'auto', marginTop: 0, background: 'rgba(255,255,255,0.05)', color: '#e2e8f0' }} onClick={() => ouvrirModalSolde('retrait')}>↓ Retirer</button>
                    </div>
                  </div>

                  <p style={{ ...s.formTitre, marginTop: '28px', fontSize: '14px' }}>Historique des transactions</p>
                  {transactions.length === 0 ? (
                    <p style={{ color: '#6b7280', fontSize: '13px', textAlign: 'center', padding: '20px' }}>Aucune transaction pour le moment</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {transactions.map(t => (
                        <div key={t.id} style={s.transactionLigne}>
                          <div>
                            <div style={{ fontWeight: '600', color: '#e2e8f0', fontSize: '13px' }}>
                              {t.type === 'recharge' ? '⬆️ Recharge' : '⬇️ Retrait'} · {OPERATEURS.find(o => o.value === t.methode)?.label}
                            </div>
                            <div style={{ color: '#6b7280', fontSize: '12px' }}>{new Date(t.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: '700', color: t.type === 'recharge' ? '#10b981' : '#ef4444' }}>
                              {t.type === 'recharge' ? '+' : '-'}{formaterMontant(t.montant)}
                            </div>
                            <span style={{ ...s.transactionStatut, color: t.statut === 'reussi' ? '#10b981' : t.statut === 'echoue' ? '#ef4444' : '#f59e0b' }}>
                              {t.statut === 'reussi' ? '✅ Réussi' : t.statut === 'echoue' ? '❌ Échoué' : '⏳ En cours'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {modalSolde && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h3 style={{ margin: '0 0 4px', color: '#c4b5fd', fontSize: '20px' }}>
              {modalSolde === 'recharge' ? '⬆️ Recharger mon solde' : '⬇️ Retirer mon solde'}
            </h3>
            <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '16px' }}>
              {modalSolde === 'recharge'
                ? 'Un prélèvement sera effectué sur le numéro renseigné.'
                : 'Les fonds seront transférés sur le numéro renseigné.'}
            </p>

            <label style={s.label}>Opérateur *</label>
            <select style={s.input} value={formSolde.methode} onChange={e => setFormSolde({ ...formSolde, methode: e.target.value })}>
              {OPERATEURS.map(o => <option key={o.value} value={o.value} style={s.option}>{o.label}</option>)}
            </select>

            <label style={s.label}>Numéro de téléphone *</label>
            <input style={s.input} placeholder="+22997001122" value={formSolde.telephone} onChange={e => setFormSolde({ ...formSolde, telephone: e.target.value })} />

            <label style={s.label}>Montant (FCFA) *</label>
            <input style={s.input} type="number" placeholder="10000" value={formSolde.montant} onChange={e => setFormSolde({ ...formSolde, montant: e.target.value })} />

            {erreur && <p style={s.erreurBox2}>{erreur}</p>}

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button style={s.btnAnnulerModal} onClick={() => setModalSolde(null)}>Annuler</button>
              <button style={{ ...s.btnSauvegarder, marginTop: 0 }} onClick={lancerOperationSolde} disabled={envoi}>
                {envoi ? 'Traitement...' : modalSolde === 'recharge' ? '✅ Lancer la recharge' : '✅ Lancer le retrait'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: 'linear-gradient(135deg,#0a0a0f 0%,#0d1117 100%)', fontFamily: "'Segoe UI',sans-serif", color: '#e2e8f0' },
  nav: { background: 'rgba(10,10,20,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(124,58,237,0.2)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px', position: 'sticky', top: 0, zIndex: 100 },
  navLogo: { color: '#e2e8f0', fontSize: '18px', cursor: 'pointer' },
  navBenin: { color: '#f59e0b' },
  navMenu: { display: 'flex', gap: '8px', alignItems: 'center' },
  navBtn: { background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af', cursor: 'pointer', padding: '7px 12px', borderRadius: '6px', fontSize: '13px' },
  navDeconnexion: { background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', cursor: 'pointer', padding: '7px 12px', borderRadius: '6px', fontSize: '13px' },
  contenu: { padding: '28px 24px', maxWidth: '1000px', margin: '0 auto' },
  loading: { display: 'flex', justifyContent: 'center', padding: '80px' },
  spinner: { width: '40px', height: '40px', border: '3px solid rgba(124,58,237,0.2)', borderTop: '3px solid #7c3aed', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  layout: { display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px', alignItems: 'start' },
  carteGauche: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', position: 'sticky', top: '84px' },
  avatarGrand: { width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '32px' },
  profilNom: { margin: 0, fontSize: '20px', fontWeight: '800', color: '#e2e8f0', textAlign: 'center' },
  profilEmail: { margin: 0, color: '#6b7280', fontSize: '13px', textAlign: 'center' },
  rolesContainer: { display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' },
  roleBadge: { padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', textAlign: 'center' },
  infoStats: { width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' },
  infoStatItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  infoStatLabel: { color: '#6b7280', fontSize: '12px' },
  infoStatVal: { color: '#e2e8f0', fontSize: '13px', fontWeight: '600' },
  carteDroite: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'hidden' },
  onglets: { display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)' },
  onglet: { flex: 1, padding: '16px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s' },
  succes: { background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', padding: '12px 20px', fontSize: '14px' },
  erreurBox: { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '12px 20px', fontSize: '14px' },
  formSection: { padding: '24px' },
  formTitre: { color: '#c4b5fd', fontSize: '16px', fontWeight: '700', margin: '0 0 8px' },
  formNote: { color: '#6b7280', fontSize: '12px', margin: '0 0 20px', background: 'rgba(255,255,255,0.03)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' },
  formGrille: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  label: { fontSize: '12px', fontWeight: '600', color: '#9ca3af', display: 'block', marginBottom: '6px', marginTop: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', padding: '10px 14px', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' },
  btnSauvegarder: { background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px 24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginTop: '20px', width: '100%' },
  securiteInfo: { marginTop: '24px', background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '10px', padding: '16px' },
  soldeCard: { width: '100%', background: 'linear-gradient(135deg,rgba(16,185,129,0.12),rgba(5,150,105,0.06))', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', padding: '16px', marginTop: '4px' },
  soldeLabel: { margin: 0, color: '#9ca3af', fontSize: '12px', fontWeight: '600' },
  soldeValeur: { margin: '4px 0 0', color: '#10b981', fontSize: '20px', fontWeight: '800' },
  btnSoldeMini: { flex: 1, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: '6px', padding: '7px 10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' },
  soldeGrandCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', background: 'linear-gradient(135deg,rgba(16,185,129,0.1),rgba(5,150,105,0.04))', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', padding: '20px' },
  soldeGrandLabel: { margin: 0, color: '#9ca3af', fontSize: '13px' },
  soldeGrandValeur: { margin: '4px 0 0', color: '#10b981', fontSize: '28px', fontWeight: '800' },
  transactionLigne: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '12px 16px' },
  transactionStatut: { fontSize: '11px', fontWeight: '600' },
  option: { background: '#0f0a1e', color: '#e2e8f0' },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modal: { background: '#0f0a1e', border: '1px solid rgba(124,58,237,0.4)', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '440px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' },
  erreurBox2: { color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '10px', borderRadius: '6px', fontSize: '13px', marginTop: '12px', border: '1px solid rgba(239,68,68,0.2)' },
  btnAnnulerModal: { flex: 1, background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px 20px', fontSize: '14px', cursor: 'pointer' },
};
