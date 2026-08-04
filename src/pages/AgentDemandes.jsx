import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import ClocheNotifications from '../components/ClocheNotifications';
import { useAuth } from '../context/AuthContext';

const STATUT_COULEURS = {
  en_attente: { bg: '#fff3e0', color: '#e65100', label: '⏳ En attente' },
  approuvee: { bg: '#e8f5e9', color: '#2e7d32', label: '✅ Approuvée' },
  annulee: { bg: '#ffebee', color: '#c62828', label: '❌ Annulée' },
};

export default function AgentDemandes() {
  const [demandes, setDemandes] = useState([]);
  const [filtre, setFiltre] = useState('en_attente');
  const [chargement, setChargement] = useState(true);
  const [modalTraitement, setModalTraitement] = useState(null);
  const [noteAgent, setNoteAgent] = useState('');
  const [modalRenouvellement, setModalRenouvellement] = useState(null);
  const [dureeRenouvellement, setDureeRenouvellement] = useState('');
  const [uniteRenouvellement, setUniteRenouvellement] = useState('mois');
  const [envoiRenouvellement, setEnvoiRenouvellement] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [succes, setSucces] = useState('');
  const [erreur, setErreur] = useState('');
  const { deconnecter } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { chargerDemandes(); }, []);

  async function chargerDemandes() {
    try {
      const r = await api.get('/demandes');
      setDemandes(r.data);
    } catch (e) {
      console.error(e);
    } finally {
      setChargement(false);
    }
  }

  async function traiterDemande(action) {
    setEnvoi(true); setErreur('');
    try {
      await api.patch(`/demandes/${modalTraitement.id}/${action}`, { note_agent: noteAgent });
      setSucces(`Demande ${action === 'approuver' ? 'approuvée' : 'annulée'} avec succès. Le propriétaire a été notifié.`);
      setModalTraitement(null);
      setNoteAgent('');
      chargerDemandes();
    } catch (e) {
      setErreur(e.response?.data?.message || 'Erreur lors du traitement');
    } finally {
      setEnvoi(false);
    }
  }

  async function validerFinResiliation(demandeId) {
    if (!window.confirm('Valider la fin de ce contrat ? Cette action est définitive.')) return;
    try {
      const r = await api.post(`/demandes/${demandeId}/finaliser-resiliation`);
      setSucces(r.data.message);
      chargerDemandes();
    } catch (e) {
      alert(e.response?.data?.message || 'Erreur lors de la validation');
    }
  }

  async function soumettreRenouvellement() {
    setErreur('');
    if (!dureeRenouvellement || parseInt(dureeRenouvellement) <= 0) {
      setErreur('Renseignez une durée de renouvellement valide');
      return;
    }
    setEnvoiRenouvellement(true);
    try {
      const r = await api.post(`/demandes/${modalRenouvellement.id}/renouveler`, {
        duree_valeur: parseInt(dureeRenouvellement),
        duree_unite: uniteRenouvellement,
      });
      setSucces(r.data.message);
      setModalRenouvellement(null);
      chargerDemandes();
    } catch (e) {
      setErreur(e.response?.data?.message || 'Erreur lors du renouvellement');
    } finally {
      setEnvoiRenouvellement(false);
    }
  }

  function formaterDate(d) {
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function formaterMontant(n) {
    return parseInt(n).toLocaleString('fr-FR') + ' FCFA';
  }

  const demandesFiltrees = (filtre === 'toutes' ? demandes : demandes.filter(d => d.statut === filtre))
    .slice()
    .sort((a, b) => (b.escaladee ? 1 : 0) - (a.escaladee ? 1 : 0));

  return (
    <div style={s.page}>
      <nav style={s.nav} className="re-nav">
        <div style={s.navLogo}>🏠 <strong>RentEasy</strong> <span style={s.navBenin}>Bénin</span> <span style={s.agentBadge}>Agent</span></div>
        <div style={s.navMenu}>
          <button style={s.navBtn} onClick={() => navigate('/agent/dashboard')}>Tableau de bord</button>
          <button style={s.navBtnActif}>Demandes</button>
          <button style={s.navBtn} onClick={() => navigate('/agent/recouvrements')}>Recouvrements</button>
          <button style={s.navBtnProfil} onClick={() => navigate('/profil')}>👤 Mon profil</button>
          <ClocheNotifications />
          <button style={s.navDeconnexion} onClick={deconnecter}>Déconnexion</button>
        </div>
      </nav>

      <div style={s.contenu}>
        <div style={s.entete}>
          <div>
            <h2 style={s.titre}>Demandes de contrats</h2>
            <p style={s.sousTitre}>{demandes.filter(d => d.statut === 'en_attente').length} demande(s) en attente de traitement</p>
          </div>
        </div>

        {succes && <div style={s.succes}>{succes}</div>}

        {/* Filtres */}
        <div style={s.filtres}>
          {['en_attente', 'approuvee', 'annulee', 'toutes'].map(f => (
            <button
              key={f}
              style={{ ...s.filtreBouton, background: filtre === f ? '#1a3a5c' : '#fff', color: filtre === f ? '#fff' : '#555' }}
              onClick={() => setFiltre(f)}
            >
              {f === 'toutes' ? 'Toutes' : STATUT_COULEURS[f]?.label || f}
            </button>
          ))}
        </div>

        {/* Liste des demandes */}
        {chargement ? (
          <p style={s.vide}>Chargement...</p>
        ) : demandesFiltrees.length === 0 ? (
          <div style={s.vide}>
            <p>✅ Aucune demande {filtre === 'en_attente' ? 'en attente' : ''}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {demandesFiltrees.map(d => {
              const st = STATUT_COULEURS[d.statut] || { bg: '#f5f5f5', color: '#9ca3af', label: d.statut };
              const conditions = d.conditions_demandees || {};
              return (
                <div key={d.id} style={s.demandeCard}>
                  <div style={s.demandeEntete}>
                    <div>
                      <span style={{
                        ...s.typeBadge,
                        background: d.type_demande === 'modification' ? '#e3f2fd' : d.type_demande === 'fin_contrat' ? '#fff3e0' : '#ffebee',
                        color: d.type_demande === 'modification' ? '#1565c0' : d.type_demande === 'fin_contrat' ? '#e65100' : '#c62828',
                      }}>
                        {d.type_demande === 'modification' ? '✏️ Modification' : d.type_demande === 'fin_contrat' ? '🔚 Fin de contrat' : '🔴 Résiliation'}
                      </span>
                      {d.initiee_par === 'locataire' && (
                        <span style={{ ...s.typeBadge, background: 'rgba(124,58,237,0.15)', color: '#a78bfa', marginLeft: '6px' }}>
                          👤 Initiée par le locataire
                        </span>
                      )}
                      {d.initiee_par === 'systeme' && (
                        <span style={{ ...s.typeBadge, background: 'rgba(107,114,128,0.15)', color: '#9ca3af', marginLeft: '6px' }}>
                          ⚙️ Générée automatiquement
                        </span>
                      )}
                      {d.escaladee && (
                        <span style={{ ...s.typeBadge, background: 'rgba(239,68,68,0.15)', color: '#ef4444', marginLeft: '6px' }}>
                          🚨 Bloquée depuis plus de 3 jours
                        </span>
                      )}
                      <span style={{ ...s.statutBadge, background: st.bg, color: st.color, marginLeft: '8px' }}>
                        {st.label}
                      </span>
                    </div>
                    <span style={s.demandeDate}>{formaterDate(d.created_at)}</span>
                  </div>

                  <div style={s.demandeGrille}>
                    <div style={s.demandeBloc}>
                      <p style={s.demandeBlocTitre}>👤 Propriétaire</p>
                      <p style={s.demandeBlocVal}>{d.proprietaire_nom}</p>
                      <p style={s.demandeBlocSous}>{d.proprietaire_email}</p>
                      <p style={s.demandeBlocSous}>{d.proprietaire_telephone}</p>
                    </div>
                    <div style={s.demandeBloc}>
                      <p style={s.demandeBlocTitre}>🏠 Bien concerné</p>
                      <p style={s.demandeBlocVal}>{d.adresse}, {d.ville}</p>
                      <p style={s.demandeBlocSous}>{d.type_bien}</p>
                    </div>
                    <div style={s.demandeBloc}>
                      <p style={s.demandeBlocTitre}>👥 Locataire</p>
                      <p style={s.demandeBlocVal}>{d.locataire_nom}</p>
                      <p style={s.demandeBlocSous}>{d.locataire_telephone}</p>
                    </div>
                    <div style={s.demandeBloc}>
                      <p style={s.demandeBlocTitre}>💰 Contrat actuel</p>
                      <p style={s.demandeBlocVal}>{formaterMontant(d.loyer_mensuel)} / mois</p>
                      {conditions.loyer_mensuel && (
                        <p style={{ color: '#e8a020', fontSize: '13px', fontWeight: '600' }}>
                          → Nouveau loyer demandé : {formaterMontant(conditions.loyer_mensuel)}
                        </p>
                      )}
                    </div>
                  </div>

                  {d.note_proprietaire && (
                    <div style={s.noteProprietaire}>
                      <strong>Note du propriétaire :</strong> {d.note_proprietaire}
                    </div>
                  )}

                  {d.note_agent && (
                    <div style={s.noteAgent}>
                      <strong>Note de l'agent :</strong> {d.note_agent}
                    </div>
                  )}

                  {d.statut === 'en_attente' && (
                    <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                      {d.type_demande === 'fin_contrat' ? (
                        <>
                          <button style={s.btnApprouver} onClick={() => validerFinResiliation(d.id)}>
                            ✅ Valider la résiliation
                          </button>
                          <button style={{ ...s.btnApprouver, background: 'linear-gradient(135deg,#f59e0b,#d97706)' }} onClick={() => { setModalRenouvellement(d); setDureeRenouvellement(''); setUniteRenouvellement('mois'); setErreur(''); }}>
                            🔄 Renouveler
                          </button>
                        </>
                      ) : (
                        <button style={s.btnApprouver} onClick={() => { setModalTraitement(d); setNoteAgent(''); setErreur(''); }}>
                          ✅ Traiter cette demande
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal traitement */}
      {modalTraitement && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h3 style={{ margin: '0 0 4px', color: '#c4b5fd' }}>Traiter la demande</h3>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>
              {modalTraitement.type_demande === 'modification' ? '✏️ Modification' : '🔴 Résiliation'} · {modalTraitement.proprietaire_nom}
            </p>

            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
              <p style={{ margin: '0 0 4px', fontWeight: '600', fontSize: '13px', color: '#c4b5fd' }}>Demande :</p>
              <p style={{ margin: 0, fontSize: '14px', color: '#e2e8f0' }}>
                {modalTraitement.type_demande === 'resiliation'
                  ? `Résiliation du contrat pour ${modalTraitement.locataire_nom} au ${modalTraitement.adresse}`
                  : `Modification du loyer${modalTraitement.conditions_demandees?.loyer_mensuel ? ` → ${formaterMontant(modalTraitement.conditions_demandees.loyer_mensuel)}` : ''}`
                }
              </p>
              {modalTraitement.note_proprietaire && (
                <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#9ca3af', fontStyle: 'italic' }}>
                  "{modalTraitement.note_proprietaire}"
                </p>
              )}
            </div>

            <label style={s.label}>Note pour le propriétaire (optionnel)</label>
            <textarea
              style={{ ...s.input, height: '80px', resize: 'vertical' }}
              placeholder="Expliquez votre décision..."
              value={noteAgent}
              onChange={e => setNoteAgent(e.target.value)}
            />

            {erreur && <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '8px' }}>{erreur}</p>}

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button style={s.btnAnnulerModal} onClick={() => setModalTraitement(null)}>Fermer</button>
              <button style={s.btnRefuser} onClick={() => traiterDemande('annuler')} disabled={envoi}>
                ❌ Annuler la demande
              </button>
              <button style={s.btnValider} onClick={() => traiterDemande('approuver')} disabled={envoi}>
                {envoi ? 'Traitement...' : '✅ Approuver'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalRenouvellement && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h3 style={s.modalTitre}>🔄 Renouveler le contrat</h3>
            <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '16px' }}>
              🔖 {modalRenouvellement.numero_bien} · {modalRenouvellement.proprietaire_nom}
            </p>
            <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '12px' }}>
              Confirmez d'abord l'accord entre le propriétaire et le locataire, puis précisez la durée de prolongation.
            </p>

            <label style={s.label}>Durée de renouvellement *</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input style={{ ...s.input, flex: 1 }} type="number" min="1" placeholder="Ex: 12" value={dureeRenouvellement} onChange={e => setDureeRenouvellement(e.target.value)} />
              <select style={{ ...s.input, flex: 1 }} value={uniteRenouvellement} onChange={e => setUniteRenouvellement(e.target.value)}>
                <option value="jours" style={s.option}>Jour(s)</option>
                <option value="semaines" style={s.option}>Semaine(s)</option>
                <option value="mois" style={s.option}>Mois</option>
                <option value="annees" style={s.option}>Année(s)</option>
              </select>
            </div>

            {erreur && <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '8px' }}>{erreur}</p>}

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button style={s.btnAnnulerModal} onClick={() => setModalRenouvellement(null)}>Annuler</button>
              <button style={s.btnValider} onClick={soumettreRenouvellement} disabled={envoiRenouvellement}>
                {envoiRenouvellement ? 'Renouvellement...' : '🔄 Confirmer le renouvellement'}
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
  agentBadge: { background: '#e8a020', color: '#fff', fontSize: '11px', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' },
  navMenu: { display: 'flex', gap: '8px', alignItems: 'center' },
    navBtn: { background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af', cursor: 'pointer', padding: '7px 12px', borderRadius: '6px', fontSize: '13px' },
    navBtnActif: { background: 'rgba(124,58,237,0.2)', border: '1px solid #7c3aed', color: '#c4b5fd', cursor: 'pointer', padding: '7px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '600' },
    navBtnProfil: { background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa', cursor: 'pointer', padding: '7px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '600' },
  navDeconnexion: { background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', cursor: 'pointer', padding: '7px 12px', borderRadius: '6px', fontSize: '13px' },
  contenu: { padding: '24px', maxWidth: '1200px', margin: '0 auto' },
  entete: { marginBottom: '24px' },
    titre: { margin: 0, fontSize: '24px', fontWeight: '800', background: 'linear-gradient(135deg,#c4b5fd,#f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  sousTitre: { color: '#6b7280', margin: '4px 0 0', fontSize: '14px' },
    succes: { background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  filtres: { display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' },
  filtreBouton: { border: '1.5px solid #ddd', borderRadius: '20px', padding: '6px 16px', fontSize: '13px', cursor: 'pointer', fontWeight: '500' },
    vide: { textAlign: 'center', color: '#6b7280', padding: '40px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' },
  demandeCard: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px' },
  demandeEntete: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' },
  typeBadge: { fontSize: '13px', fontWeight: '700', padding: '4px 12px', borderRadius: '20px' },
  statutBadge: { fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '20px' },
  demandeDate: { color: '#9ca3af', fontSize: '12px' },
  demandeGrille: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '12px' },
  demandeBloc: { background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '12px' },
  demandeBlocTitre: { fontWeight: '700', color: '#c4b5fd', fontSize: '12px', marginBottom: '6px', marginTop: 0, textTransform: 'uppercase', letterSpacing: '0.5px' },
  demandeBlocVal: { fontWeight: '600', fontSize: '14px', color: '#e2e8f0', margin: '0 0 2px' },
  demandeBlocSous: { fontSize: '12px', color: '#6b7280', margin: 0 },
  noteProprietaire: { background: '#fff8e1', color: '#f57f17', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginTop: '8px' },
  noteAgent: { background: '#e8f5e9', color: '#2e7d32', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginTop: '8px' },
  btnApprouver: { background: 'linear-gradient(135deg, #e8a020, #c47f10)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modal: { background: '#0f0a1e', border: '1px solid rgba(124,58,237,0.4)', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '460px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' },
    label: { fontSize: '13px', fontWeight: '600', color: '#9ca3af', display: 'block', marginBottom: '4px', marginTop: '12px' },
    input: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '14px', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', color: '#e2e8f0', outline: 'none' },
    option: { background: '#12121a', color: '#e2e8f0' },
  btnAnnulerModal: { background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 16px', fontSize: '14px', cursor: 'pointer' },
  btnRefuser: { background: '#ffebee', color: '#c62828', border: '1px solid #c62828', borderRadius: '8px', padding: '10px 16px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', flex: 1 },
  btnValider: { background: 'linear-gradient(135deg, #2e7d32, #1b5e20)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', flex: 1 },
};
