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
  payee: { bg: '#e8f5e9', color: '#2e7d32', label: '✅ Payée' },
  en_attente: { bg: '#fff3e0', color: '#e65100', label: '⏳ En attente' },
  impayee: { bg: '#ffebee', color: '#c62828', label: '❌ Impayée' },
  partielle: { bg: '#e3f2fd', color: '#1565c0', label: '⚡ Partielle' },
  en_recouvrement: { bg: '#f3e5f5', color: '#6a1b9a', label: '🔄 En recouvrement' },
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

  async function telechargerQuittance(paiementId) {
    try {
      const r = await api.get(`/locataire/paiements/${paiementId}/quittance`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `quittance-${paiementId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert('Erreur lors du téléchargement');
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
  const echeancesEnRetard = echeances.filter(e => (e.statut === 'impayee' || e.statut === 'partielle' || e.statut === 'en_recouvrement') && new Date(e.date_limite) < maintenant);
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: "'Segoe UI',sans-serif" }}>
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <nav style={s.nav} className="re-nav">
        <div style={s.navLogo}>🏠 <strong>RentEasy</strong> <span style={s.navBenin}>Bénin</span></div>
        <div style={s.navMenu}>
          {estAussiProprietaire && (
            <>
              <button style={s.navBtnMarche} onClick={() => navigate('/marche')}>🏪 Marché</button>
              <button style={s.navBtnBasculer} onClick={() => navigate('/dashboard')}>
                🔄 Espace propriétaire
              </button>
            </>
          )}
          <button style={s.navBtnProfil} onClick={() => navigate('/profil')}>👤 Mon profil</button>
          <ClocheNotifications />
          <button style={s.navDeconnexion} onClick={deconnecter}>Déconnexion</button>
        </div>
      </nav>

      <div style={s.contenu}>
        <div style={s.entete}>
          <h2 style={s.titre}>Bonjour, {utilisateur?.nom} 👋</h2>
          <p style={s.sousTitre}>Espace locataire</p>
        </div>

        <BoutonActiverRole />

        {liaisons.length > 0 && (
          <div style={s.liaisonsSection}>
            {liaisons.map(l => (
              <div key={l.id} style={s.liaisonCard}>
                <div>
                  <p style={s.liaisonTitre}>📨 {l.proprietaire_nom} souhaite vous ajouter comme locataire</p>
                  <p style={s.liaisonSous}>{l.proprietaire_telephone}{l.proprietaire_ville ? ` · ${l.proprietaire_ville}` : ''}</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button style={s.btnRefuser} onClick={() => refuserLiaison(l.id)} disabled={traitementLiaison === l.id}>
                    ✕ Refuser
                  </button>
                  <button style={s.btnAccepter} onClick={() => accepterLiaison(l.id)} disabled={traitementLiaison === l.id}>
                    {traitementLiaison === l.id ? '...' : '✓ Accepter'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {contratsEnAttente.length > 0 && (
          <div style={s.liaisonsSection}>
            {contratsEnAttente.map(c => (
              <div key={c.id} style={s.contratAttenteCard}>
                <div>
                  <p style={s.liaisonTitre}>✍️ Contrat à signer — {c.numero_bien}</p>
                  <p style={s.liaisonSous}>
                    {c.adresse || 'Véhicule'}, {c.ville} · Proposé par {c.proprietaire_nom} · {formaterMontant(c.loyer_mensuel)} / {c.type_loyer}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button style={s.btnVoir} onClick={() => voirContrat(c.id)}>👁️ Voir le contrat</button>
                  <button style={s.btnRefuser} onClick={() => refuserContrat(c.id)}>✕ Refuser</button>
                  <button style={s.btnAccepter} onClick={() => ouvrirModalSignature(c)}>✍️ Signer</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contrats actifs */}
        {(data?.contrats || []).map(c => (
          <div key={c.id} style={s.contratCard}>
            <div style={s.contratEntete}>
              <span style={s.contratBadge}>📋 Contrat actif</span>
            </div>
            <div style={s.contratGrille}>
              <div>
                <p style={s.contratLabel}>Bien loué</p>
                <p style={s.contratVal}>{c.adresse}</p>
                <p style={s.contratSous}>{c.ville} · {c.type_bien}</p>
              </div>
              <div>
                <p style={s.contratLabel}>Propriétaire</p>
                <p style={s.contratVal}>{c.proprietaire_nom}</p>
                <p style={s.contratSous}>{c.proprietaire_telephone}</p>
              </div>
              <div>
                <p style={s.contratLabel}>Loyer mensuel</p>
                <p style={{ ...s.contratVal, color: '#e8a020', fontSize: '20px', fontWeight: '700' }}>{formaterMontant(c.loyer_mensuel)}</p>
                <p style={s.contratSous}>{libelleEcheance(c)}</p>
              </div>
              <div>
                <p style={s.contratLabel}>Statistiques</p>
                <p style={s.contratVal}>{c.stats?.payees || 0} / {c.stats?.total || 0} payées</p>
                <p style={{ ...s.contratSous, color: c.stats?.impayees > 0 ? '#c62828' : '#2e7d32' }}>
                  {c.stats?.impayees > 0 ? `⚠️ ${c.stats.impayees} impayée(s)` : '✅ À jour'}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
              <button style={s.btnVoir} onClick={() => voirContrat(c.id)}>👁️ Voir</button>
              <button style={s.btnVoir} onClick={() => telechargerContratPDF(c.id)}>📄 Télécharger</button>
              <button style={s.btnAgent} onClick={() => ouvrirAgentResponsable(c.id)}>👔 Agent responsable</button>
              <button style={s.btnResilier} onClick={() => ouvrirModalResiliation(c)}>⚠️ Résilier</button>
            </div>
          </div>
        ))}

        {data?.contrats?.length === 0 && (
          <div style={s.vide}>
            <p>🏠 Aucun contrat actif trouvé.</p>
            <p style={{ color: '#888', fontSize: '14px' }}>Contactez votre propriétaire pour plus d'informations.</p>
          </div>
        )}

        {/* Échéances */}
        <div style={s.section}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={s.sectionTitre}>Mes échéances</h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              {voirToutesEcheances && ['tous', 'en_attente', 'payee', 'impayee', 'partielle', 'en_recouvrement'].map(f => (
                <button
                  key={f}
                  style={{ ...s.filtreBouton, background: filtre === f ? '#1a3a5c' : '#fff', color: filtre === f ? '#fff' : '#555' }}
                  onClick={() => setFiltre(f)}
                >
                  {f === 'tous' ? 'Toutes' : STATUT[f]?.label || f}
                </button>
              ))}
              <button style={s.btnVoirPlus} onClick={() => setVoirToutesEcheances(!voirToutesEcheances)}>
                {voirToutesEcheances ? '▲ Voir moins' : '▼ Voir plus'}
              </button>
            </div>
          </div>

          {!voirToutesEcheances && (
            <p style={{ color: '#6b7280', fontSize: '12px', margin: '0 0 12px' }}>
              Affichage des échéances déjà en retard et de celles en attente du mois en cours. Cliquez sur "Voir plus" pour tout afficher.
            </p>
          )}

          {echeancesAffichees.length === 0 ? (
            <p style={{ color: '#888', textAlign: 'center', padding: '20px' }}>
              {voirToutesEcheances ? 'Aucune échéance trouvée' : '🎉 Aucune échéance en retard ni en attente ce mois-ci'}
            </p>
          ) : (
            <div style={s.tableau}>
              <div style={{ ...s.tableauEntete, gridTemplateColumns: '1.3fr 1.8fr 1.1fr 1.2fr 1.6fr', minWidth: '560px' }}>
                <span>Période</span>
                <span>Bien</span>
                <span>Montant</span>
                <span>Statut</span>
                <span>Action</span>
              </div>
              {echeancesAffichees.map(e => {
                const st = STATUT[e.statut] || { bg: '#f5f5f5', color: '#666', label: e.statut };
                return (
                  <div key={e.id} style={{ ...s.tableauLigne, gridTemplateColumns: '1.3fr 1.8fr 1.1fr 1.2fr 1.6fr', minWidth: '560px' }}>
                    <span style={{ fontWeight: '600', textTransform: 'capitalize' }}>{formaterDate(e.mois_concerne)}</span>
                    <span style={{ color: '#888', fontSize: '13px' }}>{e.adresse}</span>
                    <span style={{ fontWeight: '700', color: '#1a3a5c' }}>
                      {formaterMontant(e.statut === 'partielle' ? e.montant_restant : e.montant_du)}
                      {e.statut === 'partielle' && <span style={{ fontSize: '11px', color: '#888', display: 'block', fontWeight: '400' }}>reste sur {formaterMontant(e.montant_du)}</span>}
                    </span>
                    <span style={{ ...s.statutBadge, background: st.bg, color: st.color }}>{st.label}</span>
                    <span>
                      {e.statut !== 'payee' && (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <button style={s.btnPayer} onClick={() => payerEcheance(e.id)} disabled={envoiPaiement === e.id}>
                            {envoiPaiement === e.id ? '...' : '💳 Payer'}
                          </button>
                          <button style={s.btnTranche} onClick={() => ouvrirModalTranche(e)} disabled={envoiPaiement === e.id}>
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
        <div style={s.overlay}>
          <div style={{ ...s.modal, maxWidth: '560px', maxHeight: '85vh', overflowY: 'auto' }}>
            {chargementDetail ? (
              <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px' }}>Chargement du contrat...</p>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <h3 style={{ margin: 0, color: '#c4b5fd', fontSize: '20px' }}>📄 Contrat de location</h3>
                  <button style={s.btnRefuser} onClick={() => setContratDetail(null)}>✕ Fermer</button>
                </div>
                <p style={{ color: '#f59e0b', fontSize: '12px', fontWeight: '700', marginBottom: '16px' }}>🔖 {contratDetail.numero_bien}</p>

                <div style={s.detailGrilleContrat}>
                  <div style={s.blocDetail}>
                    <p style={s.blocDetailTitre}>📍 Bien loué</p>
                    <p style={{ margin: 0, color: '#e2e8f0' }}>{contratDetail.adresse || contratDetail.lieu_depot}</p>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '13px' }}>{contratDetail.ville}{contratDetail.quartier ? `, ${contratDetail.quartier}` : ''}</p>
                  </div>
                  <div style={s.blocDetail}>
                    <p style={s.blocDetailTitre}>👤 Propriétaire</p>
                    <p style={{ margin: 0, color: '#e2e8f0' }}>{contratDetail.proprietaire_nom}</p>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '13px' }}>{contratDetail.proprietaire_telephone}</p>
                  </div>
                  <div style={s.blocDetail}>
                    <p style={s.blocDetailTitre}>📅 Durée</p>
                    <p style={{ margin: 0, color: '#e2e8f0' }}>Début : {new Date(contratDetail.date_debut).toLocaleDateString('fr-FR')}</p>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '13px' }}>{libelleEcheance(contratDetail)}</p>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '13px' }}>
                      Durée : {contratDetail.duree_valeur ? `${contratDetail.duree_valeur} ${LABELS_DUREE[contratDetail.duree_unite] || contratDetail.duree_unite} (fin le ${new Date(contratDetail.date_fin).toLocaleDateString('fr-FR')})` : 'Indéterminée'}
                    </p>
                  </div>
                  <div style={s.blocDetail}>
                    <p style={s.blocDetailTitre}>💰 Loyer</p>
                    <p style={{ margin: 0, color: '#e8a020', fontWeight: '700', fontSize: '17px' }}>{formaterMontant(contratDetail.loyer_mensuel)}</p>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '13px' }}>Périodicité : {contratDetail.type_loyer}{contratDetail.caution > 0 ? ` · Caution : ${formaterMontant(contratDetail.caution)}` : ''}</p>
                  </div>
                </div>

                {contratDetail.photos && contratDetail.photos.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <p style={s.blocDetailTitre}>📷 Aperçu du bien</p>
                      <Lightbox medias={contratDetail.photos} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(90px,1fr))', gap: '8px' }}>
                      {contratDetail.photos.map(photo => (
                        <img key={photo} src={`${API_BASE}${photo}`} alt="Aperçu" style={{ width: '100%', height: '70px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }} />
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '8px' }}>
                  <p style={{ margin: 0, color: '#9ca3af', fontSize: '12px' }}>
                    {contratDetail.statut === 'en_attente_signature'
                      ? '✍️ Ce contrat a été signé par le propriétaire et attend votre signature pour devenir officiellement actif.'
                      : contratDetail.statut === 'actif'
                      ? '✅ Ce contrat est actif et signé par les deux parties.'
                      : 'Statut : ' + contratDetail.statut}
                  </p>
                </div>

                {contratDetail.echeances && contratDetail.echeances.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <p style={s.blocDetailTitre}>📊 Échéances</p>
                    <div style={s.tableau}>
                      <div style={{ ...s.tableauEntete, gridTemplateColumns: '1.4fr 1.1fr 1.2fr', minWidth: '360px' }}>
                        <span>Période</span>
                        <span>Montant</span>
                        <span>Statut</span>
                      </div>
                      {contratDetail.echeances.map(e => {
                        const st = STATUT[e.statut] || { bg: '#f5f5f5', color: '#666', label: e.statut };
                        return (
                          <div key={e.id} style={{ ...s.tableauLigne, gridTemplateColumns: '1.4fr 1.1fr 1.2fr', minWidth: '360px' }}>
                            <span style={{ fontWeight: '600', fontSize: '13px' }}>{formaterDate(e.mois_concerne)}</span>
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
                )}

                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <button style={{ ...s.btnRefuser, flex: 1 }} onClick={() => telechargerContratPDF(contratDetail.id)}>📄 Télécharger le PDF</button>
                  {contratDetail.statut === 'en_attente_signature' && (
                    <button style={{ ...s.btnAccepter, flex: 1 }} onClick={() => { setContratDetail(null); ouvrirModalSignature(contratDetail); }}>
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
        <div style={s.overlay}>
          <div style={s.modal}>
            <h3 style={{ margin: '0 0 4px', color: '#c4b5fd', fontSize: '20px' }}>✍️ Signer le contrat</h3>
            <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '16px' }}>
              {modalSignature.numero_bien} — {modalSignature.adresse || 'Véhicule'}, {modalSignature.ville} · {formaterMontant(modalSignature.loyer_mensuel)} / {modalSignature.type_loyer}
            </p>
            <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '12px' }}>
              Dessinez votre signature ci-dessous pour signer électroniquement ce contrat. Il deviendra alors officiellement actif.
            </p>
            <SignaturePad onChange={setSignatureLocataire} />
            {erreurSignature && <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '8px' }}>{erreurSignature}</p>}
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button style={s.btnRefuser} onClick={() => setModalSignature(null)}>Annuler</button>
              <button style={s.btnAccepter} onClick={signerContrat} disabled={envoiSignature}>
                {envoiSignature ? 'Signature...' : '✍️ Signer et valider'}
              </button>
            </div>
          </div>
        </div>
      )}
      {modalTranche && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h3 style={{ margin: '0 0 4px', color: '#c4b5fd', fontSize: '20px' }}>🔢 Payer une tranche</h3>
            <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '16px' }}>
              {formaterDate(modalTranche.mois_concerne)} · {modalTranche.adresse} · Dû : {formaterMontant(modalTranche.statut === 'partielle' ? modalTranche.montant_restant : modalTranche.montant_du)}
            </p>
            <label style={s.sectionTitre}>Montant à payer (FCFA) *</label>
            <input
              style={s.modalInput}
              type="number"
              placeholder="Ex: 20000"
              value={montantTranche}
              onChange={e => setMontantTranche(e.target.value)}
            />
            {erreurPaiement && <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '8px' }}>{erreurPaiement}</p>}
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button style={s.btnRefuser} onClick={() => setModalTranche(null)}>Annuler</button>
              <button style={s.btnAccepter} onClick={payerTranche} disabled={envoiPaiement === modalTranche.id}>
                {envoiPaiement === modalTranche.id ? 'Paiement...' : '💳 Payer la tranche'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalResiliation && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h3 style={{ margin: '0 0 4px', color: '#ef4444', fontSize: '20px' }}>⚠️ Demande de résiliation</h3>
            <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '16px' }}>
              {modalResiliation.adresse}, {modalResiliation.ville}
            </p>
            <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '12px' }}>
              Votre demande sera envoyée à l'agent en charge de ce propriétaire pour traitement.
            </p>
            <label style={s.sectionTitre}>Motif (optionnel)</label>
            <textarea
              style={{ ...s.modalInput, height: '80px', resize: 'vertical' }}
              placeholder="Expliquez la raison de votre demande..."
              value={noteResiliation}
              onChange={e => setNoteResiliation(e.target.value)}
            />
            {erreurResiliation && <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '8px' }}>{erreurResiliation}</p>}
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button style={s.btnRefuser} onClick={() => setModalResiliation(null)}>Annuler</button>
              <button style={{ ...s.btnAccepter, background: 'linear-gradient(135deg,#ef4444,#b91c1c)' }} onClick={soumettreResiliation} disabled={envoiResiliation}>
                {envoiResiliation ? 'Envoi...' : 'Envoyer la demande'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalAgent && (
        <div style={s.overlay}>
          <div style={{ ...s.modal, maxWidth: afficherChatAgent ? '520px' : '420px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#c4b5fd', fontSize: '20px' }}>👔 Agent responsable</h3>
              <button style={s.btnRefuser} onClick={() => setModalAgent(null)}>✕ Fermer</button>
            </div>

            {chargementAgent ? (
              <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px' }}>Chargement...</p>
            ) : agentInfo && (
              afficherChatAgent ? (
                <>
                  <button style={{ ...s.btnVoir, marginBottom: '12px' }} onClick={() => setAfficherChatAgent(false)}>← Retour aux infos</button>
                  <Chat interlocuteur={agentInfo} contexte="locataire" />
                </>
              ) : (
                <>
                  <div style={s.blocDetail}>
                    <p style={{ margin: '0 0 4px', color: '#e2e8f0', fontWeight: '700', fontSize: '16px' }}>{agentInfo.nom}</p>
                    <p style={{ margin: '2px 0', color: '#9ca3af', fontSize: '13px' }}>📞 {agentInfo.telephone}</p>
                    <p style={{ margin: '2px 0', color: '#9ca3af', fontSize: '13px' }}>✉️ {agentInfo.email}</p>
                    {agentInfo.ville && <p style={{ margin: '2px 0', color: '#9ca3af', fontSize: '13px' }}>📍 {agentInfo.ville}</p>}
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                    <a href={`tel:${agentInfo.telephone}`} style={{ ...s.btnAccepter, textDecoration: 'none', textAlign: 'center', flex: 1 }}>📞 Appeler</a>
                    <button style={{ ...s.btnVoir, flex: 1 }} onClick={() => setAfficherChatAgent(true)}>💬 Discuter</button>
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

const s = {
  page: { minHeight: '100vh', background: 'linear-gradient(135deg,#0a0a0f 0%,#0d1117 100%)', fontFamily: "'Segoe UI',sans-serif", color: '#e2e8f0' },
  nav: { background: 'rgba(10,10,20,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(124,58,237,0.2)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px', position: 'sticky', top: 0, zIndex: 100 },
  navLogo: { color: '#e2e8f0', fontSize: '18px' },
  navBenin: { color: '#f59e0b' },
  navMenu: { display: 'flex', gap: '8px', alignItems: 'center' },
  navBtnMarche: { background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', color: '#fff', cursor: 'pointer', padding: '7px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '700' },
  navBtnBasculer: { background: 'linear-gradient(135deg,#f59e0b,#d97706)', border: 'none', color: '#000', cursor: 'pointer', padding: '7px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '700' },
  navBtnProfil: { background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#e2e8f0', cursor: 'pointer', padding: '7px 12px', borderRadius: '6px', fontSize: '13px' },
  navDeconnexion: { background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', cursor: 'pointer', padding: '7px 12px', borderRadius: '6px', fontSize: '13px' },
  contenu: { padding: '24px', maxWidth: '1000px', margin: '0 auto' },
  entete: { marginBottom: '24px' },
  titre: { margin: 0, fontSize: '24px', fontWeight: '800', background: 'linear-gradient(135deg,#c4b5fd,#f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  sousTitre: { color: '#6b7280', margin: '4px 0 0', fontSize: '14px' },
  contratCard: { background: 'linear-gradient(135deg,#1e1b4b,#0f0a2e)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '12px', padding: '20px', marginBottom: '24px', color: '#fff' },
  contratEntete: { marginBottom: '16px' },
  contratBadge: { background: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' },
  contratGrille: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '16px', marginTop: '12px' },
  contratLabel: { fontSize: '11px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' },
  contratVal: { fontWeight: '600', fontSize: '15px', margin: '0 0 2px', color: '#fff' },
  contratSous: { fontSize: '12px', color: 'rgba(255,255,255,0.6)', margin: 0 },
  section: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px' },
  sectionTitre: { margin: 0, color: '#c4b5fd', fontSize: '16px', fontWeight: '700' },
  vide: { textAlign: 'center', color: '#6b7280', padding: '40px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', marginBottom: '24px' },
  liaisonsSection: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' },
  liaisonCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '12px', padding: '16px 20px' },
  liaisonTitre: { margin: 0, fontWeight: '600', color: '#e2e8f0', fontSize: '14px' },
  liaisonSous: { margin: '4px 0 0', color: '#9ca3af', fontSize: '12px' },
  btnAccepter: { background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
  btnRefuser: { background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  btnVoir: { background: 'rgba(255,255,255,0.05)', color: '#c4b5fd', border: '1px solid rgba(196,181,253,0.3)', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  btnAgent: { background: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  btnResilier: { background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  btnVoirPlus: { background: 'transparent', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '20px', padding: '5px 14px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' },
  btnPayer: { background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' },
  btnTranche: { background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
  detailGrilleContrat: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '12px', marginTop: '8px' },
  blocDetail: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px 14px' },
  blocDetailTitre: { margin: '0 0 4px', color: '#9ca3af', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' },
  contratAttenteCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '12px', padding: '16px 20px' },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modal: { background: '#0f0a1e', border: '1px solid rgba(124,58,237,0.4)', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '460px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' },
  modalInput: { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', padding: '10px 12px', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none', marginTop: '4px' },
  filtreBouton: { border: '1.5px solid #ddd', borderRadius: '20px', padding: '5px 14px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' },
  tableau: { borderRadius: '8px', overflow: 'hidden', overflowX: 'auto', border: '1px solid rgba(255,255,255,0.08)' },
  tableauEntete: { display: 'grid', gridTemplateColumns: '1.5fr 2fr 1.3fr 1.5fr', padding: '10px 16px', background: 'rgba(124,58,237,0.1)', fontSize: '12px', fontWeight: '700', color: '#7c3aed', textTransform: 'uppercase' },
  tableauLigne: { display: 'grid', gridTemplateColumns: '1.5fr 2fr 1.3fr 1.5fr', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '14px', alignItems: 'center', color: '#e2e8f0' },
  statutBadge: { fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '20px', display: 'inline-block' },
};
