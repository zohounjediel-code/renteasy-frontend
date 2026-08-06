import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ClocheNotifications from '../components/ClocheNotifications';
import BoutonActiverRole from '../components/BoutonActiverRole';

function KPICard({ titre, valeur, sous, icone, couleur }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card">
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-lg ${couleur}`}>{icone}</div>
      <div className="text-2xl font-extrabold text-slate-900">{valeur}</div>
      <div className="mt-1 text-sm font-medium text-slate-500">{titre}</div>
      {sous && <div className="mt-1 text-xs text-slate-400">{sous}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [chargement, setChargement] = useState(true);
  const { utilisateur, deconnecter } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const estAussiLocataire = (utilisateur?.role || '').includes('locataire');

  // Un admin/super_admin peut consulter le tableau de bord d'un propriétaire précis via
  // ?proprietaire_id= (repris depuis AgentProprietaireDetail) — le propriétaire lui-même
  // n'a jamais ce paramètre et continue de voir ses propres données comme avant.
  const parametres = new URLSearchParams(location.search);
  const proprietaireIdConsulte = parametres.get('proprietaire_id');
  const proprietaireNomConsulte = parametres.get('proprietaire_nom');
  const enConsultationAdmin = !!proprietaireIdConsulte;

  // Ajoute ?proprietaire_id= (et le nom, pour le conserver d'un onglet à l'autre) aux liens
  // de navigation, pour que l'admin reste sur le même propriétaire en changeant de page.
  function lienConsultation(chemin) {
    if (!enConsultationAdmin) return chemin;
    const p = new URLSearchParams({ proprietaire_id: proprietaireIdConsulte });
    if (proprietaireNomConsulte) p.set('proprietaire_nom', proprietaireNomConsulte);
    return `${chemin}?${p.toString()}`;
  }

  useEffect(() => {
    const params = enConsultationAdmin ? { proprietaire_id: proprietaireIdConsulte } : {};
    api.get('/dashboard', { params })
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setChargement(false));
  }, [proprietaireIdConsulte]);

  function formaterMontant(n) {
    return parseInt(n || 0).toLocaleString('fr-FR') + ' FCFA';
  }
  function formaterDate(d) {
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  if (chargement) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
      <p className="text-brand-700">Chargement...</p>
    </div>
  );

  const biens = data?.biens || {};
  const mois = data?.mois_en_cours || {};
  const impayes = data?.impayes || [];
  const paiements = data?.derniers_paiements || [];

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="re-nav sticky top-0 z-[100] flex h-[60px] items-center justify-between border-b border-slate-100 bg-white/95 px-6 backdrop-blur">
        <div className="text-lg text-slate-900">🏠 <strong>RentEasy</strong> <span className="text-accent-600">Bénin</span></div>
        <div className="flex items-center gap-1.5">
          <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50" onClick={() => navigate(lienConsultation('/biens'))}>Mes biens</button>
          <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50" onClick={() => navigate(lienConsultation('/locataires'))}>Locataires</button>
          <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50" onClick={() => navigate(lienConsultation('/paiements'))}>Paiements</button>
          <button className="rounded-lg border border-brand-600 bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700">Dashboard</button>
          {!enConsultationAdmin && (
            <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50" onClick={() => navigate('/proprietaire/mon-agent')}>👔 Mon agent</button>
          )}
          {estAussiLocataire && !enConsultationAdmin && (
            <button className="rounded-lg bg-accent-500 px-3 py-1.5 text-sm font-bold text-white hover:bg-accent-600" onClick={() => navigate('/locataire/dashboard')}>🔄 Espace locataire</button>
          )}
          <button className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700 hover:bg-brand-100" onClick={() => navigate('/profil')}>👤 Mon profil</button>
          <ClocheNotifications />
          <button className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50" onClick={deconnecter}>Déconnexion</button>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-7">
        {enConsultationAdmin && (
          <div className="mb-5 rounded-xl border border-accent-200 bg-accent-50 px-4 py-2.5 text-sm text-accent-800">
            🛡️ Vous consultez le compte de <strong>{proprietaireNomConsulte || 'ce propriétaire'}</strong> en tant qu'administrateur.
          </div>
        )}

        <div className="mb-2">
          <h2 className="text-2xl font-extrabold text-slate-900">{enConsultationAdmin ? `Tableau de bord de ${proprietaireNomConsulte || 'ce propriétaire'}` : `Bonjour, ${utilisateur?.nom} 👋`}</h2>
          <p className="mt-1 text-sm text-slate-500">Tableau de bord — {mois.mois}</p>
        </div>

        {!enConsultationAdmin && <BoutonActiverRole />}

        <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
          <KPICard titre="Biens gérés" valeur={biens.total_biens || 0} sous={`${biens.biens_occupes || 0} occupés · ${biens.biens_libres || 0} libres`} couleur="bg-brand-50 text-brand-700" icone="🏘️" />
          <KPICard titre="Loyers collectés" valeur={formaterMontant(mois.montant_total_collecte)} sous={`sur ${formaterMontant(mois.montant_total_du)} attendus`} couleur="bg-emerald-50 text-emerald-700" icone="💰" />
          <KPICard titre="Taux de recouvrement" valeur={`${mois.taux_recouvrement || 0}%`} sous={`${mois.echeances_payees || 0} / ${mois.total_echeances || 0} échéances`} couleur="bg-accent-50 text-accent-700" icone="📊" />
          <KPICard titre="Impayés en retard" valeur={impayes.length} sous="à relancer" couleur="bg-red-50 text-red-600" icone="⚠️" />
        </div>

        <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-4">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card">
            <h3 className="mb-4 text-sm font-bold text-slate-900">⚠️ Impayés en retard</h3>
            {impayes.length === 0 ? (
              <p className="py-5 text-center text-sm text-slate-400">Aucun impayé en retard 🎉</p>
            ) : (
              impayes.map(e => (
                <div key={e.id} className="flex items-center justify-between border-b border-slate-50 py-3 last:border-0">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{e.locataire_nom}</div>
                    <div className="mt-0.5 text-xs text-slate-400">{e.adresse} · {e.ville}</div>
                    <div className="mt-0.5 text-xs text-slate-400">Échéance : {formaterDate(e.date_limite)}</div>
                  </div>
                  <div className="font-bold text-red-600">{formaterMontant(e.montant_du)}</div>
                </div>
              ))
            )}
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card">
            <h3 className="mb-4 text-sm font-bold text-slate-900">✅ Derniers paiements</h3>
            {paiements.length === 0 ? (
              <p className="py-5 text-center text-sm text-slate-400">Aucun paiement ce mois</p>
            ) : (
              paiements.map(p => (
                <div key={p.id} className="flex items-center justify-between border-b border-slate-50 py-3 last:border-0">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{p.locataire_nom}</div>
                    <div className="mt-0.5 text-xs text-slate-400">{p.adresse}</div>
                    <div className="mt-0.5 text-xs text-slate-400">{formaterDate(p.date_paiement)} · {p.methode?.replace('_', ' ')}</div>
                  </div>
                  <div className="font-bold text-brand-600">{formaterMontant(p.montant)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
