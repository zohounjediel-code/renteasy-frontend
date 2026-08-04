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

export default function Locataires() {
  const [locataires, setLocataires] = useState([]);
  const [liaisonsEnAttente, setLiaisonsEnAttente] = useState([]);
  const [biens, setBiens] = useState([]);
  const [contrats, setContrats] = useState([]);
  const [afficherFormLocataire, setAfficherFormLocataire] = useState(false);
  const [afficherFormContrat, setAfficherFormContrat] = useState(false);
  const [contratDetail, setContratDetail] = useState(null);
  const [modalDemande, setModalDemande] = useState(null);
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

  const STATUT_ECHEANCE = {
    payee: { bg: '#e8f5e9', color: '#2e7d32', label: 'Payée' },
    en_attente: { bg: '#fff3e0', color: '#e65100', label: 'En attente' },
    impayee: { bg: '#ffebee', color: '#c62828', label: 'Impayée' },
    partielle: { bg: '#e3f2fd', color: '#1565c0', label: 'Partielle' },
  };

  return (
    <div style={s.page}>
      <nav style={s.nav} className="re-nav">
        <div style={s.navLogo} onClick={() => navigate(lienConsultation('/dashboard'))}>🏠 <strong>RentEasy</strong> <span style={s.navBenin}>Bénin</span></div>
        <div style={s.navMenu}>
          <button style={s.navBtn} onClick={() => navigate(lienConsultation('/biens'))}>Mes biens</button>
          <button style={s.navBtnActif}>Locataires</button>
          <button style={s.navBtn} onClick={() => navigate(lienConsultation('/paiements'))}>Paiements</button>
          <button style={s.navBtn} onClick={() => navigate(lienConsultation('/dashboard'))}>Dashboard</button>
          {estAussiLocataire && !enConsultationAdmin && (
            <button style={s.navBtnBasculer} onClick={() => navigate('/locataire/dashboard')}>🔄 Espace locataire</button>
          )}
          <button style={s.navBtnProfil} onClick={() => navigate('/profil')}>👤 Mon profil</button>
          <ClocheNotifications />
        </div>
      </nav>

      <div style={s.contenu}>
        {enConsultationAdmin && (
          <div style={s.bandeauConsultation}>
            🛡️ Vous consultez et gérez les locataires de <strong>{proprietaireNomConsulte || 'ce propriétaire'}</strong> en tant qu'administrateur.
          </div>
        )}
        <div style={s.entete}>
          <h2 style={s.titre}>Locataires & Contrats</h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button style={s.boutonSec} onClick={() => { setAfficherFormContrat(!afficherFormContrat); setAfficherFormLocataire(false); }}>
              {afficherFormContrat ? '✕ Annuler' : '📋 Nouveau contrat'}
            </button>
            <button style={s.boutonPrim} onClick={() => { setAfficherFormLocataire(!afficherFormLocataire); setAfficherFormContrat(false); }}>
              {afficherFormLocataire ? '✕ Annuler' : '+ Ajouter locataire'}
            </button>
          </div>
        </div>

        {succes && <div style={s.succes}>{succes}</div>}

        {afficherFormLocataire && (
          <div style={s.card}>
            <h3 style={s.cardTitre}>Ajouter un locataire</h3>
            <p style={{ color: '#9ca3af', fontSize: '13px', marginTop: '-8px', marginBottom: '16px' }}>
              Le locataire doit déjà avoir un compte sur RentEasy. Il recevra une notification et devra accepter avant d'apparaître dans votre liste.
            </p>
            <div style={s.grille2}>
              <div>
                <label style={s.label}>Téléphone ou email du locataire *</label>
                <input style={s.input} placeholder="+22997001122 ou email@exemple.com" value={contactRecherche} onChange={e => { setContactRecherche(e.target.value); setLocataireTrouve(null); }} onKeyDown={e => e.key === 'Enter' && rechercherLocataire()} />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button style={{ ...s.boutonSec, width: '100%' }} onClick={rechercherLocataire} disabled={rechercheEnCours}>
                  {rechercheEnCours ? 'Recherche...' : '🔍 Rechercher'}
                </button>
              </div>
            </div>

            {locataireTrouve && (
              <div style={s.locataireTrouveCard}>
                <div style={s.avatar}>{locataireTrouve.nom.charAt(0).toUpperCase()}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', color: '#e2e8f0' }}>{locataireTrouve.nom}</div>
                  <div style={{ color: '#9ca3af', fontSize: '13px' }}>{locataireTrouve.telephone} {locataireTrouve.email ? `· ${locataireTrouve.email}` : ''}</div>
                </div>
                <span style={{ color: '#10b981', fontSize: '13px', fontWeight: '600' }}>✅ Compte trouvé</span>
              </div>
            )}

            {locataireTrouve && (
              <div style={{ marginTop: '12px' }}>
                <label style={s.label}>N° pièce d'identité (optionnel)</label>
                <input style={s.input} placeholder="CIP ou passeport" value={numeroPieceRecherche} onChange={e => setNumeroPieceRecherche(e.target.value)} />
              </div>
            )}

            {erreur && <p style={s.erreur}>{erreur}</p>}

            {locataireTrouve && (
              <button style={{ ...s.boutonPrim, marginTop: '16px' }} onClick={envoyerDemandeLiaison} disabled={envoi}>
                {envoi ? 'Envoi...' : "📨 Envoyer la demande d'ajout"}
              </button>
            )}
          </div>
        )}

        {liaisonsEnAttente.length > 0 && (
          <div style={s.card}>
            <h3 style={s.cardTitre}>⏳ Demandes en attente d'acceptation</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {liaisonsEnAttente.map(l => (
                <div key={l.id} style={s.attenteItem}>
                  <div>
                    <div style={{ fontWeight: '600', color: '#e2e8f0' }}>{l.nom}</div>
                    <div style={{ color: '#9ca3af', fontSize: '12px' }}>{l.telephone}{l.email ? ` · ${l.email}` : ''}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={s.badgeAttente}>⏳ En attente</span>
                    <button style={s.btnFermer} onClick={() => annulerDemandeLiaison(l.id)}>✕ Annuler</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {demandesLocataires.length > 0 && (
          <div style={s.card}>
            <h3 style={s.cardTitre}>📨 Demandes de réservation / location (marché)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {demandesLocataires.map(d => (
                <div key={d.id} style={s.attenteItem}>
                  <div>
                    <div style={{ fontWeight: '600', color: '#e2e8f0' }}>
                      {d.origine === 'locataire_location' ? '🔑 Location' : '📅 Réservation'} · 🔖 {d.numero_bien}
                    </div>
                    <div style={{ color: '#9ca3af', fontSize: '12px' }}>
                      {d.locataire_nom} ({d.locataire_telephone}) · {d.adresse}, {d.ville}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '12px' }}>
                      Du {new Date(d.date_debut).toLocaleDateString('fr-FR')} {d.date_fin ? `au ${new Date(d.date_fin).toLocaleDateString('fr-FR')}` : '(durée indéterminée)'} · {d.type_loyer} · {parseInt(d.loyer_mensuel).toLocaleString('fr-FR')} FCFA
                    </div>
                    {d.note_locataire && <div style={{ color: '#9ca3af', fontSize: '12px', fontStyle: 'italic', marginTop: '4px' }}>« {d.note_locataire} »</div>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button style={s.btnFermer} onClick={() => refuserDemandeLoc(d.id)}>✕ Refuser</button>
                    <button style={s.boutonSec} onClick={() => setModalDetailDemande(d)}>👁️ Voir</button>
                    <button style={s.boutonPrim} onClick={() => ouvrirModalApprobation(d)}>✍️ Approuver et signer</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {afficherFormContrat && (
          <div style={s.card}>
            <h3 style={s.cardTitre}>Nouveau contrat de location</h3>
            {biens.length === 0 && <div style={s.alerte}>⚠️ Aucun bien libre disponible.</div>}

            <div style={s.grille2}>
              <div>
                <label style={s.label}>Numéro du bien *</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    style={s.input}
                    placeholder="Ex: BIEN-00001"
                    value={formContrat.numero_bien}
                    onChange={e => setFormContrat({ ...formContrat, numero_bien: e.target.value })}
                    onKeyDown={e => e.key === 'Enter' && rechercherBienParNumero()}
                  />
                  <button style={{ ...s.boutonSec, whiteSpace: 'nowrap' }} onClick={rechercherBienParNumero} disabled={rechercheBienEnCours}>
                    {rechercheBienEnCours ? '...' : '🔍'}
                  </button>
                </div>
                {erreurNumeroBien && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{erreurNumeroBien}</p>}
              </div>
              <div>
                <label style={s.label}>Locataire *</label>
                <select style={s.input} value={formContrat.locataire_id} onChange={e => setFormContrat({ ...formContrat, locataire_id: e.target.value })}>
                  <option value="" style={s.option}>Sélectionner un locataire...</option>
                  {locataires.map(l => <option key={l.id} value={l.id} style={s.option}>{l.nom} · {l.telephone}</option>)}
                </select>
              </div>
            </div>

            {bienTrouve && (
              <div style={s.bienTrouveCard}>
                <p style={{ margin: '0 0 8px', fontWeight: '600', color: '#e2e8f0', fontSize: '13px' }}>
                  🏠 {bienTrouve.adresse || bienTrouve.lieu_depot}, {bienTrouve.ville}
                </p>
                <p style={{ margin: '0 0 8px', color: '#9ca3af', fontSize: '12px' }}>Choisissez le type de loyer pour ce contrat :</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {bienTrouve.tarifs && Object.keys(bienTrouve.tarifs).length > 0
                    ? Object.entries(bienTrouve.tarifs).map(([type, montant]) => (
                        <button
                          key={type}
                          style={{ ...s.tarifChoixBtn, ...(formContrat.type_loyer === type ? s.tarifChoixBtnActif : {}) }}
                          onClick={() => choisirTypeLoyer(type, montant)}
                        >
                          {LABELS_LOYER[type] || type} — {parseInt(montant).toLocaleString('fr-FR')} FCFA
                        </button>
                      ))
                    : (
                        <button
                          style={{ ...s.tarifChoixBtn, ...(formContrat.type_loyer === (bienTrouve.type_loyer || 'mensuel') ? s.tarifChoixBtnActif : {}) }}
                          onClick={() => choisirTypeLoyer(bienTrouve.type_loyer || 'mensuel', bienTrouve.loyer_mensuel)}
                        >
                          {LABELS_LOYER[bienTrouve.type_loyer] || 'Mensuel'} — {parseInt(bienTrouve.loyer_mensuel).toLocaleString('fr-FR')} FCFA
                        </button>
                      )
                  }
                </div>
              </div>
            )}

            <div style={s.grille2}>
              <div><label style={s.label}>Date de début *</label><input style={s.input} type="date" value={formContrat.date_debut} onChange={e => setFormContrat({ ...formContrat, date_debut: e.target.value })} /></div>
              <div>
                <label style={s.label}>Durée du contrat</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input style={{ ...s.input, flex: 1 }} type="number" min="1" placeholder="Vide = indéterminée" value={formContrat.duree_valeur} onChange={e => setFormContrat({ ...formContrat, duree_valeur: e.target.value })} />
                  <select style={{ ...s.input, flex: 1 }} value={formContrat.duree_unite} onChange={e => setFormContrat({ ...formContrat, duree_unite: e.target.value })}>
                    <option value="jours" style={s.option}>Jour(s)</option>
                    <option value="semaines" style={s.option}>Semaine(s)</option>
                    <option value="mois" style={s.option}>Mois</option>
                    <option value="annees" style={s.option}>Année(s)</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={s.label}>Échéance</label>
                <p style={{ ...s.input, color: '#9ca3af', fontSize: '12px', display: 'flex', alignItems: 'center', minHeight: '20px' }}>
                  {formContrat.date_debut && formContrat.type_loyer
                    ? `📅 ${libelleEcheanceAuto(formContrat.date_debut, formContrat.type_loyer)}`
                    : 'Choisissez la date de début et le type de loyer'}
                </p>
              </div>
              <div>
                <label style={s.label}>Type de loyer retenu *</label>
                <input style={{ ...s.input, background: 'rgba(255,255,255,0.02)' }} value={formContrat.type_loyer ? LABELS_LOYER[formContrat.type_loyer] || formContrat.type_loyer : ''} placeholder="Choisissez ci-dessus" readOnly />
              </div>
              <div>
                <label style={s.label}>Montant du loyer (FCFA) *</label>
                <input style={s.input} type="number" placeholder="80000" value={formContrat.loyer_mensuel} onChange={e => setFormContrat({ ...formContrat, loyer_mensuel: e.target.value })} />
              </div>
            </div>
            <div style={s.signatureBox}>
              <label style={{ ...s.label, color: '#c4b5fd' }}>✍️ Signature électronique du propriétaire *</label>
              <p style={{ color: '#6b7280', fontSize: '12px', margin: '0 0 8px' }}>
                Dessinez votre signature ci-dessous pour signer électroniquement ce contrat. Le locataire devra ensuite signer à son tour pour que le contrat soit officiellement validé.
              </p>
              <SignaturePad onChange={dataUrl => setFormContrat({ ...formContrat, signature_proprietaire: dataUrl })} />
            </div>
            {erreur && <p style={s.erreur}>{erreur}</p>}
            <button style={s.boutonPrim} onClick={creerContrat} disabled={envoi || biens.length === 0}>{envoi ? 'Signature en cours...' : '✍️ Signer et envoyer au locataire'}</button>
          </div>
        )}

        {contratDetail && (
          <div style={s.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={s.cardTitre}>Contrat — {contratDetail.locataire_nom}</h3>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button style={s.btnPDF} onClick={() => telechargerPDF(contratDetail.id)}>📄 Télécharger PDF</button>
                <button style={s.btnModif} onClick={() => setModalDemande(contratDetail)}>✏️ Modifier / Résilier</button>
                <button style={s.btnFermer} onClick={() => setContratDetail(null)}>✕</button>
              </div>
            </div>
            <div style={s.grille2}>
              <div style={s.bloc}><p style={s.blocTitre}>📍 Bien loué</p><p style={{ color: '#f59e0b', fontWeight: '700', fontSize: '12px', margin: '0 0 4px' }}>🔖 {contratDetail.numero_bien}</p><p>{contratDetail.adresse}</p><p style={{ color: '#6b7280' }}>{contratDetail.ville}</p></div>
              <div style={s.bloc}><p style={s.blocTitre}>👤 Locataire</p><p>{contratDetail.locataire_nom}</p><p style={{ color: '#6b7280' }}>{contratDetail.locataire_telephone}</p></div>
              <div style={s.bloc}><p style={s.blocTitre}>📅 Dates</p><p>Début : {formaterDate(contratDetail.date_debut)}</p><p style={{ color: '#6b7280' }}>{libelleEcheance(contratDetail)}</p><p style={{ color: '#6b7280' }}>Durée : {contratDetail.duree_valeur ? `${contratDetail.duree_valeur} ${LABELS_DUREE[contratDetail.duree_unite] || contratDetail.duree_unite} (fin le ${formaterDate(contratDetail.date_fin)})` : 'Indéterminée'}</p></div>
              <div style={s.bloc}>
                <p style={s.blocTitre}>💰 Loyer</p>
                <p style={{ fontWeight: '700', color: '#e8a020', fontSize: '18px' }}>{formaterMontant(contratDetail.loyer_mensuel)}</p>
                <p style={{ color: '#6b7280', fontSize: '12px' }}>Commission RentEasy : {formaterMontant(Math.round(contratDetail.loyer_mensuel * 0.05))}</p>
              </div>
            </div>

            {contratDetail.photos && contratDetail.photos.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <p style={{ ...s.blocTitre, margin: 0 }}>📷 Aperçu du bien</p>
                  <Lightbox medias={contratDetail.photos} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(110px,1fr))', gap: '10px' }}>
                  {contratDetail.photos.map(photo => (
                    estVideo(photo) ? (
                      <video key={photo} src={`${API_BASE}${photo}`} controls style={{ width: '100%', height: '90px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }} />
                    ) : (
                      <img key={photo} src={`${API_BASE}${photo}`} alt="Aperçu du bien" style={{ width: '100%', height: '90px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }} />
                    )
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: '20px' }}>
              <p style={s.blocTitre}>📊 Échéances</p>
              <div style={s.tableau}>
                <div style={{ ...s.tableauEntete, gridTemplateColumns: '1.4fr 1.1fr 1.2fr', minWidth: '360px' }}>
                  <span>Période</span>
                  <span>Montant</span>
                  <span>Statut</span>
                </div>
                {(contratDetail.echeances || []).map(e => {
                  const st = STATUT_ECHEANCE[e.statut] || { bg: '#f5f5f5', color: '#9ca3af', label: e.statut };
                  return (
                    <div key={e.id} style={{ ...s.tableauLigne, gridTemplateColumns: '1.4fr 1.1fr 1.2fr', minWidth: '360px' }}>
                      <span style={{ fontWeight: '600', fontSize: '13px' }}>
                        {new Date(e.mois_concerne).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </span>
                      <span style={{ fontWeight: '700', color: '#e2e8f0', fontSize: '13px' }}>
                        {formaterMontant(e.statut === 'partielle' ? e.montant_restant : e.montant_du)}
                        {e.statut === 'partielle' && <span style={{ fontSize: '10px', color: '#888', display: 'block', fontWeight: '400' }}>reste sur {formaterMontant(e.montant_du)}</span>}
                      </span>
                      <span style={{ ...s.statutBadge, background: st.bg, color: st.color }}>{st.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {chargement ? (
          <p style={s.vide}>Chargement...</p>
        ) : locataires.length === 0 ? (
          <div style={s.vide}><p>👤 Aucun locataire enregistré.</p></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {locataires.map(l => {
              // Un même locataire peut louer plusieurs biens chez le même propriétaire : on affiche
              // TOUS ses contrats actifs / en attente de signature, pas seulement le plus récent
              // (sinon un nouveau contrat masquait les précédents).
              const contratsL = contrats.filter(c => c.locataire_id === l.id);
              const contratsActifsL = contratsL.filter(c => c.statut === 'actif' || c.statut === 'en_attente_signature');
              return (
                <div key={l.id} style={s.locCard}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={s.avatar}>{l.nom.charAt(0).toUpperCase()}</div>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '15px', color: '#e2e8f0' }}>{l.nom}</div>
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>{l.telephone}{l.email ? ` · ${l.email}` : ''}</div>
                      {l.numero_piece_identite && <div style={{ fontSize: '12px', color: '#9ca3af' }}>🪪 {l.numero_piece_identite}</div>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {contratsActifsL.length > 0 ? (
                      contratsActifsL.map(c => (
                        c.statut === 'en_attente_signature' ? (
                          <span key={c.id} style={s.badgeAttente}>✍️ {c.numero_bien} — en attente de signature{c.effectue_par_agent_id ? ' (créé par votre agent)' : ''}</span>
                        ) : (
                          <button key={c.id} style={s.btnContrat} onClick={() => voirDetailContrat(c)}>
                            📋 🔖 {c.numero_bien} · {c.adresse}{c.effectue_par_agent_id ? ' · 🤝 par votre agent' : ''}
                          </button>
                        )
                      ))
                    ) : (
                      <>
                        <span style={{ color: '#9ca3af', fontSize: '13px', fontStyle: 'italic' }}>Aucun contrat actif</span>
                        <button style={s.btnFermer} onClick={() => supprimerLocataireAction(l)}>🗑️ Supprimer</button>
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
            <h3 style={{ margin: '0 0 4px', color: '#c4b5fd', fontSize: '20px' }}>Demande de contrat</h3>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>{modalDemande.locataire_nom} · {modalDemande.adresse}</p>
            <div style={{ background: '#fff8e1', color: '#f57f17', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
              ⚠️ Cette demande sera envoyée à votre agent et au locataire. L'agent traitera et vous notifiera de sa décision.
            </div>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <button style={{ ...s.typeBtn, background: formDemande.type_demande === 'modification' ? '#1a3a5c' : '#f5f5f5', color: formDemande.type_demande === 'modification' ? '#fff' : '#333' }} onClick={() => setFormDemande({ ...formDemande, type_demande: 'modification' })}>✏️ Modification</button>
              <button style={{ ...s.typeBtn, background: formDemande.type_demande === 'resiliation' ? '#c62828' : '#f5f5f5', color: formDemande.type_demande === 'resiliation' ? '#fff' : '#333' }} onClick={() => setFormDemande({ ...formDemande, type_demande: 'resiliation' })}>🔴 Résiliation</button>
            </div>
            {formDemande.type_demande === 'modification' && (
              <div>
                <label style={s.label}>Nouveau loyer souhaité (FCFA)</label>
                <input style={s.input} type="number" placeholder="Laisser vide si inchangé" value={formDemande.nouveau_loyer} onChange={e => setFormDemande({ ...formDemande, nouveau_loyer: e.target.value })} />
              </div>
            )}
            <div style={{ marginTop: '12px' }}>
              <label style={s.label}>Note pour l'agent</label>
              <textarea style={{ ...s.input, height: '80px', resize: 'vertical' }} placeholder={formDemande.type_demande === 'resiliation' ? 'Motif de résiliation...' : 'Précisez les modifications souhaitées...'} value={formDemande.note_proprietaire} onChange={e => setFormDemande({ ...formDemande, note_proprietaire: e.target.value })} />
            </div>
            {erreur && <p style={s.erreur}>{erreur}</p>}
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button style={{ background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', cursor: 'pointer', flex: 1 }} onClick={() => setModalDemande(null)}>Annuler</button>
              <button style={{ ...s.boutonPrim, flex: 1, background: formDemande.type_demande === 'resiliation' ? 'linear-gradient(135deg,#c62828,#a01010)' : undefined }} onClick={soumettreDemandeContrat} disabled={envoi}>{envoi ? 'Envoi...' : '📨 Soumettre'}</button>
            </div>
          </div>
        </div>
      )}

      {modalDetailDemande && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h3 style={{ margin: '0 0 4px', color: '#c4b5fd', fontSize: '20px' }}>👁️ Détails de la demande</h3>
            <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '16px' }}>
              {modalDetailDemande.origine === 'locataire_location' ? '🔑 Location' : '📅 Réservation'} · 🔖 {modalDetailDemande.numero_bien}
            </p>
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#e2e8f0' }}><strong>Locataire :</strong> {modalDetailDemande.locataire_nom} · {modalDetailDemande.locataire_telephone}</p>
              <p style={{ margin: 0, fontSize: '14px', color: '#e2e8f0' }}><strong>Bien :</strong> {modalDetailDemande.adresse}, {modalDetailDemande.ville}</p>
              <p style={{ margin: 0, fontSize: '14px', color: '#e2e8f0' }}>
                <strong>Période :</strong> du {new Date(modalDetailDemande.date_debut).toLocaleDateString('fr-FR')} {modalDetailDemande.date_fin ? `au ${new Date(modalDetailDemande.date_fin).toLocaleDateString('fr-FR')}` : '(durée indéterminée)'}
              </p>
              <p style={{ margin: 0, fontSize: '14px', color: '#e2e8f0' }}><strong>Type de loyer :</strong> {LABELS_LOYER[modalDetailDemande.type_loyer] || modalDetailDemande.type_loyer}</p>
              <p style={{ margin: 0, fontSize: '14px', color: '#e2e8f0' }}><strong>Montant :</strong> {parseInt(modalDetailDemande.loyer_mensuel).toLocaleString('fr-FR')} FCFA</p>
              <p style={{ margin: 0, fontSize: '14px', color: '#9ca3af' }}>{libelleEcheanceAuto(modalDetailDemande.date_debut, modalDetailDemande.type_loyer)}</p>
              {modalDetailDemande.note_locataire && (
                <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af', fontStyle: 'italic' }}>« {modalDetailDemande.note_locataire} »</p>
              )}
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button style={{ background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', cursor: 'pointer', flex: 1 }} onClick={() => setModalDetailDemande(null)}>Fermer</button>
              <button style={{ ...s.boutonPrim, flex: 1 }} onClick={() => { const d = modalDetailDemande; setModalDetailDemande(null); ouvrirModalApprobation(d); }}>
                ✍️ Approuver et signer
              </button>
            </div>
          </div>
        </div>
      )}

      {modalApprobation && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h3 style={{ margin: '0 0 4px', color: '#c4b5fd', fontSize: '20px' }}>✍️ Approuver la demande</h3>
            <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '16px' }}>
              🔖 {modalApprobation.numero_bien} — {modalApprobation.locataire_nom} · du {new Date(modalApprobation.date_debut).toLocaleDateString('fr-FR')}
              {modalApprobation.date_fin ? ` au ${new Date(modalApprobation.date_fin).toLocaleDateString('fr-FR')}` : ' (durée indéterminée)'}
            </p>
            <p style={{ color: '#e2e8f0', fontSize: '13px', marginBottom: '4px' }}>
              {LABELS_LOYER[modalApprobation.type_loyer] || modalApprobation.type_loyer} · {parseInt(modalApprobation.loyer_mensuel).toLocaleString('fr-FR')} FCFA
            </p>
            <p style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '12px' }}>{libelleEcheanceAuto(modalApprobation.date_debut, modalApprobation.type_loyer)}</p>
            <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '12px' }}>
              En signant, vous approuvez cette demande. Le locataire devra ensuite signer à son tour pour valider officiellement le contrat.
            </p>
            <SignaturePad onChange={setSignatureApprobation} />
            {erreurApprobation && <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '8px' }}>{erreurApprobation}</p>}
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button style={{ background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', cursor: 'pointer', flex: 1 }} onClick={() => setModalApprobation(null)}>Annuler</button>
              <button style={{ ...s.boutonPrim, flex: 1 }} onClick={approuverDemandeLoc} disabled={envoiApprobation}>
                {envoiApprobation ? 'Envoi...' : '✍️ Signer et approuver'}
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
    navBtnProfil: { background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa', cursor: 'pointer', padding: '7px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '600' },
  navBtn: { background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af', cursor: 'pointer', padding: '7px 12px', borderRadius: '6px', fontSize: '13px' },
    navBtnBasculer: { background: 'linear-gradient(135deg,#f59e0b,#d97706)', border: 'none', color: '#000', cursor: 'pointer', padding: '7px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '700' },
    navBtnActif: { background: 'rgba(124,58,237,0.2)', border: '1px solid #7c3aed', color: '#c4b5fd', cursor: 'pointer', padding: '7px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '600' },
  contenu: { padding: '24px', maxWidth: '1200px', margin: '0 auto' },
  bandeauConsultation: { background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.35)', color: '#f59e0b', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px' },
  entete: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    titre: { margin: 0, fontSize: '24px', fontWeight: '800', background: 'linear-gradient(135deg,#c4b5fd,#f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  boutonPrim: { background: 'linear-gradient(135deg,#e8a020,#c47f10)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  boutonSec: { background: 'rgba(255,255,255,0.05)', color: '#c4b5fd', border: '1.5px solid rgba(196,181,253,0.4)', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    card: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px', marginBottom: '24px' },
  cardTitre: { margin: '0 0 16px', color: '#c4b5fd' },
  grille2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '16px', marginBottom: '16px' },
    label: { fontSize: '13px', fontWeight: '600', color: '#9ca3af', display: 'block', marginBottom: '4px', marginTop: '12px' },
    input: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '14px', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', color: '#e2e8f0', outline: 'none' },
    option: { background: '#0f0a1e', color: '#e2e8f0' },
    erreur: { color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '10px', borderRadius: '6px', fontSize: '13px', marginTop: '8px', border: '1px solid rgba(239,68,68,0.2)' },
    succes: { background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  alerte: { background: '#fff3e0', color: '#e65100', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' },
  bienTrouveCard: { background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '10px', padding: '14px 16px', margin: '12px 0' },
  signatureBox: { background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: '10px', padding: '14px 16px', margin: '16px 0' },
  tarifChoixBtn: { background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  tarifChoixBtnActif: { background: 'rgba(16,185,129,0.2)', color: '#10b981', border: '1px solid #10b981' },
    vide: { textAlign: 'center', color: '#6b7280', padding: '40px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' },
  bloc: { background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '14px' },
  blocTitre: { fontWeight: '700', color: '#c4b5fd', fontSize: '13px', marginBottom: '8px', marginTop: 0 },
  tableau: { borderRadius: '8px', overflow: 'hidden', overflowX: 'auto', border: '1px solid rgba(255,255,255,0.08)' },
  tableauEntete: { display: 'grid', padding: '10px 16px', background: 'rgba(124,58,237,0.1)', fontSize: '12px', fontWeight: '700', color: '#7c3aed', textTransform: 'uppercase' },
  tableauLigne: { display: 'grid', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '14px', alignItems: 'center', color: '#e2e8f0' },
  statutBadge: { fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '20px', display: 'inline-block' },
  echeancesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(80px,1fr))', gap: '8px', marginTop: '8px' },
  echeanceItem: { borderRadius: '6px', padding: '8px', textAlign: 'center' },
  locCard: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' },
  locataireTrouveCard: { display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', padding: '12px 16px', marginTop: '12px' },
  attenteItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px 16px' },
  badgeAttente: { background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  avatar: { width: '44px', height: '44px', borderRadius: '50%', background: '#1a3a5c', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '18px', flexShrink: 0 },
  btnContrat: { background: '#e8f5e9', color: '#2e7d32', border: '1px solid #a5d6a7', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer', fontWeight: '600' },
  btnPDF: { background: '#1a3a5c', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 14px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' },
  btnModif: { background: '#e8a020', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 14px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' },
  btnFermer: { background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: 'none', borderRadius: '6px', padding: '8px 12px', fontSize: '12px', cursor: 'pointer' },
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modal: { background: '#0f0a1e', border: '1px solid rgba(124,58,237,0.4)', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '460px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' },
  typeBtn: { flex: 1, border: 'none', borderRadius: '8px', padding: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
};
