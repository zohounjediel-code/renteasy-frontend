import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ClocheNotifications from '../components/ClocheNotifications';

const LABELS_TYPE_BIEN = {
  appartement: 'Appartement', maison: 'Maison', villa: 'Villa', studio: 'Studio',
  chambre: 'Chambre', commerce: 'Commerce', vehicule: 'Véhicule',
};
const LABELS_LOYER = { journalier: 'Journalier', hebdomadaire: 'Hebdomadaire', mensuel: 'Mensuel', annuel: 'Annuel' };
const LABELS_STATUT_BIEN = {
  libre: { label: '🟢 Libre', cls: 'text-emerald-600' },
  occupe: { label: '🔴 Occupé', cls: 'text-red-600' },
};
const LABELS_STATUT_CONTRAT = {
  actif: { label: '✅ Actif', cls: 'text-emerald-600' },
  en_attente_signature: { label: '✍️ En attente de signature', cls: 'text-accent-600' },
  demande_locataire: { label: '📨 Demande en cours', cls: 'text-blue-600' },
  resilie: { label: '⛔ Résilié', cls: 'text-slate-400' },
  termine: { label: '⏹️ Terminé', cls: 'text-slate-400' },
};
const STATUT_ECHEANCE = {
  payee: { cls: 'text-emerald-600', label: '✅ Payée' },
  en_attente: { cls: 'text-accent-600', label: '⏳ En attente' },
  impayee: { cls: 'text-red-600', label: '❌ Impayée' },
  partielle: { cls: 'text-blue-600', label: '⚡ Partielle' },
  en_recouvrement: { cls: 'text-purple-600', label: '🔄 En recouvrement' },
};

const TYPES_LOYER_LISTE = [
  { value: 'journalier', label: 'Journalier' },
  { value: 'hebdomadaire', label: 'Hebdomadaire' },
  { value: 'mensuel', label: 'Mensuel' },
  { value: 'annuel', label: 'Annuel' },
];
const UNITE_SELON_TYPE_LOYER = { journalier: 'jours', hebdomadaire: 'semaines', mensuel: 'mois', annuel: 'annees' };
const ICONES_ACTION = {
  creation_bien: '🏠',
  ajout_photos: '📷',
  ajout_locataire: '🧑',
  creation_contrat: '📝',
  approbation_demande: '✍️',
  refus_demande: '✕',
};

const TYPES_BIEN_LISTE = [
  { value: 'appartement', label: 'Appartement', description: 'Logement dans un immeuble collectif' },
  { value: 'maison', label: 'Maison', description: 'Maison individuelle' },
  { value: 'villa', label: 'Villa', description: 'Maison de standing avec espaces extérieurs' },
  { value: 'studio', label: 'Studio', description: 'Logement d\'une seule pièce principale' },
  { value: 'chambre', label: 'Chambre', description: 'Chambre seule, souvent meublée' },
  { value: 'commerce', label: 'Commerce', description: 'Local commercial : boutique, bureau, atelier, entrepôt, restaurant...' },
  { value: 'vehicule', label: 'Véhicule', description: 'Voiture, moto, camion, bus en location' },
];
const TYPES_LOYER_PAR_BIEN = {
  appartement: ['journalier', 'hebdomadaire', 'mensuel', 'annuel'],
  maison: ['journalier', 'hebdomadaire', 'mensuel', 'annuel'],
  villa: ['journalier', 'hebdomadaire', 'mensuel', 'annuel'],
  studio: ['journalier', 'hebdomadaire', 'mensuel', 'annuel'],
  chambre: ['journalier', 'hebdomadaire', 'mensuel', 'annuel'],
  commerce: ['journalier', 'mensuel', 'annuel'],
  vehicule: ['journalier', 'hebdomadaire', 'mensuel'],
};
const LABELS_LOYER_LONG = {
  journalier: 'Journalier (par jour)', hebdomadaire: 'Hebdomadaire (par semaine)',
  mensuel: 'Mensuel (par mois)', annuel: 'Annuel (par an)',
};

const champLabel = 'mt-3 mb-1.5 block text-xs font-semibold text-slate-500';
const champInput = 'w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30';
const btnAction = 'mb-4 rounded-xl bg-brand-600 px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-brand-700';
const btnAnnuler = 'flex-1 rounded-xl border border-slate-200 px-5 py-2.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-60';
const boutonPrim = 'rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60';
const overlay = 'fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/50 p-5 backdrop-blur-sm';
const modal = 'w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-7 shadow-2xl';

function ChampBoolean({ label, valeur, onChange }) {
  return (
    <div>
      <label className={champLabel}>{label}</label>
      <select className={champInput} value={valeur} onChange={e => onChange(e.target.value)}>
        <option value="">Non spécifié</option>
        <option value="oui">Oui</option>
        <option value="non">Non</option>
      </select>
    </div>
  );
}
function ChampNombre({ label, valeur, onChange, placeholder }) {
  return (
    <div>
      <label className={champLabel}>{label}</label>
      <input className={champInput} type="number" min="0" placeholder={placeholder || '0'} value={valeur} onChange={e => onChange(e.target.value)} />
    </div>
  );
}
function ChampTexte({ label, valeur, onChange, placeholder }) {
  return (
    <div>
      <label className={champLabel}>{label}</label>
      <input className={champInput} type="text" placeholder={placeholder || ''} value={valeur} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

// Reprend exactement les mêmes champs dynamiques que le formulaire propriétaire (Biens.jsx),
// pour que l'agent puisse remplir un bien complet au nom d'un propriétaire absent/à l'étranger.
function CaracteristiquesFormAgent({ typeBien, caracteristiques, setCaracteristiques }) {
  function set(key, val) { setCaracteristiques(prev => ({ ...prev, [key]: val })); }
  const c = caracteristiques;
  const grille = 'grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4';

  if (['appartement', 'studio', 'chambre'].includes(typeBien)) {
    return (
      <div className={grille}>
        <ChampNombre label="Nombre de chambres" valeur={c.nb_chambres || ''} onChange={v => set('nb_chambres', v)} placeholder="2" />
        <ChampBoolean label="Salon" valeur={c.salon || ''} onChange={v => set('salon', v)} />
        <ChampBoolean label="Cuisine" valeur={c.cuisine || ''} onChange={v => set('cuisine', v)} />
        <ChampNombre label="Nombre de sanitaires" valeur={c.nb_sanitaires || ''} onChange={v => set('nb_sanitaires', v)} placeholder="1" />
        <ChampNombre label="Étage" valeur={c.etage || ''} onChange={v => set('etage', v)} placeholder="0 = RDC" />
        <ChampBoolean label="Climatisé" valeur={c.climatise || ''} onChange={v => set('climatise', v)} />
        <ChampBoolean label="Meublé" valeur={c.meuble || ''} onChange={v => set('meuble', v)} />
        <ChampNombre label="Superficie (m²)" valeur={c.superficie || ''} onChange={v => set('superficie', v)} placeholder="50" />
      </div>
    );
  }
  if (['maison', 'villa'].includes(typeBien)) {
    return (
      <div className={grille}>
        <ChampNombre label="Nombre d'étages" valeur={c.nb_etages || ''} onChange={v => set('nb_etages', v)} placeholder="1" />
        <ChampNombre label="Superficie (m²)" valeur={c.superficie || ''} onChange={v => set('superficie', v)} placeholder="200" />
        <ChampNombre label="Nombre de chambres" valeur={c.nb_chambres || ''} onChange={v => set('nb_chambres', v)} placeholder="3" />
        <ChampNombre label="Nombre de cuisines" valeur={c.nb_cuisines || ''} onChange={v => set('nb_cuisines', v)} placeholder="1" />
        <ChampNombre label="Nombre de sanitaires" valeur={c.nb_sanitaires || ''} onChange={v => set('nb_sanitaires', v)} placeholder="2" />
        <ChampBoolean label="Salon" valeur={c.salon || ''} onChange={v => set('salon', v)} />
        <ChampBoolean label="Jardin" valeur={c.jardin || ''} onChange={v => set('jardin', v)} />
        <ChampBoolean label="Garage" valeur={c.garage || ''} onChange={v => set('garage', v)} />
        <ChampBoolean label="Climatisé" valeur={c.climatise || ''} onChange={v => set('climatise', v)} />
        {typeBien === 'villa' && <ChampBoolean label="Piscine" valeur={c.piscine || ''} onChange={v => set('piscine', v)} />}
      </div>
    );
  }
  if (typeBien === 'commerce') {
    return (
      <div className={grille}>
        <ChampNombre label="Superficie (m²)" valeur={c.superficie || ''} onChange={v => set('superficie', v)} placeholder="30" />
        <ChampTexte label="Type d'activité possible" valeur={c.type_activite || ''} onChange={v => set('type_activite', v)} placeholder="Boutique, bureau, restaurant..." />
        <ChampBoolean label="Climatisé" valeur={c.climatise || ''} onChange={v => set('climatise', v)} />
        <ChampBoolean label="Vitrine" valeur={c.vitrine || ''} onChange={v => set('vitrine', v)} />
        <ChampNombre label="Étage" valeur={c.etage || ''} onChange={v => set('etage', v)} placeholder="0 = RDC" />
        <ChampBoolean label="Parking disponible" valeur={c.parking || ''} onChange={v => set('parking', v)} />
      </div>
    );
  }
  if (typeBien === 'vehicule') {
    return (
      <div className={grille}>
        <div>
          <label className={champLabel}>Type de véhicule</label>
          <select className={champInput} value={c.type_vehicule || ''} onChange={e => set('type_vehicule', e.target.value)}>
            <option value="">Sélectionner...</option>
            <option value="voiture">Voiture</option>
            <option value="moto">Moto</option>
            <option value="camion">Camion</option>
            <option value="bus">Bus / Minibus</option>
            <option value="autre">Autre</option>
          </select>
        </div>
        <ChampTexte label="Marque" valeur={c.marque || ''} onChange={v => set('marque', v)} placeholder="Toyota, Honda..." />
        <ChampTexte label="Modèle" valeur={c.modele || ''} onChange={v => set('modele', v)} placeholder="Corolla, CB125..." />
        <ChampNombre label="Année" valeur={c.annee || ''} onChange={v => set('annee', v)} placeholder="2020" />
        <ChampTexte label="Immatriculation" valeur={c.immatriculation || ''} onChange={v => set('immatriculation', v)} placeholder="AB 1234 BJ" />
        <ChampNombre label="Kilométrage" valeur={c.kilometrage || ''} onChange={v => set('kilometrage', v)} placeholder="50000" />
        <ChampBoolean label="Climatisé" valeur={c.climatise || ''} onChange={v => set('climatise', v)} />
        <ChampBoolean label="Chauffeur inclus" valeur={c.chauffeur || ''} onChange={v => set('chauffeur', v)} />
      </div>
    );
  }
  return null;
}

function formaterMontant(n) {
  return `${parseInt(n || 0).toLocaleString('fr-FR')} FCFA`;
}
function formaterDate(d) {
  return d ? new Date(d).toLocaleDateString('fr-FR') : '—';
}

export default function AgentProprietaireDetail() {
  const { proprietaireId } = useParams();
  const navigate = useNavigate();
  const { deconnecter, utilisateur } = useAuth();

  const [onglet, setOnglet] = useState('apercu');
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  const [dashboard, setDashboard] = useState(null);
  const [biens, setBiens] = useState(null);
  const [contrats, setContrats] = useState(null);
  const [paiements, setPaiements] = useState(null);
  const [journal, setJournal] = useState(null);
  const [contratDetail, setContratDetail] = useState(null);
  const [chargementDetail, setChargementDetail] = useState(false);
  const [signatureDemandeAgent, setSignatureDemandeAgent] = useState('');
  const [envoiTraitement, setEnvoiTraitement] = useState(false);
  const [erreurTraitement, setErreurTraitement] = useState('');
  const [locataires, setLocataires] = useState(null);

  // Ajouter un bien pour le compte du propriétaire (délégation)
  const [modalAjouterBien, setModalAjouterBien] = useState(false);
  const [typeBienForm, setTypeBienForm] = useState('appartement');
  const [formBien, setFormBien] = useState({ ville: '', adresse: '', quartier: '', lieu_depot: '' });
  const [caracteristiquesBien, setCaracteristiquesBien] = useState({});
  const [tarifsBien, setTarifsBien] = useState({});
  const [envoiBien, setEnvoiBien] = useState(false);
  const [erreurBien, setErreurBien] = useState('');
  const [bienCree, setBienCree] = useState(null);
  const [photosSelectionnees, setPhotosSelectionnees] = useState([]);
  const [envoiPhotos, setEnvoiPhotos] = useState(false);
  const [erreurPhotos, setErreurPhotos] = useState('');

  // Ajouter un locataire pour le compte du propriétaire (délégation)
  const [modalAjouterLocataire, setModalAjouterLocataire] = useState(false);
  const [contactRecherche, setContactRecherche] = useState('');
  const [resultatRecherche, setResultatRecherche] = useState(null);
  const [rechercheEffectuee, setRechercheEffectuee] = useState(false);
  const [envoiLocataire, setEnvoiLocataire] = useState(false);
  const [erreurLocataire, setErreurLocataire] = useState('');
  const [succesLocataire, setSuccesLocataire] = useState('');

  // Créer un contrat pour le compte du propriétaire (délégation) — l'agent signe pour lui
  const [modalCreerContrat, setModalCreerContrat] = useState(false);
  const [formContrat, setFormContrat] = useState({ numero_bien: '', locataire_id: '', date_debut: '', duree_valeur: '', duree_unite: 'mois', type_loyer: 'mensuel', loyer_mensuel: '', caution: '', signature_agent: '' });
  const [envoiContrat, setEnvoiContrat] = useState(false);
  const [erreurContrat, setErreurContrat] = useState('');

  useEffect(() => { chargerApercu(); }, [proprietaireId]);

  async function chargerApercu() {
    setChargement(true);
    setErreur('');
    try {
      const r = await api.get(`/agent/proprietaires/${proprietaireId}/dashboard`);
      setDashboard(r.data);
    } catch (e) {
      setErreur(e.response?.data?.message || "Impossible de charger ce propriétaire");
    } finally {
      setChargement(false);
    }
  }

  async function chargerBiens() {
    const r = await api.get(`/agent/proprietaires/${proprietaireId}/biens`);
    setBiens(r.data);
  }
  async function chargerContrats() {
    const r = await api.get(`/agent/proprietaires/${proprietaireId}/contrats`);
    setContrats(r.data);
  }
  async function chargerLocataires() {
    const r = await api.get(`/agent/proprietaires/${proprietaireId}/locataires`);
    setLocataires(r.data);
    return r.data;
  }

  const estAdmin = (utilisateur?.role || '').includes('admin') || (utilisateur?.role || '').includes('super_admin');
  // Un admin a un accès de supervision inconditionnel (vérifié côté serveur) : il n'a pas besoin
  // que le propriétaire ait explicitement délégué la gestion à SON agent pour pouvoir agir.
  const delegationActive = estAdmin || !!dashboard?.proprietaire?.autorise_agent_gestion;

  // --- Ajouter un bien pour le compte du propriétaire ---
  function ouvrirAjouterBien() {
    setTypeBienForm('appartement');
    setFormBien({ ville: '', adresse: '', quartier: '', lieu_depot: '' });
    setCaracteristiquesBien({});
    setTarifsBien({});
    setErreurBien('');
    setBienCree(null);
    setPhotosSelectionnees([]);
    setErreurPhotos('');
    setModalAjouterBien(true);
  }

  function changerTypeBienForm(type) {
    setTypeBienForm(type);
    setCaracteristiquesBien({});
  }

  async function soumettreBien() {
    setErreurBien('');
    const estVehicule = typeBienForm === 'vehicule';
    const tarifsActifs = Object.entries(tarifsBien).filter(([, v]) => v && parseInt(v) > 0);
    if (!formBien.ville || tarifsActifs.length === 0) {
      setErreurBien('Ville et au moins un tarif sont obligatoires');
      return;
    }
    if (!estVehicule && !formBien.adresse) {
      setErreurBien("L'adresse est obligatoire pour un bien immobilier");
      return;
    }
    setEnvoiBien(true);
    try {
      const r = await api.post('/biens', {
        proprietaire_id: proprietaireId,
        type_bien: typeBienForm,
        ville: formBien.ville,
        adresse: estVehicule ? null : formBien.adresse,
        quartier: estVehicule ? null : formBien.quartier,
        lieu_depot: estVehicule ? formBien.lieu_depot : null,
        loyer_mensuel: parseInt(tarifsBien.mensuel || tarifsBien.journalier || tarifsBien.hebdomadaire || tarifsBien.annuel || 0),
        type_loyer: Object.keys(tarifsBien).find(k => tarifsBien[k] && parseInt(tarifsBien[k]) > 0) || 'mensuel',
        tarifs: Object.fromEntries(tarifsActifs.map(([k, v]) => [k, parseInt(v)])),
        caracteristiques: caracteristiquesBien,
      });
      setBienCree(r.data);
      await chargerBiens();
    } catch (e) {
      setErreurBien(e.response?.data?.message || "Erreur lors de l'ajout du bien");
    } finally {
      setEnvoiBien(false);
    }
  }

  async function ajouterPhotosBienForm() {
    setErreurPhotos('');
    if (photosSelectionnees.length === 0) {
      setErreurPhotos('Sélectionnez au moins une photo');
      return;
    }
    setEnvoiPhotos(true);
    try {
      const formData = new FormData();
      photosSelectionnees.forEach(f => formData.append('photos', f));
      const r = await api.post(`/biens/${bienCree.id}/photos`, formData);
      setBienCree({ ...bienCree, photos: r.data.photos });
      setPhotosSelectionnees([]);
      await chargerBiens();
    } catch (e) {
      setErreurPhotos(e.response?.data?.message || "Erreur lors de l'envoi des photos");
    } finally {
      setEnvoiPhotos(false);
    }
  }

  function terminerAjoutBien() {
    setModalAjouterBien(false);
    setBienCree(null);
  }

  // --- Ajouter un locataire pour le compte du propriétaire ---
  function ouvrirAjouterLocataire() {
    setContactRecherche('');
    setResultatRecherche(null);
    setRechercheEffectuee(false);
    setErreurLocataire('');
    setSuccesLocataire('');
    setModalAjouterLocataire(true);
  }

  async function rechercherLocataireAgent() {
    setErreurLocataire('');
    setResultatRecherche(null);
    if (!contactRecherche.trim()) return;
    try {
      const r = await api.get('/locataires/rechercher', { params: { contact: contactRecherche.trim() } });
      setResultatRecherche(r.data);
    } catch (e) {
      setErreurLocataire(e.response?.data?.message || 'Aucun compte locataire trouvé avec ce contact');
    } finally {
      setRechercheEffectuee(true);
    }
  }

  async function envoyerDemandeLocataire() {
    setEnvoiLocataire(true);
    setErreurLocataire('');
    try {
      const r = await api.post('/locataires/demander', { proprietaire_id: proprietaireId, user_id: resultatRecherche.id });
      setSuccesLocataire(r.data.message);
    } catch (e) {
      setErreurLocataire(e.response?.data?.message || "Erreur lors de l'envoi de la demande");
    } finally {
      setEnvoiLocataire(false);
    }
  }

  // --- Créer un contrat pour le compte du propriétaire (l'agent signe pour lui) ---
  async function ouvrirCreerContrat() {
    setErreurContrat('');
    setFormContrat({ numero_bien: '', locataire_id: '', date_debut: '', duree_valeur: '', duree_unite: 'mois', type_loyer: 'mensuel', loyer_mensuel: '', caution: '', signature_agent: '' });
    if (!biens) await chargerBiens();
    if (!locataires) await chargerLocataires();
    setModalCreerContrat(true);
  }

  function choisirBienPourContrat(numeroBien) {
    const bien = (biens || []).find(b => b.numero_bien === numeroBien);
    const tarifs = bien?.tarifs || {};
    const premierType = Object.keys(tarifs)[0] || 'mensuel';
    setFormContrat({
      ...formContrat,
      numero_bien: numeroBien,
      type_loyer: premierType,
      loyer_mensuel: tarifs[premierType] ? String(tarifs[premierType]) : '',
      duree_unite: UNITE_SELON_TYPE_LOYER[premierType] || formContrat.duree_unite,
    });
  }

  function choisirTypeLoyerContrat(type) {
    const bien = (biens || []).find(b => b.numero_bien === formContrat.numero_bien);
    const tarifs = bien?.tarifs || {};
    setFormContrat({
      ...formContrat,
      type_loyer: type,
      loyer_mensuel: tarifs[type] ? String(tarifs[type]) : formContrat.loyer_mensuel,
      duree_unite: UNITE_SELON_TYPE_LOYER[type] || formContrat.duree_unite,
    });
  }

  async function soumettreContrat() {
    setErreurContrat('');
    if (!formContrat.numero_bien || !formContrat.locataire_id || !formContrat.date_debut || !formContrat.type_loyer || !formContrat.loyer_mensuel) {
      setErreurContrat('Tous les champs sont obligatoires, y compris le type de loyer');
      return;
    }
    if (!formContrat.signature_agent.trim()) {
      setErreurContrat('Vous devez signer pour le compte du propriétaire (saisissez votre nom complet)');
      return;
    }
    setEnvoiContrat(true);
    try {
      await api.post('/contrats', {
        proprietaire_id: proprietaireId,
        numero_bien: formContrat.numero_bien,
        locataire_id: formContrat.locataire_id,
        date_debut: formContrat.date_debut,
        duree_valeur: formContrat.duree_valeur,
        duree_unite: formContrat.duree_unite,
        type_loyer: formContrat.type_loyer,
        loyer_mensuel: parseInt(formContrat.loyer_mensuel),
        caution: formContrat.caution,
        signature_proprietaire: formContrat.signature_agent,
      });
      setModalCreerContrat(false);
      await Promise.all([chargerBiens(), chargerContrats()]);
    } catch (e) {
      setErreurContrat(e.response?.data?.message || 'Erreur lors de la création du contrat');
    } finally {
      setEnvoiContrat(false);
    }
  }

  async function ouvrirOnglet(nom) {
    setOnglet(nom);
    try {
      if (nom === 'biens' && !biens) await chargerBiens();
      if (nom === 'contrats' && !contrats) await chargerContrats();
      if (nom === 'paiements' && !paiements) {
        const r = await api.get(`/agent/proprietaires/${proprietaireId}/paiements`);
        setPaiements(r.data);
      }
      if (nom === 'journal' && !journal) {
        const r = await api.get(`/agent/proprietaires/${proprietaireId}/journal`);
        setJournal(r.data);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function voirContrat(id) {
    setChargementDetail(true);
    setContratDetail({ id });
    setSignatureDemandeAgent('');
    setErreurTraitement('');
    try {
      const r = await api.get(`/agent/proprietaires/${proprietaireId}/contrats/${id}`);
      setContratDetail(r.data);
    } catch (e) {
      setContratDetail(null);
    } finally {
      setChargementDetail(false);
    }
  }

  async function approuverDemandeAgent() {
    setErreurTraitement('');
    if (!signatureDemandeAgent.trim()) {
      setErreurTraitement('Vous devez signer pour le compte du propriétaire (saisissez votre nom complet)');
      return;
    }
    setEnvoiTraitement(true);
    try {
      await api.post(`/contrats/${contratDetail.id}/approuver`, { signature_proprietaire: signatureDemandeAgent });
      setContratDetail(null);
      await chargerContrats();
    } catch (e) {
      setErreurTraitement(e.response?.data?.message || "Erreur lors de l'approbation");
    } finally {
      setEnvoiTraitement(false);
    }
  }

  async function refuserDemandeAgent() {
    setEnvoiTraitement(true);
    setErreurTraitement('');
    try {
      await api.post(`/contrats/${contratDetail.id}/refuser-demande`);
      setContratDetail(null);
      await chargerContrats();
    } catch (e) {
      setErreurTraitement(e.response?.data?.message || 'Erreur lors du refus');
    } finally {
      setEnvoiTraitement(false);
    }
  }

  if (chargement) {
    return <div className="flex min-h-screen items-center justify-center bg-brand-50"><p className="text-slate-400">Chargement...</p></div>;
  }

  if (erreur) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-brand-50">
        <p className="text-red-600">{erreur}</p>
        <button className="whitespace-nowrap rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50" onClick={() => navigate('/agent/proprietaires')}>← Retour à mes propriétaires</button>
      </div>
    );
  }

  const p = dashboard?.proprietaire;

  return (
    <div className="min-h-screen bg-brand-50">
      <nav className="re-nav sticky top-0 z-[100] flex h-[60px] items-center justify-between border-b border-slate-100 bg-white/95 px-6 backdrop-blur">
        <div className="flex items-center gap-2 text-lg text-slate-900">
          ⚡ <strong>RentEasy</strong> <span className="text-accent-600">Bénin</span>
          <span className="rounded-full bg-accent-500 px-2.5 py-0.5 text-[11px] font-extrabold text-white">Agent · Lecture seule</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button className="whitespace-nowrap rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50" onClick={() => navigate('/agent/proprietaires')}>← Mes propriétaires</button>
          <button className="whitespace-nowrap rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50" onClick={deconnecter}>Déconnexion</button>
          <ClocheNotifications />
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-6 py-7">
        <div className="mb-5 flex items-center gap-4">
          <div className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-full bg-brand-600 text-xl font-bold text-white">{p?.nom?.charAt(0).toUpperCase()}</div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">{p?.nom}</h2>
            <p className="mt-1 text-[13px] text-slate-500">{p?.telephone}{p?.email ? ` · ${p.email}` : ''}{p?.ville ? ` · 📍 ${p.ville}` : ''}</p>
          </div>
          {estAdmin && (
            <button
              className="ml-auto whitespace-nowrap rounded-xl border border-brand-300 bg-brand-50 px-3.5 py-2 text-[13px] font-semibold text-brand-700 hover:bg-brand-100"
              onClick={() => navigate(`/dashboard?proprietaire_id=${proprietaireId}&proprietaire_nom=${encodeURIComponent(p?.nom || '')}`)}
            >
              Ouvrir comme le propriétaire →
            </button>
          )}
        </div>

        <div className={`mb-5 rounded-xl border p-3.5 text-[13px] leading-relaxed ${delegationActive ? 'border-brand-200 bg-brand-50 text-brand-800' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
          {estAdmin ? (
            <span>🛡️ <strong>Accès superviseur</strong> — en tant qu'admin, vous pouvez consulter et agir sur ce compte (support technique). Toute action est tracée à votre nom.</span>
          ) : delegationActive ? (
            <span>🤝 <strong>Délégation active</strong> — ce propriétaire vous autorise à ajouter des biens, créer des contrats et ajouter des locataires en son nom. Toute action est tracée à votre nom.</span>
          ) : (
            <span>🔒 Délégation non activée — ce propriétaire ne vous a pas autorisé à agir en son nom. Vous consultez son compte en lecture seule uniquement.</span>
          )}
        </div>

        <div className="mb-6 flex flex-wrap gap-1 border-b border-slate-200">
          {[['apercu', "Vue d'ensemble"], ['biens', 'Biens'], ['contrats', 'Contrats'], ['paiements', 'Paiements & échéances'], ['journal', "Journal d'activité"]].map(([id, label]) => (
            <button key={id} className={`mr-5 border-b-2 px-1 py-2.5 text-sm ${onglet === id ? 'border-brand-600 font-semibold text-brand-700' : 'border-transparent text-slate-500'}`} onClick={() => ouvrirOnglet(id)}>
              {label}
            </button>
          ))}
        </div>

        {onglet === 'apercu' && dashboard && (
          <div>
            <div className="mb-3 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
              <div className="rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 p-4 shadow-card">
                <p className="m-0 text-xs text-slate-400">Biens</p>
                <p className="my-1.5 text-xl font-bold text-slate-900">{dashboard.biens.total_biens}</p>
                <p className="m-0 text-xs text-slate-400">{dashboard.biens.biens_occupes} occupé(s) · {dashboard.biens.biens_libres} libre(s)</p>
              </div>
              <div className="rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 p-4 shadow-card">
                <p className="m-0 text-xs text-slate-400">Échéances — {dashboard.mois_en_cours.mois}</p>
                <p className="my-1.5 text-xl font-bold text-slate-900">{dashboard.mois_en_cours.echeances_payees} / {dashboard.mois_en_cours.total_echeances} payées</p>
                <p className="m-0 text-xs text-slate-400">Taux de recouvrement : {dashboard.mois_en_cours.taux_recouvrement}%</p>
              </div>
              <div className="rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 p-4 shadow-card">
                <p className="m-0 text-xs text-slate-400">Montant collecté ce mois</p>
                <p className="my-1.5 text-xl font-bold text-slate-900">{formaterMontant(dashboard.mois_en_cours.montant_total_collecte)}</p>
                <p className="m-0 text-xs text-slate-400">Sur {formaterMontant(dashboard.mois_en_cours.montant_total_du)} dû</p>
              </div>
            </div>

            <h3 className="my-7 text-[15px] font-bold text-brand-700">⚠️ Échéances en retard</h3>
            {dashboard.impayes.length === 0 ? (
              <p className="text-[13px] text-slate-400">Aucune échéance en retard.</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {dashboard.impayes.map(e => (
                  <div key={e.id} className="grid grid-cols-[1fr_1fr_auto_auto] items-center gap-3 rounded-lg border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 px-3.5 py-2.5 text-[13px] text-slate-700 shadow-card">
                    <span>{e.adresse}, {e.ville}</span>
                    <span>{e.locataire_nom}</span>
                    <span>{formaterMontant(e.montant_du)}</span>
                    <span className="text-red-600">Depuis le {formaterDate(e.date_limite)}</span>
                  </div>
                ))}
              </div>
            )}

            <h3 className="my-7 text-[15px] font-bold text-brand-700">💰 Derniers paiements reçus</h3>
            {dashboard.derniers_paiements.length === 0 ? (
              <p className="text-[13px] text-slate-400">Aucun paiement pour l'instant.</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {dashboard.derniers_paiements.map(pa => (
                  <div key={pa.id} className="grid grid-cols-[1fr_1fr_auto_auto] items-center gap-3 rounded-lg border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 px-3.5 py-2.5 text-[13px] text-slate-700 shadow-card">
                    <span>{pa.adresse}</span>
                    <span>{pa.locataire_nom}</span>
                    <span className="text-emerald-600">{formaterMontant(pa.montant)}</span>
                    <span>{formaterDate(pa.date_paiement)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {onglet === 'biens' && (
          <div>
            {delegationActive && (
              <button className={btnAction} onClick={ouvrirAjouterBien}>+ Ajouter un bien</button>
            )}
            {!biens ? (
              <p className="text-slate-400">Chargement...</p>
            ) : biens.length === 0 ? (
              <p className="text-slate-400">Aucun bien enregistré.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {biens.map(b => (
                  <div key={b.id} className="flex items-center justify-between gap-3 rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 p-4 shadow-card">
                    <div>
                      <div className="font-bold text-slate-900">🔖 {b.numero_bien} — {LABELS_TYPE_BIEN[b.type_bien] || b.type_bien}</div>
                      <div className="mt-0.5 text-[13px] text-slate-400">{b.adresse}, {b.ville}{b.quartier ? ` (${b.quartier})` : ''}</div>
                      {b.tarifs && (
                        <div className="mt-1.5 text-xs text-slate-400">
                          {Object.entries(b.tarifs).map(([k, v]) => `${LABELS_LOYER[k] || k} : ${formaterMontant(v)}`).join(' · ')}
                        </div>
                      )}
                      {b.effectue_par_agent_id && <span className="mt-2 inline-block rounded-full border border-accent-200 bg-accent-50 px-2.5 py-0.5 text-[11px] font-bold text-accent-700">🤝 Ajouté par vous (agent)</span>}
                    </div>
                    <span className={`text-[13px] font-semibold ${LABELS_STATUT_BIEN[b.statut]?.cls}`}>
                      {LABELS_STATUT_BIEN[b.statut]?.label || b.statut}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {onglet === 'contrats' && (
          <div>
            {delegationActive && (
              <div className="mb-4 flex gap-2.5">
                <button className="rounded-xl bg-brand-600 px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-brand-700" onClick={ouvrirAjouterLocataire}>+ Ajouter un locataire</button>
                <button className="rounded-xl bg-brand-600 px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-brand-700" onClick={ouvrirCreerContrat}>+ Créer un contrat</button>
              </div>
            )}
            {!contrats ? (
              <p className="text-slate-400">Chargement...</p>
            ) : contrats.length === 0 ? (
              <p className="text-slate-400">Aucun contrat.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {contrats.map(c => (
                  <div key={c.id} className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 p-4 shadow-card" onClick={() => voirContrat(c.id)} role="button">
                    <div>
                      <div className="font-bold text-slate-900">🔖 {c.numero_bien} — {c.locataire_nom}</div>
                      <div className="mt-0.5 text-[13px] text-slate-400">
                        {LABELS_LOYER[c.type_loyer] || c.type_loyer} · {formaterMontant(c.loyer_mensuel)} · du {formaterDate(c.date_debut)}{c.date_fin ? ` au ${formaterDate(c.date_fin)}` : ''}
                      </div>
                      {c.effectue_par_agent_id && <span className="mt-2 inline-block rounded-full border border-accent-200 bg-accent-50 px-2.5 py-0.5 text-[11px] font-bold text-accent-700">🤝 Créé et signé par vous (agent)</span>}
                    </div>
                    <span className={`text-[13px] font-semibold ${LABELS_STATUT_CONTRAT[c.statut]?.cls || 'text-slate-400'}`}>
                      {LABELS_STATUT_CONTRAT[c.statut]?.label || c.statut}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {onglet === 'paiements' && (
          <div>
            {!paiements ? (
              <p className="text-slate-400">Chargement...</p>
            ) : paiements.length === 0 ? (
              <p className="text-slate-400">Aucun paiement enregistré.</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {paiements.map(pa => (
                  <div key={pa.id} className="grid grid-cols-[1fr_1fr_auto_auto_auto] items-center gap-3 rounded-lg border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 px-3.5 py-2.5 text-[13px] text-slate-700 shadow-card">
                    <span>{pa.adresse}</span>
                    <span>{pa.locataire_nom}</span>
                    <span className="text-emerald-600">{formaterMontant(pa.montant)}</span>
                    <span>{pa.methode}</span>
                    <span>{formaterDate(pa.date_paiement)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {onglet === 'journal' && (
          <div>
            <p className="mb-4 text-xs text-slate-400">
              Historique de tout ce que vous avez fait pour le compte de {p?.nom}.
            </p>
            {!journal ? (
              <p className="text-slate-400">Chargement...</p>
            ) : journal.length === 0 ? (
              <p className="text-slate-400">Aucune action enregistrée pour l'instant.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {journal.map(j => (
                  <div key={j.id} className="flex items-start gap-3 rounded-lg border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 px-3.5 py-2.5 shadow-card">
                    <span className="shrink-0 text-base">{ICONES_ACTION[j.type_action] || '🤝'}</span>
                    <div className="flex-1">
                      <p className="m-0 text-[13px] text-slate-800">{j.description}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {new Date(j.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {modalAjouterBien && (
        <div className={overlay} onClick={() => !envoiBien && !envoiPhotos && setModalAjouterBien(false)}>
          <div className={modal} onClick={e => e.stopPropagation()}>
            {!bienCree ? (
              <>
                <h3 className="mb-1 text-xl font-bold text-slate-900">+ Ajouter un bien</h3>
                <p className="mb-4 text-xs text-slate-400">Pour le compte de {p?.nom} — action tracée à votre nom.</p>

                <label className={champLabel}>Type de bien *</label>
                <div className="mb-2 grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2.5">
                  {TYPES_BIEN_LISTE.map(t => (
                    <div
                      key={t.value}
                      className={`cursor-pointer rounded-xl border-2 p-3 transition ${typeBienForm === t.value ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-white'}`}
                      onClick={() => changerTypeBienForm(t.value)}
                    >
                      <div className="mb-1 text-sm font-bold text-slate-900">{t.label}</div>
                      <div className="text-[11px] leading-snug text-slate-400">{t.description}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
                  {typeBienForm !== 'vehicule' && (
                    <div>
                      <label className={champLabel}>Adresse *</label>
                      <input className={champInput} placeholder="Rue 123, Quartier..." value={formBien.adresse} onChange={e => setFormBien({ ...formBien, adresse: e.target.value })} />
                    </div>
                  )}
                  <div>
                    <label className={champLabel}>Ville *</label>
                    <input className={champInput} placeholder="Cotonou" value={formBien.ville} onChange={e => setFormBien({ ...formBien, ville: e.target.value })} />
                  </div>
                  {typeBienForm !== 'vehicule' ? (
                    <div>
                      <label className={champLabel}>Quartier</label>
                      <input className={champInput} placeholder="Fidjrosse" value={formBien.quartier} onChange={e => setFormBien({ ...formBien, quartier: e.target.value })} />
                    </div>
                  ) : (
                    <div>
                      <label className={champLabel}>Lieu de dépôt / stationnement</label>
                      <input className={champInput} placeholder="Ex: Carrefour Cadjèhoun" value={formBien.lieu_depot} onChange={e => setFormBien({ ...formBien, lieu_depot: e.target.value })} />
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <label className="mb-3 block text-sm font-bold text-brand-700">
                    Caractéristiques du {TYPES_BIEN_LISTE.find(t => t.value === typeBienForm)?.label}
                  </label>
                  <CaracteristiquesFormAgent typeBien={typeBienForm} caracteristiques={caracteristiquesBien} setCaracteristiques={setCaracteristiquesBien} />
                </div>

                <div className="mt-4">
                  <label className="mb-3 block text-sm font-bold text-brand-700">
                    💰 Tarifs du loyer * <span className="text-xs font-normal text-slate-400">(renseignez les périodicités proposées)</span>
                  </label>
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
                    {(TYPES_LOYER_PAR_BIEN[typeBienForm] || []).map(t => (
                      <div key={t}>
                        <label className={champLabel}>{LABELS_LOYER_LONG[t]}</label>
                        <div className="flex items-center gap-2">
                          <input
                            className={`${champInput} ${tarifsBien[t] ? 'border-accent-400' : ''}`}
                            type="number"
                            placeholder="Laisser vide si non proposé"
                            value={tarifsBien[t] || ''}
                            onChange={e => setTarifsBien({ ...tarifsBien, [t]: e.target.value })}
                          />
                          <span className="whitespace-nowrap text-[13px] text-slate-400">FCFA</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {erreurBien && <p className="mt-2.5 text-[13px] text-red-600">{erreurBien}</p>}

                <div className="mt-5 flex gap-3">
                  <button className={btnAnnuler} onClick={() => setModalAjouterBien(false)} disabled={envoiBien}>Annuler</button>
                  <button className={`${boutonPrim} flex-1`} onClick={soumettreBien} disabled={envoiBien}>{envoiBien ? 'Enregistrement...' : 'Enregistrer le bien'}</button>
                </div>
              </>
            ) : (
              <>
                <h3 className="mb-1 text-xl font-bold text-brand-700">✅ Bien enregistré — 🔖 {bienCree.numero_bien}</h3>
                <p className="mb-4 text-xs text-slate-400">Vous pouvez ajouter des photos maintenant, ou le faire plus tard depuis cette fiche.</p>

                <label className={champLabel}>Ajouter des photos</label>
                <input type="file" accept="image/*,video/*" multiple onChange={e => setPhotosSelectionnees(Array.from(e.target.files))} />
                {photosSelectionnees.length > 0 && <p className="my-1.5 text-xs text-slate-400">{photosSelectionnees.length} fichier(s) sélectionné(s)</p>}
                {erreurPhotos && <p className="mt-1.5 text-[13px] text-red-600">{erreurPhotos}</p>}
                <button className={`${btnAction} mt-2.5`} onClick={ajouterPhotosBienForm} disabled={envoiPhotos || photosSelectionnees.length === 0}>
                  {envoiPhotos ? 'Envoi...' : '📷 Envoyer les photos'}
                </button>

                {bienCree.photos && bienCree.photos.length > 0 && (
                  <p className="mt-2.5 text-[13px] text-brand-700">{bienCree.photos.length} photo(s) déjà ajoutée(s) à ce bien.</p>
                )}

                <div className="mt-5 flex gap-3">
                  <button className={`${boutonPrim} flex-1`} onClick={terminerAjoutBien}>Terminé</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {modalAjouterLocataire && (
        <div className={overlay} onClick={() => setModalAjouterLocataire(false)}>
          <div className={modal} onClick={e => e.stopPropagation()}>
            <h3 className="mb-1 text-xl font-bold text-slate-900">+ Ajouter un locataire</h3>
            <p className="mb-4 text-xs text-slate-400">Pour le compte de {p?.nom} — action tracée à votre nom. Le locataire doit déjà avoir un compte RentEasy et devra accepter la demande.</p>

            {succesLocataire ? (
              <p className="text-sm text-brand-700">✅ {succesLocataire}</p>
            ) : (
              <>
                <label className={champLabel}>Téléphone ou email du locataire</label>
                <div className="flex gap-2">
                  <input className={`${champInput} flex-1`} value={contactRecherche} onChange={e => setContactRecherche(e.target.value)} placeholder="+229... ou email" />
                  <button className={btnAction} onClick={rechercherLocataireAgent}>🔍</button>
                </div>

                {rechercheEffectuee && resultatRecherche && (
                  <div className="mt-3 rounded-xl border border-brand-200 bg-brand-50 p-3">
                    <p className="m-0 text-sm text-slate-800">✅ {resultatRecherche.nom} — {resultatRecherche.telephone}</p>
                  </div>
                )}

                {erreurLocataire && <p className="mt-2.5 text-[13px] text-red-600">{erreurLocataire}</p>}

                <div className="mt-5 flex gap-3">
                  <button className={btnAnnuler} onClick={() => setModalAjouterLocataire(false)}>Fermer</button>
                  <button className={`${boutonPrim} flex-1`} onClick={envoyerDemandeLocataire} disabled={!resultatRecherche || envoiLocataire}>
                    {envoiLocataire ? 'Envoi...' : "Envoyer la demande d'ajout"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {modalCreerContrat && (
        <div className={overlay} onClick={() => !envoiContrat && setModalCreerContrat(false)}>
          <div className={modal} onClick={e => e.stopPropagation()}>
            <h3 className="mb-1 text-xl font-bold text-slate-900">+ Créer un contrat</h3>
            <p className="mb-4 text-xs text-slate-400">Pour le compte de {p?.nom} — vous signez électroniquement pour son compte, action tracée à votre nom.</p>

            <label className={champLabel}>Bien *</label>
            <select className={champInput} value={formContrat.numero_bien} onChange={e => choisirBienPourContrat(e.target.value)}>
              <option value="">— Choisir un bien libre —</option>
              {(biens || []).filter(b => b.statut === 'libre').map(b => (
                <option key={b.id} value={b.numero_bien}>🔖 {b.numero_bien} — {b.adresse}, {b.ville}</option>
              ))}
            </select>

            <label className={champLabel}>Locataire *</label>
            <select className={champInput} value={formContrat.locataire_id} onChange={e => setFormContrat({ ...formContrat, locataire_id: e.target.value })}>
              <option value="">— Choisir un locataire —</option>
              {(locataires || []).map(l => (
                <option key={l.id} value={l.id}>{l.nom} — {l.telephone}</option>
              ))}
            </select>

            <label className={champLabel}>Date de début *</label>
            <input className={champInput} type="date" value={formContrat.date_debut} onChange={e => setFormContrat({ ...formContrat, date_debut: e.target.value })} />

            <div className="flex gap-2.5">
              <div className="flex-1">
                <label className={champLabel}>Durée</label>
                <input className={champInput} type="number" min="1" placeholder="Vide = indéterminée" value={formContrat.duree_valeur} onChange={e => setFormContrat({ ...formContrat, duree_valeur: e.target.value })} />
              </div>
              <div className="flex-1">
                <label className={champLabel}>&nbsp;</label>
                <select className={champInput} value={formContrat.duree_unite} onChange={e => setFormContrat({ ...formContrat, duree_unite: e.target.value })}>
                  <option value="jours">Jour(s)</option>
                  <option value="semaines">Semaine(s)</option>
                  <option value="mois">Mois</option>
                  <option value="annees">Année(s)</option>
                </select>
              </div>
            </div>

            <label className={champLabel}>Type de loyer *</label>
            <select className={champInput} value={formContrat.type_loyer} onChange={e => choisirTypeLoyerContrat(e.target.value)}>
              {TYPES_LOYER_LISTE.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            {formContrat.date_debut && formContrat.type_loyer && (
              <p className="mt-1 text-xs text-slate-400">📅 L'échéance sera calculée automatiquement à partir de la date de début.</p>
            )}

            <label className={champLabel}>Loyer ({TYPES_LOYER_LISTE.find(t => t.value === formContrat.type_loyer)?.label?.toLowerCase()}) *</label>
            <input className={champInput} type="number" value={formContrat.loyer_mensuel} onChange={e => setFormContrat({ ...formContrat, loyer_mensuel: e.target.value })} />

            <label className={champLabel}>Caution (FCFA)</label>
            <input className={champInput} type="number" value={formContrat.caution} onChange={e => setFormContrat({ ...formContrat, caution: e.target.value })} />

            <label className={champLabel}>Votre signature (pour le compte du propriétaire) *</label>
            <input className={champInput} value={formContrat.signature_agent} onChange={e => setFormContrat({ ...formContrat, signature_agent: e.target.value })} placeholder="Votre nom complet" />

            {erreurContrat && <p className="mt-2.5 text-[13px] text-red-600">{erreurContrat}</p>}

            <div className="mt-5 flex gap-3">
              <button className={btnAnnuler} onClick={() => setModalCreerContrat(false)} disabled={envoiContrat}>Annuler</button>
              <button className={`${boutonPrim} flex-1`} onClick={soumettreContrat} disabled={envoiContrat}>{envoiContrat ? 'Envoi...' : 'Signer pour le compte du propriétaire'}</button>
            </div>
          </div>
        </div>
      )}

      {contratDetail && (
        <div className={overlay} onClick={() => setContratDetail(null)}>
          <div className={modal} onClick={e => e.stopPropagation()}>
            {chargementDetail || !contratDetail.echeances ? (
              <p className="text-slate-400">Chargement...</p>
            ) : (
              <>
                <h3 className="mb-1 text-xl font-bold text-slate-900">🔖 {contratDetail.numero_bien}</h3>
                <p className="mb-4 text-[13px] text-slate-400">
                  {contratDetail.adresse}, {contratDetail.ville} · {contratDetail.locataire_nom} · {LABELS_LOYER[contratDetail.type_loyer] || contratDetail.type_loyer} · {formaterMontant(contratDetail.loyer_mensuel)}
                </p>

                {contratDetail.statut === 'demande_locataire' && delegationActive && (
                  <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-3.5">
                    <p className="mb-2.5 text-[13px] font-bold text-blue-700">📨 Demande en attente — traiter pour le compte de {p?.nom}</p>
                    <label className={champLabel}>Votre signature (pour approuver)</label>
                    <input className={champInput} value={signatureDemandeAgent} onChange={e => setSignatureDemandeAgent(e.target.value)} placeholder="Votre nom complet" />
                    {erreurTraitement && <p className="mt-2 text-[13px] text-red-600">{erreurTraitement}</p>}
                    <div className="mt-3 flex gap-2.5">
                      <button className={`${btnAnnuler} flex-1`} onClick={refuserDemandeAgent} disabled={envoiTraitement}>✕ Refuser</button>
                      <button className={`${boutonPrim} flex-1`} onClick={approuverDemandeAgent} disabled={envoiTraitement}>
                        {envoiTraitement ? 'Envoi...' : '✍️ Approuver et signer'}
                      </button>
                    </div>
                  </div>
                )}

                <h4 className="mb-2 text-sm font-bold text-slate-900">Historique des échéances</h4>
                <div className="flex max-h-[320px] flex-col gap-2 overflow-y-auto">
                  {contratDetail.echeances.map(e => (
                    <div key={e.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-2.5 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-[13px]">
                      <span>{formaterDate(e.mois_concerne)}</span>
                      <span>{formaterMontant(e.montant_du)}</span>
                      <span className={STATUT_ECHEANCE[e.statut]?.cls}>{STATUT_ECHEANCE[e.statut]?.label || e.statut}</span>
                    </div>
                  ))}
                </div>
                <button className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50" onClick={() => setContratDetail(null)}>Fermer</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
