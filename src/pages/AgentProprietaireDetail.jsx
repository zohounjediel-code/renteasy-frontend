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
  libre: { label: '🟢 Libre', color: '#2e7d32' },
  occupe: { label: '🔴 Occupé', color: '#c62828' },
};
const LABELS_STATUT_CONTRAT = {
  actif: { label: '✅ Actif', color: '#2e7d32' },
  en_attente_signature: { label: '✍️ En attente de signature', color: '#e65100' },
  demande_locataire: { label: '📨 Demande en cours', color: '#1565c0' },
  resilie: { label: '⛔ Résilié', color: '#6b7280' },
  termine: { label: '⏹️ Terminé', color: '#6b7280' },
};
const STATUT_ECHEANCE = {
  payee: { color: '#2e7d32', label: '✅ Payée' },
  en_attente: { color: '#e65100', label: '⏳ En attente' },
  impayee: { color: '#c62828', label: '❌ Impayée' },
  partielle: { color: '#1565c0', label: '⚡ Partielle' },
  en_recouvrement: { color: '#6a1b9a', label: '🔄 En recouvrement' },
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

function ChampBoolean({ label, valeur, onChange }) {
  return (
    <div>
      <label style={s.label}>{label}</label>
      <select style={s.input} value={valeur} onChange={e => onChange(e.target.value)}>
        <option value="" style={s.option}>Non spécifié</option>
        <option value="oui" style={s.option}>Oui</option>
        <option value="non" style={s.option}>Non</option>
      </select>
    </div>
  );
}
function ChampNombre({ label, valeur, onChange, placeholder }) {
  return (
    <div>
      <label style={s.label}>{label}</label>
      <input style={s.input} type="number" min="0" placeholder={placeholder || '0'} value={valeur} onChange={e => onChange(e.target.value)} />
    </div>
  );
}
function ChampTexte({ label, valeur, onChange, placeholder }) {
  return (
    <div>
      <label style={s.label}>{label}</label>
      <input style={s.input} type="text" placeholder={placeholder || ''} value={valeur} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

// Reprend exactement les mêmes champs dynamiques que le formulaire propriétaire (Biens.jsx),
// pour que l'agent puisse remplir un bien complet au nom d'un propriétaire absent/à l'étranger.
function CaracteristiquesFormAgent({ typeBien, caracteristiques, setCaracteristiques }) {
  function set(key, val) { setCaracteristiques(prev => ({ ...prev, [key]: val })); }
  const c = caracteristiques;

  if (['appartement', 'studio', 'chambre'].includes(typeBien)) {
    return (
      <div style={s.grille2}>
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
      <div style={s.grille2}>
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
      <div style={s.grille2}>
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
      <div style={s.grille2}>
        <div>
          <label style={s.label}>Type de véhicule</label>
          <select style={s.input} value={c.type_vehicule || ''} onChange={e => set('type_vehicule', e.target.value)}>
            <option value="" style={s.option}>Sélectionner...</option>
            <option value="voiture" style={s.option}>Voiture</option>
            <option value="moto" style={s.option}>Moto</option>
            <option value="camion" style={s.option}>Camion</option>
            <option value="bus" style={s.option}>Bus / Minibus</option>
            <option value="autre" style={s.option}>Autre</option>
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
    return <div style={{ ...s.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: '#6b7280' }}>Chargement...</p></div>;
  }

  if (erreur) {
    return (
      <div style={{ ...s.page, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <p style={{ color: '#ef4444' }}>{erreur}</p>
        <button style={s.navBtn} onClick={() => navigate('/agent/proprietaires')}>← Retour à mes propriétaires</button>
      </div>
    );
  }

  const p = dashboard?.proprietaire;

  return (
    <div style={s.page}>
      <nav style={s.nav} className="re-nav">
        <div style={s.navLogo}>
          ⚡ <strong>RentEasy</strong> <span style={s.navBenin}>Bénin</span>
          <span style={s.agentBadge}>Agent · Lecture seule</span>
        </div>
        <div style={s.navMenu}>
          <button style={s.navBtn} onClick={() => navigate('/agent/proprietaires')}>← Mes propriétaires</button>
          <ClocheNotifications />
          <button style={s.navDeconnexion} onClick={deconnecter}>Déconnexion</button>
        </div>
      </nav>

      <div style={s.contenu}>
        <div style={s.entete}>
          <div style={s.avatar}>{p?.nom?.charAt(0).toUpperCase()}</div>
          <div>
            <h2 style={s.titre}>{p?.nom}</h2>
            <p style={s.sousTitre}>{p?.telephone}{p?.email ? ` · ${p.email}` : ''}{p?.ville ? ` · 📍 ${p.ville}` : ''}</p>
          </div>
          {estAdmin && (
            <button
              style={s.boutonVuePropio}
              onClick={() => navigate(`/dashboard?proprietaire_id=${proprietaireId}&proprietaire_nom=${encodeURIComponent(p?.nom || '')}`)}
            >
              Ouvrir comme le propriétaire →
            </button>
          )}
        </div>

        <div style={{ ...s.delegationBanniere, borderColor: delegationActive ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.08)' }}>
          {estAdmin ? (
            <span>🛡️ <strong>Accès superviseur</strong> — en tant qu'admin, vous pouvez consulter et agir sur ce compte (support technique). Toute action est tracée à votre nom.</span>
          ) : delegationActive ? (
            <span>🤝 <strong>Délégation active</strong> — ce propriétaire vous autorise à ajouter des biens, créer des contrats et ajouter des locataires en son nom. Toute action est tracée à votre nom.</span>
          ) : (
            <span>🔒 Délégation non activée — ce propriétaire ne vous a pas autorisé à agir en son nom. Vous consultez son compte en lecture seule uniquement.</span>
          )}
        </div>

        <div style={s.onglets}>
          {[['apercu', "Vue d'ensemble"], ['biens', 'Biens'], ['contrats', 'Contrats'], ['paiements', 'Paiements & échéances'], ['journal', "Journal d'activité"]].map(([id, label]) => (
            <button key={id} style={{ ...s.onglet, ...(onglet === id ? s.ongletActif : {}) }} onClick={() => ouvrirOnglet(id)}>
              {label}
            </button>
          ))}
        </div>

        {onglet === 'apercu' && dashboard && (
          <div>
            <div style={s.grilleStats}>
              <div style={s.carteStat}>
                <p style={s.statLabel}>Biens</p>
                <p style={s.statVal}>{dashboard.biens.total_biens}</p>
                <p style={s.statSous}>{dashboard.biens.biens_occupes} occupé(s) · {dashboard.biens.biens_libres} libre(s)</p>
              </div>
              <div style={s.carteStat}>
                <p style={s.statLabel}>Échéances — {dashboard.mois_en_cours.mois}</p>
                <p style={s.statVal}>{dashboard.mois_en_cours.echeances_payees} / {dashboard.mois_en_cours.total_echeances} payées</p>
                <p style={s.statSous}>Taux de recouvrement : {dashboard.mois_en_cours.taux_recouvrement}%</p>
              </div>
              <div style={s.carteStat}>
                <p style={s.statLabel}>Montant collecté ce mois</p>
                <p style={s.statVal}>{formaterMontant(dashboard.mois_en_cours.montant_total_collecte)}</p>
                <p style={s.statSous}>Sur {formaterMontant(dashboard.mois_en_cours.montant_total_du)} dû</p>
              </div>
            </div>

            <h3 style={s.sousTitreSection}>⚠️ Échéances en retard</h3>
            {dashboard.impayes.length === 0 ? (
              <p style={{ color: '#6b7280', fontSize: '13px' }}>Aucune échéance en retard.</p>
            ) : (
              <div style={s.tableau}>
                {dashboard.impayes.map(e => (
                  <div key={e.id} style={s.ligneTableau}>
                    <span>{e.adresse}, {e.ville}</span>
                    <span>{e.locataire_nom}</span>
                    <span>{formaterMontant(e.montant_du)}</span>
                    <span style={{ color: '#c62828' }}>Depuis le {formaterDate(e.date_limite)}</span>
                  </div>
                ))}
              </div>
            )}

            <h3 style={s.sousTitreSection}>💰 Derniers paiements reçus</h3>
            {dashboard.derniers_paiements.length === 0 ? (
              <p style={{ color: '#6b7280', fontSize: '13px' }}>Aucun paiement pour l'instant.</p>
            ) : (
              <div style={s.tableau}>
                {dashboard.derniers_paiements.map(pa => (
                  <div key={pa.id} style={s.ligneTableau}>
                    <span>{pa.adresse}</span>
                    <span>{pa.locataire_nom}</span>
                    <span style={{ color: '#2e7d32' }}>{formaterMontant(pa.montant)}</span>
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
              <button style={s.btnAction} onClick={ouvrirAjouterBien}>+ Ajouter un bien</button>
            )}
            {!biens ? (
              <p style={{ color: '#6b7280' }}>Chargement...</p>
            ) : biens.length === 0 ? (
              <p style={{ color: '#6b7280' }}>Aucun bien enregistré.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {biens.map(b => (
                  <div key={b.id} style={s.carteBien}>
                    <div>
                      <div style={{ fontWeight: '700', color: '#e2e8f0' }}>🔖 {b.numero_bien} — {LABELS_TYPE_BIEN[b.type_bien] || b.type_bien}</div>
                      <div style={{ color: '#9ca3af', fontSize: '13px', marginTop: '2px' }}>{b.adresse}, {b.ville}{b.quartier ? ` (${b.quartier})` : ''}</div>
                      {b.tarifs && (
                        <div style={{ color: '#9ca3af', fontSize: '12px', marginTop: '6px' }}>
                          {Object.entries(b.tarifs).map(([k, v]) => `${LABELS_LOYER[k] || k} : ${formaterMontant(v)}`).join(' · ')}
                        </div>
                      )}
                      {b.effectue_par_agent_id && <span style={s.badgeAgent}>🤝 Ajouté par vous (agent)</span>}
                    </div>
                    <span style={{ color: LABELS_STATUT_BIEN[b.statut]?.color, fontWeight: '600', fontSize: '13px' }}>
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
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                <button style={s.btnAction} onClick={ouvrirAjouterLocataire}>+ Ajouter un locataire</button>
                <button style={s.btnAction} onClick={ouvrirCreerContrat}>+ Créer un contrat</button>
              </div>
            )}
            {!contrats ? (
              <p style={{ color: '#6b7280' }}>Chargement...</p>
            ) : contrats.length === 0 ? (
              <p style={{ color: '#6b7280' }}>Aucun contrat.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {contrats.map(c => (
                  <div key={c.id} style={s.carteBien} onClick={() => voirContrat(c.id)} role="button">
                    <div>
                      <div style={{ fontWeight: '700', color: '#e2e8f0' }}>🔖 {c.numero_bien} — {c.locataire_nom}</div>
                      <div style={{ color: '#9ca3af', fontSize: '13px', marginTop: '2px' }}>
                        {LABELS_LOYER[c.type_loyer] || c.type_loyer} · {formaterMontant(c.loyer_mensuel)} · du {formaterDate(c.date_debut)}{c.date_fin ? ` au ${formaterDate(c.date_fin)}` : ''}
                      </div>
                      {c.effectue_par_agent_id && <span style={s.badgeAgent}>🤝 Créé et signé par vous (agent)</span>}
                    </div>
                    <span style={{ color: LABELS_STATUT_CONTRAT[c.statut]?.color || '#9ca3af', fontWeight: '600', fontSize: '13px' }}>
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
              <p style={{ color: '#6b7280' }}>Chargement...</p>
            ) : paiements.length === 0 ? (
              <p style={{ color: '#6b7280' }}>Aucun paiement enregistré.</p>
            ) : (
              <div style={s.tableau}>
                {paiements.map(pa => (
                  <div key={pa.id} style={s.ligneTableau}>
                    <span>{pa.adresse}</span>
                    <span>{pa.locataire_nom}</span>
                    <span style={{ color: '#2e7d32' }}>{formaterMontant(pa.montant)}</span>
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
            <p style={{ color: '#6b7280', fontSize: '12px', margin: '0 0 16px' }}>
              Historique de tout ce que vous avez fait pour le compte de {p?.nom}.
            </p>
            {!journal ? (
              <p style={{ color: '#6b7280' }}>Chargement...</p>
            ) : journal.length === 0 ? (
              <p style={{ color: '#6b7280' }}>Aucune action enregistrée pour l'instant.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {journal.map(j => (
                  <div key={j.id} style={s.journalLigne}>
                    <span style={s.journalIcone}>{ICONES_ACTION[j.type_action] || '🤝'}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, color: '#e2e8f0', fontSize: '13px' }}>{j.description}</p>
                      <p style={{ margin: '2px 0 0', color: '#6b7280', fontSize: '11px' }}>
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
        <div style={s.overlay} onClick={() => !envoiBien && !envoiPhotos && setModalAjouterBien(false)}>
          <div style={{ ...s.modal, maxWidth: '640px', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            {!bienCree ? (
              <>
                <h3 style={{ margin: '0 0 4px', color: '#c4b5fd', fontSize: '20px' }}>+ Ajouter un bien</h3>
                <p style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '16px' }}>Pour le compte de {p?.nom} — action tracée à votre nom.</p>

                <label style={s.label}>Type de bien *</label>
                <div style={s.typeGrid}>
                  {TYPES_BIEN_LISTE.map(t => (
                    <div
                      key={t.value}
                      style={{ ...s.typeCard, border: typeBienForm === t.value ? '2px solid #e8a020' : '1px solid rgba(255,255,255,0.08)', background: typeBienForm === t.value ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.03)' }}
                      onClick={() => changerTypeBienForm(t.value)}
                    >
                      <div style={s.typeCardLabel}>{t.label}</div>
                      <div style={s.typeCardDesc}>{t.description}</div>
                    </div>
                  ))}
                </div>

                <div style={{ ...s.grille2, marginTop: '16px' }}>
                  {typeBienForm !== 'vehicule' && (
                    <div>
                      <label style={s.label}>Adresse *</label>
                      <input style={s.input} placeholder="Rue 123, Quartier..." value={formBien.adresse} onChange={e => setFormBien({ ...formBien, adresse: e.target.value })} />
                    </div>
                  )}
                  <div>
                    <label style={s.label}>Ville *</label>
                    <input style={s.input} placeholder="Cotonou" value={formBien.ville} onChange={e => setFormBien({ ...formBien, ville: e.target.value })} />
                  </div>
                  {typeBienForm !== 'vehicule' ? (
                    <div>
                      <label style={s.label}>Quartier</label>
                      <input style={s.input} placeholder="Fidjrosse" value={formBien.quartier} onChange={e => setFormBien({ ...formBien, quartier: e.target.value })} />
                    </div>
                  ) : (
                    <div>
                      <label style={s.label}>Lieu de dépôt / stationnement</label>
                      <input style={s.input} placeholder="Ex: Carrefour Cadjèhoun" value={formBien.lieu_depot} onChange={e => setFormBien({ ...formBien, lieu_depot: e.target.value })} />
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '16px' }}>
                  <label style={{ ...s.label, fontSize: '14px', color: '#c4b5fd', marginBottom: '12px', display: 'block' }}>
                    Caractéristiques du {TYPES_BIEN_LISTE.find(t => t.value === typeBienForm)?.label}
                  </label>
                  <CaracteristiquesFormAgent typeBien={typeBienForm} caracteristiques={caracteristiquesBien} setCaracteristiques={setCaracteristiquesBien} />
                </div>

                <div style={{ marginTop: '16px' }}>
                  <label style={{ ...s.label, fontSize: '14px', color: '#c4b5fd', marginBottom: '12px', display: 'block' }}>
                    💰 Tarifs du loyer * <span style={{ color: '#6b7280', fontWeight: '400', fontSize: '12px' }}>(renseignez les périodicités proposées)</span>
                  </label>
                  <div style={s.grille2}>
                    {(TYPES_LOYER_PAR_BIEN[typeBienForm] || []).map(t => (
                      <div key={t}>
                        <label style={s.label}>{LABELS_LOYER_LONG[t]}</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            style={{ ...s.input, borderColor: tarifsBien[t] ? '#e8a020' : undefined }}
                            type="number"
                            placeholder="Laisser vide si non proposé"
                            value={tarifsBien[t] || ''}
                            onChange={e => setTarifsBien({ ...tarifsBien, [t]: e.target.value })}
                          />
                          <span style={{ color: '#6b7280', fontSize: '13px', whiteSpace: 'nowrap' }}>FCFA</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {erreurBien && <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '10px' }}>{erreurBien}</p>}

                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <button style={s.btnAnnuler} onClick={() => setModalAjouterBien(false)} disabled={envoiBien}>Annuler</button>
                  <button style={{ ...s.boutonPrim, flex: 1 }} onClick={soumettreBien} disabled={envoiBien}>{envoiBien ? 'Enregistrement...' : 'Enregistrer le bien'}</button>
                </div>
              </>
            ) : (
              <>
                <h3 style={{ margin: '0 0 4px', color: '#2e7d32', fontSize: '20px' }}>✅ Bien enregistré — 🔖 {bienCree.numero_bien}</h3>
                <p style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '16px' }}>Vous pouvez ajouter des photos maintenant, ou le faire plus tard depuis cette fiche.</p>

                <label style={s.label}>Ajouter des photos</label>
                <input type="file" accept="image/*,video/*" multiple onChange={e => setPhotosSelectionnees(Array.from(e.target.files))} />
                {photosSelectionnees.length > 0 && <p style={{ color: '#9ca3af', fontSize: '12px', margin: '6px 0' }}>{photosSelectionnees.length} fichier(s) sélectionné(s)</p>}
                {erreurPhotos && <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '6px' }}>{erreurPhotos}</p>}
                <button style={{ ...s.btnAction, marginTop: '10px' }} onClick={ajouterPhotosBienForm} disabled={envoiPhotos || photosSelectionnees.length === 0}>
                  {envoiPhotos ? 'Envoi...' : '📷 Envoyer les photos'}
                </button>

                {bienCree.photos && bienCree.photos.length > 0 && (
                  <p style={{ color: '#2e7d32', fontSize: '13px', marginTop: '10px' }}>{bienCree.photos.length} photo(s) déjà ajoutée(s) à ce bien.</p>
                )}

                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <button style={{ ...s.boutonPrim, flex: 1 }} onClick={terminerAjoutBien}>Terminé</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {modalAjouterLocataire && (
        <div style={s.overlay} onClick={() => setModalAjouterLocataire(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 4px', color: '#c4b5fd', fontSize: '20px' }}>+ Ajouter un locataire</h3>
            <p style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '16px' }}>Pour le compte de {p?.nom} — action tracée à votre nom. Le locataire doit déjà avoir un compte RentEasy et devra accepter la demande.</p>

            {succesLocataire ? (
              <p style={{ color: '#2e7d32', fontSize: '14px' }}>✅ {succesLocataire}</p>
            ) : (
              <>
                <label style={s.label}>Téléphone ou email du locataire</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input style={{ ...s.input, flex: 1 }} value={contactRecherche} onChange={e => setContactRecherche(e.target.value)} placeholder="+229... ou email" />
                  <button style={s.btnAction} onClick={rechercherLocataireAgent}>🔍</button>
                </div>

                {rechercheEffectuee && resultatRecherche && (
                  <div style={{ background: 'rgba(46,125,50,0.1)', border: '1px solid rgba(46,125,50,0.3)', borderRadius: '8px', padding: '12px', marginTop: '12px' }}>
                    <p style={{ margin: 0, color: '#e2e8f0', fontSize: '14px' }}>✅ {resultatRecherche.nom} — {resultatRecherche.telephone}</p>
                  </div>
                )}

                {erreurLocataire && <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '10px' }}>{erreurLocataire}</p>}

                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <button style={s.btnAnnuler} onClick={() => setModalAjouterLocataire(false)}>Fermer</button>
                  <button style={{ ...s.boutonPrim, flex: 1 }} onClick={envoyerDemandeLocataire} disabled={!resultatRecherche || envoiLocataire}>
                    {envoiLocataire ? 'Envoi...' : "Envoyer la demande d'ajout"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {modalCreerContrat && (
        <div style={s.overlay} onClick={() => !envoiContrat && setModalCreerContrat(false)}>
          <div style={{ ...s.modal, maxWidth: '560px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 4px', color: '#c4b5fd', fontSize: '20px' }}>+ Créer un contrat</h3>
            <p style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '16px' }}>Pour le compte de {p?.nom} — vous signez électroniquement pour son compte, action tracée à votre nom.</p>

            <label style={s.label}>Bien *</label>
            <select style={s.input} value={formContrat.numero_bien} onChange={e => choisirBienPourContrat(e.target.value)}>
              <option value="" style={s.option}>— Choisir un bien libre —</option>
              {(biens || []).filter(b => b.statut === 'libre').map(b => (
                <option key={b.id} value={b.numero_bien} style={s.option}>🔖 {b.numero_bien} — {b.adresse}, {b.ville}</option>
              ))}
            </select>

            <label style={s.label}>Locataire *</label>
            <select style={s.input} value={formContrat.locataire_id} onChange={e => setFormContrat({ ...formContrat, locataire_id: e.target.value })}>
              <option value="" style={s.option}>— Choisir un locataire —</option>
              {(locataires || []).map(l => (
                <option key={l.id} value={l.id} style={s.option}>{l.nom} — {l.telephone}</option>
              ))}
            </select>

            <label style={s.label}>Date de début *</label>
            <input style={s.input} type="date" value={formContrat.date_debut} onChange={e => setFormContrat({ ...formContrat, date_debut: e.target.value })} />

            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={s.label}>Durée</label>
                <input style={s.input} type="number" min="1" placeholder="Vide = indéterminée" value={formContrat.duree_valeur} onChange={e => setFormContrat({ ...formContrat, duree_valeur: e.target.value })} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={s.label}>&nbsp;</label>
                <select style={s.input} value={formContrat.duree_unite} onChange={e => setFormContrat({ ...formContrat, duree_unite: e.target.value })}>
                  <option value="jours" style={s.option}>Jour(s)</option>
                  <option value="semaines" style={s.option}>Semaine(s)</option>
                  <option value="mois" style={s.option}>Mois</option>
                  <option value="annees" style={s.option}>Année(s)</option>
                </select>
              </div>
            </div>

            <label style={s.label}>Type de loyer *</label>
            <select style={s.input} value={formContrat.type_loyer} onChange={e => choisirTypeLoyerContrat(e.target.value)}>
              {TYPES_LOYER_LISTE.map(t => <option key={t.value} value={t.value} style={s.option}>{t.label}</option>)}
            </select>
            {formContrat.date_debut && formContrat.type_loyer && (
              <p style={{ color: '#9ca3af', fontSize: '12px', margin: '4px 0 0' }}>📅 L'échéance sera calculée automatiquement à partir de la date de début.</p>
            )}

            <label style={s.label}>Loyer ({TYPES_LOYER_LISTE.find(t => t.value === formContrat.type_loyer)?.label?.toLowerCase()}) *</label>
            <input style={s.input} type="number" value={formContrat.loyer_mensuel} onChange={e => setFormContrat({ ...formContrat, loyer_mensuel: e.target.value })} />

            <label style={s.label}>Caution (FCFA)</label>
            <input style={s.input} type="number" value={formContrat.caution} onChange={e => setFormContrat({ ...formContrat, caution: e.target.value })} />

            <label style={s.label}>Votre signature (pour le compte du propriétaire) *</label>
            <input style={s.input} value={formContrat.signature_agent} onChange={e => setFormContrat({ ...formContrat, signature_agent: e.target.value })} placeholder="Votre nom complet" />

            {erreurContrat && <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '10px' }}>{erreurContrat}</p>}

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button style={s.btnAnnuler} onClick={() => setModalCreerContrat(false)} disabled={envoiContrat}>Annuler</button>
              <button style={{ ...s.boutonPrim, flex: 1 }} onClick={soumettreContrat} disabled={envoiContrat}>{envoiContrat ? 'Envoi...' : 'Signer pour le compte du propriétaire'}</button>
            </div>
          </div>
        </div>
      )}

      {contratDetail && (
        <div style={s.overlay} onClick={() => setContratDetail(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            {chargementDetail || !contratDetail.echeances ? (
              <p style={{ color: '#6b7280' }}>Chargement...</p>
            ) : (
              <>
                <h3 style={{ margin: '0 0 4px', color: '#c4b5fd', fontSize: '20px' }}>🔖 {contratDetail.numero_bien}</h3>
                <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '16px' }}>
                  {contratDetail.adresse}, {contratDetail.ville} · {contratDetail.locataire_nom} · {LABELS_LOYER[contratDetail.type_loyer] || contratDetail.type_loyer} · {formaterMontant(contratDetail.loyer_mensuel)}
                </p>

                {contratDetail.statut === 'demande_locataire' && delegationActive && (
                  <div style={{ background: 'rgba(21,101,192,0.1)', border: '1px solid rgba(21,101,192,0.3)', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
                    <p style={{ margin: '0 0 10px', color: '#c4b5fd', fontSize: '13px', fontWeight: '700' }}>📨 Demande en attente — traiter pour le compte de {p?.nom}</p>
                    <label style={s.label}>Votre signature (pour approuver)</label>
                    <input style={s.input} value={signatureDemandeAgent} onChange={e => setSignatureDemandeAgent(e.target.value)} placeholder="Votre nom complet" />
                    {erreurTraitement && <p style={{ color: '#ef4444', fontSize: '13px', margin: '8px 0 0' }}>{erreurTraitement}</p>}
                    <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                      <button style={{ ...s.btnAnnuler, flex: 1 }} onClick={refuserDemandeAgent} disabled={envoiTraitement}>✕ Refuser</button>
                      <button style={{ ...s.boutonPrim, flex: 1 }} onClick={approuverDemandeAgent} disabled={envoiTraitement}>
                        {envoiTraitement ? 'Envoi...' : '✍️ Approuver et signer'}
                      </button>
                    </div>
                  </div>
                )}

                <h4 style={{ color: '#e2e8f0', fontSize: '14px', margin: '0 0 8px' }}>Historique des échéances</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
                  {contratDetail.echeances.map(e => (
                    <div key={e.id} style={s.ligneEcheance}>
                      <span>{formaterDate(e.mois_concerne)}</span>
                      <span>{formaterMontant(e.montant_du)}</span>
                      <span style={{ color: STATUT_ECHEANCE[e.statut]?.color }}>{STATUT_ECHEANCE[e.statut]?.label || e.statut}</span>
                    </div>
                  ))}
                </div>
                <button style={{ ...s.navBtn, marginTop: '16px', width: '100%' }} onClick={() => setContratDetail(null)}>Fermer</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: 'linear-gradient(135deg,#0a0a0f 0%,#0d1117 100%)', fontFamily: "'Segoe UI',sans-serif", color: '#e2e8f0' },
  nav: { background: 'rgba(10,10,20,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(124,58,237,0.2)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px', position: 'sticky', top: 0, zIndex: 100 },
  navLogo: { color: '#e2e8f0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' },
  navBenin: { color: '#f59e0b' },
  agentBadge: { background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#000', fontSize: '11px', padding: '3px 10px', borderRadius: '20px', fontWeight: '800' },
  navMenu: { display: 'flex', gap: '8px', alignItems: 'center' },
  navBtn: { background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af', cursor: 'pointer', padding: '7px 12px', borderRadius: '6px', fontSize: '13px' },
  navDeconnexion: { background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', cursor: 'pointer', padding: '7px 12px', borderRadius: '6px', fontSize: '13px' },
  contenu: { padding: '28px 24px', maxWidth: '1100px', margin: '0 auto' },
  entete: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' },
  boutonVuePropio: { marginLeft: 'auto', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.4)', color: '#a78bfa', cursor: 'pointer', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap' },
  avatar: { width: '54px', height: '54px', borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '22px', flexShrink: 0 },
  titre: { margin: 0, fontSize: '22px', fontWeight: '800', color: '#e2e8f0' },
  sousTitre: { color: '#6b7280', margin: '4px 0 0', fontSize: '13px' },
  sousTitreSection: { color: '#c4b5fd', fontSize: '15px', margin: '28px 0 12px' },
  onglets: { display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '24px', flexWrap: 'wrap' },
  onglet: { background: 'transparent', border: 'none', borderBottom: '2px solid transparent', color: '#9ca3af', cursor: 'pointer', padding: '10px 4px', fontSize: '14px', marginRight: '20px' },
  ongletActif: { color: '#c4b5fd', borderBottom: '2px solid #7c3aed', fontWeight: '600' },
  grilleStats: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '12px' },
  carteStat: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px' },
  statLabel: { color: '#9ca3af', fontSize: '12px', margin: 0 },
  statVal: { color: '#e2e8f0', fontSize: '22px', fontWeight: '700', margin: '6px 0' },
  statSous: { color: '#6b7280', fontSize: '12px', margin: 0 },
  tableau: { display: 'flex', flexDirection: 'column', gap: '6px' },
  ligneTableau: { display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '12px', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#e2e8f0' },
  carteBien: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', cursor: 'pointer' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modal: { background: '#12121a', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' },
  ligneEcheance: { display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '10px', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '8px 12px', fontSize: '13px' },
  delegationBanniere: { border: '1px solid', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', color: '#c4b5fd', marginBottom: '20px', background: 'rgba(255,255,255,0.02)', lineHeight: '1.5' },
  badgeAgent: { display: 'inline-block', marginTop: '8px', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: '700' },
  btnAction: { background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginBottom: '16px' },
  label: { display: 'block', color: '#9ca3af', fontSize: '12px', fontWeight: '600', margin: '12px 0 6px' },
  input: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '14px', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', color: '#e2e8f0', outline: 'none' },
  option: { background: '#12121a', color: '#e2e8f0' },
  boutonPrim: { background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  btnAnnuler: { background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', cursor: 'pointer', flex: 1 },
  grille2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' },
  typeGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px', marginBottom: '8px' },
  typeCard: { borderRadius: '8px', padding: '12px', cursor: 'pointer', transition: 'all 0.2s' },
  typeCardLabel: { fontWeight: '700', fontSize: '13px', color: '#c4b5fd', marginBottom: '4px' },
  typeCardDesc: { fontSize: '11px', color: '#6b7280', lineHeight: '1.3' },
  journalLigne: { display: 'flex', gap: '12px', alignItems: 'flex-start', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '10px 14px' },
  journalIcone: { fontSize: '16px', flexShrink: 0 },
};
