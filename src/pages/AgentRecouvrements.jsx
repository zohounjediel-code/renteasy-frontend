import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import ClocheNotifications from '../components/ClocheNotifications';
import { useAuth } from '../context/AuthContext';

const TYPES_ACTION = ['appel', 'visite', 'mise_en_demeure', 'autre'];
const RESULTATS = ['promesse_paiement', 'paiement_partiel', 'refus', 'absent', 'paiement_complet'];

const RESULTAT_LABELS = {
  promesse_paiement: { label: '🤝 Promesse de paiement', cls: 'text-accent-600' },
  paiement_partiel: { label: '⚡ Paiement partiel', cls: 'text-cyan-600' },
  refus: { label: '❌ Refus', cls: 'text-red-600' },
  absent: { label: '🚪 Absent', cls: 'text-slate-500' },
  paiement_complet: { label: '✅ Paiement complet', cls: 'text-emerald-600' },
};

const champLabel = 'mt-3.5 mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500';
const champInput = 'w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30';
const overlay = 'fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/50 p-5 backdrop-blur-sm';
const modal = 'w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-7 shadow-2xl';
const btnAnnuler = 'flex-1 rounded-xl border border-slate-200 px-5 py-2.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-60';
const btnValider = 'flex-1 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60';

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
    <div className="min-h-screen bg-slate-50">
      <nav className="re-nav sticky top-0 z-[100] flex h-[60px] items-center justify-between border-b border-slate-100 bg-white/95 px-6 backdrop-blur">
        <div className="flex items-center gap-2 text-lg text-slate-900">
          ⚡ <strong>RentEasy</strong> <span className="text-accent-600">Bénin</span>
          <span className="rounded-full bg-accent-500 px-2.5 py-0.5 text-[11px] font-extrabold text-white">Agent</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50" onClick={() => navigate('/agent/dashboard')}>Tableau de bord</button>
          <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50" onClick={() => navigate('/agent/demandes')}>Demandes</button>
          <button className="rounded-lg border border-brand-600 bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700">Recouvrements</button>
          <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50" onClick={() => navigate('/agent/proprietaires')}>Mes propriétaires</button>
          <button className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700 hover:bg-brand-100" onClick={() => navigate('/profil')}>👤 Mon profil</button>
          <ClocheNotifications />
          <button className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50" onClick={deconnecter}>Déconnexion</button>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-6 py-7">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Recouvrement terrain</h2>
            <p className="mt-1 text-sm text-slate-500">{impayes.length} échéance(s) impayée(s) à traiter</p>
          </div>
          <div className="rounded-2xl border border-brand-200 bg-brand-50 px-5 py-3 text-right">
            <p className="m-0 text-[11px] font-semibold text-slate-500">💰 Mon solde</p>
            <p className="mb-2 mt-0.5 text-lg font-extrabold text-brand-700">{soldeAgent.toLocaleString('fr-FR')} FCFA</p>
            <button className="rounded-lg border border-brand-300 bg-white px-3 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100" onClick={() => navigate('/profil')}>+ Recharger</button>
          </div>
        </div>

        {succes && <div className="mb-4 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">{succes}</div>}

        {/* Stats rapides */}
        <div className="mb-7 grid grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 text-center shadow-card">
            <div className="mb-2 text-2xl">⚠️</div>
            <div className="mb-1 text-3xl font-extrabold text-red-600">{impayes.length}</div>
            <div className="text-[13px] text-slate-400">Impayés à traiter</div>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-5 text-center shadow-card">
            <div className="mb-2 text-2xl">📋</div>
            <div className="mb-1 text-3xl font-extrabold text-brand-700">{recouvrements.length}</div>
            <div className="text-[13px] text-slate-400">Interventions totales</div>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-5 text-center shadow-card">
            <div className="mb-2 text-2xl">✅</div>
            <div className="mb-1 text-3xl font-extrabold text-emerald-600">
              {recouvrements.filter(r => r.resultat === 'paiement_complet').length}
            </div>
            <div className="text-[13px] text-slate-400">Paiements obtenus</div>
          </div>
        </div>

        {/* Liste des impayés */}
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-brand-700">📋 Échéances à recouvrer</p>

        {chargement ? (
          <p className="py-10 text-center text-slate-400">Chargement...</p>
        ) : impayes.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-14 text-center text-slate-400 shadow-card">
            <p className="mb-2 text-3xl">🎉</p>
            <p>Aucune échéance impayée en retard !</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {impayes.map(e => {
              const retard = joursRetard(e.date_limite);
              return (
                <div key={e.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-red-100 bg-white p-5 shadow-card">
                  <div className="flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-3">
                      <span className="text-base font-bold text-slate-900">{e.locataire_nom}</span>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${retard > 30 ? 'bg-red-50 text-red-600' : 'bg-accent-50 text-accent-700'}`}>
                        {retard} jour(s) de retard
                      </span>
                    </div>
                    <div className="mb-1 text-[13px] text-slate-500">📍 {e.adresse}, {e.ville}</div>
                    <div className="mb-1 text-[13px] text-slate-500">📞 {e.locataire_telephone}</div>
                    <div className="mb-1 text-[13px] text-slate-500">📅 Échéance : {formaterDate(e.date_limite)}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2.5">
                    <div className="text-xl font-extrabold text-red-600">{formaterMontant(e.montant_du)}</div>
                    <button className="rounded-xl bg-brand-600 px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-brand-700" onClick={() => ouvrirModalPaiement(e)}>
                      💰 Payer avec mon solde
                    </button>
                    <button className="rounded-xl border border-brand-300 px-4 py-2.5 text-[13px] font-semibold text-brand-700 hover:bg-brand-50" onClick={() => ouvrirModalPaiementManuel(e)}>
                      ✅ Enregistrer un paiement reçu
                    </button>
                    <button className="rounded-xl bg-accent-500 px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-accent-600" onClick={() => { setModalIntervention(e); setErreur(''); }}>
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
            <p className="mb-3 mt-8 text-xs font-bold uppercase tracking-wide text-brand-700">📜 Historique des interventions</p>
            <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-card">
              <div className="grid min-w-[640px] grid-cols-[1.5fr_1fr_1.5fr_1fr_2fr] bg-slate-50 px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                <span>Locataire</span>
                <span>Type</span>
                <span>Résultat</span>
                <span>Date</span>
                <span>Notes</span>
              </div>
              {recouvrements.slice(0, 20).map(r => {
                const res = RESULTAT_LABELS[r.resultat] || { label: r.resultat, cls: 'text-slate-500' };
                return (
                  <div key={r.id} className="grid min-w-[640px] grid-cols-[1.5fr_1fr_1.5fr_1fr_2fr] items-center border-t border-slate-50 px-5 py-3 text-[13px]">
                    <span className="font-semibold text-slate-800">{r.locataire_nom || '—'}</span>
                    <span className="capitalize text-slate-400">{r.type_action?.replace('_', ' ')}</span>
                    <span className={`text-[13px] font-semibold ${res.cls}`}>{res.label}</span>
                    <span className="text-[13px] text-slate-400">{formaterDate(r.date_intervention || r.created_at)}</span>
                    <span className="text-xs text-slate-400">{r.notes || '—'}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Modal paiement avec le solde de l'agent */}
      {modalPaiement && (
        <div className={overlay}>
          <div className={modal}>
            <h3 className="mb-1 text-xl font-bold text-slate-900">💰 Payer avec mon solde</h3>
            <p className="mb-1 text-sm text-slate-400">{modalPaiement.locataire_nom} · {modalPaiement.adresse}</p>
            <p className="mb-2 text-base font-bold text-red-600">
              {formaterMontant(modalPaiement.montant_du)} dû
            </p>
            <p className="mb-4 text-xs text-slate-400">
              À utiliser si vous avez déjà encaissé cet argent (espèces, etc.) sur le terrain. Le montant sera
              débité de <strong className="text-brand-700">votre</strong> solde RentEasy et crédité au propriétaire.
            </p>

            <label className={champLabel}>Montant à payer (FCFA)</label>
            <input
              className={champInput}
              type="number"
              min="1"
              max={modalPaiement.montant_du}
              value={montantPaiement}
              onChange={e => setMontantPaiement(e.target.value)}
            />
            <p className="mt-1.5 text-[11px] text-slate-400">
              Laissez le montant complet pour un paiement total, ou réduisez-le pour un paiement en tranche.
            </p>
            <p className="mt-2.5 text-xs text-slate-500">
              Votre solde disponible : <strong>{soldeAgent.toLocaleString('fr-FR')} FCFA</strong>
            </p>

            {erreurPaiement && <p className="mt-2.5 text-[13px] text-red-600">{erreurPaiement}</p>}

            <div className="mt-5 flex gap-3">
              <button className={btnAnnuler} onClick={() => setModalPaiement(null)} disabled={envoiPaiement}>Annuler</button>
              <button className={btnValider} onClick={payerAvecSolde} disabled={envoiPaiement}>
                {envoiPaiement ? 'Paiement...' : '💰 Confirmer le paiement'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal enregistrement manuel d'un paiement déjà reçu (espèces, virement, mobile money confirmé à la main) */}
      {modalPaiementManuel && (
        <div className={overlay}>
          <div className={modal}>
            <h3 className="mb-1 text-xl font-bold text-slate-900">✅ Enregistrer un paiement reçu</h3>
            <p className="mb-1 text-sm text-slate-400">{modalPaiementManuel.locataire_nom} · {modalPaiementManuel.adresse}</p>
            <p className="mb-2 text-base font-bold text-red-600">
              {formaterMontant(modalPaiementManuel.resteDu)} dû
              {modalPaiementManuel.statut === 'partielle' && (
                <span className="block text-[11px] font-normal text-slate-400">
                  reste sur {formaterMontant(modalPaiementManuel.montant_du)} — déjà partiellement réglé
                </span>
              )}
            </p>
            <p className="mb-4 text-xs text-slate-400">
              À utiliser quand le paiement est déjà arrivé par un autre moyen que le solde RentEasy
              (espèces, virement bancaire, ou mobile money confirmé directement avec le locataire). Aucun
              montant n'est débité de votre solde ici — vous déclarez simplement un paiement déjà reçu.
            </p>

            <label className={champLabel}>Montant reçu (FCFA)</label>
            <input
              className={champInput}
              type="number"
              min="1"
              max={modalPaiementManuel.resteDu}
              value={formPaiementManuel.montant}
              onChange={e => setFormPaiementManuel({ ...formPaiementManuel, montant: e.target.value })}
            />
            <p className="mt-1.5 text-[11px] text-slate-400">
              Laissez le montant complet pour un paiement total, ou réduisez-le pour un paiement en tranche.
            </p>

            <label className={champLabel}>Moyen de paiement</label>
            <select className={champInput} value={formPaiementManuel.methode} onChange={e => setFormPaiementManuel({ ...formPaiementManuel, methode: e.target.value })}>
              <option value="especes">💵 Espèces</option>
              <option value="virement">🏦 Virement bancaire</option>
              <option value="mtn_momo">📱 MTN Mobile Money</option>
              <option value="moov_money">📱 Moov Money</option>
            </select>

            {formPaiementManuel.methode !== 'especes' && (
              <>
                <label className={champLabel}>Référence de transaction (optionnel)</label>
                <input
                  className={champInput}
                  type="text"
                  placeholder="Ex: numéro de la transaction mobile money"
                  value={formPaiementManuel.reference_transaction}
                  onChange={e => setFormPaiementManuel({ ...formPaiementManuel, reference_transaction: e.target.value })}
                />
              </>
            )}

            {erreurPaiementManuel && <p className="mt-2.5 text-[13px] text-red-600">{erreurPaiementManuel}</p>}

            <div className="mt-5 flex gap-3">
              <button className={btnAnnuler} onClick={() => setModalPaiementManuel(null)} disabled={envoiPaiementManuel}>Annuler</button>
              <button className={btnValider} onClick={enregistrerPaiementManuel} disabled={envoiPaiementManuel}>
                {envoiPaiementManuel ? 'Enregistrement...' : '✅ Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal intervention */}
      {modalIntervention && (
        <div className={overlay}>
          <div className={modal}>
            <h3 className="mb-1 text-xl font-bold text-slate-900">📝 Enregistrer une intervention</h3>
            <p className="mb-1 text-sm text-slate-400">{modalIntervention.locataire_nom} · {modalIntervention.adresse}</p>
            <p className="mb-5 text-base font-bold text-red-600">
              {formaterMontant(modalIntervention.montant_du)} en retard
            </p>

            <label className={champLabel}>Type d'intervention</label>
            <select className={champInput} value={form.type_action} onChange={e => setForm({ ...form, type_action: e.target.value })}>
              {TYPES_ACTION.map(t => (
                <option key={t} value={t}>{t.replace('_', ' ').charAt(0).toUpperCase() + t.replace('_', ' ').slice(1)}</option>
              ))}
            </select>

            <label className={champLabel}>Résultat</label>
            <select className={champInput} value={form.resultat} onChange={e => setForm({ ...form, resultat: e.target.value })}>
              {RESULTATS.map(r => (
                <option key={r} value={r}>{RESULTAT_LABELS[r]?.label || r}</option>
              ))}
            </select>

            <label className={champLabel}>Notes (optionnel)</label>
            <textarea
              className={`${champInput} h-20 resize-y`}
              placeholder="Détails de l'intervention..."
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
            />

            {erreur && <p className="mt-2 text-[13px] text-red-600">{erreur}</p>}

            <div className="mt-5 flex gap-3">
              <button className={btnAnnuler} onClick={() => setModalIntervention(null)}>Annuler</button>
              <button className={btnValider} onClick={enregistrerIntervention} disabled={envoi}>
                {envoi ? 'Enregistrement...' : '✅ Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
