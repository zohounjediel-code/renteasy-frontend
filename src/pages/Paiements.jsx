import { useEffect, useState, useRef } from 'react';
import ClocheNotifications from '../components/ClocheNotifications';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

const STATUT_COULEURS = {
  payee: { cls: 'bg-emerald-50 text-emerald-700', label: '✅ Payée' },
  en_attente: { cls: 'bg-accent-50 text-accent-700', label: '⏳ En attente' },
  impayee: { cls: 'bg-red-50 text-red-600', label: '❌ Impayée' },
  partielle: { cls: 'bg-blue-50 text-blue-700', label: '⚡ Partielle' },
  en_recouvrement: { cls: 'bg-purple-50 text-purple-700', label: '🔄 En recouvrement' },
};

const OPERATEURS_MOBILE_MONEY = [
  { value: 'mtn_momo', label: '📱 MTN Mobile Money' },
  { value: 'moov_money', label: '📱 Moov Money' },
  { value: 'celtiis_pay', label: '📱 Celtiis Pay' },
];

export default function Paiements() {
  const [echeances, setEcheances] = useState([]);
  const [contrats, setContrats] = useState([]);
  const [filtre, setFiltre] = useState('tous');
  const [chargement, setChargement] = useState(true);
  const [modalMobileMoney, setModalMobileMoney] = useState(null); // échéance ciblée
  const [methodeMobileMoney, setMethodeMobileMoney] = useState('mtn_momo');
  const [telephoneMobileMoney, setTelephoneMobileMoney] = useState('');
  const [statutDemande, setStatutDemande] = useState(null); // null | 'envoi' | 'attente' | 'echec'
  const [erreurMobileMoney, setErreurMobileMoney] = useState('');
  const [referenceEnCours, setReferenceEnCours] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { utilisateur } = useAuth();
  const estAussiLocataire = (utilisateur?.role || '').includes('locataire');

  // Un admin/super_admin peut consulter les paiements d'un propriétaire précis via
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

  useEffect(() => { chargerDonnees(); }, [proprietaireIdConsulte]);

  const intervalPollingRef = useRef(null);
  const tentativesPollingRef = useRef(0);

  // Le locataire confirme sur son téléphone, hors de l'app — on ne sait donc pas quand ça arrive
  // et on interroge le statut périodiquement le temps que la fenêtre reste ouverte. Le job
  // périodique côté serveur (verifierPaiementsMobileEnCoursPeriodique) prend le relais si la
  // personne ferme la fenêtre avant confirmation, donc pas besoin de polling indéfini ici.
  useEffect(() => {
    if (!referenceEnCours) return;
    tentativesPollingRef.current = 0;

    intervalPollingRef.current = setInterval(async () => {
      tentativesPollingRef.current += 1;
      try {
        const r = await api.get(`/mobilemoney/statut/${referenceEnCours}`, { params: { methode: methodeMobileMoney } });
        if (r.data.statut === 'SUCCESSFUL') {
          clearInterval(intervalPollingRef.current);
          setReferenceEnCours(null);
          setModalMobileMoney(null);
          setStatutDemande(null);
          chargerDonnees();
        } else if (r.data.statut === 'FAILED') {
          clearInterval(intervalPollingRef.current);
          setReferenceEnCours(null);
          setStatutDemande('echec');
          setErreurMobileMoney('Le paiement a été refusé ou annulé côté opérateur.');
        } else if (tentativesPollingRef.current >= 40) { // ~2 minutes à 3s d'intervalle
          clearInterval(intervalPollingRef.current);
          setReferenceEnCours(null);
          setStatutDemande('echec');
          setErreurMobileMoney("Toujours en attente de confirmation. Si le locataire valide plus tard, l'échéance se mettra à jour automatiquement.");
        }
      } catch (e) {
        console.error(e);
      }
    }, 3000);

    return () => clearInterval(intervalPollingRef.current);
  }, [referenceEnCours, methodeMobileMoney]);

  function ouvrirModalMobileMoney(echeance) {
    setModalMobileMoney(echeance);
    setMethodeMobileMoney('mtn_momo');
    setTelephoneMobileMoney(echeance.locataire_telephone || '');
    setStatutDemande(null);
    setErreurMobileMoney('');
    setReferenceEnCours(null);
  }

  function fermerModalMobileMoney() {
    clearInterval(intervalPollingRef.current);
    setModalMobileMoney(null);
    setReferenceEnCours(null);
  }

  async function envoyerDemandeMobileMoney() {
    if (!telephoneMobileMoney.trim()) {
      setErreurMobileMoney('Le numéro de téléphone du locataire est requis');
      return;
    }
    setStatutDemande('envoi');
    setErreurMobileMoney('');
    try {
      // Timeout dédié : l'appel à l'opérateur (MTN/Moov/Celtiis) peut rester bloqué en silence
      // côté serveur si son API ne répond pas — sans ça, le propriétaire resterait indéfiniment
      // sur "Envoi..." sans le moindre message d'erreur.
      const r = await api.post('/mobilemoney/initier', {
        echeance_id: modalMobileMoney.id,
        methode: methodeMobileMoney,
        telephone_payeur: telephoneMobileMoney.trim(),
      }, { timeout: 25000 });
      setReferenceEnCours(r.data.reference_transaction);
      setStatutDemande('attente');
    } catch (e) {
      setStatutDemande('echec');
      setErreurMobileMoney(
        e.code === 'ECONNABORTED'
          ? "L'opérateur met du temps à répondre. Réessayez dans quelques instants."
          : e.response?.data?.message || "Erreur lors de l'envoi de la demande"
      );
    }
  }

  async function chargerDonnees() {
    try {
      const params = enConsultationAdmin ? { proprietaire_id: proprietaireIdConsulte } : {};
      const r = await api.get('/contrats', { params });
      setContrats(r.data);
      // Récupère toutes les échéances de tous les contrats (obtenirContrat autorise déjà
      // admin/super_admin sur n'importe quel contrat, sans besoin de proprietaire_id ici)
      const echeancesPromises = r.data.map(c => api.get(`/contrats/${c.id}`));
      const resultats = await Promise.all(echeancesPromises);
      const toutesEcheances = resultats.flatMap(r =>
        r.data.echeances.map(e => ({
          ...e,
          adresse: r.data.adresse,
          locataire_nom: r.data.locataire_nom,
          locataire_telephone: r.data.locataire_telephone,
        }))
      );
      toutesEcheances.sort((a, b) => new Date(a.mois_concerne) - new Date(b.mois_concerne));
      setEcheances(toutesEcheances);
    } catch (e) {
      console.error(e);
    } finally {
      setChargement(false);
    }
  }

  function formaterMontant(n) {
    return parseInt(n).toLocaleString('fr-FR') + ' FCFA';
  }

  function formaterDate(d) {
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  const maintenant = new Date();
  const moisCourantDebut = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
  const moisCourantFin = new Date(maintenant.getFullYear(), maintenant.getMonth() + 1, 0, 23, 59, 59);

  function estMoisCourant(dateStr) {
    const d = new Date(dateStr);
    return d >= moisCourantDebut && d <= moisCourantFin;
  }
  function estMoisCourantOuPasse(dateStr) {
    return new Date(dateStr) <= moisCourantFin;
  }

  const echeancesFiltrees = echeances.filter(e => {
    if (filtre === 'impayee' || filtre === 'partielle' || filtre === 'en_recouvrement') {
      return e.statut === filtre && estMoisCourantOuPasse(e.mois_concerne);
    }
    if (filtre === 'tous') return estMoisCourant(e.mois_concerne);
    return e.statut === filtre && estMoisCourant(e.mois_concerne);
  });

  return (
    <div className="min-h-screen bg-brand-50">
      <nav className="re-nav sticky top-0 z-[100] flex h-[60px] items-center justify-between border-b border-slate-100 bg-white/95 px-6 backdrop-blur">
        <div className="cursor-pointer text-lg text-slate-900" onClick={() => navigate(lienConsultation('/dashboard'))}>🏠 <strong>RentEasy</strong> <span className="text-accent-600">Bénin</span></div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button className="whitespace-nowrap rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50" onClick={() => navigate(lienConsultation('/biens'))}>Mes biens</button>
          <button className="whitespace-nowrap rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50" onClick={() => navigate(lienConsultation('/locataires'))}>Locataires</button>
          <button className="whitespace-nowrap rounded-lg border border-brand-600 bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700">Paiements</button>
          {estAussiLocataire && !enConsultationAdmin && (
            <button className="whitespace-nowrap rounded-lg bg-accent-500 px-3 py-1.5 text-sm font-bold text-white hover:bg-accent-600" onClick={() => navigate('/locataire/dashboard')}>🔄 Espace locataire</button>
          )}
          <button className="whitespace-nowrap rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700 hover:bg-brand-100" onClick={() => navigate('/profil')}>👤 Mon profil</button>
          <button className="whitespace-nowrap rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50" onClick={() => navigate(lienConsultation('/dashboard'))}>Dashboard</button>
          <ClocheNotifications />
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-6">
        {enConsultationAdmin && (
          <div className="mb-5 rounded-xl border border-accent-200 bg-accent-50 px-4 py-2.5 text-sm text-accent-800">
            🛡️ Vous consultez le compte de <strong>{proprietaireNomConsulte || 'ce propriétaire'}</strong> en tant qu'administrateur.
          </div>
        )}
        <div className="mb-6">
          <h2 className="text-2xl font-extrabold text-slate-900">Échéances &amp; Paiements</h2>
        </div>

        {/* Filtres */}
        <div className="mb-4 flex flex-wrap gap-2">
          {['tous', 'en_attente', 'payee', 'impayee', 'partielle', 'en_recouvrement'].map(f => (
            <button
              key={f}
              className={`rounded-full border-[1.5px] px-4 py-1.5 text-[13px] font-medium ${filtre === f ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 bg-white text-slate-600'}`}
              onClick={() => setFiltre(f)}
            >
              {f === 'tous' ? 'Toutes' : STATUT_COULEURS[f]?.label || f}
            </button>
          ))}
        </div>
        <p className="-mt-2 mb-4 text-xs text-slate-400">
          {filtre === 'impayee' || filtre === 'partielle' || filtre === 'en_recouvrement'
            ? 'Échéances de cette catégorie, mois en cours et passés.'
            : 'Échéances du mois en cours uniquement.'}
        </p>

        {/* Liste des échéances */}
        {chargement ? (
          <p className="py-10 text-center text-slate-400">Chargement...</p>
        ) : echeancesFiltrees.length === 0 ? (
          <div className="rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 p-10 text-center text-slate-400 shadow-card">
            <p>Aucune échéance trouvée pour ce filtre.</p>
          </div>
        ) : (
          <>
          <p className="mb-1.5 text-[11px] text-slate-400 sm:hidden">↔ Faites glisser pour voir toutes les colonnes</p>
          <div className="overflow-x-auto rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 shadow-card">
            <div className="grid min-w-[760px] grid-cols-[1.2fr_1.5fr_2fr_1.3fr_1.5fr_1.6fr] bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">
              <span>Période</span>
              <span>Locataire</span>
              <span>Bien</span>
              <span>Montant</span>
              <span>Statut</span>
              <span>Action</span>
            </div>
            {echeancesFiltrees.map(e => {
              const statutInfo = STATUT_COULEURS[e.statut] || { cls: 'bg-slate-100 text-slate-500', label: e.statut };
              return (
                <div key={e.id} className="grid min-w-[760px] grid-cols-[1.2fr_1.5fr_2fr_1.3fr_1.5fr_1.6fr] items-center border-t border-slate-50 px-5 py-3.5 text-sm">
                  <span className="font-semibold capitalize text-slate-800">{formaterDate(e.mois_concerne)}</span>
                  <span className="text-slate-700">{e.locataire_nom}</span>
                  <span className="text-[13px] text-slate-400">{e.adresse}</span>
                  <span className="font-bold text-brand-700">
                    {formaterMontant(e.statut === 'partielle' ? e.montant_restant : e.montant_du)}
                    {e.statut === 'partielle' && <span className="block text-[11px] font-normal text-slate-400">reste sur {formaterMontant(e.montant_du)}</span>}
                  </span>
                  <span>
                    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${statutInfo.cls}`}>
                      {statutInfo.label}
                    </span>
                  </span>
                  <span>
                    {e.statut !== 'payee' && (
                      <button className="whitespace-nowrap rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100" onClick={() => ouvrirModalMobileMoney(e)}>
                        📱 Mobile Money
                      </button>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
          </>
        )}
      </div>

      {modalMobileMoney && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/50 p-5 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl">
            <h3 className="mb-1 text-xl font-bold text-slate-900">📱 Demander un paiement Mobile Money</h3>
            <p className="mb-4 text-sm text-slate-400">
              {modalMobileMoney.locataire_nom} · {formaterMontant(modalMobileMoney.statut === 'partielle' ? modalMobileMoney.montant_restant : modalMobileMoney.montant_du)}
            </p>

            {statutDemande === 'attente' ? (
              <div className="flex flex-col items-center gap-3 rounded-xl bg-brand-50 px-5 py-8 text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
                <p className="text-sm font-semibold text-brand-800">Demande envoyée à {telephoneMobileMoney}</p>
                <p className="text-xs text-slate-500">Le locataire doit valider sur son téléphone. Cette fenêtre se met à jour automatiquement.</p>
              </div>
            ) : (
              <>
                <label className="mt-3 mb-1 block text-sm font-semibold text-slate-700">Opérateur</label>
                <div className="flex flex-col gap-2">
                  {OPERATEURS_MOBILE_MONEY.map(op => (
                    <label key={op.value} className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm ${methodeMobileMoney === op.value ? 'border-brand-600 bg-brand-50 font-semibold text-brand-700' : 'border-slate-200 text-slate-600'}`}>
                      <input type="radio" name="methode-momo" className="accent-brand-600" checked={methodeMobileMoney === op.value} onChange={() => setMethodeMobileMoney(op.value)} />
                      {op.label}
                    </label>
                  ))}
                </div>

                <label className="mt-4 mb-1 block text-sm font-semibold text-slate-700">Numéro de téléphone du locataire</label>
                <input
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
                  type="tel"
                  value={telephoneMobileMoney}
                  onChange={e => setTelephoneMobileMoney(e.target.value)}
                  placeholder="Ex : 22990000000"
                />

                {erreurMobileMoney && <p className="mt-3 text-sm text-red-600">{erreurMobileMoney}</p>}

                <div className="mt-5 flex gap-3">
                  <button className="flex-1 rounded-xl border border-slate-200 px-5 py-3 text-sm text-slate-600 hover:bg-slate-50" onClick={fermerModalMobileMoney}>Annuler</button>
                  <button className="flex-1 rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60" onClick={envoyerDemandeMobileMoney} disabled={statutDemande === 'envoi'}>
                    {statutDemande === 'envoi' ? 'Envoi...' : 'Envoyer la demande'}
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
