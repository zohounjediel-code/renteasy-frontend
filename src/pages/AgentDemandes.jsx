import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import ClocheNotifications from '../components/ClocheNotifications';
import { useAuth } from '../context/AuthContext';
import SignaturePad from '../components/SignaturePad';

const STATUT_COULEURS = {
  en_attente: { cls: 'bg-accent-50 text-accent-700', label: '⏳ En attente' },
  approuvee: { cls: 'bg-emerald-50 text-emerald-700', label: '✅ Approuvée' },
  annulee: { cls: 'bg-red-50 text-red-600', label: '❌ Annulée' },
};

const champLabel = 'mt-3 mb-1 block text-sm font-semibold text-slate-700';
const champInput = 'w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30';
const overlay = 'fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/50 p-5 backdrop-blur-sm';
const modal = 'w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-7 shadow-2xl';
const btnAnnulerModal = 'rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50';
const btnRefuser = 'flex-1 rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-60';
const btnValider = 'flex-1 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60';

export default function AgentDemandes() {
  const [demandes, setDemandes] = useState([]);
  const [demandesMarche, setDemandesMarche] = useState([]);
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
  const [modalApprobationMarche, setModalApprobationMarche] = useState(null);
  const [signatureApprobationMarche, setSignatureApprobationMarche] = useState(null);
  const [envoiApprobationMarche, setEnvoiApprobationMarche] = useState(false);
  const [erreurApprobationMarche, setErreurApprobationMarche] = useState('');
  const { deconnecter } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { chargerDemandes(); }, []);

  async function chargerDemandes() {
    try {
      const [rDemandes, rMarche] = await Promise.all([
        api.get('/demandes'),
        api.get('/agent/demandes-marche'),
      ]);
      setDemandes(rDemandes.data);
      setDemandesMarche(rMarche.data);
    } catch (e) {
      console.error(e);
    } finally {
      setChargement(false);
    }
  }

  async function approuverDemandeMarche() {
    setErreurApprobationMarche('');
    if (!signatureApprobationMarche) {
      setErreurApprobationMarche('Signez pour approuver cette demande');
      return;
    }
    setEnvoiApprobationMarche(true);
    try {
      await api.post(`/contrats/${modalApprobationMarche.id}/approuver`, { signature_proprietaire: signatureApprobationMarche });
      setSucces('Demande de location approuvée et signée. En attente de la signature du locataire.');
      setModalApprobationMarche(null);
      chargerDemandes();
    } catch (e) {
      setErreurApprobationMarche(e.response?.data?.message || "Erreur lors de l'approbation");
    } finally {
      setEnvoiApprobationMarche(false);
    }
  }

  async function refuserDemandeMarche(id) {
    if (!window.confirm('Refuser cette demande de location ?')) return;
    try {
      await api.post(`/contrats/${id}/refuser-demande`);
      setSucces('Demande de location refusée.');
      chargerDemandes();
    } catch (e) {
      alert(e.response?.data?.message || 'Erreur lors du refus');
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
    <div className="min-h-screen bg-brand-50">
      <nav className="re-nav sticky top-0 z-[100] flex h-[60px] items-center justify-between border-b border-slate-100 bg-white/95 px-6 backdrop-blur">
        <div className="flex items-center gap-2 text-lg text-slate-900">🏠 <strong>RentEasy</strong> <span className="text-accent-600">Bénin</span> <span className="rounded-full bg-accent-500 px-2.5 py-0.5 text-[11px] font-extrabold text-white">Agent</span></div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button className="whitespace-nowrap rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50" onClick={() => navigate('/agent/dashboard')}>Tableau de bord</button>
          <button className="whitespace-nowrap rounded-lg border border-brand-600 bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700">Demandes</button>
          <button className="whitespace-nowrap rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50" onClick={() => navigate('/agent/recouvrements')}>Recouvrements</button>
          <button className="whitespace-nowrap rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700 hover:bg-brand-100" onClick={() => navigate('/profil')}>👤 Mon profil</button>
          <button className="whitespace-nowrap rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50" onClick={deconnecter}>Déconnexion</button>
          <ClocheNotifications />
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-extrabold text-slate-900">Demandes de contrats</h2>
          <p className="mt-1 text-sm text-slate-500">{demandes.filter(d => d.statut === 'en_attente').length + demandesMarche.length} demande(s) en attente de traitement</p>
        </div>

        {succes && <div className="mb-4 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">{succes}</div>}

        {/* Demandes de location via le marché : type distinct des demandes_contrat ci-dessous
            (modification/résiliation) — un locataire a postulé directement sur un bien listé. */}
        {demandesMarche.length > 0 && (
          <div className="mb-6 rounded-2xl border border-purple-100 bg-gradient-to-b from-white to-purple-50/50 p-5 shadow-card">
            <h3 className="mb-3 text-base font-bold text-slate-900">📨 Demandes de location — marché ({demandesMarche.length})</h3>
            <div className="flex flex-col gap-2.5">
              {demandesMarche.map(d => (
                <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <div>
                    <div className="font-semibold text-slate-900">🔖 {d.numero_bien} <span className="font-mono text-xs font-normal text-slate-400">#{d.id.slice(0, 8)}</span></div>
                    <div className="text-xs text-slate-400">
                      {d.locataire_nom} ({d.locataire_telephone}) · {d.adresse}, {d.ville}
                    </div>
                    <div className="text-xs text-slate-400">
                      Propriétaire : {d.proprietaire_nom} · Du {new Date(d.date_debut).toLocaleDateString('fr-FR')}{d.date_fin ? ` au ${new Date(d.date_fin).toLocaleDateString('fr-FR')}` : ' (durée indéterminée)'} · {parseInt(d.loyer_mensuel).toLocaleString('fr-FR')} FCFA
                    </div>
                    {!d.autorise_agent_gestion && (
                      <div className="mt-1.5 text-xs font-semibold text-accent-700">
                        ⚠️ Délégation non activée par ce propriétaire — vous ne pouvez pas traiter cette demande à sa place, seulement la consulter.
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50" onClick={() => navigate(`/agent/proprietaires/${d.proprietaire_id}`)}>👁️ Voir le propriétaire</button>
                    {d.autorise_agent_gestion && (
                      <>
                        <button className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-100" onClick={() => refuserDemandeMarche(d.id)}>✕ Refuser</button>
                        <button className="rounded-lg bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-700" onClick={() => { setModalApprobationMarche(d); setSignatureApprobationMarche(null); setErreurApprobationMarche(''); }}>✍️ Approuver et signer</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filtres */}
        <div className="mb-5 flex flex-wrap gap-2">
          {['en_attente', 'approuvee', 'annulee', 'toutes'].map(f => (
            <button
              key={f}
              className={`rounded-full border-[1.5px] px-4 py-1.5 text-[13px] font-medium ${filtre === f ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 bg-white text-slate-600'}`}
              onClick={() => setFiltre(f)}
            >
              {f === 'toutes' ? 'Toutes' : STATUT_COULEURS[f]?.label || f}
            </button>
          ))}
        </div>

        {/* Liste des demandes */}
        {chargement ? (
          <p className="py-10 text-center text-slate-400">Chargement...</p>
        ) : demandesFiltrees.length === 0 ? (
          <div className="rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 p-10 text-center text-slate-400 shadow-card">
            <p>✅ Aucune demande {filtre === 'en_attente' ? 'en attente' : ''}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {demandesFiltrees.map(d => {
              const st = STATUT_COULEURS[d.statut] || { cls: 'bg-slate-100 text-slate-500', label: d.statut };
              const conditions = d.conditions_demandees || {};
              return (
                <div key={d.id} className="rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 p-5 shadow-card">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className={`rounded-full px-3 py-1 text-[13px] font-bold ${
                        d.type_demande === 'modification' ? 'bg-blue-50 text-blue-700' : d.type_demande === 'fin_contrat' ? 'bg-accent-50 text-accent-700' : 'bg-red-50 text-red-600'
                      }`}>
                        {d.type_demande === 'modification' ? '✏️ Modification' : d.type_demande === 'fin_contrat' ? '🔚 Fin de contrat' : '🔴 Résiliation'}
                      </span>
                      {d.initiee_par === 'locataire' && (
                        <span className="ml-1.5 rounded-full bg-purple-50 px-3 py-1 text-[13px] font-bold text-purple-700">
                          👤 Initiée par le locataire
                        </span>
                      )}
                      {d.initiee_par === 'systeme' && (
                        <span className="ml-1.5 rounded-full bg-slate-100 px-3 py-1 text-[13px] font-bold text-slate-500">
                          ⚙️ Générée automatiquement
                        </span>
                      )}
                      {d.escaladee && (
                        <span className="ml-1.5 rounded-full bg-red-50 px-3 py-1 text-[13px] font-bold text-red-600">
                          🚨 Bloquée depuis plus de 3 jours
                        </span>
                      )}
                      <span className={`ml-2 rounded-full px-2.5 py-1 text-xs font-semibold ${st.cls}`}>
                        {st.label}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">{formaterDate(d.created_at)}</span>
                  </div>

                  <div className="mb-3 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-brand-700">👤 Propriétaire</p>
                      <p className="m-0 mb-0.5 text-sm font-semibold text-slate-800">{d.proprietaire_nom}</p>
                      <p className="m-0 text-xs text-slate-400">{d.proprietaire_email}</p>
                      <p className="m-0 text-xs text-slate-400">{d.proprietaire_telephone}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-brand-700">🏠 Bien concerné</p>
                      <p className="m-0 mb-0.5 text-sm font-semibold text-slate-800">{d.adresse}, {d.ville}</p>
                      <p className="m-0 text-xs text-slate-400">{d.type_bien}</p>
                      <p className="m-0 font-mono text-[11px] text-slate-300">Contrat #{d.contrat_id.slice(0, 8)}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-brand-700">👥 Locataire</p>
                      <p className="m-0 mb-0.5 text-sm font-semibold text-slate-800">{d.locataire_nom}</p>
                      <p className="m-0 text-xs text-slate-400">{d.locataire_telephone}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-brand-700">💰 Contrat actuel</p>
                      <p className="m-0 mb-0.5 text-sm font-semibold text-slate-800">{formaterMontant(d.loyer_mensuel)} / mois</p>
                      {conditions.loyer_mensuel && (
                        <p className="text-[13px] font-semibold text-accent-600">
                          → Nouveau loyer demandé : {formaterMontant(conditions.loyer_mensuel)}
                        </p>
                      )}
                    </div>
                  </div>

                  {d.note_proprietaire && (
                    <div className="mt-2 rounded-lg bg-amber-50 px-3.5 py-2.5 text-[13px] text-amber-800">
                      <strong>Note du propriétaire :</strong> {d.note_proprietaire}
                    </div>
                  )}

                  {d.note_agent && (
                    <div className="mt-2 rounded-lg bg-emerald-50 px-3.5 py-2.5 text-[13px] text-emerald-800">
                      <strong>Note de l'agent :</strong> {d.note_agent}
                    </div>
                  )}

                  {d.statut === 'en_attente' && (
                    <div className="mt-4 flex gap-3">
                      {d.type_demande === 'fin_contrat' ? (
                        <>
                          <button className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700" onClick={() => validerFinResiliation(d.id)}>
                            ✅ Valider la résiliation
                          </button>
                          <button className="rounded-xl bg-accent-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-600" onClick={() => { setModalRenouvellement(d); setDureeRenouvellement(''); setUniteRenouvellement('mois'); setErreur(''); }}>
                            🔄 Renouveler
                          </button>
                        </>
                      ) : (
                        <button className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700" onClick={() => { setModalTraitement(d); setNoteAgent(''); setErreur(''); }}>
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
        <div className={overlay}>
          <div className={modal}>
            <h3 className="mb-1 text-xl font-bold text-slate-900">Traiter la demande</h3>
            <p className="mb-4 text-sm text-slate-400">
              {modalTraitement.type_demande === 'modification' ? '✏️ Modification' : '🔴 Résiliation'} · {modalTraitement.proprietaire_nom}
            </p>

            <div className="mb-4 rounded-xl bg-slate-50 p-3.5">
              <p className="mb-1 text-[13px] font-semibold text-brand-700">Demande :</p>
              <p className="m-0 text-sm text-slate-700">
                {modalTraitement.type_demande === 'resiliation'
                  ? `Résiliation du contrat pour ${modalTraitement.locataire_nom} au ${modalTraitement.adresse}`
                  : `Modification du loyer${modalTraitement.conditions_demandees?.loyer_mensuel ? ` → ${formaterMontant(modalTraitement.conditions_demandees.loyer_mensuel)}` : ''}`
                }
              </p>
              {modalTraitement.note_proprietaire && (
                <p className="mt-2 text-[13px] italic text-slate-400">
                  "{modalTraitement.note_proprietaire}"
                </p>
              )}
            </div>

            <label className={champLabel}>Note pour le propriétaire (optionnel)</label>
            <textarea
              className={`${champInput} h-20 resize-y`}
              placeholder="Expliquez votre décision..."
              value={noteAgent}
              onChange={e => setNoteAgent(e.target.value)}
            />

            {erreur && <p className="mt-2 text-[13px] text-red-600">{erreur}</p>}

            <div className="mt-4 flex gap-3">
              <button className={btnAnnulerModal} onClick={() => setModalTraitement(null)}>Fermer</button>
              <button className={btnRefuser} onClick={() => traiterDemande('annuler')} disabled={envoi}>
                ❌ Annuler la demande
              </button>
              <button className={btnValider} onClick={() => traiterDemande('approuver')} disabled={envoi}>
                {envoi ? 'Traitement...' : '✅ Approuver'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalRenouvellement && (
        <div className={overlay}>
          <div className={modal}>
            <h3 className="mb-1 text-xl font-bold text-slate-900">🔄 Renouveler le contrat</h3>
            <p className="mb-4 text-[13px] text-slate-400">
              🔖 {modalRenouvellement.numero_bien} · {modalRenouvellement.proprietaire_nom}
            </p>
            <p className="mb-3 text-[13px] text-slate-500">
              Confirmez d'abord l'accord entre le propriétaire et le locataire, puis précisez la durée de prolongation.
            </p>

            <label className={champLabel}>Durée de renouvellement *</label>
            <div className="flex gap-2">
              <input className={`${champInput} flex-1`} type="number" min="1" placeholder="Ex: 12" value={dureeRenouvellement} onChange={e => setDureeRenouvellement(e.target.value)} />
              <select className={`${champInput} flex-1`} value={uniteRenouvellement} onChange={e => setUniteRenouvellement(e.target.value)}>
                <option value="jours">Jour(s)</option>
                <option value="semaines">Semaine(s)</option>
                <option value="mois">Mois</option>
                <option value="annees">Année(s)</option>
              </select>
            </div>

            {erreur && <p className="mt-2 text-[13px] text-red-600">{erreur}</p>}

            <div className="mt-5 flex gap-3">
              <button className={btnAnnulerModal} onClick={() => setModalRenouvellement(null)}>Annuler</button>
              <button className={btnValider} onClick={soumettreRenouvellement} disabled={envoiRenouvellement}>
                {envoiRenouvellement ? 'Renouvellement...' : '🔄 Confirmer le renouvellement'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalApprobationMarche && (
        <div className={overlay}>
          <div className={modal}>
            <h3 className="mb-1 text-xl font-bold text-slate-900">✍️ Approuver la demande de location</h3>
            <p className="mb-4 text-[13px] text-slate-400">
              🔖 {modalApprobationMarche.numero_bien} — {modalApprobationMarche.locataire_nom} · pour {modalApprobationMarche.proprietaire_nom} · du {new Date(modalApprobationMarche.date_debut).toLocaleDateString('fr-FR')}
              {modalApprobationMarche.date_fin ? ` au ${new Date(modalApprobationMarche.date_fin).toLocaleDateString('fr-FR')}` : ' (durée indéterminée)'}
            </p>
            <p className="mb-3 text-[13px] text-slate-700">{parseInt(modalApprobationMarche.loyer_mensuel).toLocaleString('fr-FR')} FCFA / mois</p>
            <p className="mb-3 text-[13px] text-slate-500">
              En signant, vous approuvez cette demande au nom du propriétaire (délégation activée). Le locataire devra ensuite signer à son tour pour valider officiellement le contrat.
            </p>
            <SignaturePad onChange={setSignatureApprobationMarche} />
            {erreurApprobationMarche && <p className="mt-2 text-[13px] text-red-600">{erreurApprobationMarche}</p>}
            <div className="mt-5 flex gap-3">
              <button className={btnAnnulerModal} onClick={() => setModalApprobationMarche(null)}>Annuler</button>
              <button className={btnValider} onClick={approuverDemandeMarche} disabled={envoiApprobationMarche}>
                {envoiApprobationMarche ? 'Envoi...' : '✍️ Signer et approuver'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
