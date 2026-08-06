import { useEffect, useState } from 'react';
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

export default function Paiements() {
  const [echeances, setEcheances] = useState([]);
  const [contrats, setContrats] = useState([]);
  const [filtre, setFiltre] = useState('tous');
  const [chargement, setChargement] = useState(true);
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
        <div className="flex items-center gap-1.5">
          <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50" onClick={() => navigate(lienConsultation('/biens'))}>Mes biens</button>
          <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50" onClick={() => navigate(lienConsultation('/locataires'))}>Locataires</button>
          <button className="rounded-lg border border-brand-600 bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700">Paiements</button>
          {estAussiLocataire && !enConsultationAdmin && (
            <button className="rounded-lg bg-accent-500 px-3 py-1.5 text-sm font-bold text-white hover:bg-accent-600" onClick={() => navigate('/locataire/dashboard')}>🔄 Espace locataire</button>
          )}
          <button className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700 hover:bg-brand-100" onClick={() => navigate('/profil')}>👤 Mon profil</button>
          <ClocheNotifications />
          <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50" onClick={() => navigate(lienConsultation('/dashboard'))}>Dashboard</button>
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
          <div className="overflow-x-auto rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 shadow-card">
            <div className="grid min-w-[640px] grid-cols-[1.2fr_1.5fr_2fr_1.3fr_1.5fr] bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">
              <span>Période</span>
              <span>Locataire</span>
              <span>Bien</span>
              <span>Montant</span>
              <span>Statut</span>
            </div>
            {echeancesFiltrees.map(e => {
              const statutInfo = STATUT_COULEURS[e.statut] || { cls: 'bg-slate-100 text-slate-500', label: e.statut };
              return (
                <div key={e.id} className="grid min-w-[640px] grid-cols-[1.2fr_1.5fr_2fr_1.3fr_1.5fr] items-center border-t border-slate-50 px-5 py-3.5 text-sm">
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
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
