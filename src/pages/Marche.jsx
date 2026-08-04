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
    <div style={s.page}>
      <nav style={s.nav} className="re-nav">
        <div style={s.navLogo}>🏠 <strong>RentEasy</strong> <span style={s.navBenin}>Bénin</span></div>
        <div style={s.navMenu}>
          <button style={s.navBtnActif}>🏪 Marché</button>
          <button style={s.navBtn} onClick={() => navigate('/locataire/dashboard')}>Mon espace</button>
          {estAussiProprietaire && (
            <button style={s.navBtnBasculer} onClick={() => navigate('/dashboard')}>🔄 Espace propriétaire</button>
          )}
          <button style={s.navBtnProfil} onClick={() => navigate('/profil')}>👤 Mon profil</button>
          <ClocheNotifications />
          <button style={s.navDeconnexion} onClick={deconnecter}>Déconnexion</button>
        </div>
      </nav>

      <div style={s.contenu}>
        {/* En-tête */}
        <div style={s.entete}>
          <div>
            <h2 style={s.titre}>🏪 Marché immobilier RentEasy</h2>
            <p style={s.sousTitre}>{biens.length} bien(s) disponible(s) sur le marché</p>
          </div>
          <button
            style={{ ...s.btnFiltres, background: filtresActifs > 0 ? 'linear-gradient(135deg,#7c3aed,#5b21b6)' : 'rgba(255,255,255,0.05)' }}
            onClick={() => setAfficherFiltres(!afficherFiltres)}
          >
            🔍 Filtres {filtresActifs > 0 ? `(${filtresActifs})` : ''}
          </button>
        </div>

        {/* Panneau filtres */}
        {afficherFiltres && (
          <div style={s.panneauFiltres}>
            <h3 style={s.filtresTitre}>🔍 Filtrer les biens</h3>
            <div style={s.filtresGrille}>
              <div>
                <label style={s.label}>Type de bien</label>
                <select style={s.input} value={filtres.type_bien} onChange={e => setFiltres({ ...filtres, type_bien: e.target.value })}>
                  {TYPES_BIEN.map(t => <option key={t.value} value={t.value} style={s.option}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label style={s.label}>Ville</label>
                <input style={s.input} placeholder="Ex: Cotonou" value={filtres.ville} onChange={e => setFiltres({ ...filtres, ville: e.target.value })} />
              </div>
              <div>
                <label style={s.label}>Périodicité du loyer</label>
                <select style={s.input} value={filtres.type_loyer} onChange={e => setFiltres({ ...filtres, type_loyer: e.target.value })}>
                  {TYPES_LOYER.map(t => <option key={t.value} value={t.value} style={s.option}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label style={s.label}>Loyer min (FCFA)</label>
                <input style={s.input} type="number" placeholder="0" value={filtres.loyer_min} onChange={e => setFiltres({ ...filtres, loyer_min: e.target.value })} />
              </div>
              <div>
                <label style={s.label}>Loyer max (FCFA)</label>
                <input style={s.input} type="number" placeholder="500000" value={filtres.loyer_max} onChange={e => setFiltres({ ...filtres, loyer_max: e.target.value })} />
              </div>
              <div>
                <label style={s.label}>Chambres min</label>
                <input style={s.input} type="number" placeholder="1" value={filtres.nb_chambres} onChange={e => setFiltres({ ...filtres, nb_chambres: e.target.value })} />
              </div>
              <div>
                <label style={s.label}>Sanitaires min</label>
                <input style={s.input} type="number" placeholder="1" value={filtres.nb_sanitaires} onChange={e => setFiltres({ ...filtres, nb_sanitaires: e.target.value })} />
              </div>
              <div>
                <label style={s.label}>Étages min</label>
                <input style={s.input} type="number" placeholder="1" value={filtres.nb_etages} onChange={e => setFiltres({ ...filtres, nb_etages: e.target.value })} />
              </div>
              <div>
                <label style={s.label}>Superficie min (m²)</label>
                <input style={s.input} type="number" placeholder="20" value={filtres.superficie_min} onChange={e => setFiltres({ ...filtres, superficie_min: e.target.value })} />
              </div>
              <div>
                <label style={s.label}>Superficie max (m²)</label>
                <input style={s.input} type="number" placeholder="500" value={filtres.superficie_max} onChange={e => setFiltres({ ...filtres, superficie_max: e.target.value })} />
              </div>
            </div>

            {/* Caractéristiques booléennes */}
            <p style={{ ...s.label, marginTop: '16px', marginBottom: '10px' }}>Équipements</p>
            <div style={s.equipementsGrid}>
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
                  style={{ ...s.equipBtn, background: filtres[key] === 'oui' ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.05)', border: filtres[key] === 'oui' ? '1px solid #7c3aed' : '1px solid rgba(255,255,255,0.1)', color: filtres[key] === 'oui' ? '#c4b5fd' : '#9ca3af' }}
                  onClick={() => setFiltres({ ...filtres, [key]: filtres[key] === 'oui' ? '' : 'oui' })}
                >
                  {label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button style={s.btnReinitialiser} onClick={reinitialiserFiltres}>Réinitialiser</button>
              <button style={s.btnAppliquer} onClick={appliquerFiltres}>Appliquer les filtres</button>
            </div>
          </div>
        )}

        {/* Grille des biens */}
        {chargement ? (
          <div style={s.loading}>
            <div style={s.spinner} />
            <p style={{ color: '#9ca3af' }}>Chargement du marché...</p>
          </div>
        ) : biens.length === 0 ? (
          <div style={s.vide}>
            <p style={{ fontSize: '48px', margin: '0 0 12px' }}>🏘️</p>
            <p style={{ fontSize: '18px', color: '#e2e8f0', fontWeight: '600' }}>Aucun bien disponible</p>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>Essayez de modifier vos filtres de recherche</p>
          </div>
        ) : (
          <div style={s.grille}>
            {biens.map(b => {
              const carac = b.caracteristiques || {};
              return (
                <div key={b.id} style={s.bienCard} onClick={() => { const ouvre = bienDetail?.id !== b.id; setBienDetail(ouvre ? b : null); if (ouvre) chargerReservations(b.id); }}>
                  {/* Badge type */}
                  <div style={s.cardEntete}>
                    <span style={s.typeBadge}>{TYPES_BIEN.find(t => t.value === b.type_bien)?.label || b.type_bien}</span>
                    <span style={s.marcheBadge}>🏪 Disponible</span>
                  </div>

                  {/* Infos principales */}
                  <div style={s.cardAdresse}>{b.adresse || b.lieu_depot}</div>
                  <div style={s.cardVille}>📍 {b.quartier ? `${b.quartier}, ` : ''}{b.ville}</div>

                  {/* Tarif */}
                  <div style={s.cardTarif}>
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
                            <div key={k} style={s.tarifLigne}>
                              <span style={s.tarifMontant}>{formaterMontant(v)}</span>
                              <span style={s.tarifPeriode}>/ {k}</span>
                            </div>
                          ));
                        })()
                      : <div style={s.tarifLigne}>
                          <span style={s.tarifMontant}>{formaterMontant(b.loyer_mensuel)}</span>
                          <span style={s.tarifPeriode}>/ {b.type_loyer || 'mois'}</span>
                        </div>
                    }
                  </div>

                  {/* Caractéristiques rapides */}
                  {Object.keys(carac).length > 0 && (
                    <div style={s.caracRapides}>
                      {carac.nb_chambres && <span style={s.caracBadge}>🛏️ {carac.nb_chambres} ch.</span>}
                      {carac.superficie && <span style={s.caracBadge}>📐 {carac.superficie} m²</span>}
                      {carac.climatise === 'oui' && <span style={s.caracBadge}>❄️ Clim</span>}
                      {carac.meuble === 'oui' && <span style={s.caracBadge}>🛋️ Meublé</span>}
                      {carac.piscine === 'oui' && <span style={s.caracBadge}>🏊 Piscine</span>}
                      {carac.jardin === 'oui' && <span style={s.caracBadge}>🌿 Jardin</span>}
                      {carac.type_vehicule && <span style={s.caracBadge}>🚗 {carac.type_vehicule}</span>}
                    </div>
                  )}

                  {b.description_marche && (
                    <p style={s.description}>{b.description_marche}</p>
                  )}

                  {/* Détail étendu */}
                  {bienDetail?.id === b.id && (
                    <div style={s.detailEtendu}>
                      <div style={s.separateur} />
                      <p style={s.detailTitre}>💰 Tous les tarifs proposés</p>
                      <div style={s.detailGrille}>
                        {b.tarifs && Object.keys(b.tarifs).length > 0
                          ? Object.entries(b.tarifs).map(([k, v]) => (
                              <div key={k} style={s.detailItem}>
                                <span style={s.detailLabel}>{TYPES_LOYER.find(t => t.value === k)?.label || k}</span>
                                <span style={s.detailVal}>{formaterMontant(v)}</span>
                              </div>
                            ))
                          : (
                              <div style={s.detailItem}>
                                <span style={s.detailLabel}>{TYPES_LOYER.find(t => t.value === b.type_loyer)?.label || b.type_loyer || 'Mensuel'}</span>
                                <span style={s.detailVal}>{formaterMontant(b.loyer_mensuel)}</span>
                              </div>
                            )
                        }
                      </div>

                      {b.photos && b.photos.length > 0 && (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', marginBottom: '8px' }}>
                            <p style={{ ...s.detailTitre, margin: 0 }}>📷 Aperçu</p>
                            <Lightbox medias={b.photos} />
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(100px,1fr))', gap: '8px' }}>
                            {b.photos.map(photo => (
                              estVideo(photo) ? (
                                <video
                                  key={photo}
                                  src={`${API_BASE}${photo}`}
                                  controls
                                  style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}
                                  onClick={e => e.stopPropagation()}
                                />
                              ) : (
                                <img
                                  key={photo}
                                  src={`${API_BASE}${photo}`}
                                  alt="Aperçu du bien"
                                  style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}
                                  onClick={e => e.stopPropagation()}
                                />
                              )
                            ))}
                          </div>
                        </>
                      )}

                      <p style={{ ...s.detailTitre, marginTop: '16px' }}>📅 Disponibilité</p>
                      {(reservationsParBien[b.id] || []).length === 0 ? (
                        <p style={{ color: '#10b981', fontSize: '13px', margin: '4px 0' }}>✅ Aucune réservation en cours — entièrement disponible</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {reservationsParBien[b.id].map((r, i) => (
                            <div key={i} style={s.reservationLigne}>
                              <span>{new Date(r.date_debut).toLocaleDateString('fr-FR')} → {r.date_fin ? new Date(r.date_fin).toLocaleDateString('fr-FR') : 'indéterminé'}</span>
                              <span style={{
                                ...s.reservationBadge,
                                color: r.statut === 'actif' ? '#ef4444' : '#f59e0b',
                                background: r.statut === 'actif' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                              }}>
                                {r.statut === 'actif' ? 'Occupé' : r.statut === 'en_attente_signature' ? 'En cours de validation' : 'Demande en cours'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <p style={{ ...s.detailTitre, marginTop: '16px' }}>📋 Toutes les caractéristiques</p>
                      <div style={s.detailGrille}>
                        {Object.entries(carac).filter(([, v]) => v).map(([k, v]) => (
                          <div key={k} style={s.detailItem}>
                            <span style={s.detailLabel}>{LABELS_CARACTERISTIQUES[k] || k}</span>
                            <span style={s.detailVal}>{v}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <p style={{ color: '#6b7280', fontSize: '12px', margin: 0 }}>
                          Publié par RentEasy Bénin · Contactez votre agent pour visiter ce bien
                        </p>
                        <span
                          style={s.lienSignaler}
                          onClick={e => { e.stopPropagation(); setModalSignalement(b); setMotifSignalement(''); setDescriptionSignalement(''); setMessageSignalement(''); }}
                        >
                          🚩 Signaler cette annonce
                        </span>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={{ ...s.btnDetail, flex: 1 }} onClick={e => { e.stopPropagation(); const ouvre = bienDetail?.id !== b.id; setBienDetail(ouvre ? b : null); if (ouvre) chargerReservations(b.id); }}>
                      {bienDetail?.id === b.id ? '▲ Réduire' : '▼ Voir les détails'}
                    </button>
                    {estLocataire && (
                      <>
                        <button style={{ ...s.btnDetail, flex: 1, background: 'rgba(124,58,237,0.15)', color: '#a78bfa' }} onClick={e => { e.stopPropagation(); ouvrirModalDemande(b, 'reservation'); }}>
                          📅 Réserver
                        </button>
                        <button style={{ ...s.btnDetail, flex: 1, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff' }} onClick={e => { e.stopPropagation(); ouvrirModalDemande(b, 'location'); }}>
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
        <div style={s.overlay}>
          <div style={s.modal}>
            <h3 style={{ margin: '0 0 4px', color: '#c4b5fd', fontSize: '20px' }}>
              {modalDemande.origine === 'location' ? '🔑 Louer ce bien' : '📅 Réserver ce bien'}
            </h3>
            <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '16px' }}>
              🔖 {modalDemande.bien.numero_bien || ''} — {modalDemande.bien.adresse || modalDemande.bien.lieu_depot}, {modalDemande.bien.ville}
            </p>

            {succesDemande ? (
              <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                ✅ {succesDemande}
              </div>
            ) : (
              <>
                <label style={s.label}>Date de début *</label>
                <input style={s.input} type="date" value={formDemande.date_debut} onChange={e => setFormDemande({ ...formDemande, date_debut: e.target.value })} />

                <label style={s.label}>Durée</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input style={{ ...s.input, flex: 1 }} type="number" min="1" placeholder="Vide = indéterminée" value={formDemande.duree_valeur} onChange={e => setFormDemande({ ...formDemande, duree_valeur: e.target.value })} />
                  <select style={{ ...s.input, flex: 1 }} value={formDemande.duree_unite} onChange={e => setFormDemande({ ...formDemande, duree_unite: e.target.value })}>
                    <option value="jours" style={s.option}>Jour(s)</option>
                    <option value="semaines" style={s.option}>Semaine(s)</option>
                    <option value="mois" style={s.option}>Mois</option>
                    <option value="annees" style={s.option}>Année(s)</option>
                  </select>
                </div>

                <label style={s.label}>Type de loyer *</label>
                <select style={s.input} value={formDemande.type_loyer} onChange={e => choisirTypeLoyerDemande(e.target.value)}>
                  {Object.keys(modalDemande.bien.tarifs || {}).length > 0
                    ? Object.entries(modalDemande.bien.tarifs).map(([k, v]) => (
                        <option key={k} value={k} style={s.option}>{TYPES_LOYER.find(t => t.value === k)?.label || k} — {parseInt(v).toLocaleString('fr-FR')} FCFA</option>
                      ))
                    : <option value={modalDemande.bien.type_loyer} style={s.option}>{TYPES_LOYER.find(t => t.value === modalDemande.bien.type_loyer)?.label || modalDemande.bien.type_loyer}</option>
                  }
                </select>

                {formDemande.date_debut && formDemande.type_loyer && (
                  <p style={{ ...s.input, color: '#9ca3af', fontSize: '12px', display: 'flex', alignItems: 'center', minHeight: '20px', marginTop: '8px' }}>
                    📅 {libelleEcheanceAuto(formDemande.date_debut, formDemande.type_loyer)}
                  </p>
                )}

                <label style={s.label}>Message au propriétaire (optionnel)</label>
                <textarea
                  style={{ ...s.input, height: '70px', resize: 'vertical' }}
                  placeholder="Précisez votre demande si besoin..."
                  value={formDemande.note}
                  onChange={e => setFormDemande({ ...formDemande, note: e.target.value })}
                />

                {erreurDemande && <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '8px' }}>{erreurDemande}</p>}

                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button style={s.btnAnnulerModal} onClick={() => setModalDemande(null)}>Annuler</button>
                  <button style={s.btnValiderModal} onClick={soumettreDemande} disabled={envoiDemande}>
                    {envoiDemande ? 'Envoi...' : modalDemande.origine === 'location' ? 'Envoyer la demande de location' : 'Envoyer la demande de réservation'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {modalSignalement && (
        <div style={s.overlay} onClick={() => setModalSignalement(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 4px', color: '#c4b5fd', fontSize: '20px' }}>🚩 Signaler cette annonce</h3>
            <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '16px' }}>
              🔖 {modalSignalement.numero_bien || ''} — {modalSignalement.adresse || modalSignalement.lieu_depot}, {modalSignalement.ville}
            </p>

            {messageSignalement ? (
              <div style={{
                background: messageSignalement.includes('déjà') || messageSignalement.includes('Erreur') ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                border: `1px solid ${messageSignalement.includes('déjà') || messageSignalement.includes('Erreur') ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
                color: messageSignalement.includes('déjà') || messageSignalement.includes('Erreur') ? '#ef4444' : '#10b981',
                padding: '12px', borderRadius: '8px', textAlign: 'center', fontSize: '14px',
              }}>
                {messageSignalement}
              </div>
            ) : (
              <>
                <label style={s.label}>Motif *</label>
                <select style={s.input} value={motifSignalement} onChange={e => setMotifSignalement(e.target.value)}>
                  <option value="" style={s.option}>Sélectionnez un motif</option>
                  {MOTIFS_SIGNALEMENT.map(m => (
                    <option key={m.value} value={m.value} style={s.option}>{m.label}</option>
                  ))}
                </select>

                <label style={s.label}>Précisions (optionnel)</label>
                <textarea
                  style={{ ...s.input, height: '70px', resize: 'vertical' }}
                  placeholder="Décrivez le problème si besoin..."
                  value={descriptionSignalement}
                  onChange={e => setDescriptionSignalement(e.target.value)}
                />

                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button style={s.btnAnnulerModal} onClick={() => setModalSignalement(null)}>Annuler</button>
                  <button
                    style={{ ...s.btnValiderModal, background: 'linear-gradient(135deg,#ef4444,#b91c1c)' }}
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

const s = {
  page: { minHeight: '100vh', background: 'linear-gradient(135deg,#0a0a0f 0%,#0d1117 100%)', fontFamily: "'Segoe UI',sans-serif", color: '#e2e8f0' },
  nav: { background: 'rgba(10,10,20,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(124,58,237,0.2)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px', position: 'sticky', top: 0, zIndex: 100 },
  navLogo: { color: '#e2e8f0', fontSize: '18px' },
  navBenin: { color: '#f59e0b' },
  navMenu: { display: 'flex', gap: '8px', alignItems: 'center' },
  navBtn: { background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af', cursor: 'pointer', padding: '7px 12px', borderRadius: '6px', fontSize: '13px' },
  navBtnActif: { background: 'rgba(16,185,129,0.2)', border: '1px solid #10b981', color: '#6ee7b7', cursor: 'pointer', padding: '7px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '600' },
  navBtnBasculer: { background: 'linear-gradient(135deg,#f59e0b,#d97706)', border: 'none', color: '#000', cursor: 'pointer', padding: '7px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '700' },
  navBtnProfil: { background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa', cursor: 'pointer', padding: '7px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '600' },
  navDeconnexion: { background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', cursor: 'pointer', padding: '7px 12px', borderRadius: '6px', fontSize: '13px' },
  contenu: { padding: '28px 24px', maxWidth: '1300px', margin: '0 auto' },
  entete: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  titre: { margin: 0, fontSize: '26px', fontWeight: '800', background: 'linear-gradient(135deg,#6ee7b7,#f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  sousTitre: { color: '#6b7280', margin: '4px 0 0', fontSize: '14px' },
  btnFiltres: { color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  panneauFiltres: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '12px', padding: '24px', marginBottom: '24px' },
  filtresTitre: { margin: '0 0 16px', color: '#c4b5fd', fontSize: '16px', fontWeight: '700' },
  filtresGrille: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '14px' },
  label: { fontSize: '12px', fontWeight: '600', color: '#9ca3af', display: 'block', marginBottom: '4px', marginTop: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', outline: 'none' },
  option: { background: '#0f0a1e', color: '#e2e8f0' },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modal: { background: '#0f0a1e', border: '1px solid rgba(124,58,237,0.4)', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '460px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' },
  btnAnnulerModal: { flex: 1, background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px 20px', fontSize: '14px', cursor: 'pointer' },
  btnValiderModal: { flex: 1, background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px 20px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  lienSignaler: { color: '#ef4444', fontSize: '12px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' },
  reservationLigne: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', color: '#e2e8f0' },
  reservationBadge: { padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '600' },
  equipementsGrid: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  equipBtn: { padding: '8px 16px', borderRadius: '20px', fontSize: '13px', cursor: 'pointer', fontWeight: '600' },
  btnReinitialiser: { background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', cursor: 'pointer' },
  btnAppliquer: { background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', flex: 1 },
  loading: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px', gap: '16px' },
  spinner: { width: '40px', height: '40px', border: '3px solid rgba(124,58,237,0.2)', borderTop: '3px solid #7c3aed', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  vide: { textAlign: 'center', padding: '80px 20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' },
  grille: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '16px' },
  bienCard: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px', cursor: 'pointer', transition: 'border-color 0.2s', display: 'flex', flexDirection: 'column', gap: '10px' },
  cardEntete: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  typeBadge: { background: 'rgba(124,58,237,0.15)', color: '#a78bfa', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', border: '1px solid rgba(124,58,237,0.3)' },
  marcheBadge: { background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', border: '1px solid rgba(16,185,129,0.3)' },
  cardAdresse: { fontWeight: '700', color: '#e2e8f0', fontSize: '15px' },
  cardVille: { color: '#9ca3af', fontSize: '13px' },
  cardTarif: { display: 'flex', flexDirection: 'column', gap: '4px' },
  tarifLigne: { display: 'flex', alignItems: 'baseline', gap: '6px' },
  tarifMontant: { color: '#f59e0b', fontWeight: '800', fontSize: '18px' },
  tarifPeriode: { color: '#6b7280', fontSize: '13px' },
  caracRapides: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  caracBadge: { background: 'rgba(255,255,255,0.05)', color: '#9ca3af', padding: '3px 8px', borderRadius: '10px', fontSize: '11px', border: '1px solid rgba(255,255,255,0.08)' },
  description: { color: '#9ca3af', fontSize: '13px', fontStyle: 'italic', margin: 0, lineHeight: '1.5' },
  btnDetail: { background: 'transparent', border: 'none', color: '#7c3aed', cursor: 'pointer', fontSize: '13px', fontWeight: '600', padding: '4px 0', textAlign: 'left', marginTop: 'auto' },
  separateur: { height: '1px', background: 'rgba(255,255,255,0.08)', margin: '4px 0 12px' },
  detailEtendu: {},
  detailTitre: { color: '#a78bfa', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px' },
  detailGrille: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: '8px' },
  detailItem: { background: 'rgba(255,255,255,0.04)', borderRadius: '6px', padding: '8px 10px' },
  detailLabel: { fontSize: '10px', color: '#6b7280', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' },
  detailVal: { fontSize: '13px', fontWeight: '600', color: '#e2e8f0' },
};
