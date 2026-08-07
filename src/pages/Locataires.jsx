import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

const API_BASE = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

function estVideo(chemin) {
  return /\.(mp4|webm|mov|quicktime)$/i.test(chemin);
}
import ClocheNotifications from '../components/ClocheNotifications';
import { useAuth } from '../context/AuthContext';
import SignaturePad from '../components/SignaturePad';
import Lightbox from '../components/Lightbox';

const LABELS_LOYER = { journalier: 'Journalier', hebdomadaire: 'Hebdomadaire', mensuel: 'Mensuel', annuel: 'Annuel' };
const LABELS_DUREE = { jours: 'jour(s)', semaines: 'semaine(s)', mois: 'mois', annees: 'année(s)' };
// L'unité de durée doit toujours correspondre au type de loyer choisi
const UNITE_SELON_TYPE_LOYER = { journalier: 'jours', hebdomadaire: 'semaines', mensuel: 'mois', annuel: 'annees' };

const JOURS_SEMAINE = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MOIS_NOMS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

// Calcule le libellé de l'échéance automatiquement à partir de la date de début et du type de loyer
// (l'échéance suit toujours la date de début, elle n'est jamais choisie manuellement)
function libelleEcheanceAuto(date_debut, type_loyer) {
  if (!date_debut || !type_loyer) return '';
  const d = new Date(date_debut);
  if (type_loyer === 'mensuel') return `Échéance chaque ${Math.min(d.getDate(), 28)} du mois`;
  if (type_loyer === 'hebdomadaire') return `Échéance chaque ${JOURS_SEMAINE[d.getDay()]} (début + 7 jours)`;
  if (type_loyer === 'annuel') return `Échéance chaque ${d.getDate()} ${MOIS_NOMS[d.getMonth()]}`;
  if (type_loyer === 'journalier') return 'Échéance chaque jour';
  return '';
}

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

const champLabel = 'mt-3 mb-1 block text-sm font-semibold text-slate-700';
const champInput = 'w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30';
const boutonPrim = 'rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60';
const boutonSec = 'rounded-xl border-[1.5px] border-accent-300 bg-white px-5 py-2.5 text-sm font-semibold text-accent-700 hover:bg-accent-50';
const btnFermer = 'rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-200';
const card = 'mb-6 rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 p-6 shadow-card';
const cardTitre = 'mb-4 text-lg font-bold text-slate-900';
const grille2 = 'mb-4 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4';
const badgeAttente = 'rounded-full bg-accent-50 px-2.5 py-1 text-xs font-semibold text-accent-700';
const bloc = 'rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm';
const blocTitre = 'mb-2 text-[13px] font-bold text-brand-700';

const STATUT_ECHEANCE = {
  payee: { cls: 'bg-emerald-50 text-emerald-700', label: 'Payée' },
  en_attente: { cls: 'bg-accent-50 text-accent-700', label: 'En attente' },
  impayee: { cls: 'bg-red-50 text-red-600', label: 'Impayée' },
  partielle: { cls: 'bg-blue-50 text-blue-700', label: 'Partielle' },
};

export default function Locataires() {
  const [locataires, setLocataires] = useState([]);
  const [liaisonsEnAttente, setLiaisonsEnAttente] = useState([]);
  const [biens, setBiens] = useState([]);
  const [contrats, setContrats] = useState([]);
  const [afficherFormLocataire, setAfficherFormLocataire] = useState(false);
  const [afficherFormContrat, setAfficherFormContrat] = useState(false);
  const [contratDetail, setContratDetail] = useState(null);
  const [pdfApercuUrl, setPdfApercuUrl] = useState(null);
  const [modalDemande, setModalDemande] = useState(null);
  const [modalPieceIdentite, setModalPieceIdentite] = useState(null);
  const [valeurPieceIdentite, setValeurPieceIdentite] = useState('');
  const [envoiPieceIdentite, setEnvoiPieceIdentite] = useState(false);
  const [erreurPieceIdentite, setErreurPieceIdentite] = useState('');
  const [chargement, setChargement] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');
  const [contactRecherche, setContactRecherche] = useState('');
  const [numeroPieceRecherche, setNumeroPieceRecherche] = useState('');
  const [locataireTrouve, setLocataireTrouve] = useState(null);
  const [rechercheEnCours, setRechercheEnCours] = useState(false);
  const [formContrat, setFormContrat] = useState({ numero_bien: '', locataire_id: '', date_debut: '', duree_valeur: '', duree_unite: 'mois', type_loyer: '', loyer_mensuel: '', signature_proprietaire: null });
  const [bienTrouve, setBienTrouve] = useState(null);
  const [rechercheBienEnCours, setRechercheBienEnCours] = useState(false);
  const [erreurNumeroBien, setErreurNumeroBien] = useState('');
  const [formDemande, setFormDemande] = useState({ type_demande: 'modification', note_proprietaire: '', nouveau_loyer: '' });
  const navigate = useNavigate();
  const location = useLocation();
  const { utilisateur } = useAuth();
  const estAussiLocataire = (utilisateur?.role || '').includes('locataire');
  const [demandesLocataires, setDemandesLocataires] = useState([]);
  const [modalApprobation, setModalApprobation] = useState(null);
  const [modalDetailDemande, setModalDetailDemande] = useState(null);
  const [signatureApprobation, setSignatureApprobation] = useState(null);
  const [envoiApprobation, setEnvoiApprobation] = useState(false);
  const [erreurApprobation, setErreurApprobation] = useState('');

  // Un admin/super_admin peut consulter (et gérer) les locataires d'un propriétaire précis
  // via ?proprietaire_id= (repris depuis AgentProprietaireDetail).
  const parametres = new URLSearchParams(location.search);
  const proprietaireIdConsulte = parametres.get('proprietaire_id');
  const proprietaireNomConsulte = parametres.get('proprietaire_nom');
  const enConsultationAdmin = !!proprietaireIdConsulte;

  function lienConsultation(chemin) {
    if (!enConsultationAdmin) return chemin;
    const p = new URLSearchParams({ proprietaire_id: proprietaireIdConsulte });
    if (proprietaireNomConsulte) p.set('proprietaire_nom', proprietaireNomConsulte);
    return `${chemin}?${p.toString()}`;
  }

  useEffect(() => { chargerDonnees(); }, [proprietaireIdConsulte]);

  async function chargerDonnees() {
    try {
      const params = enConsultationAdmin ? { proprietaire_id: proprietaireIdConsulte } : {};
      const [rLoc, rEnAttente, rBiens, rContrats, rDemandes] = await Promise.all([
        api.get('/locataires', { params }),
        api.get('/locataires/en-attente', { params }),
        api.get('/biens', { params }),
        api.get('/contrats', { params }),
        api.get('/contrats/demandes-locataires', { params }),
      ]);
      setLocataires(rLoc.data);
      setLiaisonsEnAttente(rEnAttente.data);
      setBiens(rBiens.data.filter(b => b.statut === 'libre'));
      setContrats(rContrats.data);
      setDemandesLocataires(rDemandes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setChargement(false);
    }
  }

  function ouvrirModalApprobation(demande) {
    setModalApprobation(demande);
    setSignatureApprobation(null);
    setErreurApprobation('');
  }

  async function approuverDemandeLoc() {
    setErreurApprobation('');
    if (!signatureApprobation) {
      setErreurApprobation('Signez pour approuver cette demande');
      return;
    }
    setEnvoiApprobation(true);
    try {
      await api.post(`/contrats/${modalApprobation.id}/approuver`, { signature_proprietaire: signatureApprobation });
      setModalApprobation(null);
      chargerDonnees();
    } catch (e) {
      setErreurApprobation(e.response?.data?.message || "Erreur lors de l'approbation");
    } finally {
      setEnvoiApprobation(false);
    }
  }

  async function refuserDemandeLoc(id) {
    if (!window.confirm('Refuser cette demande ?')) return;
    try {
      await api.post(`/contrats/${id}/refuser-demande`);
      chargerDonnees();
    } catch (e) {
      alert(e.response?.data?.message || 'Erreur lors du refus');
    }
  }

  async function rechercherLocataire() {
    setErreur(''); setSucces(''); setLocataireTrouve(null);
    if (!contactRecherche) {
      setErreur('Renseignez le téléphone ou email du locataire');
      return;
    }
    setRechercheEnCours(true);
    try {
      const r = await api.get('/locataires/rechercher', { params: { contact: contactRecherche } });
      setLocataireTrouve(r.data);
    } catch (e) {
      setErreur(e.response?.data?.message || 'Aucun compte locataire trouvé');
    } finally {
      setRechercheEnCours(false);
    }
  }

  async function envoyerDemandeLiaison() {
    setErreur(''); setSucces('');
    setEnvoi(true);
    try {
      await api.post('/locataires/demander', {
        user_id: locataireTrouve.id,
        numero_piece_identite: numeroPieceRecherche || undefined,
        ...(enConsultationAdmin ? { proprietaire_id: proprietaireIdConsulte } : {}),
      });
      setContactRecherche(''); setNumeroPieceRecherche(''); setLocataireTrouve(null);
      setAfficherFormLocataire(false);
      setSucces("Demande envoyée ! Le locataire doit l'accepter pour être ajouté à votre liste.");
      chargerDonnees();
    } catch (e) {
      setErreur(e.response?.data?.message || "Erreur lors de l'envoi de la demande");
    } finally {
      setEnvoi(false);
    }
  }

  async function annulerDemandeLiaison(id) {
    try {
      await api.delete(`/locataires/en-attente/${id}`);
      chargerDonnees();
    } catch (e) {
      alert(e.response?.data?.message || 'Erreur lors de l\'annulation');
    }
  }

  async function supprimerLocataireAction(locataire) {
    if (!window.confirm(`Supprimer "${locataire.nom}" de votre liste ? Cette action est irréversible.`)) return;
    try {
      await api.delete(`/locataires/${locataire.id}`);
      chargerDonnees();
    } catch (e) {
      alert(e.response?.data?.message || 'Erreur lors de la suppression');
    }
  }

  function ouvrirModalPieceIdentite(locataire) {
    setModalPieceIdentite(locataire);
    setValeurPieceIdentite(locataire.numero_piece_identite || '');
    setErreurPieceIdentite('');
  }

  async function enregistrerPieceIdentite() {
    setEnvoiPieceIdentite(true);
    setErreurPieceIdentite('');
    try {
      await api.put(`/locataires/${modalPieceIdentite.id}`, { numero_piece_identite: valeurPieceIdentite.trim() || null });
      setModalPieceIdentite(null);
      chargerDonnees();
    } catch (e) {
      setErreurPieceIdentite(e.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setEnvoiPieceIdentite(false);
    }
  }

  async function rechercherBienParNumero() {
    setErreurNumeroBien(''); setBienTrouve(null);
    setFormContrat({ ...formContrat, type_loyer: '', loyer_mensuel: '' });
    if (!formContrat.numero_bien) return;
    setRechercheBienEnCours(true);
    try {
      const r = await api.get(`/biens/numero/${formContrat.numero_bien.trim().toUpperCase()}`);
      if (r.data.statut !== 'libre') {
        setErreurNumeroBien('Ce bien est occupé, il ne peut pas être associé à un nouveau contrat');
        return;
      }
      setBienTrouve(r.data);
    } catch (e) {
      setErreurNumeroBien(e.response?.data?.message || 'Aucun bien trouvé avec ce numéro');
    } finally {
      setRechercheBienEnCours(false);
    }
  }

  function choisirTypeLoyer(type, montant) {
    // L'unité de durée doit toujours s'adapter au type de loyer choisi
    setFormContrat({ ...formContrat, type_loyer: type, loyer_mensuel: String(montant), duree_unite: UNITE_SELON_TYPE_LOYER[type] || formContrat.duree_unite });
  }

  async function creerContrat() {
    setErreur(''); setSucces('');
    if (!formContrat.numero_bien || !formContrat.locataire_id || !formContrat.date_debut || !formContrat.type_loyer || !formContrat.loyer_mensuel) {
      setErreur('Tous les champs sont obligatoires, y compris le type de loyer');
      return;
    }
    if (!formContrat.signature_proprietaire) {
      setErreur('Vous devez signer électroniquement le contrat en dessinant votre signature');
      return;
    }
    setEnvoi(true);
    try {
      // L'échéance (jour_echeance / jour_semaine_echeance / jour_echeance_annuel / mois_echeance_annuel)
      // est désormais calculée automatiquement par le serveur à partir de la date de début, elle n'est
      // plus envoyée manuellement depuis le formulaire.
      await api.post('/contrats', {
        numero_bien: formContrat.numero_bien,
        locataire_id: formContrat.locataire_id,
        date_debut: formContrat.date_debut,
        duree_valeur: formContrat.duree_valeur,
        duree_unite: formContrat.duree_unite,
        type_loyer: formContrat.type_loyer,
        loyer_mensuel: parseInt(formContrat.loyer_mensuel),
        caution: formContrat.caution,
        signature_proprietaire: formContrat.signature_proprietaire,
        ...(enConsultationAdmin ? { proprietaire_id: proprietaireIdConsulte } : {}),
      });
      setFormContrat({ numero_bien: '', locataire_id: '', date_debut: '', duree_valeur: '', duree_unite: 'mois', type_loyer: '', loyer_mensuel: '', signature_proprietaire: null });
      setBienTrouve(null);
      setAfficherFormContrat(false);
      setSucces("Contrat signé et envoyé au locataire. Il sera actif dès que le locataire l'aura signé à son tour.");
      chargerDonnees();
    } catch (e) {
      setErreur(e.response?.data?.message || 'Erreur lors de la création du contrat');
    } finally {
      setEnvoi(false);
    }
  }

  async function voirDetailContrat(contrat) {
    try {
      const r = await api.get(`/contrats/${contrat.id}`);
      setContratDetail(r.data);
    } catch (e) { console.error(e); }
  }

  // Le PDF est protégé par JWT (pas de cookie), donc un <a href> ou window.open() direct vers
  // l'API ne fonctionnerait pas : on le récupère en blob via axios (authentifié). Affiché dans
  // un lecteur intégré (iframe) plutôt que dans un nouvel onglet : Chrome bloque la navigation
  // d'un onglet fraîchement ouvert vers une blob: URL créée ailleurs (restriction de sécurité,
  // même en synchrone) — l'iframe reste dans le même document, donc pas concerné.
  async function voirPDF(contratId) {
    try {
      const r = await api.get(`/contrats/${contratId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }));
      setPdfApercuUrl(url);
    } catch (e) { console.error(e); }
  }

  function fermerApercuPDF() {
    if (pdfApercuUrl) window.URL.revokeObjectURL(pdfApercuUrl);
    setPdfApercuUrl(null);
  }

  async function telechargerPDF(contratId) {
    try {
      const r = await api.get(`/contrats/${contratId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `contrat-${contratId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) { alert('Erreur lors du téléchargement du PDF'); }
  }

  async function soumettreDemandeContrat() {
    setErreur(''); setSucces('');
    setEnvoi(true);
    try {
      const conditions = {};
      if (formDemande.type_demande === 'modification' && formDemande.nouveau_loyer) {
        conditions.loyer_mensuel = parseInt(formDemande.nouveau_loyer);
      }
      await api.post(`/contrats/${modalDemande.id}/demande`, {
        type_demande: formDemande.type_demande,
        conditions_demandees: conditions,
        note_proprietaire: formDemande.note_proprietaire,
      });
      setModalDemande(null);
      setFormDemande({ type_demande: 'modification', note_proprietaire: '', nouveau_loyer: '' });
      setSucces("Demande soumise ! L'agent et le locataire ont été notifiés.");
      chargerDonnees();
    } catch (e) {
      setErreur(e.response?.data?.message || 'Erreur lors de la soumission');
    } finally {
      setEnvoi(false);
    }
  }

  function formaterDate(d) {
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  }
  function formaterMontant(n) {
    return parseInt(n).toLocaleString('fr-FR') + ' FCFA';
  }

  return (
    <div className="min-h-screen bg-brand-50">
      <nav className="re-nav sticky top-0 z-[100] flex h-[60px] items-center justify-between border-b border-slate-100 bg-white/95 px-6 backdrop-blur">
        <div className="cursor-pointer text-lg text-slate-900" onClick={() => navigate(lienConsultation('/dashboard'))}>🏠 <strong>RentEasy</strong> <span className="text-accent-600">Bénin</span></div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button className="whitespace-nowrap rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50" onClick={() => navigate(lienConsultation('/biens'))}>Mes biens</button>
          <button className="whitespace-nowrap rounded-lg border border-brand-600 bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700">Locataires</button>
          <button className="whitespace-nowrap rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50" onClick={() => navigate(lienConsultation('/paiements'))}>Paiements</button>
          <button className="whitespace-nowrap rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50" onClick={() => navigate(lienConsultation('/dashboard'))}>Dashboard</button>
          {estAussiLocataire && !enConsultationAdmin && (
            <button className="whitespace-nowrap rounded-lg bg-accent-500 px-3 py-1.5 text-sm font-bold text-white hover:bg-accent-600" onClick={() => navigate('/locataire/dashboard')}>🔄 Espace locataire</button>
          )}
          <button className="whitespace-nowrap rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700 hover:bg-brand-100" onClick={() => navigate('/profil')}>👤 Mon profil</button>
          <ClocheNotifications />
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-6">
        {enConsultationAdmin && (
          <div className="mb-5 rounded-xl border border-accent-200 bg-accent-50 px-4 py-2.5 text-sm text-accent-800">
            🛡️ Vous consultez et gérez les locataires de <strong>{proprietaireNomConsulte || 'ce propriétaire'}</strong> en tant qu'administrateur.
          </div>
        )}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-slate-900">Locataires &amp; Contrats</h2>
          <div className="flex gap-3">
            <button className={boutonSec} onClick={() => { setAfficherFormContrat(!afficherFormContrat); setAfficherFormLocataire(false); }}>
              {afficherFormContrat ? '✕ Annuler' : '📋 Nouveau contrat'}
            </button>
            <button className={boutonPrim} onClick={() => { setAfficherFormLocataire(!afficherFormLocataire); setAfficherFormContrat(false); }}>
              {afficherFormLocataire ? '✕ Annuler' : '+ Ajouter locataire'}
            </button>
          </div>
        </div>

        {succes && <div className="mb-4 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">{succes}</div>}

        {afficherFormLocataire && (
          <div className={card}>
            <h3 className={cardTitre}>Ajouter un locataire</h3>
            <p className="-mt-2 mb-4 text-[13px] text-slate-500">
              Le locataire doit déjà avoir un compte sur RentEasy. Il recevra une notification et devra accepter avant d'apparaître dans votre liste.
            </p>
            <div className={grille2}>
              <div>
                <label className={champLabel}>Téléphone ou email du locataire *</label>
                <input className={champInput} placeholder="+22997001122 ou email@exemple.com" value={contactRecherche} onChange={e => { setContactRecherche(e.target.value); setLocataireTrouve(null); }} onKeyDown={e => e.key === 'Enter' && rechercherLocataire()} />
              </div>
              <div className="flex items-end">
                <button className={`${boutonSec} w-full`} onClick={rechercherLocataire} disabled={rechercheEnCours}>
                  {rechercheEnCours ? 'Recherche...' : '🔍 Rechercher'}
                </button>
              </div>
            </div>

            {locataireTrouve && (
              <div className="mt-3 flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-600 text-lg font-bold text-white">{locataireTrouve.nom.charAt(0).toUpperCase()}</div>
                <div className="flex-1">
                  <div className="font-bold text-slate-900">{locataireTrouve.nom}</div>
                  <div className="text-[13px] text-slate-500">{locataireTrouve.telephone} {locataireTrouve.email ? `· ${locataireTrouve.email}` : ''}</div>
                </div>
                <span className="text-[13px] font-semibold text-brand-700">✅ Compte trouvé</span>
              </div>
            )}

            {locataireTrouve && (
              <div className="mt-3">
                <label className={champLabel}>N° pièce d'identité (optionnel)</label>
                <input className={champInput} placeholder="CIP ou passeport" value={numeroPieceRecherche} onChange={e => setNumeroPieceRecherche(e.target.value)} />
              </div>
            )}

            {erreur && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{erreur}</p>}

            {locataireTrouve && (
              <button className={`${boutonPrim} mt-4`} onClick={envoyerDemandeLiaison} disabled={envoi}>
                {envoi ? 'Envoi...' : "📨 Envoyer la demande d'ajout"}
              </button>
            )}
          </div>
        )}

        {liaisonsEnAttente.length > 0 && (
          <div className={card}>
            <h3 className={cardTitre}>⏳ Demandes en attente d'acceptation</h3>
            <div className="flex flex-col gap-2.5">
              {liaisonsEnAttente.map(l => (
                <div key={l.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <div>
                    <div className="font-semibold text-slate-900">{l.nom}</div>
                    <div className="text-xs text-slate-400">{l.telephone}{l.email ? ` · ${l.email}` : ''}</div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className={badgeAttente}>⏳ En attente</span>
                    <button className={btnFermer} onClick={() => annulerDemandeLiaison(l.id)}>✕ Annuler</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {demandesLocataires.length > 0 && (
          <div className={card}>
            <h3 className={cardTitre}>📨 Demandes de réservation / location (marché)</h3>
            <div className="flex flex-col gap-2.5">
              {demandesLocataires.map(d => (
                <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <div>
                    <div className="font-semibold text-slate-900">
                      {d.origine === 'locataire_location' ? '🔑 Location' : '📅 Réservation'} · 🔖 {d.numero_bien}
                    </div>
                    <div className="text-xs text-slate-400">
                      {d.locataire_nom} ({d.locataire_telephone}) · {d.adresse}, {d.ville}
                    </div>
                    <div className="text-xs text-slate-400">
                      Du {new Date(d.date_debut).toLocaleDateString('fr-FR')} {d.date_fin ? `au ${new Date(d.date_fin).toLocaleDateString('fr-FR')}` : '(durée indéterminée)'} · {d.type_loyer} · {parseInt(d.loyer_mensuel).toLocaleString('fr-FR')} FCFA
                    </div>
                    {d.note_locataire && <div className="mt-1 text-xs italic text-slate-400">« {d.note_locataire} »</div>}
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button className={btnFermer} onClick={() => refuserDemandeLoc(d.id)}>✕ Refuser</button>
                    <button className={boutonSec} onClick={() => setModalDetailDemande(d)}>👁️ Voir</button>
                    <button className={boutonPrim} onClick={() => ouvrirModalApprobation(d)}>✍️ Approuver et signer</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {afficherFormContrat && (
          <div className={card}>
            <h3 className={cardTitre}>Nouveau contrat de location</h3>
            {biens.length === 0 && <div className="mb-3 rounded-lg bg-accent-50 px-3 py-2 text-[13px] text-accent-800">⚠️ Aucun bien libre disponible.</div>}

            <div className={grille2}>
              <div>
                <label className={champLabel}>Numéro du bien *</label>
                <div className="flex gap-2">
                  <input
                    className={champInput}
                    placeholder="Ex: BIEN-00001"
                    value={formContrat.numero_bien}
                    onChange={e => setFormContrat({ ...formContrat, numero_bien: e.target.value })}
                    onKeyDown={e => e.key === 'Enter' && rechercherBienParNumero()}
                  />
                  <button className={`${boutonSec} whitespace-nowrap`} onClick={rechercherBienParNumero} disabled={rechercheBienEnCours}>
                    {rechercheBienEnCours ? '...' : '🔍'}
                  </button>
                </div>
                {erreurNumeroBien && <p className="mt-1 text-xs text-red-600">{erreurNumeroBien}</p>}
              </div>
              <div>
                <label className={champLabel}>Locataire *</label>
                <select className={champInput} value={formContrat.locataire_id} onChange={e => setFormContrat({ ...formContrat, locataire_id: e.target.value })}>
                  <option value="">Sélectionner un locataire...</option>
                  {locataires.map(l => <option key={l.id} value={l.id}>{l.nom} · {l.telephone}</option>)}
                </select>
              </div>
            </div>

            {bienTrouve && (
              <div className="my-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3.5">
                <p className="mb-2 text-[13px] font-semibold text-slate-800">
                  🏠 {bienTrouve.adresse || bienTrouve.lieu_depot}, {bienTrouve.ville}
                </p>
                <p className="mb-2 text-xs text-slate-500">Choisissez le type de loyer pour ce contrat :</p>
                <div className="flex flex-wrap gap-2">
                  {bienTrouve.tarifs && Object.keys(bienTrouve.tarifs).length > 0
                    ? Object.entries(bienTrouve.tarifs).map(([type, montant]) => (
                        <button
                          key={type}
                          className={`rounded-lg border px-3.5 py-2 text-[13px] font-semibold ${formContrat.type_loyer === type ? 'border-brand-600 bg-brand-100 text-brand-700' : 'border-slate-200 bg-white text-slate-500'}`}
                          onClick={() => choisirTypeLoyer(type, montant)}
                        >
                          {LABELS_LOYER[type] || type} — {parseInt(montant).toLocaleString('fr-FR')} FCFA
                        </button>
                      ))
                    : (
                        <button
                          className={`rounded-lg border px-3.5 py-2 text-[13px] font-semibold ${formContrat.type_loyer === (bienTrouve.type_loyer || 'mensuel') ? 'border-brand-600 bg-brand-100 text-brand-700' : 'border-slate-200 bg-white text-slate-500'}`}
                          onClick={() => choisirTypeLoyer(bienTrouve.type_loyer || 'mensuel', bienTrouve.loyer_mensuel)}
                        >
                          {LABELS_LOYER[bienTrouve.type_loyer] || 'Mensuel'} — {parseInt(bienTrouve.loyer_mensuel).toLocaleString('fr-FR')} FCFA
                        </button>
                      )
                  }
                </div>
              </div>
            )}

            <div className={grille2}>
              <div><label className={champLabel}>Date de début *</label><input className={champInput} type="date" value={formContrat.date_debut} onChange={e => setFormContrat({ ...formContrat, date_debut: e.target.value })} /></div>
              <div>
                <label className={champLabel}>Durée du contrat</label>
                <div className="flex gap-2">
                  <input className={`${champInput} flex-1`} type="number" min="1" placeholder="Vide = indéterminée" value={formContrat.duree_valeur} onChange={e => setFormContrat({ ...formContrat, duree_valeur: e.target.value })} />
                  <select className={`${champInput} flex-1`} value={formContrat.duree_unite} onChange={e => setFormContrat({ ...formContrat, duree_unite: e.target.value })}>
                    <option value="jours">Jour(s)</option>
                    <option value="semaines">Semaine(s)</option>
                    <option value="mois">Mois</option>
                    <option value="annees">Année(s)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={champLabel}>Échéance</label>
                <p className={`${champInput} flex min-h-[20px] items-center text-xs text-slate-500`}>
                  {formContrat.date_debut && formContrat.type_loyer
                    ? `📅 ${libelleEcheanceAuto(formContrat.date_debut, formContrat.type_loyer)}`
                    : 'Choisissez la date de début et le type de loyer'}
                </p>
              </div>
              <div>
                <label className={champLabel}>Type de loyer retenu *</label>
                <input className={`${champInput} bg-slate-50`} value={formContrat.type_loyer ? LABELS_LOYER[formContrat.type_loyer] || formContrat.type_loyer : ''} placeholder="Choisissez ci-dessus" readOnly />
              </div>
              <div>
                <label className={champLabel}>Montant du loyer (FCFA) *</label>
                <input className={champInput} type="number" placeholder="80000" value={formContrat.loyer_mensuel} onChange={e => setFormContrat({ ...formContrat, loyer_mensuel: e.target.value })} />
              </div>
            </div>
            <div className="my-4 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3.5">
              <label className="mb-1 block text-sm font-semibold text-brand-700">✍️ Signature électronique du propriétaire *</label>
              <p className="mb-2 text-xs text-slate-500">
                Dessinez votre signature ci-dessous pour signer électroniquement ce contrat. Le locataire devra ensuite signer à son tour pour que le contrat soit officiellement validé.
              </p>
              <SignaturePad onChange={dataUrl => setFormContrat({ ...formContrat, signature_proprietaire: dataUrl })} />
            </div>
            {erreur && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{erreur}</p>}
            <button className={boutonPrim} onClick={creerContrat} disabled={envoi || biens.length === 0}>{envoi ? 'Signature en cours...' : '✍️ Signer et envoyer au locataire'}</button>
          </div>
        )}

        {contratDetail && (
          <div className={card}>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
              <h3 className={`${cardTitre} mb-0`}>Contrat — {contratDetail.locataire_nom}</h3>
              <div className="flex flex-wrap gap-2">
                <button className="rounded-lg bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-700" onClick={() => voirPDF(contratDetail.id)}>👁️ Voir le contrat</button>
                <button className="rounded-lg bg-brand-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-800" onClick={() => telechargerPDF(contratDetail.id)}>📄 Télécharger PDF</button>
                <button className="rounded-lg bg-accent-500 px-3.5 py-2 text-xs font-semibold text-white hover:bg-accent-600" onClick={() => setModalDemande(contratDetail)}>✏️ Modifier / Résilier</button>
                <button className={btnFermer} onClick={() => setContratDetail(null)}>✕</button>
              </div>
            </div>
            <div className={grille2}>
              <div className={bloc}><p className={blocTitre}>📍 Bien loué</p><p className="mb-1 text-xs font-bold text-accent-600">🔖 {contratDetail.numero_bien}</p><p className="text-sm text-slate-700">{contratDetail.adresse}</p><p className="text-sm text-slate-400">{contratDetail.ville}</p></div>
              <div className={bloc}><p className={blocTitre}>👤 Locataire</p><p className="text-sm text-slate-700">{contratDetail.locataire_nom}</p><p className="text-sm text-slate-400">{contratDetail.locataire_telephone}</p></div>
              <div className={bloc}><p className={blocTitre}>📅 Dates</p><p className="text-sm text-slate-700">Début : {formaterDate(contratDetail.date_debut)}</p><p className="text-sm text-slate-400">{libelleEcheance(contratDetail)}</p><p className="text-sm text-slate-400">Durée : {contratDetail.duree_valeur ? `${contratDetail.duree_valeur} ${LABELS_DUREE[contratDetail.duree_unite] || contratDetail.duree_unite} (fin le ${formaterDate(contratDetail.date_fin)})` : 'Indéterminée'}</p></div>
              <div className={bloc}>
                <p className={blocTitre}>💰 Loyer</p>
                <p className="text-lg font-bold text-brand-700">{formaterMontant(contratDetail.loyer_mensuel)}</p>
                <p className="text-xs text-slate-400">Commission RentEasy : {formaterMontant(Math.round(contratDetail.loyer_mensuel * 0.05))}</p>
              </div>
            </div>

            {contratDetail.photos && contratDetail.photos.length > 0 && (
              <div className="mt-5">
                <div className="mb-2.5 flex items-center justify-between">
                  <p className={`${blocTitre} mb-0`}>📷 Aperçu du bien</p>
                  <Lightbox medias={contratDetail.photos} />
                </div>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-2.5">
                  {contratDetail.photos.map(photo => (
                    estVideo(photo) ? (
                      <video key={photo} src={`${API_BASE}${photo}`} controls className="h-[90px] w-full rounded-lg border border-slate-100 object-cover" />
                    ) : (
                      <img key={photo} src={`${API_BASE}${photo}`} alt="Aperçu du bien" className="h-[90px] w-full rounded-lg border border-slate-100 object-cover" />
                    )
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5">
              <p className={blocTitre}>📊 Échéances</p>
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <div className="grid min-w-[360px] grid-cols-[1.4fr_1.1fr_1.2fr] bg-brand-50 px-4 py-2.5 text-xs font-bold uppercase text-brand-700">
                  <span>Période</span>
                  <span>Montant</span>
                  <span>Statut</span>
                </div>
                {(contratDetail.echeances || []).map(e => {
                  const st = STATUT_ECHEANCE[e.statut] || { cls: 'bg-slate-100 text-slate-500', label: e.statut };
                  return (
                    <div key={e.id} className="grid min-w-[360px] grid-cols-[1.4fr_1.1fr_1.2fr] items-center border-t border-slate-50 px-4 py-3 text-sm">
                      <span className="font-semibold text-slate-700">
                        {new Date(e.mois_concerne).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </span>
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
          </div>
        )}

        {chargement ? (
          <p className="py-10 text-center text-slate-400">Chargement...</p>
        ) : locataires.length === 0 ? (
          <div className="rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 p-10 text-center text-slate-400 shadow-card"><p>👤 Aucun locataire enregistré.</p></div>
        ) : (
          <div className="flex flex-col gap-3">
            {locataires.map(l => {
              // Un même locataire peut louer plusieurs biens chez le même propriétaire : on affiche
              // TOUS ses contrats actifs / en attente de signature, pas seulement le plus récent
              // (sinon un nouveau contrat masquait les précédents).
              const contratsL = contrats.filter(c => c.locataire_id === l.id);
              const contratsActifsL = contratsL.filter(c => c.statut === 'actif' || c.statut === 'en_attente_signature');
              return (
                <div key={l.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 px-5 py-4 shadow-card">
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-600 text-lg font-bold text-white">{l.nom.charAt(0).toUpperCase()}</div>
                    <div>
                      <div className="text-[15px] font-bold text-slate-900">{l.nom}</div>
                      <div className="text-[13px] text-slate-400">{l.telephone}{l.email ? ` · ${l.email}` : ''}</div>
                      {l.numero_piece_identite ? (
                        <div className="text-xs text-slate-400">🪪 {l.numero_piece_identite}</div>
                      ) : (
                        <div className="text-xs italic text-accent-600">🪪 Pièce d'identité non renseignée</div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2.5">
                    <button className="rounded-lg border border-slate-200 px-3 py-2 text-[13px] font-semibold text-slate-600 hover:bg-slate-50" onClick={() => ouvrirModalPieceIdentite(l)}>✏️ Modifier</button>
                    {contratsActifsL.length > 0 ? (
                      contratsActifsL.map(c => (
                        c.statut === 'en_attente_signature' ? (
                          <span key={c.id} className={badgeAttente}>✍️ {c.numero_bien} — en attente de signature{c.effectue_par_agent_id ? ' (créé par votre agent)' : ''}</span>
                        ) : (
                          <button key={c.id} className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-[13px] font-semibold text-emerald-700 hover:bg-emerald-100" onClick={() => voirDetailContrat(c)}>
                            📋 🔖 {c.numero_bien} · {c.adresse}{c.effectue_par_agent_id ? ' · 🤝 par votre agent' : ''}
                          </button>
                        )
                      ))
                    ) : (
                      <>
                        <span className="text-[13px] italic text-slate-400">Aucun contrat actif</span>
                        <button className={btnFermer} onClick={() => supprimerLocataireAction(l)}>🗑️ Supprimer</button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {pdfApercuUrl && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/70 p-5 backdrop-blur-sm">
          <div className="flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
              <span className="text-sm font-bold text-slate-900">📄 Aperçu du contrat</span>
              <button className={btnFermer} onClick={fermerApercuPDF}>✕ Fermer</button>
            </div>
            <iframe src={pdfApercuUrl} title="Aperçu du contrat" className="flex-1" />
          </div>
        </div>
      )}

      {modalPieceIdentite && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/50 p-5 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl">
            <h3 className="mb-1 text-xl font-bold text-slate-900">Modifier la pièce d'identité</h3>
            <p className="mb-4 text-sm text-slate-400">{modalPieceIdentite.nom}</p>

            <label className={champLabel}>Numéro de pièce d'identité</label>
            <input
              className={champInput}
              type="text"
              value={valeurPieceIdentite}
              onChange={e => setValeurPieceIdentite(e.target.value)}
              placeholder="Ex : 0123456789"
              autoFocus
            />

            {erreurPieceIdentite && <p className="mt-3 text-sm text-red-600">{erreurPieceIdentite}</p>}

            <div className="mt-5 flex gap-3">
              <button className="flex-1 rounded-xl border border-slate-200 px-5 py-3 text-sm text-slate-600 hover:bg-slate-50" onClick={() => setModalPieceIdentite(null)}>Annuler</button>
              <button className="flex-1 rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60" onClick={enregistrerPieceIdentite} disabled={envoiPieceIdentite}>
                {envoiPieceIdentite ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalDemande && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/50 p-5 backdrop-blur-sm">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-7 shadow-2xl">
            <h3 className="mb-1 text-xl font-bold text-slate-900">Demande de contrat</h3>
            <p className="mb-4 text-sm text-slate-400">{modalDemande.locataire_nom} · {modalDemande.adresse}</p>
            <div className="mb-4 rounded-lg bg-amber-50 px-3.5 py-2.5 text-[13px] text-amber-800">
              ⚠️ Cette demande sera envoyée à votre agent et au locataire. L'agent traitera et vous notifiera de sa décision.
            </div>
            <div className="mb-4 flex gap-3">
              <button className={`flex-1 rounded-xl py-2.5 text-sm font-semibold ${formDemande.type_demande === 'modification' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'}`} onClick={() => setFormDemande({ ...formDemande, type_demande: 'modification' })}>✏️ Modification</button>
              <button className={`flex-1 rounded-xl py-2.5 text-sm font-semibold ${formDemande.type_demande === 'resiliation' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'}`} onClick={() => setFormDemande({ ...formDemande, type_demande: 'resiliation' })}>🔴 Résiliation</button>
            </div>
            {formDemande.type_demande === 'modification' && (
              <div>
                <label className={champLabel}>Nouveau loyer souhaité (FCFA)</label>
                <input className={champInput} type="number" placeholder="Laisser vide si inchangé" value={formDemande.nouveau_loyer} onChange={e => setFormDemande({ ...formDemande, nouveau_loyer: e.target.value })} />
              </div>
            )}
            <div className="mt-3">
              <label className={champLabel}>Note pour l'agent</label>
              <textarea className={`${champInput} h-20 resize-y`} placeholder={formDemande.type_demande === 'resiliation' ? 'Motif de résiliation...' : 'Précisez les modifications souhaitées...'} value={formDemande.note_proprietaire} onChange={e => setFormDemande({ ...formDemande, note_proprietaire: e.target.value })} />
            </div>
            {erreur && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{erreur}</p>}
            <div className="mt-4 flex gap-3">
              <button className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm text-slate-500 hover:bg-slate-50" onClick={() => setModalDemande(null)}>Annuler</button>
              <button className={`flex-1 ${boutonPrim} ${formDemande.type_demande === 'resiliation' ? '!bg-red-600 hover:!bg-red-700' : ''}`} onClick={soumettreDemandeContrat} disabled={envoi}>{envoi ? 'Envoi...' : '📨 Soumettre'}</button>
            </div>
          </div>
        </div>
      )}

      {modalDetailDemande && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/50 p-5 backdrop-blur-sm">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-7 shadow-2xl">
            <h3 className="mb-1 text-xl font-bold text-slate-900">👁️ Détails de la demande</h3>
            <p className="mb-4 text-[13px] text-slate-400">
              {modalDetailDemande.origine === 'locataire_location' ? '🔑 Location' : '📅 Réservation'} · 🔖 {modalDetailDemande.numero_bien}
            </p>
            <div className="flex flex-col gap-2 rounded-xl bg-slate-50 p-3.5">
              <p className="m-0 text-sm text-slate-700"><strong>Locataire :</strong> {modalDetailDemande.locataire_nom} · {modalDetailDemande.locataire_telephone}</p>
              <p className="m-0 text-sm text-slate-700"><strong>Bien :</strong> {modalDetailDemande.adresse}, {modalDetailDemande.ville}</p>
              <p className="m-0 text-sm text-slate-700">
                <strong>Période :</strong> du {new Date(modalDetailDemande.date_debut).toLocaleDateString('fr-FR')} {modalDetailDemande.date_fin ? `au ${new Date(modalDetailDemande.date_fin).toLocaleDateString('fr-FR')}` : '(durée indéterminée)'}
              </p>
              <p className="m-0 text-sm text-slate-700"><strong>Type de loyer :</strong> {LABELS_LOYER[modalDetailDemande.type_loyer] || modalDetailDemande.type_loyer}</p>
              <p className="m-0 text-sm text-slate-700"><strong>Montant :</strong> {parseInt(modalDetailDemande.loyer_mensuel).toLocaleString('fr-FR')} FCFA</p>
              <p className="m-0 text-sm text-slate-400">{libelleEcheanceAuto(modalDetailDemande.date_debut, modalDetailDemande.type_loyer)}</p>
              {modalDetailDemande.note_locataire && (
                <p className="m-0 text-[13px] italic text-slate-400">« {modalDetailDemande.note_locataire} »</p>
              )}
            </div>
            <div className="mt-5 flex gap-3">
              <button className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm text-slate-500 hover:bg-slate-50" onClick={() => setModalDetailDemande(null)}>Fermer</button>
              <button className={`flex-1 ${boutonPrim}`} onClick={() => { const d = modalDetailDemande; setModalDetailDemande(null); ouvrirModalApprobation(d); }}>
                ✍️ Approuver et signer
              </button>
            </div>
          </div>
        </div>
      )}

      {modalApprobation && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/50 p-5 backdrop-blur-sm">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-7 shadow-2xl">
            <h3 className="mb-1 text-xl font-bold text-slate-900">✍️ Approuver la demande</h3>
            <p className="mb-4 text-[13px] text-slate-400">
              🔖 {modalApprobation.numero_bien} — {modalApprobation.locataire_nom} · du {new Date(modalApprobation.date_debut).toLocaleDateString('fr-FR')}
              {modalApprobation.date_fin ? ` au ${new Date(modalApprobation.date_fin).toLocaleDateString('fr-FR')}` : ' (durée indéterminée)'}
            </p>
            <p className="mb-1 text-[13px] text-slate-700">
              {LABELS_LOYER[modalApprobation.type_loyer] || modalApprobation.type_loyer} · {parseInt(modalApprobation.loyer_mensuel).toLocaleString('fr-FR')} FCFA
            </p>
            <p className="mb-3 text-xs text-slate-400">{libelleEcheanceAuto(modalApprobation.date_debut, modalApprobation.type_loyer)}</p>
            <p className="mb-3 text-[13px] text-slate-500">
              En signant, vous approuvez cette demande. Le locataire devra ensuite signer à son tour pour valider officiellement le contrat.
            </p>
            <SignaturePad onChange={setSignatureApprobation} />
            {erreurApprobation && <p className="mt-2 text-[13px] text-red-600">{erreurApprobation}</p>}
            <div className="mt-5 flex gap-3">
              <button className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm text-slate-500 hover:bg-slate-50" onClick={() => setModalApprobation(null)}>Annuler</button>
              <button className={`flex-1 ${boutonPrim}`} onClick={approuverDemandeLoc} disabled={envoiApprobation}>
                {envoiApprobation ? 'Envoi...' : '✍️ Signer et approuver'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
