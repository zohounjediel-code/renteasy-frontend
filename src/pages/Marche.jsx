import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Lightbox from '../components/Lightbox';

const API_BASE = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

function estVideo(chemin) {
  return /\.(mp4|webm|mov|quicktime)$/i.test(chemin);
}
import { useAuth } from '../context/AuthContext';
import ClocheNotifications from '../components/ClocheNotifications';

const TYPES_BIEN = [
  { value: '', label: 'Tous les types' },
  { value: 'appartement', label: '🏢 Appartement' },
  { value: 'maison', label: '🏠 Maison' },
  { value: 'villa', label: '🏡 Villa' },
  { value: 'studio', label: '🛏️ Studio' },
  { value: 'chambre', label: '🚪 Chambre' },
  { value: 'commerce', label: '🏪 Commerce' },
  { value: 'vehicule', label: '🚗 Véhicule' },
];

const TYPES_LOYER = [
  { value: '', label: 'Toutes périodes' },
  { value: 'journalier', label: 'Journalier' },
  { value: 'hebdomadaire', label: 'Hebdomadaire' },
  { value: 'mensuel', label: 'Mensuel' },
  { value: 'annuel', label: 'Annuel' },
];

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

const LABELS_CARACTERISTIQUES = {
  nb_chambres: 'Chambres', nb_sanitaires: 'Sanitaires', nb_etages: 'Étages',
  superficie: 'Superficie (m²)', salon: 'Salon', cuisine: 'Cuisine',
  climatise: 'Climatisé', meuble: 'Meublé', jardin: 'Jardin',
  garage: 'Garage', piscine: 'Piscine', vitrine: 'Vitrine',
  parking: 'Parking', type_activite: "Type d'activité",
  type_vehicule: 'Type véhicule', marque: 'Marque', modele: 'Modèle',
  annee: 'Année', immatriculation: 'Immatriculation', chauffeur: 'Chauffeur',
};

const MOTIFS_SIGNALEMENT = [
  { value: 'photos_non_conformes', label: 'Photos non conformes au bien' },
  { value: 'coordonnees_trompeuses', label: 'Coordonnées trompeuses' },
  { value: 'annonce_en_double', label: 'Annonce en double' },
  { value: 'bien_indisponible', label: 'Bien déjà loué / indisponible' },
  { value: 'contenu_inapproprie', label: 'Contenu inapproprié' },
  { value: 'autre', label: 'Autre' },
];

const champLabel = 'mt-2.5 mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500';
const champInput = 'w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13px] outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30';
const overlay = 'fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/50 p-5 backdrop-blur-sm';
const modal = 'w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-7 shadow-2xl';
const btnAnnulerModal = 'flex-1 rounded-xl border border-slate-200 px-5 py-3 text-sm text-slate-600 hover:bg-slate-50';
const btnValiderModal = 'flex-1 rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60';

export default function Marche() {
  const [biens, setBiens] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [afficherFiltres, setAfficherFiltres] = useState(false);
  const [bienDetail, setBienDetail] = useState(null);
  const [filtres, setFiltres] = useState({
    type_bien: '', ville: '', type_loyer: '',
    loyer_min: '', loyer_max: '',
    nb_chambres: '', nb_sanitaires: '', nb_etages: '', superficie_min: '', superficie_max: '',
    climatise: '', meuble: '', jardin: '', garage: '', piscine: '',
    salon: '', cuisine: '',
    type_vehicule: '',
  });
  const { utilisateur, deconnecter } = useAuth();
  const estAussiProprietaire = (utilisateur?.role || '').includes('proprietaire');
  const estLocataire = (utilisateur?.role || '').includes('locataire');
  const navigate = useNavigate();
  const [reservationsParBien, setReservationsParBien] = useState({});
  const [modalDemande, setModalDemande] = useState(null); // { bien, origine: 'reservation'|'location' }
  const [formDemande, setFormDemande] = useState({ date_debut: '', duree_valeur: '', duree_unite: 'mois', type_loyer: '', note: '' });
  const [envoiDemande, setEnvoiDemande] = useState(false);
  const [erreurDemande, setErreurDemande] = useState('');
  const [succesDemande, setSuccesDemande] = useState('');
  const [modalSignalement, setModalSignalement] = useState(null); // bien en cours de signalement
  const [motifSignalement, setMotifSignalement] = useState('');
  const [descriptionSignalement, setDescriptionSignalement] = useState('');
  const [envoiSignalement, setEnvoiSignalement] = useState(false);
  const [messageSignalement, setMessageSignalement] = useState('');

  useEffect(() => { chargerMarche(); }, []);

  async function chargerReservations(bienId) {
    if (reservationsParBien[bienId]) return;
    try {
      const r = await api.get(`/biens/marche/${bienId}/reservations`);
      setReservationsParBien(prev => ({ ...prev, [bienId]: r.data }));
    } catch (e) {
      console.error(e);
    }
  }

  async function envoyerSignalement() {
    if (!motifSignalement) return;
    setEnvoiSignalement(true);
    setMessageSignalement('');
    try {
      const r = await api.post(`/biens/marche/${modalSignalement.id}/signaler`, {
        motif: motifSignalement,
        description: descriptionSignalement,
      });
      setMessageSignalement(r.data.message);
      setTimeout(() => {
        setModalSignalement(null);
        setMotifSignalement('');
        setDescriptionSignalement('');
        setMessageSignalement('');
      }, 2000);
    } catch (e) {
      setMessageSignalement(e.response?.data?.message || 'Erreur lors de l\'envoi du signalement.');
    } finally {
      setEnvoiSignalement(false);
    }
  }

  function ouvrirModalDemande(bien, origine) {
    setModalDemande({ bien, origine });
    const premierType = Object.keys(bien.tarifs || {})[0] || bien.type_loyer || 'mensuel';
    setFormDemande({ date_debut: '', duree_valeur: '', duree_unite: UNITE_SELON_TYPE_LOYER[premierType] || 'mois', type_loyer: premierType, note: '' });
    setErreurDemande('');
    setSuccesDemande('');
  }

  function choisirTypeLoyerDemande(type) {
    // L'unité de durée doit toujours s'adapter au type de loyer choisi
    setFormDemande({ ...formDemande, type_loyer: type, duree_unite: UNITE_SELON_TYPE_LOYER[type] || formDemande.duree_unite });
  }

  async function soumettreDemande() {
    setErreurDemande('');
    if (!formDemande.date_debut || !formDemande.type_loyer) {
      setErreurDemande('La date de début et le type de loyer sont obligatoires');
      return;
    }
    setEnvoiDemande(true);
    try {
      // L'échéance (jour_echeance / jour_semaine_echeance / jour_echeance_annuel / mois_echeance_annuel)
      // est désormais calculée automatiquement par le serveur à partir de la date de début.
      const r = await api.post('/locataire/marche/demander', {
        bien_id: modalDemande.bien.id,
        origine: modalDemande.origine,
        date_debut: formDemande.date_debut,
        duree_valeur: formDemande.duree_valeur || undefined,
        duree_unite: formDemande.duree_unite,
        type_loyer: formDemande.type_loyer,
        note: formDemande.note || undefined,
      });
      setSuccesDemande(r.data.message);
      setTimeout(() => setModalDemande(null), 1800);
    } catch (e) {
      setErreurDemande(e.response?.data?.message || 'Erreur lors de la demande');
    } finally {
      setEnvoiDemande(false);
    }
  }

  async function chargerMarche(filtresActifs = filtres) {
    setChargement(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filtresActifs).forEach(([k, v]) => { if (v) params.append(k, v); });
      const r = await api.get(`/biens/marche/liste?${params.toString()}`);
      setBiens(r.data);
    } catch (e) {
      console.error(e);
    } finally {
      setChargement(false);
    }
  }

  function appliquerFiltres() {
    chargerMarche(filtres);
    setAfficherFiltres(false);
  }

  function reinitialiserFiltres() {
    const vides = Object.fromEntries(Object.keys(filtres).map(k => [k, '']));
    setFiltres(vides);
    chargerMarche(vides);
  }

  function formaterMontant(n) {
    return parseInt(n || 0).toLocaleString('fr-FR') + ' FCFA';
  }

  const filtresActifs = Object.values(filtres).filter(v => v).length;

  return (
    <div className="min-h-screen bg-brand-50">
      <nav className="re-nav sticky top-0 z-[100] flex h-[60px] items-center justify-between border-b border-slate-100 bg-white/95 px-6 backdrop-blur">
        <div className="text-lg text-slate-900">🏠 <strong>RentEasy</strong> <span className="text-accent-600">Bénin</span></div>
        <div className="flex items-center gap-1.5">
          <button className="rounded-lg border border-brand-600 bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700">🏪 Marché</button>
          <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50" onClick={() => navigate('/locataire/dashboard')}>Mon espace</button>
          {estAussiProprietaire && (
            <button className="rounded-lg bg-accent-500 px-3 py-1.5 text-sm font-bold text-white hover:bg-accent-600" onClick={() => navigate('/dashboard')}>🔄 Espace propriétaire</button>
          )}
          <button className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700 hover:bg-brand-100" onClick={() => navigate('/profil')}>👤 Mon profil</button>
          <ClocheNotifications />
          <button className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50" onClick={deconnecter}>Déconnexion</button>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-7">
        {/* En-tête */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">🏪 Marché immobilier RentEasy</h2>
            <p className="mt-1 text-sm text-slate-500">{biens.length} bien(s) disponible(s) sur le marché</p>
          </div>
          <button
            className={`rounded-xl border px-5 py-2.5 text-sm font-semibold ${filtresActifs > 0 ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 bg-white text-slate-600'}`}
            onClick={() => setAfficherFiltres(!afficherFiltres)}
          >
            🔍 Filtres {filtresActifs > 0 ? `(${filtresActifs})` : ''}
          </button>
        </div>

        {/* Panneau filtres */}
        {afficherFiltres && (
          <div className="mb-6 rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 p-6 shadow-card">
            <h3 className="mb-4 text-base font-bold text-slate-900">🔍 Filtrer les biens</h3>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3.5">
              <div>
                <label className={champLabel}>Type de bien</label>
                <select className={champInput} value={filtres.type_bien} onChange={e => setFiltres({ ...filtres, type_bien: e.target.value })}>
                  {TYPES_BIEN.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className={champLabel}>Ville</label>
                <input className={champInput} placeholder="Ex: Cotonou" value={filtres.ville} onChange={e => setFiltres({ ...filtres, ville: e.target.value })} />
              </div>
              <div>
                <label className={champLabel}>Périodicité du loyer</label>
                <select className={champInput} value={filtres.type_loyer} onChange={e => setFiltres({ ...filtres, type_loyer: e.target.value })}>
                  {TYPES_LOYER.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className={champLabel}>Loyer min (FCFA)</label>
                <input className={champInput} type="number" placeholder="0" value={filtres.loyer_min} onChange={e => setFiltres({ ...filtres, loyer_min: e.target.value })} />
              </div>
              <div>
                <label className={champLabel}>Loyer max (FCFA)</label>
                <input className={champInput} type="number" placeholder="500000" value={filtres.loyer_max} onChange={e => setFiltres({ ...filtres, loyer_max: e.target.value })} />
              </div>
              <div>
                <label className={champLabel}>Chambres min</label>
                <input className={champInput} type="number" placeholder="1" value={filtres.nb_chambres} onChange={e => setFiltres({ ...filtres, nb_chambres: e.target.value })} />
              </div>
              <div>
                <label className={champLabel}>Sanitaires min</label>
                <input className={champInput} type="number" placeholder="1" value={filtres.nb_sanitaires} onChange={e => setFiltres({ ...filtres, nb_sanitaires: e.target.value })} />
              </div>
              <div>
                <label className={champLabel}>Étages min</label>
                <input className={champInput} type="number" placeholder="1" value={filtres.nb_etages} onChange={e => setFiltres({ ...filtres, nb_etages: e.target.value })} />
              </div>
              <div>
                <label className={champLabel}>Superficie min (m²)</label>
                <input className={champInput} type="number" placeholder="20" value={filtres.superficie_min} onChange={e => setFiltres({ ...filtres, superficie_min: e.target.value })} />
              </div>
              <div>
                <label className={champLabel}>Superficie max (m²)</label>
                <input className={champInput} type="number" placeholder="500" value={filtres.superficie_max} onChange={e => setFiltres({ ...filtres, superficie_max: e.target.value })} />
              </div>
            </div>

            {/* Caractéristiques booléennes */}
            <p className={`${champLabel} mb-2.5 mt-4`}>Équipements</p>
            <div className="flex flex-wrap gap-2.5">
              {[
                { key: 'salon', label: '🛋️ Salon' },
                { key: 'cuisine', label: '🍳 Cuisine' },
                { key: 'climatise', label: '❄️ Climatisé' },
                { key: 'meuble', label: '🛋️ Meublé' },
                { key: 'jardin', label: '🌿 Jardin' },
                { key: 'garage', label: '🚗 Garage' },
                { key: 'piscine', label: '🏊 Piscine' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  className={`rounded-full border px-4 py-2 text-[13px] font-semibold ${filtres[key] === 'oui' ? 'border-brand-600 bg-brand-100 text-brand-700' : 'border-slate-200 bg-white text-slate-500'}`}
                  onClick={() => setFiltres({ ...filtres, [key]: filtres[key] === 'oui' ? '' : 'oui' })}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-5 flex gap-3">
              <button className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm text-slate-600 hover:bg-slate-50" onClick={reinitialiserFiltres}>Réinitialiser</button>
              <button className="flex-1 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700" onClick={appliquerFiltres}>Appliquer les filtres</button>
            </div>
          </div>
        )}

        {/* Grille des biens */}
        {chargement ? (
          <div className="flex flex-col items-center gap-4 py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
            <p className="text-slate-400">Chargement du marché...</p>
          </div>
        ) : biens.length === 0 ? (
          <div className="rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 py-20 text-center shadow-card">
            <p className="mb-3 text-5xl">🏘️</p>
            <p className="text-lg font-semibold text-slate-900">Aucun bien disponible</p>
            <p className="text-sm text-slate-400">Essayez de modifier vos filtres de recherche</p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
            {biens.map(b => {
              const carac = b.caracteristiques || {};
              return (
                <div key={b.id} className="flex cursor-pointer flex-col gap-2.5 rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 p-5 shadow-card" onClick={() => { const ouvre = bienDetail?.id !== b.id; setBienDetail(ouvre ? b : null); if (ouvre) chargerReservations(b.id); }}>
                  {/* Badge type */}
                  <div className="flex items-center justify-between">
                    <span className="rounded-xl border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">{TYPES_BIEN.find(t => t.value === b.type_bien)?.label || b.type_bien}</span>
                    <span className="rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">🏪 Disponible</span>
                  </div>

                  {/* Infos principales */}
                  <div className="text-[15px] font-bold text-slate-900">{b.adresse || b.lieu_depot}</div>
                  <div className="text-[13px] text-slate-400">📍 {b.quartier ? `${b.quartier}, ` : ''}{b.ville}</div>

                  {/* Tarif */}
                  <div className="flex flex-col gap-1">
                    {b.tarifs && Object.keys(b.tarifs).length > 0
                      ? (() => {
                          // Si un filtre de période est actif, on affiche en priorité le
                          // tarif qui y correspond exactement — sinon, avec 3-4 tarifs
                          // possibles sur un même bien, celui que l'utilisateur vient de
                          // rechercher pouvait ne pas figurer parmi les 2 premiers affichés.
                          const entrees = Object.entries(b.tarifs);
                          const filtreActif = filtres.type_loyer && b.tarifs[filtres.type_loyer] != null;
                          const triees = filtreActif
                            ? [[filtres.type_loyer, b.tarifs[filtres.type_loyer]], ...entrees.filter(([k]) => k !== filtres.type_loyer)]
                            : entrees;
                          return triees.slice(0, 2).map(([k, v]) => (
                            <div key={k} className="flex items-baseline gap-1.5">
                              <span className="text-lg font-extrabold text-brand-700">{formaterMontant(v)}</span>
                              <span className="text-[13px] text-slate-400">/ {k}</span>
                            </div>
                          ));
                        })()
                      : <div className="flex items-baseline gap-1.5">
                          <span className="text-lg font-extrabold text-brand-700">{formaterMontant(b.loyer_mensuel)}</span>
                          <span className="text-[13px] text-slate-400">/ {b.type_loyer || 'mois'}</span>
                        </div>
                    }
                  </div>

                  {/* Caractéristiques rapides */}
                  {Object.keys(carac).length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {carac.nb_chambres && <span className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1 text-[11px] text-slate-500">🛏️ {carac.nb_chambres} ch.</span>}
                      {carac.superficie && <span className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1 text-[11px] text-slate-500">📐 {carac.superficie} m²</span>}
                      {carac.climatise === 'oui' && <span className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1 text-[11px] text-slate-500">❄️ Clim</span>}
                      {carac.meuble === 'oui' && <span className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1 text-[11px] text-slate-500">🛋️ Meublé</span>}
                      {carac.piscine === 'oui' && <span className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1 text-[11px] text-slate-500">🏊 Piscine</span>}
                      {carac.jardin === 'oui' && <span className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1 text-[11px] text-slate-500">🌿 Jardin</span>}
                      {carac.type_vehicule && <span className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1 text-[11px] text-slate-500">🚗 {carac.type_vehicule}</span>}
                    </div>
                  )}

                  {b.description_marche && (
                    <p className="m-0 text-[13px] italic leading-relaxed text-slate-400">{b.description_marche}</p>
                  )}

                  {/* Détail étendu */}
                  {bienDetail?.id === b.id && (
                    <div>
                      <div className="my-1 h-px bg-slate-100" />
                      <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-brand-700">💰 Tous les tarifs proposés</p>
                      <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-2">
                        {b.tarifs && Object.keys(b.tarifs).length > 0
                          ? Object.entries(b.tarifs).map(([k, v]) => (
                              <div key={k} className="rounded-lg bg-slate-50 px-2.5 py-2">
                                <span className="mb-0.5 block text-[10px] uppercase tracking-wide text-slate-400">{TYPES_LOYER.find(t => t.value === k)?.label || k}</span>
                                <span className="text-[13px] font-semibold text-slate-800">{formaterMontant(v)}</span>
                              </div>
                            ))
                          : (
                              <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                                <span className="mb-0.5 block text-[10px] uppercase tracking-wide text-slate-400">{TYPES_LOYER.find(t => t.value === b.type_loyer)?.label || b.type_loyer || 'Mensuel'}</span>
                                <span className="text-[13px] font-semibold text-slate-800">{formaterMontant(b.loyer_mensuel)}</span>
                              </div>
                            )
                        }
                      </div>

                      {b.photos && b.photos.length > 0 && (
                        <>
                          <div className="mb-2 mt-4 flex items-center justify-between">
                            <p className="m-0 text-xs font-bold uppercase tracking-wide text-brand-700">📷 Aperçu</p>
                            <Lightbox medias={b.photos} />
                          </div>
                          <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2">
                            {b.photos.map(photo => (
                              estVideo(photo) ? (
                                <video
                                  key={photo}
                                  src={`${API_BASE}${photo}`}
                                  controls
                                  className="h-20 w-full rounded-lg border border-slate-100 object-cover"
                                  onClick={e => e.stopPropagation()}
                                />
                              ) : (
                                <img
                                  key={photo}
                                  src={`${API_BASE}${photo}`}
                                  alt="Aperçu du bien"
                                  className="h-20 w-full rounded-lg border border-slate-100 object-cover"
                                  onClick={e => e.stopPropagation()}
                                />
                              )
                            ))}
                          </div>
                        </>
                      )}

                      <p className="mb-2.5 mt-4 text-xs font-bold uppercase tracking-wide text-brand-700">📅 Disponibilité</p>
                      {(reservationsParBien[b.id] || []).length === 0 ? (
                        <p className="my-1 text-[13px] text-brand-600">✅ Aucune réservation en cours — entièrement disponible</p>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          {reservationsParBien[b.id].map((r, i) => (
                            <div key={i} className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700">
                              <span>{new Date(r.date_debut).toLocaleDateString('fr-FR')} → {r.date_fin ? new Date(r.date_fin).toLocaleDateString('fr-FR') : 'indéterminé'}</span>
                              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${r.statut === 'actif' ? 'bg-red-50 text-red-600' : 'bg-accent-50 text-accent-700'}`}>
                                {r.statut === 'actif' ? 'Occupé' : r.statut === 'en_attente_signature' ? 'En cours de validation' : 'Demande en cours'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <p className="mb-2.5 mt-4 text-xs font-bold uppercase tracking-wide text-brand-700">📋 Toutes les caractéristiques</p>
                      <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-2">
                        {Object.entries(carac).filter(([, v]) => v).map(([k, v]) => (
                          <div key={k} className="rounded-lg bg-slate-50 px-2.5 py-2">
                            <span className="mb-0.5 block text-[10px] uppercase tracking-wide text-slate-400">{LABELS_CARACTERISTIQUES[k] || k}</span>
                            <span className="text-[13px] font-semibold text-slate-800">{v}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                        <p className="m-0 text-xs text-slate-400">
                          Publié par RentEasy Bénin · Contactez votre agent pour visiter ce bien
                        </p>
                        <span
                          className="cursor-pointer whitespace-nowrap text-xs font-semibold text-red-600"
                          onClick={e => { e.stopPropagation(); setModalSignalement(b); setMotifSignalement(''); setDescriptionSignalement(''); setMessageSignalement(''); }}
                        >
                          🚩 Signaler cette annonce
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button className="mt-auto flex-1 py-1 text-left text-[13px] font-semibold text-brand-700" onClick={e => { e.stopPropagation(); const ouvre = bienDetail?.id !== b.id; setBienDetail(ouvre ? b : null); if (ouvre) chargerReservations(b.id); }}>
                      {bienDetail?.id === b.id ? '▲ Réduire' : '▼ Voir les détails'}
                    </button>
                    {estLocataire && (
                      <>
                        <button className="flex-1 rounded-lg bg-purple-50 py-1 text-[13px] font-semibold text-purple-700" onClick={e => { e.stopPropagation(); ouvrirModalDemande(b, 'reservation'); }}>
                          📅 Réserver
                        </button>
                        <button className="flex-1 rounded-lg bg-brand-600 py-1 text-[13px] font-semibold text-white" onClick={e => { e.stopPropagation(); ouvrirModalDemande(b, 'location'); }}>
                          🔑 Louer
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modalDemande && (
        <div className={overlay}>
          <div className={modal}>
            <h3 className="mb-1 text-xl font-bold text-slate-900">
              {modalDemande.origine === 'location' ? '🔑 Louer ce bien' : '📅 Réserver ce bien'}
            </h3>
            <p className="mb-4 text-[13px] text-slate-400">
              🔖 {modalDemande.bien.numero_bien || ''} — {modalDemande.bien.adresse || modalDemande.bien.lieu_depot}, {modalDemande.bien.ville}
            </p>

            {succesDemande ? (
              <div className="rounded-xl border border-brand-200 bg-brand-50 p-3 text-center text-brand-700">
                ✅ {succesDemande}
              </div>
            ) : (
              <>
                <label className={champLabel}>Date de début *</label>
                <input className={champInput} type="date" value={formDemande.date_debut} onChange={e => setFormDemande({ ...formDemande, date_debut: e.target.value })} />

                <label className={champLabel}>Durée</label>
                <div className="flex gap-2">
                  <input className={`${champInput} flex-1`} type="number" min="1" placeholder="Vide = indéterminée" value={formDemande.duree_valeur} onChange={e => setFormDemande({ ...formDemande, duree_valeur: e.target.value })} />
                  <select className={`${champInput} flex-1`} value={formDemande.duree_unite} onChange={e => setFormDemande({ ...formDemande, duree_unite: e.target.value })}>
                    <option value="jours">Jour(s)</option>
                    <option value="semaines">Semaine(s)</option>
                    <option value="mois">Mois</option>
                    <option value="annees">Année(s)</option>
                  </select>
                </div>

                <label className={champLabel}>Type de loyer *</label>
                <select className={champInput} value={formDemande.type_loyer} onChange={e => choisirTypeLoyerDemande(e.target.value)}>
                  {Object.keys(modalDemande.bien.tarifs || {}).length > 0
                    ? Object.entries(modalDemande.bien.tarifs).map(([k, v]) => (
                        <option key={k} value={k}>{TYPES_LOYER.find(t => t.value === k)?.label || k} — {parseInt(v).toLocaleString('fr-FR')} FCFA</option>
                      ))
                    : <option value={modalDemande.bien.type_loyer}>{TYPES_LOYER.find(t => t.value === modalDemande.bien.type_loyer)?.label || modalDemande.bien.type_loyer}</option>
                  }
                </select>

                {formDemande.date_debut && formDemande.type_loyer && (
                  <p className={`${champInput} mt-2 flex min-h-[20px] items-center text-xs text-slate-500`}>
                    📅 {libelleEcheanceAuto(formDemande.date_debut, formDemande.type_loyer)}
                  </p>
                )}

                <label className={champLabel}>Message au propriétaire (optionnel)</label>
                <textarea
                  className={`${champInput} h-[70px] resize-y`}
                  placeholder="Précisez votre demande si besoin..."
                  value={formDemande.note}
                  onChange={e => setFormDemande({ ...formDemande, note: e.target.value })}
                />

                {erreurDemande && <p className="mt-2 text-[13px] text-red-600">{erreurDemande}</p>}

                <div className="mt-4 flex gap-3">
                  <button className={btnAnnulerModal} onClick={() => setModalDemande(null)}>Annuler</button>
                  <button className={btnValiderModal} onClick={soumettreDemande} disabled={envoiDemande}>
                    {envoiDemande ? 'Envoi...' : modalDemande.origine === 'location' ? 'Envoyer la demande de location' : 'Envoyer la demande de réservation'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {modalSignalement && (
        <div className={overlay} onClick={() => setModalSignalement(null)}>
          <div className={modal} onClick={e => e.stopPropagation()}>
            <h3 className="mb-1 text-xl font-bold text-slate-900">🚩 Signaler cette annonce</h3>
            <p className="mb-4 text-[13px] text-slate-400">
              🔖 {modalSignalement.numero_bien || ''} — {modalSignalement.adresse || modalSignalement.lieu_depot}, {modalSignalement.ville}
            </p>

            {messageSignalement ? (
              <div className={`rounded-xl border p-3 text-center text-sm ${
                messageSignalement.includes('déjà') || messageSignalement.includes('Erreur') ? 'border-red-200 bg-red-50 text-red-600' : 'border-brand-200 bg-brand-50 text-brand-700'
              }`}>
                {messageSignalement}
              </div>
            ) : (
              <>
                <label className={champLabel}>Motif *</label>
                <select className={champInput} value={motifSignalement} onChange={e => setMotifSignalement(e.target.value)}>
                  <option value="">Sélectionnez un motif</option>
                  {MOTIFS_SIGNALEMENT.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>

                <label className={champLabel}>Précisions (optionnel)</label>
                <textarea
                  className={`${champInput} h-[70px] resize-y`}
                  placeholder="Décrivez le problème si besoin..."
                  value={descriptionSignalement}
                  onChange={e => setDescriptionSignalement(e.target.value)}
                />

                <div className="mt-4 flex gap-3">
                  <button className={btnAnnulerModal} onClick={() => setModalSignalement(null)}>Annuler</button>
                  <button
                    className={`${btnValiderModal} !bg-red-600 hover:!bg-red-700`}
                    onClick={envoyerSignalement}
                    disabled={envoiSignalement || !motifSignalement}
                  >
                    {envoiSignalement ? 'Envoi...' : 'Envoyer le signalement'}
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
