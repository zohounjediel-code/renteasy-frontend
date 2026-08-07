import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const API_BASE = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
import ClocheNotifications from '../components/ClocheNotifications';
import { useAuth } from '../context/AuthContext';
import BoutonActiverRole from '../components/BoutonActiverRole';
import SignaturePad from '../components/SignaturePad';
import Chat from '../components/Chat';
import Lightbox from '../components/Lightbox';

const STATUT = {
  payee: { cls: 'bg-emerald-50 text-emerald-700', label: '✅ Payée' },
  en_attente: { cls: 'bg-accent-50 text-accent-700', label: '⏳ En attente' },
  impayee: { cls: 'bg-red-50 text-red-600', label: '❌ Impayée' },
  partielle: { cls: 'bg-blue-50 text-blue-700', label: '⚡ Partielle' },
  en_recouvrement: { cls: 'bg-purple-50 text-purple-700', label: '🔄 En recouvrement' },
};

const LABELS_DUREE = { jours: 'jour(s)', semaines: 'semaine(s)', mois: 'mois', annees: 'année(s)' };
const JOURS_SEMAINE = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MOIS_NOMS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

function libelleEcheance(c) {
  if (c.type_loyer === 'mensuel') return `Échéance le ${c.jour_echeance} de chaque mois`;
  if (c.type_loyer === 'hebdomadaire') {
    const jour = c.jour_semaine_echeance ?? new Date(c.date_debut).getDay();
    return `Échéance chaque ${JOURS_SEMAINE[jour] || ''}`;
  }
  if (c.type_loyer === 'annuel') {
    const jour = c.jour_echeance_annuel || new Date(c.date_debut).getDate();
    const mois = c.mois_echeance_annuel || (new Date(c.date_debut).getMonth() + 1);
    return `Échéance chaque ${jour} ${MOIS_NOMS[mois - 1]}`;
  }
  return 'Échéance chaque jour';
}

const btnAccepter = 'rounded-lg bg-brand-600 px-4 py-2 text-[13px] font-bold text-white hover:bg-brand-700 disabled:opacity-60';
const btnRefuser = 'rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-[13px] font-semibold text-red-600 hover:bg-red-100';
const btnVoir = 'rounded-lg border border-accent-200 bg-accent-50 px-4 py-2 text-[13px] font-semibold text-accent-700 hover:bg-accent-100';
const btnAgent = 'rounded-lg border border-brand-200 bg-brand-50 px-4 py-2 text-[13px] font-semibold text-brand-700 hover:bg-brand-100';
const modal = 'w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-7 shadow-2xl';
const overlay = 'fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/50 p-5 backdrop-blur-sm';
const modalInput = 'mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30';
const blocDetail = 'rounded-xl border border-slate-100 bg-slate-50 p-3.5';
const blocDetailTitre = 'mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400';

export default function LocataireDashboard() {
  const [data, setData] = useState(null);
  const [liaisons, setLiaisons] = useState([]);
  const [contratsEnAttente, setContratsEnAttente] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [filtre, setFiltre] = useState('tous');
  const [traitementLiaison, setTraitementLiaison] = useState(null);
  const [modalSignature, setModalSignature] = useState(null);
  const [contratDetail, setContratDetail] = useState(null);
  const [chargementDetail, setChargementDetail] = useState(false);
  const [signatureLocataire, setSignatureLocataire] = useState(null);
  const [envoiSignature, setEnvoiSignature] = useState(false);
  const [erreurSignature, setErreurSignature] = useState('');
  const [voirToutesEcheances, setVoirToutesEcheances] = useState(false);
  const [envoiPaiement, setEnvoiPaiement] = useState(null);
  const [modalTranche, setModalTranche] = useState(null);
  const [montantTranche, setMontantTranche] = useState('');
  const [erreurPaiement, setErreurPaiement] = useState('');
  const [modalResiliation, setModalResiliation] = useState(null);
  const [noteResiliation, setNoteResiliation] = useState('');
  const [envoiResiliation, setEnvoiResiliation] = useState(false);
  const [erreurResiliation, setErreurResiliation] = useState('');
  const [modalAgent, setModalAgent] = useState(null);
  const [agentInfo, setAgentInfo] = useState(null);
  const [chargementAgent, setChargementAgent] = useState(false);
  const [afficherChatAgent, setAfficherChatAgent] = useState(false);
  const { utilisateur, deconnecter } = useAuth();
  const navigate = useNavigate();

  // Si l'utilisateur a aussi le rôle propriétaire, proposer de basculer
  const estAussiProprietaire = (utilisateur?.role || '').includes('proprietaire');

  useEffect(() => {
    chargerDonnees();
  }, []);

  function chargerDonnees() {
    Promise.all([
      api.get('/locataire/dashboard'),
      api.get('/locataire/liaisons'),
      api.get('/locataire/contrats-en-attente'),
    ])
      .then(([rDash, rLiaisons, rContrats]) => {
        setData(rDash.data);
        setLiaisons(rLiaisons.data);
        setContratsEnAttente(rContrats.data);
      })
      .catch(console.error)
      .finally(() => setChargement(false));
  }

  async function accepterLiaison(id) {
    setTraitementLiaison(id);
    try {
      await api.post(`/locataire/liaisons/${id}/accepter`);
      chargerDonnees();
    } catch (e) {
      alert(e.response?.data?.message || "Erreur lors de l'acceptation");
    } finally {
      setTraitementLiaison(null);
    }
  }

  async function refuserLiaison(id) {
    setTraitementLiaison(id);
    try {
      await api.post(`/locataire/liaisons/${id}/refuser`);
      chargerDonnees();
    } catch (e) {
      alert(e.response?.data?.message || 'Erreur lors du refus');
    } finally {
      setTraitementLiaison(null);
    }
  }

  function ouvrirModalSignature(contrat) {
    setModalSignature(contrat);
    setSignatureLocataire(null);
    setErreurSignature('');
  }

  async function voirContrat(id) {
    setContratDetail(null);
    setChargementDetail(true);
    try {
      const r = await api.get(`/locataire/contrats/${id}`);
      setContratDetail(r.data);
    } catch (e) {
      alert(e.response?.data?.message || 'Erreur lors du chargement du contrat');
    } finally {
      setChargementDetail(false);
    }
  }

  async function telechargerContratPDF(id) {
    try {
      const r = await api.get(`/locataire/contrats/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `contrat-${id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert('Erreur lors du téléchargement du PDF');
    }
  }

  async function signerContrat() {
    setErreurSignature('');
    if (!signatureLocataire) {
      setErreurSignature('Dessinez votre signature pour signer le contrat');
      return;
    }
    setEnvoiSignature(true);
    try {
      await api.post(`/locataire/contrats/${modalSignature.id}/signer`, { signature_locataire: signatureLocataire });
      setModalSignature(null);
      chargerDonnees();
    } catch (e) {
      setErreurSignature(e.response?.data?.message || 'Erreur lors de la signature');
    } finally {
      setEnvoiSignature(false);
    }
  }

  async function refuserContrat(id) {
    if (!window.confirm('Refuser ce contrat ? Cette action est définitive.')) return;
    try {
      await api.post(`/locataire/contrats/${id}/refuser`);
      chargerDonnees();
    } catch (e) {
      alert(e.response?.data?.message || 'Erreur lors du refus');
    }
  }

  async function payerEcheance(id) {
    if (!window.confirm('Payer cette échéance depuis votre solde RentEasy ?')) return;
    setEnvoiPaiement(id);
    try {
      const r = await api.post(`/locataire/echeances/${id}/payer`);
      alert(r.data.message);
      chargerDonnees();
    } catch (e) {
      alert(e.response?.data?.message || 'Erreur lors du paiement');
    } finally {
      setEnvoiPaiement(null);
    }
  }

  function ouvrirModalTranche(echeance) {
    setModalTranche(echeance);
    setMontantTranche('');
    setErreurPaiement('');
  }

  async function payerTranche() {
    setErreurPaiement('');
    if (!montantTranche || parseInt(montantTranche) <= 0) {
      setErreurPaiement('Renseignez un montant valide');
      return;
    }
    setEnvoiPaiement(modalTranche.id);
    try {
      const r = await api.post(`/locataire/echeances/${modalTranche.id}/payer`, { montant: parseInt(montantTranche) });
      setModalTranche(null);
      alert(r.data.message);
      chargerDonnees();
    } catch (e) {
      setErreurPaiement(e.response?.data?.message || 'Erreur lors du paiement');
    } finally {
      setEnvoiPaiement(null);
    }
  }

  function ouvrirModalResiliation(contrat) {
    setModalResiliation(contrat);
    setNoteResiliation('');
    setErreurResiliation('');
  }

  async function soumettreResiliation() {
    setErreurResiliation('');
    setEnvoiResiliation(true);
    try {
      const r = await api.post(`/locataire/contrats/${modalResiliation.id}/demander-resiliation`, { note_locataire: noteResiliation || undefined });
      alert(r.data.message);
      setModalResiliation(null);
      chargerDonnees();
    } catch (e) {
      setErreurResiliation(e.response?.data?.message || 'Erreur lors de la demande');
    } finally {
      setEnvoiResiliation(false);
    }
  }

  async function ouvrirAgentResponsable(contratId) {
    setModalAgent(contratId);
    setAgentInfo(null);
    setAfficherChatAgent(false);
    setChargementAgent(true);
    try {
      const r = await api.get(`/locataire/contrats/${contratId}/agent`);
      setAgentInfo(r.data);
    } catch (e) {
      alert(e.response?.data?.message || "Erreur lors du chargement de l'agent");
      setModalAgent(null);
    } finally {
      setChargementAgent(false);
    }
  }

  function formaterMontant(n) {
    return parseInt(n).toLocaleString('fr-FR') + ' FCFA';
  }
  function formaterDate(d) {
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  const echeances = data?.echeances || [];
  const maintenant = new Date();
  // Comparaison par date calendaire (pas par instant précis) : une échéance dont la date limite
  // est aujourd'hui ne doit pas apparaître en retard tant que la journée n'est pas terminée.
  const aujourdHui = new Date(Date.UTC(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate()));
  const echeancesEnRetard = echeances.filter(e => (e.statut === 'impayee' || e.statut === 'partielle' || e.statut === 'en_recouvrement') && new Date(e.date_limite) < aujourdHui);
  // Échéances en attente dont l'échéance tombe dans le mois en cours : pas encore en retard,
  // mais le locataire doit pouvoir les voir et les payer sans attendre qu'elles deviennent impayées.
  const echeancesEnAttenteMoisEnCours = echeances.filter(e => {
    if (e.statut !== 'en_attente') return false;
    const d = new Date(e.date_limite);
    return d.getMonth() === maintenant.getMonth() && d.getFullYear() === maintenant.getFullYear();
  });
  const echeancesParDefaut = [...echeancesEnRetard, ...echeancesEnAttenteMoisEnCours].sort((a, b) => new Date(a.date_limite) - new Date(b.date_limite));
  const echeancesFiltrees = filtre === 'tous' ? echeances : echeances.filter(e => e.statut === filtre);
  const echeancesAffichees = voirToutesEcheances ? echeancesFiltrees : echeancesParDefaut;

  if (chargement) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-50">
        <p className="text-slate-400">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-50">
      <nav className="re-nav sticky top-0 z-[100] flex h-[60px] items-center justify-between border-b border-slate-100 bg-white/95 px-6 backdrop-blur">
        <div className="text-lg text-slate-900">🏠 <strong>RentEasy</strong> <span className="text-accent-600">Bénin</span></div>
        <div className="flex flex-wrap items-center gap-1.5">
          {estAussiProprietaire && (
            <>
              <button className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-bold text-white hover:bg-brand-700" onClick={() => navigate('/marche')}>🏪 Marché</button>
              <button className="whitespace-nowrap rounded-lg bg-accent-500 px-3 py-1.5 text-sm font-bold text-white hover:bg-accent-600" onClick={() => navigate('/dashboard')}>
                🔄 Espace propriétaire
              </button>
            </>
          )}
          <button className="whitespace-nowrap rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50" onClick={() => navigate('/profil')}>👤 Mon profil</button>
          <button className="whitespace-nowrap rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50" onClick={deconnecter}>Déconnexion</button>
          <ClocheNotifications />
        </div>
      </nav>

      <div className="mx-auto max-w-4xl px-6 py-7">
        <div className="mb-6">
          <h2 className="text-2xl font-extrabold text-slate-900">Bonjour, {utilisateur?.nom} 👋</h2>
          <p className="mt-1 text-sm text-slate-500">Espace locataire</p>
        </div>

        <div className="mb-6"><BoutonActiverRole /></div>

        {liaisons.length > 0 && (
          <div className="mb-6 flex flex-col gap-2.5">
            {liaisons.map(l => (
              <div key={l.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent-200 bg-accent-50 px-5 py-4">
                <div>
                  <p className="m-0 text-sm font-semibold text-slate-800">📨 {l.proprietaire_nom} souhaite vous ajouter comme locataire</p>
                  <p className="mt-1 text-xs text-slate-500">{l.proprietaire_telephone}{l.proprietaire_ville ? ` · ${l.proprietaire_ville}` : ''}</p>
                </div>
                <div className="flex gap-2.5">
                  <button className={btnRefuser} onClick={() => refuserLiaison(l.id)} disabled={traitementLiaison === l.id}>
                    ✕ Refuser
                  </button>
                  <button className={btnAccepter} onClick={() => accepterLiaison(l.id)} disabled={traitementLiaison === l.id}>
                    {traitementLiaison === l.id ? '...' : '✓ Accepter'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {contratsEnAttente.length > 0 && (
          <div className="mb-6 flex flex-col gap-2.5">
            {contratsEnAttente.map(c => (
              <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-200 bg-brand-50 px-5 py-4">
                <div>
                  <p className="m-0 text-sm font-semibold text-slate-800">✍️ Contrat à signer — {c.numero_bien}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {c.adresse || 'Véhicule'}, {c.ville} · Proposé par {c.proprietaire_nom} · {formaterMontant(c.loyer_mensuel)} / {c.type_loyer}
                  </p>
                </div>
                <div className="flex gap-2.5">
                  <button className={btnVoir} onClick={() => voirContrat(c.id)}>👁️ Voir le contrat</button>
                  <button className={btnRefuser} onClick={() => refuserContrat(c.id)}>✕ Refuser</button>
                  <button className={btnAccepter} onClick={() => ouvrirModalSignature(c)}>✍️ Signer</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contrats actifs */}
        {(data?.contrats || []).map(c => (
          <div key={c.id} className="mb-6 rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 p-6 text-white shadow-card">
            <div className="mb-4">
              <span className="rounded-full bg-white/15 px-3 py-1 text-[13px] font-semibold">📋 Contrat actif</span>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
              <div>
                <p className="mb-1 text-[11px] uppercase tracking-wide text-white/60">Bien loué</p>
                <p className="mb-0.5 text-[15px] font-semibold">{c.adresse}</p>
                <p className="text-xs text-white/60">{c.ville} · {c.type_bien}</p>
              </div>
              <div>
                <p className="mb-1 text-[11px] uppercase tracking-wide text-white/60">Propriétaire</p>
                <p className="mb-0.5 text-[15px] font-semibold">{c.proprietaire_nom}</p>
                <p className="text-xs text-white/60">{c.proprietaire_telephone}</p>
              </div>
              <div>
                <p className="mb-1 text-[11px] uppercase tracking-wide text-white/60">Loyer mensuel</p>
                <p className="mb-0.5 text-xl font-bold text-accent-300">{formaterMontant(c.loyer_mensuel)}</p>
                <p className="text-xs text-white/60">{libelleEcheance(c)}</p>
              </div>
              <div>
                <p className="mb-1 text-[11px] uppercase tracking-wide text-white/60">Statistiques</p>
                <p className="mb-0.5 text-[15px] font-semibold">{c.stats?.payees || 0} / {c.stats?.total || 0} payées</p>
                <p className={`text-xs ${c.stats?.impayees > 0 ? 'text-red-300' : 'text-emerald-300'}`}>
                  {c.stats?.impayees > 0 ? `⚠️ ${c.stats.impayees} impayée(s)` : '✅ À jour'}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <button className="rounded-lg bg-white/10 px-4 py-2 text-[13px] font-semibold text-white hover:bg-white/20" onClick={() => voirContrat(c.id)}>👁️ Voir</button>
              <button className="rounded-lg bg-white/10 px-4 py-2 text-[13px] font-semibold text-white hover:bg-white/20" onClick={() => telechargerContratPDF(c.id)}>📄 Télécharger</button>
              <button className="rounded-lg bg-white/10 px-4 py-2 text-[13px] font-semibold text-white hover:bg-white/20" onClick={() => ouvrirAgentResponsable(c.id)}>👔 Agent responsable</button>
              <button className="rounded-lg bg-red-500/80 px-4 py-2 text-[13px] font-semibold text-white hover:bg-red-500" onClick={() => ouvrirModalResiliation(c)}>⚠️ Résilier</button>
            </div>
          </div>
        ))}

        {data?.contrats?.length === 0 && (
          <div className="mb-6 rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 p-10 text-center text-slate-400 shadow-card">
            <p>🏠 Aucun contrat actif trouvé.</p>
            <p className="text-sm text-slate-400">Contactez votre propriétaire pour plus d'informations.</p>
          </div>
        )}

        {/* Échéances */}
        <div className="rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 p-6 shadow-card">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-bold text-slate-900">Mes échéances</h3>
            <div className="flex flex-wrap items-center gap-2">
              {voirToutesEcheances && ['tous', 'en_attente', 'payee', 'impayee', 'partielle', 'en_recouvrement'].map(f => (
                <button
                  key={f}
                  className={`rounded-full border-[1.5px] px-3.5 py-1 text-xs font-medium ${filtre === f ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 bg-white text-slate-600'}`}
                  onClick={() => setFiltre(f)}
                >
                  {f === 'tous' ? 'Toutes' : STATUT[f]?.label || f}
                </button>
              ))}
              <button className="rounded-full border border-accent-300 px-3.5 py-1 text-xs font-semibold text-accent-700 hover:bg-accent-50" onClick={() => setVoirToutesEcheances(!voirToutesEcheances)}>
                {voirToutesEcheances ? '▲ Voir moins' : '▼ Voir plus'}
              </button>
            </div>
          </div>

          {!voirToutesEcheances && (
            <p className="mb-3 text-xs text-slate-400">
              Affichage des échéances déjà en retard et de celles en attente du mois en cours. Cliquez sur "Voir plus" pour tout afficher.
            </p>
          )}

          {echeancesAffichees.length === 0 ? (
            <p className="py-5 text-center text-slate-400">
              {voirToutesEcheances ? 'Aucune échéance trouvée' : '🎉 Aucune échéance en retard ni en attente ce mois-ci'}
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <div className="grid min-w-[560px] grid-cols-[1.3fr_1.8fr_1.1fr_1.2fr_1.6fr] bg-brand-50 px-4 py-2.5 text-xs font-bold uppercase text-brand-700">
                <span>Période</span>
                <span>Bien</span>
                <span>Montant</span>
                <span>Statut</span>
                <span>Action</span>
              </div>
              {echeancesAffichees.map(e => {
                const st = STATUT[e.statut] || { cls: 'bg-slate-100 text-slate-500', label: e.statut };
                return (
                  <div key={e.id} className="grid min-w-[560px] grid-cols-[1.3fr_1.8fr_1.1fr_1.2fr_1.6fr] items-center border-t border-slate-50 px-4 py-3 text-sm">
                    <span className="font-semibold capitalize text-slate-800">{formaterDate(e.mois_concerne)}</span>
                    <span className="text-[13px] text-slate-400">{e.adresse}</span>
                    <span className="font-bold text-brand-700">
                      {formaterMontant(e.statut === 'partielle' ? e.montant_restant : e.montant_du)}
                      {e.statut === 'partielle' && <span className="block text-[11px] font-normal text-slate-400">reste sur {formaterMontant(e.montant_du)}</span>}
                    </span>
                    <span className={`inline-block w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${st.cls}`}>{st.label}</span>
                    <span>
                      {e.statut !== 'payee' && (
                        <div className="flex flex-wrap gap-1.5">
                          <button className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-60" onClick={() => payerEcheance(e.id)} disabled={envoiPaiement === e.id}>
                            {envoiPaiement === e.id ? '...' : '💳 Payer'}
                          </button>
                          <button className="rounded-lg border border-accent-200 bg-accent-50 px-3 py-1.5 text-xs font-semibold text-accent-700 hover:bg-accent-100 disabled:opacity-60" onClick={() => ouvrirModalTranche(e)} disabled={envoiPaiement === e.id}>
                            🔢 Tranche
                          </button>
                        </div>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {(contratDetail || chargementDetail) && (
        <div className={overlay}>
          <div className={`${modal} max-w-lg`}>
            {chargementDetail ? (
              <p className="py-5 text-center text-slate-400">Chargement du contrat...</p>
            ) : (
              <>
                <div className="mb-1 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-900">📄 Contrat de location</h3>
                  <button className={btnRefuser} onClick={() => setContratDetail(null)}>✕ Fermer</button>
                </div>
                <p className="mb-4 text-xs font-bold text-accent-600">🔖 {contratDetail.numero_bien}</p>

                <div className="mt-2 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
                  <div className={blocDetail}>
                    <p className={blocDetailTitre}>📍 Bien loué</p>
                    <p className="m-0 text-sm text-slate-700">{contratDetail.adresse || contratDetail.lieu_depot}</p>
                    <p className="m-0 text-[13px] text-slate-400">{contratDetail.ville}{contratDetail.quartier ? `, ${contratDetail.quartier}` : ''}</p>
                  </div>
                  <div className={blocDetail}>
                    <p className={blocDetailTitre}>👤 Propriétaire</p>
                    <p className="m-0 text-sm text-slate-700">{contratDetail.proprietaire_nom}</p>
                    <p className="m-0 text-[13px] text-slate-400">{contratDetail.proprietaire_telephone}</p>
                  </div>
                  <div className={blocDetail}>
                    <p className={blocDetailTitre}>📅 Durée</p>
                    <p className="m-0 text-sm text-slate-700">Début : {new Date(contratDetail.date_debut).toLocaleDateString('fr-FR')}</p>
                    <p className="m-0 text-[13px] text-slate-400">{libelleEcheance(contratDetail)}</p>
                    <p className="m-0 text-[13px] text-slate-400">
                      Durée : {contratDetail.duree_valeur ? `${contratDetail.duree_valeur} ${LABELS_DUREE[contratDetail.duree_unite] || contratDetail.duree_unite} (fin le ${new Date(contratDetail.date_fin).toLocaleDateString('fr-FR')})` : 'Indéterminée'}
                    </p>
                  </div>
                  <div className={blocDetail}>
                    <p className={blocDetailTitre}>💰 Loyer</p>
                    <p className="m-0 text-lg font-bold text-brand-700">{formaterMontant(contratDetail.loyer_mensuel)}</p>
                    <p className="m-0 text-[13px] text-slate-400">Périodicité : {contratDetail.type_loyer}{contratDetail.caution > 0 ? ` · Caution : ${formaterMontant(contratDetail.caution)}` : ''}</p>
                  </div>
                </div>

                {contratDetail.photos && contratDetail.photos.length > 0 && (
                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className={blocDetailTitre}>📷 Aperçu du bien</p>
                      <Lightbox medias={contratDetail.photos} />
                    </div>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] gap-2">
                      {contratDetail.photos.map(photo => (
                        <img key={photo} src={`${API_BASE}${photo}`} alt="Aperçu" className="h-[70px] w-full rounded-lg border border-slate-100 object-cover" />
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 rounded-lg border border-brand-200 bg-brand-50 p-3">
                  <p className="m-0 text-xs text-brand-800">
                    {contratDetail.statut === 'en_attente_signature'
                      ? '✍️ Ce contrat a été signé par le propriétaire et attend votre signature pour devenir officiellement actif.'
                      : contratDetail.statut === 'actif'
                      ? '✅ Ce contrat est actif et signé par les deux parties.'
                      : 'Statut : ' + contratDetail.statut}
                  </p>
                </div>

                {contratDetail.echeances && contratDetail.echeances.length > 0 && (
                  <div className="mt-4">
                    <p className={blocDetailTitre}>📊 Échéances</p>
                    <div className="overflow-x-auto rounded-lg border border-slate-100">
                      <div className="grid min-w-[360px] grid-cols-[1.4fr_1.1fr_1.2fr] bg-brand-50 px-4 py-2.5 text-xs font-bold uppercase text-brand-700">
                        <span>Période</span>
                        <span>Montant</span>
                        <span>Statut</span>
                      </div>
                      {contratDetail.echeances.map(e => {
                        const st = STATUT[e.statut] || { cls: 'bg-slate-100 text-slate-500', label: e.statut };
                        return (
                          <div key={e.id} className="grid min-w-[360px] grid-cols-[1.4fr_1.1fr_1.2fr] items-center border-t border-slate-50 px-4 py-3 text-sm">
                            <span className="font-semibold text-slate-700">{formaterDate(e.mois_concerne)}</span>
                            <span className="font-bold text-slate-900">
                              {formaterMontant(e.statut === 'partielle' ? e.montant_restant : e.montant_du)}
                              {e.statut === 'partielle' && <span className="block text-[10px] font-normal text-slate-400">reste sur {formaterMontant(e.montant_du)}</span>}
                            </span>
                            <span className={`inline-block w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${st.cls}`}>{st.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="mt-5 flex gap-3">
                  <button className={`${btnRefuser} flex-1`} onClick={() => telechargerContratPDF(contratDetail.id)}>📄 Télécharger le PDF</button>
                  {contratDetail.statut === 'en_attente_signature' && (
                    <button className={`${btnAccepter} flex-1`} onClick={() => { setContratDetail(null); ouvrirModalSignature(contratDetail); }}>
                      ✍️ Signer maintenant
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {modalSignature && (
        <div className={overlay}>
          <div className={modal}>
            <h3 className="mb-1 text-xl font-bold text-slate-900">✍️ Signer le contrat</h3>
            <p className="mb-4 text-[13px] text-slate-400">
              {modalSignature.numero_bien} — {modalSignature.adresse || 'Véhicule'}, {modalSignature.ville} · {formaterMontant(modalSignature.loyer_mensuel)} / {modalSignature.type_loyer}
            </p>
            <p className="mb-3 text-[13px] text-slate-500">
              Dessinez votre signature ci-dessous pour signer électroniquement ce contrat. Il deviendra alors officiellement actif.
            </p>
            <SignaturePad onChange={setSignatureLocataire} />
            {erreurSignature && <p className="mt-2 text-[13px] text-red-600">{erreurSignature}</p>}
            <div className="mt-5 flex gap-3">
              <button className={btnRefuser} onClick={() => setModalSignature(null)}>Annuler</button>
              <button className={btnAccepter} onClick={signerContrat} disabled={envoiSignature}>
                {envoiSignature ? 'Signature...' : '✍️ Signer et valider'}
              </button>
            </div>
          </div>
        </div>
      )}
      {modalTranche && (
        <div className={overlay}>
          <div className={modal}>
            <h3 className="mb-1 text-xl font-bold text-slate-900">🔢 Payer une tranche</h3>
            <p className="mb-4 text-[13px] text-slate-400">
              {formaterDate(modalTranche.mois_concerne)} · {modalTranche.adresse} · Dû : {formaterMontant(modalTranche.statut === 'partielle' ? modalTranche.montant_restant : modalTranche.montant_du)}
            </p>
            <label className="text-sm font-bold text-slate-900">Montant à payer (FCFA) *</label>
            <input
              className={modalInput}
              type="number"
              placeholder="Ex: 20000"
              value={montantTranche}
              onChange={e => setMontantTranche(e.target.value)}
            />
            {erreurPaiement && <p className="mt-2 text-[13px] text-red-600">{erreurPaiement}</p>}
            <div className="mt-5 flex gap-3">
              <button className={btnRefuser} onClick={() => setModalTranche(null)}>Annuler</button>
              <button className={btnAccepter} onClick={payerTranche} disabled={envoiPaiement === modalTranche.id}>
                {envoiPaiement === modalTranche.id ? 'Paiement...' : '💳 Payer la tranche'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalResiliation && (
        <div className={overlay}>
          <div className={modal}>
            <h3 className="mb-1 text-xl font-bold text-red-600">⚠️ Demande de résiliation</h3>
            <p className="mb-4 text-[13px] text-slate-400">
              {modalResiliation.adresse}, {modalResiliation.ville}
            </p>
            <p className="mb-3 text-[13px] text-slate-500">
              Votre demande sera envoyée à l'agent en charge de ce propriétaire pour traitement.
            </p>
            <label className="text-sm font-bold text-slate-900">Motif (optionnel)</label>
            <textarea
              className={`${modalInput} h-20 resize-y`}
              placeholder="Expliquez la raison de votre demande..."
              value={noteResiliation}
              onChange={e => setNoteResiliation(e.target.value)}
            />
            {erreurResiliation && <p className="mt-2 text-[13px] text-red-600">{erreurResiliation}</p>}
            <div className="mt-5 flex gap-3">
              <button className={btnRefuser} onClick={() => setModalResiliation(null)}>Annuler</button>
              <button className="rounded-lg bg-red-600 px-4 py-2 text-[13px] font-bold text-white hover:bg-red-700 disabled:opacity-60" onClick={soumettreResiliation} disabled={envoiResiliation}>
                {envoiResiliation ? 'Envoi...' : 'Envoyer la demande'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalAgent && (
        <div className={overlay}>
          <div className={`${modal} ${afficherChatAgent ? 'max-w-[520px]' : 'max-w-[420px]'}`}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">👔 Agent responsable</h3>
              <button className={btnRefuser} onClick={() => setModalAgent(null)}>✕ Fermer</button>
            </div>

            {chargementAgent ? (
              <p className="py-5 text-center text-slate-400">Chargement...</p>
            ) : agentInfo && (
              afficherChatAgent ? (
                <>
                  <button className={`${btnVoir} mb-3`} onClick={() => setAfficherChatAgent(false)}>← Retour aux infos</button>
                  <Chat interlocuteur={agentInfo} contexte="locataire" />
                </>
              ) : (
                <>
                  <div className={blocDetail}>
                    <p className="mb-1 text-base font-bold text-slate-900">{agentInfo.nom}</p>
                    <p className="my-0.5 text-[13px] text-slate-500">📞 {agentInfo.telephone}</p>
                    <p className="my-0.5 text-[13px] text-slate-500">✉️ {agentInfo.email}</p>
                    {agentInfo.ville && <p className="my-0.5 text-[13px] text-slate-500">📍 {agentInfo.ville}</p>}
                  </div>
                  <div className="mt-4 flex gap-2.5">
                    <a href={`tel:${agentInfo.telephone}`} className={`${btnAccepter} flex-1 text-center no-underline`}>📞 Appeler</a>
                    <button className={`${btnVoir} flex-1`} onClick={() => setAfficherChatAgent(true)}>💬 Discuter</button>
                  </div>
                </>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
