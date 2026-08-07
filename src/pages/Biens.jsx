import { useEffect, useState } from 'react';
import ClocheNotifications from '../components/ClocheNotifications';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import Lightbox from '../components/Lightbox';

const API_BASE = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

function estVideo(chemin) {
  return /\.(mp4|webm|mov|quicktime)$/i.test(chemin);
}

const TYPES_BIEN = [
  { value: 'appartement', label: 'Appartement', description: 'Logement dans un immeuble collectif' },
  { value: 'maison', label: 'Maison', description: 'Maison individuelle' },
  { value: 'villa', label: 'Villa', description: 'Maison de standing avec espaces extérieurs' },
  { value: 'studio', label: 'Studio', description: 'Logement d\'une seule pièce principale' },
  { value: 'chambre', label: 'Chambre', description: 'Chambre seule, souvent meublée' },
  { value: 'commerce', label: 'Commerce', description: 'Local commercial : boutique, bureau, atelier, entrepôt, restaurant...' },
  { value: 'vehicule', label: 'Véhicule', description: 'Voiture, moto, camion, bus en location' },
];

const TYPES_LOYER = {
  appartement: ['journalier', 'hebdomadaire', 'mensuel', 'annuel'],
  maison: ['journalier', 'hebdomadaire', 'mensuel', 'annuel'],
  villa: ['journalier', 'hebdomadaire', 'mensuel', 'annuel'],
  studio: ['journalier', 'hebdomadaire', 'mensuel', 'annuel'],
  chambre: ['journalier', 'hebdomadaire', 'mensuel', 'annuel'],
  commerce: ['journalier', 'mensuel', 'annuel'],
  vehicule: ['journalier', 'hebdomadaire', 'mensuel'],
};

const LABELS_LOYER = {
  journalier: 'Journalier (par jour)',
  hebdomadaire: 'Hebdomadaire (par semaine)',
  mensuel: 'Mensuel (par mois)',
  annuel: 'Annuel (par an)',
};

const champLabel = 'mt-3 mb-1 block text-sm font-semibold text-slate-700';
const champInput = 'w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30';

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

function CaracteristiquesForm({ typeBien, caracteristiques, setCaracteristiques }) {
  function set(key, val) {
    setCaracteristiques(prev => ({ ...prev, [key]: val }));
  }

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
        {typeBien === 'villa' && (
          <ChampBoolean label="Piscine" valeur={c.piscine || ''} onChange={v => set('piscine', v)} />
        )}
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

function DetailsBien({ bien }) {
  const c = bien.caracteristiques || {};
  const items = Object.entries(c).filter(([, v]) => v && v !== '');

  if (items.length === 0) return <p className="text-[13px] text-slate-400">Aucune caractéristique renseignée.</p>;

  const labels = {
    nb_chambres: 'Chambres', nb_sanitaires: 'Sanitaires', nb_etages: 'Étages',
    nb_cuisines: 'Cuisines', superficie: 'Superficie (m²)', etage: 'Étage',
    salon: 'Salon', cuisine: 'Cuisine', climatise: 'Climatisé', meuble: 'Meublé',
    jardin: 'Jardin', garage: 'Garage', piscine: 'Piscine', vitrine: 'Vitrine',
    parking: 'Parking', type_activite: 'Type d\'activité', type_vehicule: 'Type de véhicule',
    marque: 'Marque', modele: 'Modèle', annee: 'Année', immatriculation: 'Immatriculation',
    kilometrage: 'Kilométrage (km)', chauffeur: 'Chauffeur inclus',
  };

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-2.5">
      {items.map(([key, val]) => (
        <div key={key} className="rounded-lg bg-slate-50 px-3 py-2.5">
          <span className="mb-1 block text-[11px] uppercase tracking-wide text-slate-400">{labels[key] || key}</span>
          <span className="text-sm font-semibold text-slate-800">{val}</span>
        </div>
      ))}
    </div>
  );
}

export default function Biens() {
  const [biens, setBiens] = useState([]);
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);
  const [bienDetail, setBienDetail] = useState(null);
  const [reservationsBien, setReservationsBien] = useState([]);
  const [modalMarche, setModalMarche] = useState(null);
  const [descriptionMarche, setDescriptionMarche] = useState('');
  const [envoiMarche, setEnvoiMarche] = useState(false);
  const [succesMarche, setSuccesMarche] = useState('');
  const [bienModifier, setBienModifier] = useState(null);
  const [photosSelectionnees, setPhotosSelectionnees] = useState([]);
  const [envoiPhotos, setEnvoiPhotos] = useState(false);
  const [erreurPhotos, setErreurPhotos] = useState('');
  const [formModif, setFormModif] = useState({});
  const [caracteristiquesModif, setCaracteristiquesModif] = useState({});
  const [tarifsModif, setTarifsModif] = useState({});
  const [envoiModif, setEnvoiModif] = useState(false);
  const [erreurModif, setErreurModif] = useState('');
  const [chargement, setChargement] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');
  const [typeBien, setTypeBien] = useState('appartement');
  const [caracteristiques, setCaracteristiques] = useState({});
  const [tarifs, setTarifs] = useState({});
  const [form, setForm] = useState({
    adresse: '', ville: '', quartier: '', lieu_depot: '',
  });
  const navigate = useNavigate();
  const location = useLocation();
  const { utilisateur } = useAuth();
  const estAussiLocataire = (utilisateur?.role || '').includes('locataire');

  // Un admin/super_admin peut consulter (et gérer) les biens d'un propriétaire précis via
  // ?proprietaire_id= (repris depuis AgentProprietaireDetail).
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

  useEffect(() => { chargerBiens(); }, [proprietaireIdConsulte]);

  async function chargerBiens() {
    try {
      const params = enConsultationAdmin ? { proprietaire_id: proprietaireIdConsulte } : {};
      const r = await api.get('/biens', { params });
      setBiens(r.data);
    } catch (e) {
      console.error(e);
    } finally {
      setChargement(false);
    }
  }

  function changerTypeBien(type) {
    setTypeBien(type);
    setCaracteristiques({});
    const typeLoyers = TYPES_LOYER[type];
    setForm(f => ({ ...f, type_loyer: typeLoyers[typeLoyers.length > 2 ? 2 : 0] }));
  }

  async function handleToggleMarche() {
    setEnvoiMarche(true);
    try {
      const r = await api.patch(`/biens/${modalMarche.id}/marche`, { description_marche: descriptionMarche });
      setSuccesMarche(r.data.message);
      setTimeout(() => { setModalMarche(null); setSuccesMarche(''); chargerBiens(); }, 1500);
    } catch (e) {
      alert(e.response?.data?.message || 'Erreur');
    } finally {
      setEnvoiMarche(false);
    }
  }

  async function ajouterBien() {
    setErreur('');
    const estVehicule = typeBien === 'vehicule';

    const tarifsActifs = Object.entries(tarifs).filter(([, v]) => v && parseInt(v) > 0);
    if (!form.ville || tarifsActifs.length === 0) {
      setErreur('Ville et au moins un tarif sont obligatoires');
      return;
    }
    if (!estVehicule && !form.adresse) {
      setErreur('L\'adresse est obligatoire pour un bien immobilier');
      return;
    }

    setEnvoi(true);
    try {
      const r = await api.post('/biens', {
        adresse: estVehicule ? null : form.adresse,
        ville: form.ville,
        quartier: estVehicule ? null : form.quartier,
        lieu_depot: estVehicule ? form.lieu_depot : null,
        type_bien: typeBien,
        loyer_mensuel: parseInt(tarifs.mensuel || tarifs.journalier || tarifs.hebdomadaire || tarifs.annuel || 0),
        type_loyer: Object.keys(tarifs).find(k => tarifs[k] && parseInt(tarifs[k]) > 0) || 'mensuel',
        tarifs: Object.fromEntries(Object.entries(tarifs).filter(([, v]) => v && parseInt(v) > 0).map(([k, v]) => [k, parseInt(v)])),
        ...(enConsultationAdmin ? { proprietaire_id: proprietaireIdConsulte } : {}),
        caracteristiques,
      });
      setForm({ adresse: '', ville: '', quartier: '', lieu_depot: '' });
      setTarifs({});
      setTypeBien('appartement');
      setCaracteristiques({});
      setAfficherFormulaire(false);
      await chargerBiens();
      // Ouvre directement la modification pour permettre d'ajouter des photos au bien tout juste créé
      ouvrirModification(r.data);
    } catch (e) {
      setErreur(e.response?.data?.message || 'Erreur lors de l\'ajout');
    } finally {
      setEnvoi(false);
    }
  }

  function formaterMontant(n) {
    return parseInt(n).toLocaleString('fr-FR') + ' FCFA';
  }

  async function chargerReservationsBien(bienId) {
    setReservationsBien([]);
    try {
      const r = await api.get(`/biens/${bienId}/reservations`);
      setReservationsBien(r.data);
    } catch (e) {
      console.error(e);
    }
  }

  function ouvrirModification(bien) {
    setBienDetail(null);
    setAfficherFormulaire(false);
    setBienModifier(bien);
    setFormModif({
      adresse: bien.adresse || '',
      ville: bien.ville || '',
      quartier: bien.quartier || '',
      lieu_depot: bien.lieu_depot || '',
    });
    setCaracteristiquesModif(bien.caracteristiques || {});
    setPhotosSelectionnees([]);
    setErreurPhotos('');
    setTarifsModif(
      bien.tarifs && Object.keys(bien.tarifs).length > 0
        ? Object.fromEntries(Object.entries(bien.tarifs).map(([k, v]) => [k, String(v)]))
        : { [bien.type_loyer || 'mensuel']: String(bien.loyer_mensuel || '') }
    );
    setErreurModif('');
  }

  async function enregistrerModification() {
    setErreurModif('');
    if (!formModif.ville) {
      setErreurModif('La ville est obligatoire');
      return;
    }
    const estVehicule = bienModifier.type_bien === 'vehicule';
    if (!estVehicule && !formModif.adresse) {
      setErreurModif("L'adresse est obligatoire pour un bien immobilier");
      return;
    }
    const tarifsActifs = Object.entries(tarifsModif).filter(([, v]) => v && parseInt(v) > 0);
    if (tarifsActifs.length === 0) {
      setErreurModif('Renseignez au moins un tarif');
      return;
    }

    setEnvoiModif(true);
    try {
      await api.put(`/biens/${bienModifier.id}`, {
        adresse: estVehicule ? null : formModif.adresse,
        ville: formModif.ville,
        quartier: estVehicule ? null : formModif.quartier,
        lieu_depot: estVehicule ? formModif.lieu_depot : null,
        loyer_mensuel: parseInt(tarifsModif.mensuel || tarifsModif.journalier || tarifsModif.hebdomadaire || tarifsModif.annuel || 0),
        type_loyer: Object.keys(tarifsModif).find(k => tarifsModif[k] && parseInt(tarifsModif[k]) > 0) || 'mensuel',
        tarifs: Object.fromEntries(tarifsActifs.map(([k, v]) => [k, parseInt(v)])),
        caracteristiques: caracteristiquesModif,
      });
      setBienModifier(null);
      chargerBiens();
    } catch (e) {
      setErreurModif(e.response?.data?.message || 'Erreur lors de la modification');
    } finally {
      setEnvoiModif(false);
    }
  }

  async function ajouterPhotos() {
    setErreurPhotos('');
    if (photosSelectionnees.length === 0) {
      setErreurPhotos('Sélectionnez au moins une photo');
      return;
    }
    setEnvoiPhotos(true);
    try {
      const formData = new FormData();
      photosSelectionnees.forEach(f => formData.append('photos', f));
      const r = await api.post(`/biens/${bienModifier.id}/photos`, formData);
      setBienModifier({ ...bienModifier, photos: r.data.photos });
      setPhotosSelectionnees([]);
      chargerBiens();
    } catch (e) {
      setErreurPhotos(e.response?.data?.message || "Erreur lors de l'envoi des photos");
    } finally {
      setEnvoiPhotos(false);
    }
  }

  async function supprimerPhoto(chemin) {
    try {
      const r = await api.delete(`/biens/${bienModifier.id}/photos`, { data: { chemin } });
      setBienModifier({ ...bienModifier, photos: r.data.photos });
      chargerBiens();
    } catch (e) {
      alert(e.response?.data?.message || 'Erreur lors de la suppression de la photo');
    }
  }

  async function supprimerBienAction(bien) {
    const confirmation = window.confirm(
      `Supprimer définitivement "${bien.adresse || bien.lieu_depot}" ? Cette action est irréversible.`
    );
    if (!confirmation) return;

    try {
      await api.delete(`/biens/${bien.id}`);
      if (bienDetail?.id === bien.id) setBienDetail(null);
      chargerBiens();
    } catch (e) {
      alert(e.response?.data?.message || 'Erreur lors de la suppression. Un bien sous contrat actif ne peut pas être supprimé.');
    }
  }

  const estVehicule = typeBien === 'vehicule';
  const typeLoyers = TYPES_LOYER[typeBien] || ['mensuel'];

  const boutonPrimaire = 'rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60';
  const boutonSecondaire = 'rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50';
  const boutonSupprimer = 'rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-100';
  const grille2 = 'grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4';

  return (
    <div className="min-h-screen bg-brand-50">
      <nav className="re-nav sticky top-0 z-[100] flex h-[60px] items-center justify-between border-b border-slate-100 bg-white/95 px-6 backdrop-blur">
        <div className="cursor-pointer text-lg text-slate-900" onClick={() => navigate(lienConsultation('/dashboard'))}>🏠 <strong>RentEasy</strong> <span className="text-accent-600">Bénin</span></div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button className="whitespace-nowrap rounded-lg border border-brand-600 bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700">Mes biens</button>
          <button className="whitespace-nowrap rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50" onClick={() => navigate(lienConsultation('/locataires'))}>Locataires</button>
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
            🛡️ Vous consultez et gérez les biens de <strong>{proprietaireNomConsulte || 'ce propriétaire'}</strong> en tant qu'administrateur.
          </div>
        )}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-slate-900">Mes biens</h2>
          <button className={boutonPrimaire} onClick={() => { setAfficherFormulaire(!afficherFormulaire); setBienDetail(null); }}>
            {afficherFormulaire ? '✕ Annuler' : '+ Ajouter un bien'}
          </button>
        </div>

        {/* Formulaire d'ajout */}
        {afficherFormulaire && (
          <div className="mb-6 rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 p-6 shadow-card">
            <h3 className="mb-4 text-lg font-bold text-slate-900">Nouveau bien</h3>

            {/* Sélection du type */}
            <label className={champLabel}>Type de bien *</label>
            <div className="mb-2 grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2.5">
              {TYPES_BIEN.map(t => (
                <div
                  key={t.value}
                  className={`cursor-pointer rounded-xl border-2 p-3 transition ${typeBien === t.value ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-white'}`}
                  onClick={() => changerTypeBien(t.value)}
                >
                  <div className="mb-1 text-sm font-bold text-slate-900">{t.label}</div>
                  <div className="text-[11px] leading-snug text-slate-400">{t.description}</div>
                </div>
              ))}
            </div>

            {/* Localisation */}
            <div className={`mt-5 ${grille2}`}>
              {!estVehicule && (
                <div>
                  <label className={champLabel}>Adresse *</label>
                  <input className={champInput} placeholder="Rue 123, Quartier..." value={form.adresse} onChange={e => setForm({ ...form, adresse: e.target.value })} />
                </div>
              )}
              <div>
                <label className={champLabel}>Ville *</label>
                <input className={champInput} placeholder="Cotonou" value={form.ville} onChange={e => setForm({ ...form, ville: e.target.value })} />
              </div>
              {!estVehicule && (
                <div>
                  <label className={champLabel}>Quartier</label>
                  <input className={champInput} placeholder="Fidjrosse" value={form.quartier} onChange={e => setForm({ ...form, quartier: e.target.value })} />
                </div>
              )}
              {estVehicule && (
                <div>
                  <label className={champLabel}>Lieu de dépôt / stationnement</label>
                  <input className={champInput} placeholder="Ex: Carrefour Cadjèhoun" value={form.lieu_depot} onChange={e => setForm({ ...form, lieu_depot: e.target.value })} />
                </div>
              )}
            </div>

            {/* Caractéristiques dynamiques */}
            <div className="mt-4">
              <label className="mb-3 block text-sm font-bold text-brand-700">
                Caractéristiques du {TYPES_BIEN.find(t => t.value === typeBien)?.label}
              </label>
              <CaracteristiquesForm typeBien={typeBien} caracteristiques={caracteristiques} setCaracteristiques={setCaracteristiques} />
            </div>

            {/* Tarifs multiples */}
            <div className="mt-4">
              <label className="mb-3 block text-sm font-bold text-brand-700">
                💰 Tarifs du loyer * <span className="text-xs font-normal text-slate-400">(renseignez les périodicités que vous proposez)</span>
              </label>
              <div className={grille2}>
                {typeLoyers.map(t => (
                  <div key={t}>
                    <label className={champLabel}>{LABELS_LOYER[t]}</label>
                    <div className="flex items-center gap-2">
                      <input
                        className={`${champInput} ${tarifs[t] ? 'border-accent-400' : ''}`}
                        type="number"
                        placeholder="Laisser vide si non proposé"
                        value={tarifs[t] || ''}
                        onChange={e => setTarifs({ ...tarifs, [t]: e.target.value })}
                      />
                      <span className="whitespace-nowrap text-[13px] text-slate-400">FCFA</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {erreur && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{erreur}</p>}
            <button className={`${boutonPrimaire} mt-4`} onClick={ajouterBien} disabled={envoi}>
              {envoi ? 'Enregistrement...' : 'Enregistrer le bien'}
            </button>
          </div>
        )}

        {/* Détail d'un bien */}
        {bienDetail && (
          <div className="mb-6 rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 p-6 shadow-card">
            <div className="mb-1 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                {TYPES_BIEN.find(t => t.value === bienDetail.type_bien)?.label} — {bienDetail.adresse || bienDetail.lieu_depot || '—'}
              </h3>
              <button className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-200" onClick={() => setBienDetail(null)}>✕ Fermer</button>
            </div>
            <p className="mb-4 text-xs font-bold tracking-wide text-accent-600">🔖 N° {bienDetail.numero_bien} <span className="font-normal text-slate-400">— à utiliser pour créer un contrat</span></p>
            <div className={grille2}>
              <div className="mb-2">
                <p className="mb-2 text-sm font-bold text-brand-700">📍 Localisation</p>
                <p className="text-sm text-slate-700"><strong>Ville :</strong> {bienDetail.ville}</p>
                {bienDetail.quartier && <p className="text-sm text-slate-700"><strong>Quartier :</strong> {bienDetail.quartier}</p>}
                {bienDetail.adresse && <p className="text-sm text-slate-700"><strong>Adresse :</strong> {bienDetail.adresse}</p>}
                {bienDetail.lieu_depot && <p className="text-sm text-slate-700"><strong>Lieu de dépôt :</strong> {bienDetail.lieu_depot}</p>}
              </div>
              <div className="mb-2">
                <p className="mb-2 text-sm font-bold text-brand-700">💰 Loyer</p>
                {bienDetail.tarifs && Object.keys(bienDetail.tarifs).length > 0
                  ? Object.entries(bienDetail.tarifs).map(([k, v]) => (
                      <p key={k} className="text-sm text-slate-700"><strong>{LABELS_LOYER[k]} :</strong> {formaterMontant(v)}</p>
                    ))
                  : <p className="text-sm text-slate-700"><strong>Loyer :</strong> {formaterMontant(bienDetail.loyer_mensuel)}</p>
                }
                <p className="text-sm text-slate-700"><strong>Statut :</strong> {bienDetail.statut === 'occupe' ? '● Occupé' : '○ Libre'}</p>
              </div>
            </div>
            {bienDetail.photos && bienDetail.photos.length > 0 && (
              <div className="mt-4">
                <div className="mb-2.5 flex items-center justify-between">
                  <p className="m-0 text-sm font-bold text-brand-700">📷 Aperçu</p>
                  <Lightbox medias={bienDetail.photos} />
                </div>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] gap-2">
                  {bienDetail.photos.map(photo => (
                    estVideo(photo) ? (
                      <video key={photo} src={`${API_BASE}${photo}`} className="h-[70px] w-full rounded-lg border border-slate-100 object-cover" />
                    ) : (
                      <img key={photo} src={`${API_BASE}${photo}`} alt="Aperçu du bien" className="h-[70px] w-full rounded-lg border border-slate-100 object-cover" />
                    )
                  ))}
                </div>
              </div>
            )}
            <div className="mt-4">
              <p className="mb-2 text-sm font-bold text-brand-700">🔍 Caractéristiques</p>
              <DetailsBien bien={bienDetail} />
            </div>
            <div className="mt-4">
              <p className="mb-2 text-sm font-bold text-brand-700">📅 Réservations</p>
              {reservationsBien.length === 0 ? (
                <p className="text-[13px] text-brand-600">✅ Aucune réservation — bien entièrement disponible</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {reservationsBien.map(r => (
                    <div key={r.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3.5 py-2.5">
                      <div>
                        <div className="text-[13px] font-semibold text-slate-800">
                          {r.origine === 'locataire_location' ? '🔑' : r.origine === 'locataire_reservation' ? '📅' : '📋'} {r.locataire_nom} · {r.locataire_telephone}
                        </div>
                        <div className="text-xs text-slate-400">
                          Du {new Date(r.date_debut).toLocaleDateString('fr-FR')} {r.date_fin ? `au ${new Date(r.date_fin).toLocaleDateString('fr-FR')}` : '(indéterminée)'} · {r.type_loyer}
                        </div>
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        r.statut === 'actif' ? 'bg-red-50 text-red-600' : r.statut === 'en_attente_signature' ? 'bg-accent-50 text-accent-700' : 'bg-brand-50 text-brand-700'
                      }`}>
                        {r.statut === 'actif' ? 'Actif' : r.statut === 'en_attente_signature' ? 'Signature en attente' : 'Demande en attente'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Liste des biens */}
        {chargement ? (
          <p className="py-10 text-center text-slate-400">Chargement...</p>
        ) : biens.length === 0 ? (
          <div className="rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 p-10 text-center text-slate-400 shadow-card">
            <p>🏘️ Vous n'avez pas encore de bien enregistré.</p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
            {biens.map(b => (
              <div key={b.id} className="rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 p-5 shadow-card">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">{TYPES_BIEN.find(t => t.value === b.type_bien)?.label || b.type_bien}</span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${b.statut === 'occupe' ? 'bg-emerald-50 text-emerald-700' : 'bg-accent-50 text-accent-700'}`}>
                    {b.statut === 'occupe' ? '● Occupé' : '○ Libre'}
                  </span>
                </div>
                <p className="mb-1.5 text-xs font-bold tracking-wide text-accent-600">🔖 N° {b.numero_bien}</p>
                <p className="m-0 text-[15px] font-semibold text-slate-900">{b.adresse || b.lieu_depot || '—'}</p>
                <p className="mb-3 mt-0.5 text-[13px] text-slate-400">{b.quartier ? `${b.quartier}, ` : ''}{b.ville}</p>
                {b.effectue_par_agent_id && (
                  <span className="mt-1.5 inline-block rounded-full border border-accent-200 bg-accent-50 px-2.5 py-0.5 text-[11px] font-bold text-accent-700">
                    🤝 Ajouté par votre agent
                  </span>
                )}
                <div className="mt-2">
                  {b.tarifs && Object.keys(b.tarifs).length > 0
                    ? Object.entries(b.tarifs).slice(0, 2).map(([k, v]) => (
                        <p key={k} className="m-0 my-0.5 text-sm font-bold text-brand-700">
                          {formaterMontant(v)} <span className="text-xs font-normal text-slate-400">/ {k}</span>
                        </p>
                      ))
                    : <p className="m-0 text-base font-bold text-brand-700">{formaterMontant(b.loyer_mensuel)} <span className="text-xs font-normal text-slate-400">/ {b.type_loyer || 'mois'}</span></p>
                  }
                </div>
                <div className="mt-3 flex gap-2">
                  <button className={`${boutonSecondaire} flex-1`} onClick={() => { setBienDetail(b); setAfficherFormulaire(false); chargerReservationsBien(b.id); }}>
                    🔍 Voir les détails
                  </button>
                  {b.statut === 'libre' && (
                    <button
                      className={`flex-1 rounded-lg px-3.5 py-2 text-xs font-semibold ${b.sur_le_marche ? 'border border-red-300 bg-red-50 text-red-600' : 'bg-brand-600 text-white hover:bg-brand-700'}`}
                      onClick={() => { setModalMarche(b); setDescriptionMarche(b.description_marche || ''); setSuccesMarche(''); }}
                    >
                      {b.sur_le_marche ? '🏪 Retirer du marché' : '🏪 Mettre sur le marché'}
                    </button>
                  )}
                </div>
                <div className="mt-2 flex gap-2">
                  {b.statut === 'libre' && (
                    <button className={`${boutonSecondaire} flex-1`} onClick={() => ouvrirModification(b)}>
                      ✏️ Modifier
                    </button>
                  )}
                  {b.statut === 'libre' && (
                    <button className={`${boutonSupprimer} flex-1`} onClick={() => supprimerBienAction(b)}>
                      🗑️ Supprimer
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal modification */}
      {bienModifier && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/50 p-5 backdrop-blur-sm">
          <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-7 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">✏️ Modifier le bien</h3>
              <button className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-200" onClick={() => setBienModifier(null)}>✕ Fermer</button>
            </div>

            <div className={grille2}>
              {bienModifier.type_bien !== 'vehicule' ? (
                <>
                  <ChampTexte label="Adresse" valeur={formModif.adresse} onChange={v => setFormModif({ ...formModif, adresse: v })} />
                  <ChampTexte label="Quartier" valeur={formModif.quartier} onChange={v => setFormModif({ ...formModif, quartier: v })} />
                </>
              ) : (
                <ChampTexte label="Lieu de dépôt" valeur={formModif.lieu_depot} onChange={v => setFormModif({ ...formModif, lieu_depot: v })} />
              )}
              <ChampTexte label="Ville" valeur={formModif.ville} onChange={v => setFormModif({ ...formModif, ville: v })} />
            </div>

            <div className="mt-4">
              <label className="mb-3 block text-sm font-bold text-brand-700">
                💰 Tarifs du loyer * <span className="text-xs font-normal text-slate-400">(renseignez les périodicités que vous proposez)</span>
              </label>
              <div className={grille2}>
                {(TYPES_LOYER[bienModifier.type_bien] || ['mensuel']).map(t => (
                  <div key={t}>
                    <label className={champLabel}>{LABELS_LOYER[t]}</label>
                    <div className="flex items-center gap-2">
                      <input
                        className={`${champInput} ${tarifsModif[t] ? 'border-accent-400' : ''}`}
                        type="number"
                        placeholder="Laisser vide si non proposé"
                        value={tarifsModif[t] || ''}
                        onChange={e => setTarifsModif({ ...tarifsModif, [t]: e.target.value })}
                      />
                      <span className="whitespace-nowrap text-[13px] text-slate-400">FCFA</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-sm font-bold text-brand-700">🔍 Caractéristiques</p>
              <CaracteristiquesForm typeBien={bienModifier.type_bien} caracteristiques={caracteristiquesModif} setCaracteristiques={setCaracteristiquesModif} />
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-brand-700">📷 Aperçu (photos &amp; vidéos) <span className="text-xs font-normal text-slate-400">(optionnel)</span></p>
                {(bienModifier.photos || []).length > 0 && <Lightbox medias={bienModifier.photos} />}
              </div>

              {(bienModifier.photos || []).length > 0 && (
                <div className="mb-3 grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] gap-2">
                  {bienModifier.photos.map(photo => (
                    <div key={photo} className="relative">
                      {estVideo(photo) ? (
                        <video src={`${API_BASE}${photo}`} controls className="h-20 w-full rounded-lg border border-slate-100 object-cover" />
                      ) : (
                        <img src={`${API_BASE}${photo}`} alt="Aperçu du bien" className="h-20 w-full rounded-lg border border-slate-100 object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={() => supprimerPhoto(photo)}
                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 p-0 text-xs leading-5 text-white"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
                multiple
                onChange={e => setPhotosSelectionnees(Array.from(e.target.files))}
                className="text-[13px] text-slate-500"
              />
              {photosSelectionnees.length > 0 && (
                <button type="button" className={`${boutonSecondaire} ml-2.5`} onClick={ajouterPhotos} disabled={envoiPhotos}>
                  {envoiPhotos ? 'Envoi...' : `📤 Envoyer (${photosSelectionnees.length})`}
                </button>
              )}
              {erreurPhotos && <p className="mt-1.5 text-xs text-red-600">{erreurPhotos}</p>}
            </div>

            {erreurModif && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{erreurModif}</p>}

            <div className="mt-5 flex gap-3">
              <button className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50" onClick={() => setBienModifier(null)}>Annuler</button>
              <button className={`${boutonPrimaire} flex-1`} onClick={enregistrerModification} disabled={envoiModif}>
                {envoiModif ? 'Enregistrement...' : '✅ Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal marché */}
      {modalMarche && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/50 p-5 backdrop-blur-sm">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-7 shadow-2xl">
            <h3 className="mb-2 text-xl font-bold text-brand-700">
              {modalMarche.sur_le_marche ? '🏪 Retirer du marché' : '🏪 Mettre sur le marché'}
            </h3>
            <p className="mb-4 text-sm text-slate-500">{modalMarche.adresse}, {modalMarche.ville}</p>

            {succesMarche ? (
              <div className="rounded-xl border border-brand-200 bg-brand-50 p-3 text-center text-brand-700">
                ✅ {succesMarche}
              </div>
            ) : (
              <>
                {!modalMarche.sur_le_marche && (
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Description pour les locataires (optionnel)
                    </label>
                    <textarea
                      className={`${champInput} h-20 resize-y`}
                      placeholder="Ex: Appartement lumineux au 2e étage, proche du marché..."
                      value={descriptionMarche}
                      onChange={e => setDescriptionMarche(e.target.value)}
                    />
                  </div>
                )}
                <div className="mt-4 flex gap-3">
                  <button className="flex-1 rounded-lg border border-slate-200 px-5 py-2.5 text-sm text-slate-500 hover:bg-slate-50" onClick={() => setModalMarche(null)}>
                    Annuler
                  </button>
                  <button
                    className={`flex-1 rounded-lg px-5 py-2.5 text-sm font-semibold text-white ${modalMarche.sur_le_marche ? 'bg-red-600 hover:bg-red-700' : 'bg-brand-600 hover:bg-brand-700'}`}
                    onClick={handleToggleMarche}
                    disabled={envoiMarche}
                  >
                    {envoiMarche ? 'Traitement...' : modalMarche.sur_le_marche ? 'Retirer du marché' : '🏪 Publier'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
