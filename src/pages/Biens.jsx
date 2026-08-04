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

function ChampBoolean({ label, valeur, onChange }) {
  return (
    <div>
      <label style={styles.label}>{label}</label>
      <select style={styles.input} value={valeur} onChange={e => onChange(e.target.value)}>
        <option value="" style={styles.option}>Non spécifié</option>
        <option value="oui" style={styles.option}>Oui</option>
        <option value="non" style={styles.option}>Non</option>
      </select>
    </div>
  );
}

function ChampNombre({ label, valeur, onChange, placeholder }) {
  return (
    <div>
      <label style={styles.label}>{label}</label>
      <input style={styles.input} type="number" min="0" placeholder={placeholder || '0'} value={valeur} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

function ChampTexte({ label, valeur, onChange, placeholder }) {
  return (
    <div>
      <label style={styles.label}>{label}</label>
      <input style={styles.input} type="text" placeholder={placeholder || ''} value={valeur} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

function CaracteristiquesForm({ typeBien, caracteristiques, setCaracteristiques }) {
  function set(key, val) {
    setCaracteristiques(prev => ({ ...prev, [key]: val }));
  }

  const c = caracteristiques;

  if (['appartement', 'studio', 'chambre'].includes(typeBien)) {
    return (
      <div style={styles.grille2}>
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
      <div style={styles.grille2}>
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
      <div style={styles.grille2}>
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
      <div style={styles.grille2}>
        <div>
          <label style={styles.label}>Type de véhicule</label>
          <select style={styles.input} value={c.type_vehicule || ''} onChange={e => set('type_vehicule', e.target.value)}>
            <option value="" style={styles.option}>Sélectionner...</option>
            <option value="voiture" style={styles.option}>Voiture</option>
            <option value="moto" style={styles.option}>Moto</option>
            <option value="camion" style={styles.option}>Camion</option>
            <option value="bus" style={styles.option}>Bus / Minibus</option>
            <option value="autre" style={styles.option}>Autre</option>
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

  if (items.length === 0) return <p style={{ color: '#6b7280', fontSize: '13px' }}>Aucune caractéristique renseignée.</p>;

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
    <div style={styles.detailsGrid}>
      {items.map(([key, val]) => (
        <div key={key} style={styles.detailItem}>
          <span style={styles.detailLabel}>{labels[key] || key}</span>
          <span style={styles.detailValeur}>{val}</span>
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
  // typeLoyers utilisé dans le formulaire de tarifs

  return (
    <div style={styles.page}>
      <nav style={styles.nav} className="re-nav">
        <div style={styles.navLogo} onClick={() => navigate(lienConsultation('/dashboard'))}>🏠 <strong>RentEasy</strong> <span style={styles.navBenin}>Bénin</span></div>
        <div style={styles.navMenu}>
          <button style={styles.navBtnActif}>Mes biens</button>
          <button style={styles.navBtn} onClick={() => navigate(lienConsultation('/locataires'))}>Locataires</button>
          <button style={styles.navBtn} onClick={() => navigate(lienConsultation('/paiements'))}>Paiements</button>
          <button style={styles.navBtn} onClick={() => navigate(lienConsultation('/dashboard'))}>Dashboard</button>
          {estAussiLocataire && !enConsultationAdmin && (
            <button style={styles.navBtnBasculer} onClick={() => navigate('/locataire/dashboard')}>🔄 Espace locataire</button>
          )}
          <button style={styles.navBtnProfil} onClick={() => navigate('/profil')}>👤 Mon profil</button>
          <ClocheNotifications />
        </div>
      </nav>

      <div style={styles.contenu}>
        {enConsultationAdmin && (
          <div style={styles.bandeauConsultation}>
            🛡️ Vous consultez et gérez les biens de <strong>{proprietaireNomConsulte || 'ce propriétaire'}</strong> en tant qu'administrateur.
          </div>
        )}
        <div style={styles.entete}>
          <h2 style={styles.titre}>Mes biens</h2>
          <button style={styles.boutonPrimaire} onClick={() => { setAfficherFormulaire(!afficherFormulaire); setBienDetail(null); }}>
            {afficherFormulaire ? '✕ Annuler' : '+ Ajouter un bien'}
          </button>
        </div>

        {/* Formulaire d'ajout */}
        {afficherFormulaire && (
          <div style={styles.formulaire}>
            <h3 style={styles.formulaireTitre}>Nouveau bien</h3>

            {/* Sélection du type */}
            <label style={styles.label}>Type de bien *</label>
            <div style={styles.typeGrid}>
              {TYPES_BIEN.map(t => (
                <div
                  key={t.value}
                  style={{ ...styles.typeCard, border: typeBien === t.value ? '2px solid #e8a020' : '1px solid rgba(255,255,255,0.08)', background: typeBien === t.value ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.03)' }}
                  onClick={() => changerTypeBien(t.value)}
                >
                  <div style={styles.typeCardLabel}>{t.label}</div>
                  <div style={styles.typeCardDesc}>{t.description}</div>
                </div>
              ))}
            </div>

            {/* Localisation */}
            <div style={{ ...styles.grille2, marginTop: '20px' }}>
              {!estVehicule && (
                <div>
                  <label style={styles.label}>Adresse *</label>
                  <input style={styles.input} placeholder="Rue 123, Quartier..." value={form.adresse} onChange={e => setForm({ ...form, adresse: e.target.value })} />
                </div>
              )}
              <div>
                <label style={styles.label}>Ville *</label>
                <input style={styles.input} placeholder="Cotonou" value={form.ville} onChange={e => setForm({ ...form, ville: e.target.value })} />
              </div>
              {!estVehicule && (
                <div>
                  <label style={styles.label}>Quartier</label>
                  <input style={styles.input} placeholder="Fidjrosse" value={form.quartier} onChange={e => setForm({ ...form, quartier: e.target.value })} />
                </div>
              )}
              {estVehicule && (
                <div>
                  <label style={styles.label}>Lieu de dépôt / stationnement</label>
                  <input style={styles.input} placeholder="Ex: Carrefour Cadjèhoun" value={form.lieu_depot} onChange={e => setForm({ ...form, lieu_depot: e.target.value })} />
                </div>
              )}
            </div>

            {/* Caractéristiques dynamiques */}
            <div style={{ marginTop: '16px' }}>
              <label style={{ ...styles.label, fontSize: '14px', color: '#c4b5fd', marginBottom: '12px', display: 'block' }}>
                Caractéristiques du {TYPES_BIEN.find(t => t.value === typeBien)?.label}
              </label>
              <CaracteristiquesForm typeBien={typeBien} caracteristiques={caracteristiques} setCaracteristiques={setCaracteristiques} />
            </div>

            {/* Tarifs multiples */}
            <div style={{ marginTop: '16px' }}>
              <label style={{ ...styles.label, fontSize: '14px', color: '#c4b5fd', marginBottom: '12px', display: 'block' }}>
                💰 Tarifs du loyer * <span style={{ color: '#6b7280', fontWeight: '400', fontSize: '12px' }}>(renseignez les périodicités que vous proposez)</span>
              </label>
              <div style={styles.grille2}>
                {typeLoyers.map(t => (
                  <div key={t}>
                    <label style={styles.label}>{LABELS_LOYER[t]}</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        style={{ ...styles.input, borderColor: tarifs[t] ? '#e8a020' : '#ddd' }}
                        type="number"
                        placeholder="Laisser vide si non proposé"
                        value={tarifs[t] || ''}
                        onChange={e => setTarifs({ ...tarifs, [t]: e.target.value })}
                      />
                      <span style={{ color: '#6b7280', fontSize: '13px', whiteSpace: 'nowrap' }}>FCFA</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {erreur && <p style={styles.erreur}>{erreur}</p>}
            <button style={{ ...styles.boutonPrimaire, marginTop: '16px' }} onClick={ajouterBien} disabled={envoi}>
              {envoi ? 'Enregistrement...' : 'Enregistrer le bien'}
            </button>
          </div>
        )}

        {/* Détail d'un bien */}
        {bienDetail && (
          <div style={styles.formulaire}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <h3 style={styles.formulaireTitre}>
                {TYPES_BIEN.find(t => t.value === bienDetail.type_bien)?.label} — {bienDetail.adresse || bienDetail.lieu_depot || '—'}
              </h3>
              <button style={styles.boutonFermer} onClick={() => setBienDetail(null)}>✕ Fermer</button>
            </div>
            <p style={{ ...styles.numeroBien, marginBottom: '16px' }}>🔖 N° {bienDetail.numero_bien} <span style={{ color: '#6b7280', fontWeight: '400' }}>— à utiliser pour créer un contrat</span></p>
            <div style={styles.grille2}>
              <div style={styles.detailSection}>
                <p style={styles.detailSectionTitre}>📍 Localisation</p>
                <p><strong>Ville :</strong> {bienDetail.ville}</p>
                {bienDetail.quartier && <p><strong>Quartier :</strong> {bienDetail.quartier}</p>}
                {bienDetail.adresse && <p><strong>Adresse :</strong> {bienDetail.adresse}</p>}
                {bienDetail.lieu_depot && <p><strong>Lieu de dépôt :</strong> {bienDetail.lieu_depot}</p>}
              </div>
              <div style={styles.detailSection}>
                <p style={styles.detailSectionTitre}>💰 Loyer</p>
                {bienDetail.tarifs && Object.keys(bienDetail.tarifs).length > 0
                  ? Object.entries(bienDetail.tarifs).map(([k, v]) => (
                      <p key={k}><strong>{LABELS_LOYER[k]} :</strong> {formaterMontant(v)}</p>
                    ))
                  : <p><strong>Loyer :</strong> {formaterMontant(bienDetail.loyer_mensuel)}</p>
                }
                <p><strong>Statut :</strong> {bienDetail.statut === 'occupe' ? '● Occupé' : '○ Libre'}</p>
              </div>
            </div>
            {bienDetail.photos && bienDetail.photos.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <p style={{ ...styles.detailSectionTitre, margin: 0 }}>📷 Aperçu</p>
                  <Lightbox medias={bienDetail.photos} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(90px,1fr))', gap: '8px' }}>
                  {bienDetail.photos.map(photo => (
                    estVideo(photo) ? (
                      <video key={photo} src={`${API_BASE}${photo}`} style={{ width: '100%', height: '70px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }} />
                    ) : (
                      <img key={photo} src={`${API_BASE}${photo}`} alt="Aperçu du bien" style={{ width: '100%', height: '70px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }} />
                    )
                  ))}
                </div>
              </div>
            )}
            <div style={{ marginTop: '16px' }}>
              <p style={styles.detailSectionTitre}>🔍 Caractéristiques</p>
              <DetailsBien bien={bienDetail} />
            </div>
            <div style={{ marginTop: '16px' }}>
              <p style={styles.detailSectionTitre}>📅 Réservations</p>
              {reservationsBien.length === 0 ? (
                <p style={{ color: '#10b981', fontSize: '13px' }}>✅ Aucune réservation — bien entièrement disponible</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {reservationsBien.map(r => (
                    <div key={r.id} style={styles.reservationLigne}>
                      <div>
                        <div style={{ fontWeight: '600', color: '#e2e8f0', fontSize: '13px' }}>
                          {r.origine === 'locataire_location' ? '🔑' : r.origine === 'locataire_reservation' ? '📅' : '📋'} {r.locataire_nom} · {r.locataire_telephone}
                        </div>
                        <div style={{ color: '#6b7280', fontSize: '12px' }}>
                          Du {new Date(r.date_debut).toLocaleDateString('fr-FR')} {r.date_fin ? `au ${new Date(r.date_fin).toLocaleDateString('fr-FR')}` : '(indéterminée)'} · {r.type_loyer}
                        </div>
                      </div>
                      <span style={{
                        ...styles.reservationBadge,
                        color: r.statut === 'actif' ? '#ef4444' : r.statut === 'en_attente_signature' ? '#f59e0b' : '#a78bfa',
                        background: r.statut === 'actif' ? 'rgba(239,68,68,0.1)' : r.statut === 'en_attente_signature' ? 'rgba(245,158,11,0.1)' : 'rgba(124,58,237,0.1)',
                      }}>
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
          <p style={styles.vide}>Chargement...</p>
        ) : biens.length === 0 ? (
          <div style={styles.vide}>
            <p>🏘️ Vous n'avez pas encore de bien enregistré.</p>
          </div>
        ) : (
          <div style={styles.grilleBiens}>
            {biens.map(b => (
              <div key={b.id} style={styles.carteBien}>
                <div style={styles.carteBienEntete}>
                  <span style={styles.typeBien}>{TYPES_BIEN.find(t => t.value === b.type_bien)?.label || b.type_bien}</span>
                  <span style={{ ...styles.statutBadge, background: b.statut === 'occupe' ? '#e8f5e9' : '#fff3e0', color: b.statut === 'occupe' ? '#2e7d32' : '#e65100' }}>
                    {b.statut === 'occupe' ? '● Occupé' : '○ Libre'}
                  </span>
                </div>
                <p style={styles.numeroBien}>🔖 N° {b.numero_bien}</p>
                <p style={styles.carteBienAdresse}>{b.adresse || b.lieu_depot || '—'}</p>
                <p style={styles.carteBienVille}>{b.quartier ? `${b.quartier}, ` : ''}{b.ville}</p>
                {b.effectue_par_agent_id && (
                  <span style={{ display: 'inline-block', marginTop: '6px', background: 'rgba(245,158,11,0.15)', color: '#e65100', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '20px', padding: '2px 10px', fontSize: '11px', fontWeight: '700' }}>
                    🤝 Ajouté par votre agent
                  </span>
                )}
                <div style={{ marginTop: '8px' }}>
                  {b.tarifs && Object.keys(b.tarifs).length > 0
                    ? Object.entries(b.tarifs).slice(0, 2).map(([k, v]) => (
                        <p key={k} style={{ ...styles.carteBienLoyer, fontSize: '14px', margin: '2px 0' }}>
                          {formaterMontant(v)} <span style={styles.perioBadge}>/ {k}</span>
                        </p>
                      ))
                    : <p style={styles.carteBienLoyer}>{formaterMontant(b.loyer_mensuel)} <span style={styles.perioBadge}>/ {b.type_loyer || 'mois'}</span></p>
                  }
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button style={{ ...styles.boutonDetails, flex: 1 }} onClick={() => { setBienDetail(b); setAfficherFormulaire(false); chargerReservationsBien(b.id); }}>
                  🔍 Voir les détails
                </button>
                  {b.statut === 'libre' && (
                    <button
                      style={{ ...styles.boutonDetails, flex: 1, background: b.sur_le_marche ? 'rgba(239,68,68,0.2)' : 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: b.sur_le_marche ? '1px solid #ef4444' : 'none' }}
                      onClick={() => { setModalMarche(b); setDescriptionMarche(b.description_marche || ''); setSuccesMarche(''); }}
                    >
                      {b.sur_le_marche ? '🏪 Retirer du marché' : '🏪 Mettre sur le marché'}
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  {b.statut === 'libre' && (
                    <button style={{ ...styles.boutonSecondaire, flex: 1 }} onClick={() => ouvrirModification(b)}>
                      ✏️ Modifier
                    </button>
                  )}
                  {b.statut === 'libre' && (
                    <button style={{ ...styles.boutonSupprimer, flex: 1 }} onClick={() => supprimerBienAction(b)}>
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#0f0a1e', border: '1px solid rgba(124,58,237,0.4)', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '560px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#c4b5fd', fontSize: '18px' }}>✏️ Modifier le bien</h3>
              <button style={styles.boutonFermer} onClick={() => setBienModifier(null)}>✕ Fermer</button>
            </div>

            <div style={styles.grille2}>
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

            <div style={{ marginTop: '16px' }}>
              <label style={{ ...styles.label, fontSize: '14px', color: '#c4b5fd', marginBottom: '12px', display: 'block' }}>
                💰 Tarifs du loyer * <span style={{ color: '#6b7280', fontWeight: '400', fontSize: '12px' }}>(renseignez les périodicités que vous proposez)</span>
              </label>
              <div style={styles.grille2}>
                {(TYPES_LOYER[bienModifier.type_bien] || ['mensuel']).map(t => (
                  <div key={t}>
                    <label style={styles.label}>{LABELS_LOYER[t]}</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        style={{ ...styles.input, borderColor: tarifsModif[t] ? '#e8a020' : 'rgba(255,255,255,0.1)' }}
                        type="number"
                        placeholder="Laisser vide si non proposé"
                        value={tarifsModif[t] || ''}
                        onChange={e => setTarifsModif({ ...tarifsModif, [t]: e.target.value })}
                      />
                      <span style={{ color: '#6b7280', fontSize: '13px', whiteSpace: 'nowrap' }}>FCFA</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <p style={styles.detailSectionTitre}>🔍 Caractéristiques</p>
              <CaracteristiquesForm typeBien={bienModifier.type_bien} caracteristiques={caracteristiquesModif} setCaracteristiques={setCaracteristiquesModif} />
            </div>

            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={styles.detailSectionTitre}>📷 Aperçu (photos & vidéos) <span style={{ color: '#6b7280', fontWeight: '400', fontSize: '12px' }}>(optionnel)</span></p>
                {(bienModifier.photos || []).length > 0 && <Lightbox medias={bienModifier.photos} />}
              </div>

              {(bienModifier.photos || []).length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(90px,1fr))', gap: '8px', marginBottom: '12px' }}>
                  {bienModifier.photos.map(photo => (
                    <div key={photo} style={{ position: 'relative' }}>
                      {estVideo(photo) ? (
                        <video src={`${API_BASE}${photo}`} controls style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }} />
                      ) : (
                        <img src={`${API_BASE}${photo}`} alt="Aperçu du bien" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }} />
                      )}
                      <button
                        type="button"
                        onClick={() => supprimerPhoto(photo)}
                        style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(239,68,68,0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', fontSize: '12px', cursor: 'pointer', lineHeight: '20px', padding: 0 }}
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
                style={{ color: '#9ca3af', fontSize: '13px' }}
              />
              {photosSelectionnees.length > 0 && (
                <button type="button" style={{ ...styles.boutonSecondaire, marginLeft: '10px', padding: '6px 12px' }} onClick={ajouterPhotos} disabled={envoiPhotos}>
                  {envoiPhotos ? 'Envoi...' : `📤 Envoyer (${photosSelectionnees.length})`}
                </button>
              )}
              {erreurPhotos && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px' }}>{erreurPhotos}</p>}
            </div>

            {erreurModif && <p style={styles.erreur}>{erreurModif}</p>}

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button style={{ ...styles.boutonSecondaire, flex: 1 }} onClick={() => setBienModifier(null)}>Annuler</button>
              <button style={{ ...styles.boutonPrimaire, flex: 1 }} onClick={enregistrerModification} disabled={envoiModif}>
                {envoiModif ? 'Enregistrement...' : '✅ Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal marché */}
      {modalMarche && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#0f0a1e', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '460px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
            <h3 style={{ margin: '0 0 8px', color: '#10b981', fontSize: '20px', fontWeight: '700' }}>
              {modalMarche.sur_le_marche ? '🏪 Retirer du marché' : '🏪 Mettre sur le marché'}
            </h3>
            <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '16px' }}>{modalMarche.adresse}, {modalMarche.ville}</p>

            {succesMarche ? (
              <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                ✅ {succesMarche}
              </div>
            ) : (
              <>
                {!modalMarche.sur_le_marche && (
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#9ca3af', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Description pour les locataires (optionnel)
                    </label>
                    <textarea
                      style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', padding: '10px 12px', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none', height: '80px', resize: 'vertical' }}
                      placeholder="Ex: Appartement lumineux au 2e étage, proche du marché..."
                      value={descriptionMarche}
                      onChange={e => setDescriptionMarche(e.target.value)}
                    />
                  </div>
                )}
                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button style={{ background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', cursor: 'pointer', flex: 1 }} onClick={() => setModalMarche(null)}>
                    Annuler
                  </button>
                  <button
                    style={{ background: modalMarche.sur_le_marche ? 'linear-gradient(135deg,#ef4444,#b91c1c)' : 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', flex: 1 }}
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

const styles = {
    page: { minHeight: '100vh', background: 'linear-gradient(135deg,#0a0a0f 0%,#0d1117 100%)', fontFamily: "'Segoe UI',sans-serif", color: '#e2e8f0' },
    nav: { background: 'rgba(10,10,20,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(124,58,237,0.2)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px', position: 'sticky', top: 0, zIndex: 100 },
    navLogo: { color: '#e2e8f0', fontSize: '18px', cursor: 'pointer' },
    navBenin: { color: '#f59e0b' },
  navMenu: { display: 'flex', gap: '8px', alignItems: 'center' },
    navBtn: { background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af', cursor: 'pointer', padding: '7px 12px', borderRadius: '6px', fontSize: '13px' },
    navBtnProfil: { background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa', cursor: 'pointer', padding: '7px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '600' },
  navBtnActif: { background: 'rgba(124,58,237,0.2)', border: '1px solid #7c3aed', color: '#c4b5fd', cursor: 'pointer', padding: '7px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '600' },
  contenu: { padding: '24px', maxWidth: '1200px', margin: '0 auto' },
  bandeauConsultation: { background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.35)', color: '#f59e0b', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px' },
  entete: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    titre: { margin: 0, fontSize: '24px', fontWeight: '800', background: 'linear-gradient(135deg,#c4b5fd,#f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
    boutonPrimaire: { background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  boutonFermer: { background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer' },
  boutonSecondaire: { background: 'rgba(255,255,255,0.05)', color: '#c4b5fd', border: '1px solid rgba(196,181,253,0.3)', borderRadius: '6px', padding: '8px 14px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' },
  boutonSupprimer: { background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', padding: '8px 14px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' },
  boutonDetails: { background: '#1a3a5c', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 14px', fontSize: '12px', cursor: 'pointer', fontWeight: '600', width: '100%', marginTop: '12px' },
  formulaire: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px', marginBottom: '24px' },
  formulaireTitre: { margin: '0 0 16px', color: '#c4b5fd' },
  typeGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', marginBottom: '8px' },
  typeCard: { borderRadius: '8px', padding: '12px', cursor: 'pointer', transition: 'all 0.2s' },
  typeCardLabel: { fontWeight: '700', fontSize: '14px', color: '#c4b5fd', marginBottom: '4px' },
  typeCardDesc: { fontSize: '11px', color: '#6b7280', lineHeight: '1.3' },
  grille2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' },
    label: { fontSize: '13px', fontWeight: '600', color: '#9ca3af', display: 'block', marginBottom: '4px', marginTop: '12px' },
    input: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '14px', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', color: '#e2e8f0', outline: 'none' },
    option: { background: '#0f0a1e', color: '#e2e8f0' },
    erreur: { color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '10px', borderRadius: '6px', fontSize: '13px', marginTop: '8px', border: '1px solid rgba(239,68,68,0.2)' },
    vide: { textAlign: 'center', color: '#6b7280', padding: '40px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' },
  grilleBiens: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' },
  carteBien: { background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '20px', border: '1px solid rgba(255,255,255,0.08)' },
  carteBienEntete: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  typeBien: { fontSize: '12px', fontWeight: '600', color: '#c4b5fd', textTransform: 'uppercase', letterSpacing: '0.5px' },
  statutBadge: { fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '20px' },
  numeroBien: { fontSize: '12px', fontWeight: '700', color: '#f59e0b', margin: '0 0 6px', letterSpacing: '0.5px' },
  reservationLigne: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 14px' },
  reservationBadge: { padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' },
  carteBienAdresse: { fontSize: '15px', fontWeight: '600', color: '#e2e8f0', margin: '0 0 4px' },
  carteBienVille: { fontSize: '13px', color: '#6b7280', margin: '0 0 12px' },
  carteBienLoyer: { fontSize: '16px', fontWeight: '700', color: '#e8a020', margin: 0 },
  perioBadge: { fontSize: '12px', color: '#6b7280', fontWeight: '400' },
  detailsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' },
  detailItem: { background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '10px 12px' },
  detailLabel: { fontSize: '11px', color: '#6b7280', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' },
  detailValeur: { fontSize: '14px', fontWeight: '600', color: '#e2e8f0' },
  detailSection: { marginBottom: '8px' },
  detailSectionTitre: { fontWeight: '700', color: '#c4b5fd', fontSize: '14px', marginBottom: '8px' },
};
