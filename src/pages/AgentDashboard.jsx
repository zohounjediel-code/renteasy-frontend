import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ClocheNotifications from '../components/ClocheNotifications';

function formaterMontant(n) {
  return `${parseInt(n || 0).toLocaleString('fr-FR')} FCFA`;
}

export default function AgentDashboard() {
  const [perf, setPerf] = useState(null);
  const [chargement, setChargement] = useState(true);
  const { deconnecter, utilisateur } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/agent/performance')
      .then(r => setPerf(r.data))
      .finally(() => setChargement(false));
  }, []);

  return (
    <div className="min-h-screen bg-brand-50">
      <nav className="sticky top-0 z-[100] flex h-[60px] flex-wrap items-center justify-between border-b border-slate-100 bg-white/95 px-6 backdrop-blur">
        <div className="flex items-center gap-2 text-lg text-slate-900">
          ⚡ <strong>RentEasy</strong> <span className="text-accent-600">Bénin</span>
          <span className="rounded-full bg-accent-500 px-2.5 py-0.5 text-[11px] font-extrabold text-white">Agent</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button className="whitespace-nowrap rounded-lg border border-brand-600 bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700">Tableau de bord</button>
          <button className="whitespace-nowrap rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50" onClick={() => navigate('/agent/demandes')}>Demandes</button>
          <button className="whitespace-nowrap rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50" onClick={() => navigate('/agent/recouvrements')}>Recouvrements</button>
          <button className="whitespace-nowrap rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50" onClick={() => navigate('/agent/proprietaires')}>Mes propriétaires</button>
          <button className="whitespace-nowrap rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700 hover:bg-brand-100" onClick={() => navigate('/profil')}>👤 Mon profil</button>
          <ClocheNotifications />
          <button className="whitespace-nowrap rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50" onClick={deconnecter}>Déconnexion</button>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-6 py-7">
        <h2 className="text-2xl font-extrabold text-slate-900">Bonjour {utilisateur?.nom?.split(' ')[0]} 👋</h2>
        <p className="mb-7 mt-1.5 text-sm text-slate-500">Voici la performance de votre portefeuille{perf ? ` — ${perf.mois}` : ''}.</p>

        {chargement ? (
          <p className="p-5 text-slate-400">Chargement...</p>
        ) : !perf ? (
          <p className="text-red-600">Impossible de charger vos statistiques.</p>
        ) : (
          <>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
              <div className="cursor-pointer rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 p-5 shadow-card transition hover:border-brand-200" onClick={() => navigate('/agent/proprietaires')} role="button">
                <p className="mb-2 text-xl">👤</p>
                <p className="mb-1 text-2xl font-extrabold text-slate-900">{perf.nb_proprietaires}</p>
                <p className="m-0 text-[13px] font-semibold text-brand-700">Propriétaire(s) géré(s)</p>
                <p className="mt-1.5 text-xs text-slate-400">{perf.nb_proprietaires_delegation} en délégation active</p>
              </div>

              <div className="rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 p-5 shadow-card">
                <p className="mb-2 text-xl">📊</p>
                <p className={`mb-1 text-2xl font-extrabold ${perf.taux_recouvrement >= 80 ? 'text-emerald-600' : perf.taux_recouvrement >= 50 ? 'text-accent-600' : 'text-red-600'}`}>
                  {perf.taux_recouvrement}%
                </p>
                <p className="m-0 text-[13px] font-semibold text-brand-700">Taux de recouvrement</p>
                <p className="mt-1.5 text-xs text-slate-400">{perf.echeances_payees} / {perf.total_echeances} échéances payées ce mois</p>
              </div>

              <div className="rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 p-5 shadow-card">
                <p className="mb-2 text-xl">💰</p>
                <p className="mb-1 text-2xl font-extrabold text-slate-900">{formaterMontant(perf.revenus_collectes)}</p>
                <p className="m-0 text-[13px] font-semibold text-brand-700">Revenus collectés ce mois</p>
                <p className="mt-1.5 text-xs text-slate-400">Sur l'ensemble de votre portefeuille</p>
              </div>

              <div
                className={`cursor-pointer rounded-2xl border p-5 shadow-card ${perf.demandes_en_attente > 0 ? 'border-accent-300 bg-accent-50' : 'border-slate-100 bg-white'}`}
                onClick={() => navigate(perf.demandes_marche_en_attente > 0 ? '/agent/proprietaires' : '/agent/demandes')}
                role="button"
              >
                <p className="mb-2 text-xl">📨</p>
                <p className={`mb-1 text-2xl font-extrabold ${perf.demandes_en_attente > 0 ? 'text-accent-700' : 'text-slate-900'}`}>{perf.demandes_en_attente}</p>
                <p className="m-0 text-[13px] font-semibold text-brand-700">Demande(s) en attente</p>
                <p className="mt-1.5 text-xs text-slate-400">{perf.demandes_modification_en_attente} modification(s) · {perf.demandes_marche_en_attente} nouvelle(s) location(s)</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
              <div className="rounded-xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 p-4 shadow-card">
                <p className="m-0 text-[13px] font-semibold text-brand-700">Biens sous gestion</p>
                <p className="mt-1 text-xl font-bold text-slate-900">{perf.nb_biens}</p>
              </div>
              <div className="rounded-xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 p-4 shadow-card">
                <p className="m-0 text-[13px] font-semibold text-brand-700">Contrats actifs</p>
                <p className="mt-1 text-xl font-bold text-slate-900">{perf.nb_contrats_actifs}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
