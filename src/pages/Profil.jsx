import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ClocheNotifications from '../components/ClocheNotifications';

const ROLES_LABELS = {
  proprietaire: { label: 'Propriétaire', cls: 'bg-brand-50 text-brand-700 border-brand-200', icone: '🏘️' },
  locataire: { label: 'Locataire', cls: 'bg-purple-50 text-purple-700 border-purple-200', icone: '🏠' },
  agent: { label: 'Agent', cls: 'bg-accent-50 text-accent-700 border-accent-200', icone: '👔' },
  admin: { label: 'Admin', cls: 'bg-red-50 text-red-600 border-red-200', icone: '🛡️' },
  super_admin: { label: 'Super Admin', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icone: '⚡' },
};

const champLabel = 'mt-3 mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500';
const champInput = 'w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30';

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
    <div className="min-h-screen bg-brand-50">
      <nav className="re-nav sticky top-0 z-[100] flex h-[60px] items-center justify-between border-b border-slate-100 bg-white/95 px-6 backdrop-blur">
        <div className="cursor-pointer text-lg text-slate-900" onClick={retourDashboard}>
          🏠 <strong>RentEasy</strong> <span className="text-accent-600">Bénin</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50" onClick={retourDashboard}>← Dashboard</button>
          <ClocheNotifications />
          <button className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50" onClick={deconnecter}>Déconnexion</button>
        </div>
      </nav>

      <div className="mx-auto max-w-4xl px-6 py-7">
        {chargement ? (
          <div className="flex justify-center py-20"><div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" /></div>
        ) : (
          <div className="grid grid-cols-[280px_1fr] items-start gap-6">
            {/* Carte profil gauche */}
            <div className="sticky top-[84px] flex flex-col items-center gap-3 rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 p-7 shadow-card">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-600 text-3xl font-extrabold text-white">{profil?.nom?.charAt(0).toUpperCase()}</div>
              <h2 className="m-0 text-center text-xl font-extrabold text-slate-900">{profil?.nom}</h2>
              <p className="m-0 text-center text-[13px] text-slate-400">{profil?.email}</p>

              {/* Rôles */}
              <div className="flex w-full flex-col gap-1.5">
                {roles.map(r => {
                  const rl = ROLES_LABELS[r] || { label: r, cls: 'bg-slate-100 text-slate-500 border-slate-200', icone: '👤' };
                  return (
                    <span key={r} className={`rounded-lg border px-3 py-1.5 text-center text-[13px] font-bold ${rl.cls}`}>
                      {rl.icone} {rl.label}
                    </span>
                  );
                })}
              </div>

              <div className="mt-1 w-full rounded-xl border border-brand-200 bg-brand-50 p-4">
                <p className="m-0 text-xs font-semibold text-slate-500">💰 Solde disponible</p>
                <p className="mt-1 text-xl font-extrabold text-brand-700">{formaterMontant(solde)}</p>
                <div className="mt-2.5 flex gap-2">
                  <button className="flex-1 rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-brand-700" onClick={() => { setOnglet('solde'); ouvrirModalSolde('recharge'); }}>+ Recharger</button>
                  <button className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-50" onClick={() => { setOnglet('solde'); ouvrirModalSolde('retrait'); }}>↓ Retirer</button>
                </div>
              </div>

              <div className="mt-2 flex w-full flex-col gap-2 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Membre depuis</span>
                  <span className="text-[13px] font-semibold text-slate-700">{formaterDate(profil?.created_at)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Statut</span>
                  <span className={`text-[13px] font-semibold ${profil?.actif ? 'text-emerald-600' : 'text-red-600'}`}>
                    {profil?.actif ? '● Actif' : '○ Inactif'}
                  </span>
                </div>
                {profil?.ville && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Ville</span>
                    <span className="text-[13px] font-semibold text-slate-700">{profil.ville}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Panneau droite */}
            <div className="overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 shadow-card">
              {/* Onglets */}
              <div className="flex border-b border-slate-100">
                <button
                  className={`flex-1 border-b-2 p-4 text-sm font-semibold transition ${onglet === 'infos' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-400'}`}
                  onClick={() => { setOnglet('infos'); setSucces(''); setErreur(''); }}
                >
                  👤 Mes informations
                </button>
                <button
                  className={`flex-1 border-b-2 p-4 text-sm font-semibold transition ${onglet === 'securite' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-400'}`}
                  onClick={() => { setOnglet('securite'); setSucces(''); setErreur(''); }}
                >
                  🔒 Sécurité
                </button>
                <button
                  className={`flex-1 border-b-2 p-4 text-sm font-semibold transition ${onglet === 'solde' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-400'}`}
                  onClick={() => { setOnglet('solde'); setSucces(''); setErreur(''); }}
                >
                  💰 Mon solde
                </button>
              </div>

              {succes && <div className="bg-brand-50 px-5 py-3 text-sm text-brand-800">{succes}</div>}
              {erreur && <div className="bg-red-50 px-5 py-3 text-sm text-red-600">{erreur}</div>}

              {onglet === 'infos' && (
                <div className="p-6">
                  <p className="mb-2 text-base font-bold text-slate-900">Modifier mes informations</p>
                  <p className="mb-5 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 text-xs text-slate-500">⚠️ L'email ne peut pas être modifié. Contactez l'administration si nécessaire.</p>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={champLabel}>Nom complet</label>
                      <input className={champInput} value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} />
                    </div>
                    <div>
                      <label className={champLabel}>Téléphone</label>
                      <input className={champInput} value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} />
                    </div>
                    <div>
                      <label className={champLabel}>Ville</label>
                      <input className={champInput} placeholder="Cotonou" value={form.ville} onChange={e => setForm({ ...form, ville: e.target.value })} />
                    </div>
                    <div>
                      <label className={champLabel}>N° pièce d'identité</label>
                      <input className={champInput} placeholder="CIP ou passeport" value={form.numero_piece_identite} onChange={e => setForm({ ...form, numero_piece_identite: e.target.value })} />
                    </div>
                  </div>

                  {/* Email en lecture seule */}
                  <div className="mt-3">
                    <label className={champLabel}>Adresse email</label>
                    <input className={`${champInput} cursor-not-allowed bg-slate-50 text-slate-400`} value={profil?.email || ''} readOnly />
                  </div>

                  <button className="mt-5 w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60" onClick={sauvegarderProfil} disabled={envoi}>
                    {envoi ? 'Sauvegarde...' : '✅ Sauvegarder les modifications'}
                  </button>
                </div>
              )}

              {onglet === 'securite' && (
                <div className="p-6">
                  <p className="mb-2 text-base font-bold text-slate-900">Changer mon mot de passe</p>

                  <label className={champLabel}>Mot de passe actuel</label>
                  <input className={champInput} type="password" placeholder="••••••••" value={formMdp.ancien} onChange={e => setFormMdp({ ...formMdp, ancien: e.target.value })} />

                  <label className={champLabel}>Nouveau mot de passe</label>
                  <input className={champInput} type="password" placeholder="8 caractères minimum" value={formMdp.nouveau} onChange={e => setFormMdp({ ...formMdp, nouveau: e.target.value })} />

                  <label className={champLabel}>Confirmer le nouveau mot de passe</label>
                  <input className={champInput} type="password" placeholder="••••••••" value={formMdp.confirmer} onChange={e => setFormMdp({ ...formMdp, confirmer: e.target.value })} />

                  <button className="mt-5 w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60" onClick={changerMotDePasse} disabled={envoi}>
                    {envoi ? 'Modification...' : '🔒 Changer le mot de passe'}
                  </button>

                  <div className="mt-6 rounded-xl border border-brand-200 bg-brand-50 p-4">
                    <p className="mb-2 text-[13px] font-semibold text-brand-700">🔐 Conseils de sécurité</p>
                    <ul className="m-0 list-disc space-y-1 pl-4 text-xs leading-relaxed text-slate-500">
                      <li>Utilisez au moins 8 caractères</li>
                      <li>Combinez majuscules, minuscules et chiffres</li>
                      <li>Ne partagez jamais votre mot de passe</li>
                    </ul>
                  </div>
                </div>
              )}
              {onglet === 'solde' && (
                <div className="p-6">
                  <p className="mb-2 text-base font-bold text-slate-900">Mon portefeuille</p>
                  <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-brand-200 bg-brand-50 p-5">
                    <div>
                      <p className="m-0 text-[13px] text-slate-500">Solde disponible</p>
                      <p className="mt-1 text-2xl font-extrabold text-brand-700">{formaterMontant(solde)}</p>
                    </div>
                    <div className="flex gap-2.5">
                      <button className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700" onClick={() => ouvrirModalSolde('recharge')}>+ Recharger</button>
                      <button className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50" onClick={() => ouvrirModalSolde('retrait')}>↓ Retirer</button>
                    </div>
                  </div>

                  <p className="mb-3 mt-7 text-sm font-bold text-slate-900">Historique des transactions</p>
                  {transactions.length === 0 ? (
                    <p className="py-5 text-center text-[13px] text-slate-400">Aucune transaction pour le moment</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {transactions.map(t => (
                        <div key={t.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                          <div>
                            <div className="text-[13px] font-semibold text-slate-800">
                              {t.type === 'recharge' ? '⬆️ Recharge' : '⬇️ Retrait'} · {OPERATEURS.find(o => o.value === t.methode)?.label}
                            </div>
                            <div className="text-xs text-slate-400">{new Date(t.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                          </div>
                          <div className="text-right">
                            <div className={`font-bold ${t.type === 'recharge' ? 'text-emerald-600' : 'text-red-600'}`}>
                              {t.type === 'recharge' ? '+' : '-'}{formaterMontant(t.montant)}
                            </div>
                            <span className={`text-[11px] font-semibold ${t.statut === 'reussi' ? 'text-emerald-600' : t.statut === 'echoue' ? 'text-red-600' : 'text-accent-600'}`}>
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
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/50 p-5 backdrop-blur-sm">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-7 shadow-2xl">
            <h3 className="mb-1 text-xl font-bold text-slate-900">
              {modalSolde === 'recharge' ? '⬆️ Recharger mon solde' : '⬇️ Retirer mon solde'}
            </h3>
            <p className="mb-4 text-[13px] text-slate-400">
              {modalSolde === 'recharge'
                ? 'Un prélèvement sera effectué sur le numéro renseigné.'
                : 'Les fonds seront transférés sur le numéro renseigné.'}
            </p>

            <label className={champLabel}>Opérateur *</label>
            <select className={champInput} value={formSolde.methode} onChange={e => setFormSolde({ ...formSolde, methode: e.target.value })}>
              {OPERATEURS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            <label className={champLabel}>Numéro de téléphone *</label>
            <input className={champInput} placeholder="+22997001122" value={formSolde.telephone} onChange={e => setFormSolde({ ...formSolde, telephone: e.target.value })} />

            <label className={champLabel}>Montant (FCFA) *</label>
            <input className={champInput} type="number" placeholder="10000" value={formSolde.montant} onChange={e => setFormSolde({ ...formSolde, montant: e.target.value })} />

            {erreur && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-600">{erreur}</p>}

            <div className="mt-5 flex gap-3">
              <button className="flex-1 rounded-xl border border-slate-200 px-5 py-3 text-sm text-slate-600 hover:bg-slate-50" onClick={() => setModalSolde(null)}>Annuler</button>
              <button className="flex-1 rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60" onClick={lancerOperationSolde} disabled={envoi}>
                {envoi ? 'Traitement...' : modalSolde === 'recharge' ? '✅ Lancer la recharge' : '✅ Lancer le retrait'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
