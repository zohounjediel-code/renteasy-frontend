import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import ClocheNotifications from '../components/ClocheNotifications';
import { useAuth } from '../context/AuthContext';

const TYPES_ACTION = ['appel', 'visite', 'mise_en_demeure', 'autre'];
const RESULTATS = ['promesse_paiement', 'paiement_partiel', 'refus', 'absent', 'paiement_complet'];

const RESULTAT_LABELS = {
  promesse_paiement: { label: '🤝 Promesse de paiement', couleur: '#f59e0b' },
  paiement_partiel: { label: '⚡ Paiement partiel', couleur: '#06b6d4' },
  refus: { label: '❌ Refus', couleur: '#ef4444' },
  absent: { label: '🚪 Absent', couleur: '#6b7280' },
  paiement_complet: { label: '✅ Paiement complet', couleur: '#10b981' },
};

export default function AgentRecouvrements() {
  const [impayes, setImpayes] = useState([]);
  const [recouvrements, setRecouvrements] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [modalIntervention, setModalIntervention] = useState(null);
  const [form, setForm] = useState({ type_action: 'visite', resultat: 'absent', notes: '' });
  const [envoi, setEnvoi] = useState(false);
  const [succes, setSucces] = useState('');
  const [erreur, setErreur] = useState('');
  const [soldeAgent, setSoldeAgent] = useState(0);
  const [modalPaiement, setModalPaiement] = useState(null);
  const [montantPaiement, setMontantPaiement] = useState('');
  const [envoiPaiement, setEnvoiPaiement] = useState(false);
  const [erreurPaiement, setErreurPaiement] = useState('');
  const [modalPaiementManuel, setModalPaiementManuel] = useState(null);
  const [formPaiementManuel, setFormPaiementManuel] = useState({ montant: '', methode: 'especes', reference_transaction: '' });
  const [envoiPaiementManuel, setEnvoiPaiementManuel] = useState(false);
  const [erreurPaiementManuel, setErreurPaiementManuel] = useState('');
  const { deconnecter } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { chargerDonnees(); }, []);

  async function chargerDonnees() {
    try {
      const [rImpayes, rRecouvrements, rSolde] = await Promise.all([
        api.get('/paiements/impayes'),
        api.get('/recouvrements'),
        api.get('/solde'),
      ]);
      setImpayes(rImpayes.data);
      setRecouvrements(rRecouvrements.data || []);
      setSoldeAgent(rSolde.data.solde || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setChargement(false);
    }
  }

  function ouvrirModalPaiement(e) {
    setModalPaiement(e);
    setMontantPaiement(String(e.montant_du));
    setErreurPaiement('');
  }

  async function payerAvecSolde() {
    setErreurPaiement('');
    const montant = parseInt(montantPaiement);
    if (!montant || montant <= 0) {
      setErreurPaiement('Montant invalide');
      return;
    }
    if (montant > soldeAgent) {
      setErreurPaiement(`Solde insuffisant (disponible : ${soldeAgent.toLocaleString('fr-FR')} FCFA). Rechargez votre solde depuis votre profil.`);
      return;
    }
    setEnvoiPaiement(true);
    try {
      await api.post(`/paiements/${modalPaiement.id}/payer-solde`, { montant });
      setSucces(`Paiement de ${montant.toLocaleString('fr-FR')} FCFA enregistré avec succès pour ${modalPaiement.locataire_nom}.`);
      setModalPaiement(null);
      chargerDonnees();
    } catch (e) {
      setErreurPaiement(e.response?.data?.message || 'Erreur lors du paiement');
    } finally {
      setEnvoiPaiement(false);
    }
  }

  function ouvrirModalPaiementManuel(e) {
    // Pour une échéance déjà "partielle", ce qui reste dû est montant_restant, pas montant_du
    // (le montant d'origine) — sinon le champ se pré-remplit avec un montant que le backend
    // refusera systématiquement (creerPaiement plafonne désormais au reste réellement dû).
    const resteDu = e.statut === 'partielle' ? e.montant_restant : e.montant_du;
    setModalPaiementManuel({ ...e, resteDu });
    setFormPaiementManuel({ montant: String(resteDu), methode: 'especes', reference_transaction: '' });
    setErreurPaiementManuel('');
  }

  async function enregistrerPaiementManuel() {
    setErreurPaiementManuel('');
    const montant = parseInt(formPaiementManuel.montant);
    if (!montant || montant <= 0) {
      setErreurPaiementManuel('Montant invalide');
      return;
    }
    setEnvoiPaiementManuel(true);
    try {
      await api.post('/paiements', {
        echeance_id: modalPaiementManuel.id,
        montant,
        methode: formPaiementManuel.methode,
        reference_transaction: formPaiementManuel.reference_transaction || undefined,
      });
      setSucces(`Paiement de ${montant.toLocaleString('fr-FR')} FCFA enregistré avec succès pour ${modalPaiementManuel.locataire_nom}.`);
      setModalPaiementManuel(null);
      chargerDonnees();
    } catch (e) {
      setErreurPaiementManuel(e.response?.data?.message || "Erreur lors de l'enregistrement du paiement");
    } finally {
      setEnvoiPaiementManuel(false);
    }
  }

  async function enregistrerIntervention() {
    setEnvoi(true); setErreur('');
    try {
      await api.post('/recouvrements', {
        echeance_id: modalIntervention.id,
        ...form,
      });
      setSucces('Intervention enregistrée avec succès !');
      setModalIntervention(null);
      setForm({ type_action: 'visite', resultat: 'absent', notes: '' });
      chargerDonnees();
    } catch (e) {
      setErreur(e.response?.data?.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setEnvoi(false);
    }
  }

  function formaterMontant(n) {
    return parseInt(n || 0).toLocaleString('fr-FR') + ' FCFA';
  }
  function formaterDate(d) {
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  function joursRetard(dateStr) {
    const diff = Math.floor((new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24));
    return diff;
  }

  return (
    <div style={s.page}>
      <nav style={s.nav} className="re-nav">
        <div style={s.navLogo}>
          ⚡ <strong>RentEasy</strong> <span style={s.navBenin}>Bénin</span>
          <span style={s.agentBadge}>Agent</span>
        </div>
        <div style={s.navMenu}>
          <button style={s.navBtn} onClick={() => navigate('/agent/dashboard')}>Tableau de bord</button>
          <button style={s.navBtn} onClick={() => navigate('/agent/demandes')}>Demandes</button>
          <button style={s.navBtn} onClick={() => navigate('/agent/recouvrements')}>Recouvrements</button>
          <button style={s.navBtn} onClick={() => navigate('/agent/proprietaires')}>Mes propriétaires</button>
          <button style={{ ...s.navBtn, ...s.navBtnActif }}>Recouvrements</button>
          <button style={s.navBtnProfil} onClick={() => navigate('/profil')}>👤 Mon profil</button>
          <ClocheNotifications />
          <button style={s.navDeconnexion} onClick={deconnecter}>Déconnexion</button>
        </div>
      </nav>

      <div style={s.contenu}>
        <div style={s.entete}>
          <div>
            <h2 style={s.titre}>Recouvrement terrain</h2>
            <p style={s.sousTitre}>{impayes.length} échéance(s) impayée(s) à traiter</p>
          </div>
          <div style={s.soldeBox}>
            <p style={s.soldeLabel}>💰 Mon solde</p>
            <p style={s.soldeValeur}>{soldeAgent.toLocaleString('fr-FR')} FCFA</p>
            <button style={s.btnRecharger} onClick={() => navigate('/profil')}>+ Recharger</button>
          </div>
        </div>

        {succes && <div style={s.succes}>{succes}</div>}

        {/* Stats rapides */}
        <div style={s.statsGrid}>
          <div style={s.statCard}>
            <div style={s.statIcone}>⚠️</div>
            <div style={{ ...s.statVal, color: '#ef4444' }}>{impayes.length}</div>
            <div style={s.statLabel}>Impayés à traiter</div>
          </div>
          <div style={s.statCard}>
            <div style={s.statIcone}>📋</div>
            <div style={{ ...s.statVal, color: '#7c3aed' }}>{recouvrements.length}</div>
            <div style={s.statLabel}>Interventions totales</div>
          </div>
          <div style={s.statCard}>
            <div style={s.statIcone}>✅</div>
            <div style={{ ...s.statVal, color: '#10b981' }}>
              {recouvrements.filter(r => r.resultat === 'paiement_complet').length}
            </div>
            <div style={s.statLabel}>Paiements obtenus</div>
          </div>
        </div>

        {/* Liste des impayés */}
        <p style={s.sectionTitre}>📋 Échéances à recouvrer</p>

        {chargement ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '40px' }}>Chargement...</p>
        ) : impayes.length === 0 ? (
          <div style={s.vide}>
            <p style={{ fontSize: '32px', margin: '0 0 8px' }}>🎉</p>
            <p>Aucune échéance impayée en retard !</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {impayes.map(e => {
              const retard = joursRetard(e.date_limite);
              return (
                <div key={e.id} style={s.impayeCard}>
                  <div style={s.impayeInfo}>
                    <div style={s.impayeEntete}>
                      <span style={s.locataireNom}>{e.locataire_nom}</span>
                      <span style={{ ...s.retardBadge, background: retard > 30 ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)', color: retard > 30 ? '#ef4444' : '#f59e0b', border: `1px solid ${retard > 30 ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}` }}>
                        {retard} jour(s) de retard
                      </span>
                    </div>
                    <div style={s.impayeDetail}>📍 {e.adresse}, {e.ville}</div>
                    <div style={s.impayeDetail}>📞 {e.locataire_telephone}</div>
                    <div style={s.impayeDetail}>📅 Échéance : {formaterDate(e.date_limite)}</div>
                  </div>
                  <div style={s.impayeDroite}>
                    <div style={s.montantImpaye}>{formaterMontant(e.montant_du)}</div>
                    <button style={s.btnPayer} onClick={() => ouvrirModalPaiement(e)}>
                      💰 Payer avec mon solde
                    </button>
                    <button style={s.btnPaiementManuel} onClick={() => ouvrirModalPaiementManuel(e)}>
                      ✅ Enregistrer un paiement reçu
                    </button>
                    <button style={s.btnIntervenir} onClick={() => { setModalIntervention(e); setErreur(''); }}>
                      📝 Enregistrer intervention
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Historique des interventions */}
        {recouvrements.length > 0 && (
          <>
            <p style={{ ...s.sectionTitre, marginTop: '32px' }}>📜 Historique des interventions</p>
            <div style={s.tableau}>
              <div style={s.tableauEntete}>
                <span>Locataire</span>
                <span>Type</span>
                <span>Résultat</span>
                <span>Date</span>
                <span>Notes</span>
              </div>
              {recouvrements.slice(0, 20).map(r => {
                const res = RESULTAT_LABELS[r.resultat] || { label: r.resultat, couleur: '#6b7280' };
                return (
                  <div key={r.id} style={s.tableauLigne}>
                    <span style={{ color: '#e2e8f0', fontWeight: '600' }}>{r.locataire_nom || '—'}</span>
                    <span style={{ color: '#9ca3af', textTransform: 'capitalize' }}>{r.type_action?.replace('_', ' ')}</span>
                    <span style={{ color: res.couleur, fontWeight: '600', fontSize: '13px' }}>{res.label}</span>
                    <span style={{ color: '#6b7280', fontSize: '13px' }}>{formaterDate(r.date_intervention || r.created_at)}</span>
                    <span style={{ color: '#6b7280', fontSize: '12px' }}>{r.notes || '—'}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Modal paiement avec le solde de l'agent */}
      {modalPaiement && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h3 style={s.modalTitre}>💰 Payer avec mon solde</h3>
            <p style={s.modalSous}>{modalPaiement.locataire_nom} · {modalPaiement.adresse}</p>
            <p style={{ color: '#ef4444', fontWeight: '700', fontSize: '16px', marginBottom: '8px' }}>
              {formaterMontant(modalPaiement.montant_du)} dû
            </p>
            <p style={{ color: '#6b7280', fontSize: '12px', marginBottom: '16px' }}>
              À utiliser si vous avez déjà encaissé cet argent (espèces, etc.) sur le terrain. Le montant sera
              débité de <strong style={{ color: '#10b981' }}>votre</strong> solde RentEasy et crédité au propriétaire.
            </p>

            <label style={s.label}>Montant à payer (FCFA)</label>
            <input
              style={s.input}
              type="number"
              min="1"
              max={modalPaiement.montant_du}
              value={montantPaiement}
              onChange={e => setMontantPaiement(e.target.value)}
            />
            <p style={{ color: '#6b7280', fontSize: '11px', margin: '6px 0 0' }}>
              Laissez le montant complet pour un paiement total, ou réduisez-le pour un paiement en tranche.
            </p>
            <p style={{ color: '#9ca3af', fontSize: '12px', margin: '10px 0 0' }}>
              Votre solde disponible : <strong>{soldeAgent.toLocaleString('fr-FR')} FCFA</strong>
            </p>

            {erreurPaiement && <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '10px' }}>{erreurPaiement}</p>}

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button style={s.btnAnnuler} onClick={() => setModalPaiement(null)} disabled={envoiPaiement}>Annuler</button>
              <button style={s.btnValider} onClick={payerAvecSolde} disabled={envoiPaiement}>
                {envoiPaiement ? 'Paiement...' : '💰 Confirmer le paiement'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal enregistrement manuel d'un paiement déjà reçu (espèces, virement, mobile money confirmé à la main) */}
      {modalPaiementManuel && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h3 style={s.modalTitre}>✅ Enregistrer un paiement reçu</h3>
            <p style={s.modalSous}>{modalPaiementManuel.locataire_nom} · {modalPaiementManuel.adresse}</p>
            <p style={{ color: '#ef4444', fontWeight: '700', fontSize: '16px', marginBottom: '8px' }}>
              {formaterMontant(modalPaiementManuel.resteDu)} dû
              {modalPaiementManuel.statut === 'partielle' && (
                <span style={{ fontSize: '11px', color: '#6b7280', display: 'block', fontWeight: '400' }}>
                  reste sur {formaterMontant(modalPaiementManuel.montant_du)} — déjà partiellement réglé
                </span>
              )}
            </p>
            <p style={{ color: '#6b7280', fontSize: '12px', marginBottom: '16px' }}>
              À utiliser quand le paiement est déjà arrivé par un autre moyen que le solde RentEasy
              (espèces, virement bancaire, ou mobile money confirmé directement avec le locataire). Aucun
              montant n'est débité de votre solde ici — vous déclarez simplement un paiement déjà reçu.
            </p>

            <label style={s.label}>Montant reçu (FCFA)</label>
            <input
              style={s.input}
              type="number"
              min="1"
              max={modalPaiementManuel.resteDu}
              value={formPaiementManuel.montant}
              onChange={e => setFormPaiementManuel({ ...formPaiementManuel, montant: e.target.value })}
            />
            <p style={{ color: '#6b7280', fontSize: '11px', margin: '6px 0 0' }}>
              Laissez le montant complet pour un paiement total, ou réduisez-le pour un paiement en tranche.
            </p>

            <label style={s.label}>Moyen de paiement</label>
            <select style={s.input} value={formPaiementManuel.methode} onChange={e => setFormPaiementManuel({ ...formPaiementManuel, methode: e.target.value })}>
              <option value="especes" style={s.option}>💵 Espèces</option>
              <option value="virement" style={s.option}>🏦 Virement bancaire</option>
              <option value="mtn_momo" style={s.option}>📱 MTN Mobile Money</option>
              <option value="moov_money" style={s.option}>📱 Moov Money</option>
            </select>

            {formPaiementManuel.methode !== 'especes' && (
              <>
                <label style={s.label}>Référence de transaction (optionnel)</label>
                <input
                  style={s.input}
                  type="text"
                  placeholder="Ex: numéro de la transaction mobile money"
                  value={formPaiementManuel.reference_transaction}
                  onChange={e => setFormPaiementManuel({ ...formPaiementManuel, reference_transaction: e.target.value })}
                />
              </>
            )}

            {erreurPaiementManuel && <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '10px' }}>{erreurPaiementManuel}</p>}

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button style={s.btnAnnuler} onClick={() => setModalPaiementManuel(null)} disabled={envoiPaiementManuel}>Annuler</button>
              <button style={s.btnValider} onClick={enregistrerPaiementManuel} disabled={envoiPaiementManuel}>
                {envoiPaiementManuel ? 'Enregistrement...' : '✅ Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal intervention */}
      {modalIntervention && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h3 style={s.modalTitre}>📝 Enregistrer une intervention</h3>
            <p style={s.modalSous}>{modalIntervention.locataire_nom} · {modalIntervention.adresse}</p>
            <p style={{ color: '#ef4444', fontWeight: '700', fontSize: '16px', marginBottom: '20px' }}>
              {formaterMontant(modalIntervention.montant_du)} en retard
            </p>

            <label style={s.label}>Type d'intervention</label>
            <select style={s.input} value={form.type_action} onChange={e => setForm({ ...form, type_action: e.target.value })}>
              {TYPES_ACTION.map(t => (
                <option key={t} value={t} style={s.option}>{t.replace('_', ' ').charAt(0).toUpperCase() + t.replace('_', ' ').slice(1)}</option>
              ))}
            </select>

            <label style={s.label}>Résultat</label>
            <select style={s.input} value={form.resultat} onChange={e => setForm({ ...form, resultat: e.target.value })}>
              {RESULTATS.map(r => (
                <option key={r} value={r} style={s.option}>{RESULTAT_LABELS[r]?.label || r}</option>
              ))}
            </select>

            <label style={s.label}>Notes (optionnel)</label>
            <textarea
              style={{ ...s.input, height: '80px', resize: 'vertical' }}
              placeholder="Détails de l'intervention..."
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
            />

            {erreur && <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '8px' }}>{erreur}</p>}

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button style={s.btnAnnuler} onClick={() => setModalIntervention(null)}>Annuler</button>
              <button style={s.btnValider} onClick={enregistrerIntervention} disabled={envoi}>
                {envoi ? 'Enregistrement...' : '✅ Enregistrer'}
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
  navLogo: { color: '#e2e8f0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' },
  navBenin: { color: '#f59e0b' },
  agentBadge: { background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#000', fontSize: '11px', padding: '3px 10px', borderRadius: '20px', fontWeight: '800' },
  navMenu: { display: 'flex', gap: '8px', alignItems: 'center' },
  navBtn: { background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af', cursor: 'pointer', padding: '7px 12px', borderRadius: '6px', fontSize: '13px' },
  navBtnActif: { background: 'rgba(124,58,237,0.2)', border: '1px solid #7c3aed', color: '#c4b5fd', fontWeight: '600' },
  navBtnProfil: { background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa', cursor: 'pointer', padding: '7px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '600' },
  navDeconnexion: { background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', cursor: 'pointer', padding: '7px 12px', borderRadius: '6px', fontSize: '13px' },
  contenu: { padding: '28px 24px', maxWidth: '1100px', margin: '0 auto' },
  entete: { marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' },
  soldeBox: { background: 'linear-gradient(135deg,rgba(16,185,129,0.12),rgba(5,150,105,0.06))', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', padding: '12px 18px', textAlign: 'right' },
  soldeLabel: { margin: 0, color: '#9ca3af', fontSize: '11px', fontWeight: '600' },
  soldeValeur: { margin: '2px 0 8px', color: '#10b981', fontSize: '18px', fontWeight: '800' },
  btnRecharger: { background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', color: '#10b981', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
  btnPayer: { background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 18px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  btnPaiementManuel: { background: 'transparent', color: '#10b981', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '8px', padding: '10px 18px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  titre: { margin: 0, fontSize: '26px', fontWeight: '800', background: 'linear-gradient(135deg,#c4b5fd,#f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  sousTitre: { color: '#6b7280', margin: '4px 0 0', fontSize: '14px' },
  succes: { background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '28px' },
  statCard: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px', textAlign: 'center' },
  statIcone: { fontSize: '28px', marginBottom: '8px' },
  statVal: { fontSize: '32px', fontWeight: '800', marginBottom: '4px' },
  statLabel: { fontSize: '13px', color: '#6b7280' },
  sectionTitre: { color: '#a78bfa', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 12px' },
  vide: { textAlign: 'center', color: '#6b7280', padding: '60px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' },
  impayeCard: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '12px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' },
  impayeInfo: { flex: 1 },
  impayeEntete: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' },
  locataireNom: { fontWeight: '700', fontSize: '16px', color: '#e2e8f0' },
  retardBadge: { padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' },
  impayeDetail: { color: '#9ca3af', fontSize: '13px', marginBottom: '4px' },
  impayeDroite: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' },
  montantImpaye: { color: '#ef4444', fontWeight: '800', fontSize: '20px' },
  btnIntervenir: { background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 18px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  tableau: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden', overflowX: 'auto' },
  tableauEntete: { display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.5fr 1fr 2fr', minWidth: '640px', padding: '12px 20px', background: 'rgba(124,58,237,0.1)', fontSize: '11px', fontWeight: '700', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.5px' },
  tableauLigne: { display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.5fr 1fr 2fr', minWidth: '640px', padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '13px', alignItems: 'center' },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#0f0a1e', border: '1px solid rgba(124,58,237,0.4)', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '460px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' },
  modalTitre: { margin: '0 0 4px', color: '#c4b5fd', fontSize: '20px', fontWeight: '700' },
  modalSous: { color: '#9ca3af', fontSize: '14px', marginBottom: '4px' },
  label: { fontSize: '12px', fontWeight: '600', color: '#9ca3af', display: 'block', marginBottom: '4px', marginTop: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', padding: '10px 12px', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' },
  option: { background: '#0f0a1e', color: '#e2e8f0' },
  btnAnnuler: { background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', cursor: 'pointer', flex: 1 },
  btnValider: { background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', flex: 1 },
};
