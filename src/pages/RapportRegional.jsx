import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ClocheNotifications from '../components/ClocheNotifications';

function StatCard({ icone, valeur, label, couleur, sous }) {
  return (
    <div className={`rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 p-5 shadow-card border-t-[3px] ${couleur}`}>
      <div className="mb-1.5 text-xl">{icone}</div>
      <div className="mb-1 text-xl font-extrabold text-slate-900">{valeur}</div>
      <div className="text-[13px] font-medium text-slate-500">{label}</div>
      {sous && <div className="mt-1 text-xs text-slate-400">{sous}</div>}
    </div>
  );
}

function formaterMontant(n) {
  return parseInt(n || 0).toLocaleString('fr-FR') + ' FCFA';
}

export default function RapportRegional() {
  const [rapport, setRapport] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [regionOuverte, setRegionOuverte] = useState(null);
  const { utilisateur, deconnecter } = useAuth();
  const navigate = useNavigate();
  const estSuperAdmin = (utilisateur?.role || '').includes('super_admin');

  useEffect(() => {
    api.get('/superadmin/rapport-regional')
      .then(r => {
        setRapport(r.data);
        if (r.data.length > 0) setRegionOuverte(r.data[0].region);
      })
      .catch(console.error)
      .finally(() => setChargement(false));
  }, []);

  if (chargement) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-brand-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
        <p className="text-brand-700">Chargement...</p>
      </div>
    );
  }

  const totalGeneral = rapport.reduce((acc, r) => ({
    revenus_collectes: acc.revenus_collectes + r.totaux.revenus_collectes,
    commissions_generees: acc.commissions_generees + r.totaux.commissions_generees,
    nb_agents: acc.nb_agents + r.totaux.nb_agents,
  }), { revenus_collectes: 0, commissions_generees: 0, nb_agents: 0 });

  return (
    <div className="min-h-screen bg-brand-50">
      <nav className="re-nav sticky top-0 z-[100] flex h-16 items-center justify-between border-b border-slate-100 bg-white/95 px-6 backdrop-blur">
        <div className="flex items-center gap-2.5 text-lg font-bold text-slate-900">
          <span className="text-xl">⚡</span>
          <span>RentEasy <span className="text-accent-600">Bénin</span></span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button className="whitespace-nowrap rounded-lg border border-slate-200 px-3.5 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50" onClick={() => navigate(estSuperAdmin ? '/superadmin/dashboard' : '/admin/dashboard')}>← Retour</button>
          <button className="whitespace-nowrap rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700 hover:bg-brand-100" onClick={() => navigate('/profil')}>👤 Mon profil</button>
          <ClocheNotifications />
          <button className="whitespace-nowrap rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50" onClick={deconnecter}>Déconnexion</button>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6">
          <h1 className="text-[28px] font-extrabold text-slate-900">Rapport financier régional</h1>
          <p className="mt-1.5 text-sm text-slate-500">Loyers, commissions et recouvrement par région — lecture seule, mois en cours</p>
        </div>

        <div className="mb-7 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
          <StatCard icone="🗺️" valeur={rapport.length} label="Régions actives" couleur="border-t-cyan-500" />
          <StatCard icone="👔" valeur={totalGeneral.nb_agents} label="Agents (toutes régions)" couleur="border-t-accent-500" />
          <StatCard icone="💰" valeur={formaterMontant(totalGeneral.revenus_collectes)} label="Loyers collectés" couleur="border-t-emerald-500" />
          <StatCard icone="🏦" valeur={formaterMontant(totalGeneral.commissions_generees)} label="Commissions RentEasy" couleur="border-t-purple-500" />
        </div>

        {rapport.length === 0 ? (
          <div className="rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 p-10 text-center text-slate-400 shadow-card">Aucune région à afficher — aucun agent enregistré.</div>
        ) : (
          rapport.map(r => {
            const ouverte = regionOuverte === r.region;
            return (
              <div key={r.region} className="mb-4 overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 shadow-card">
                <button className="flex w-full flex-wrap items-center justify-between gap-3 bg-purple-50 px-6 py-4.5 text-left" onClick={() => setRegionOuverte(ouverte ? null : r.region)}>
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg text-purple-700">{ouverte ? '▾' : '▸'}</span>
                    <span className="text-base font-bold text-purple-700">📍 {r.region}</span>
                    <span className="text-xs font-normal text-slate-400">{r.totaux.nb_agents} agent(s) · {r.totaux.nb_biens} bien(s)</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="font-bold text-emerald-600">{formaterMontant(r.totaux.revenus_collectes)}</span>
                    <span className={`font-bold ${r.totaux.taux_recouvrement >= 80 ? 'text-emerald-600' : r.totaux.taux_recouvrement >= 50 ? 'text-accent-600' : 'text-red-600'}`}>
                      {r.totaux.taux_recouvrement}% recouvré
                    </span>
                  </div>
                </button>

                {ouverte && (
                  <div className="px-6 py-5">
                    <div className="mb-4 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
                      <StatCard icone="🏘️" valeur={r.totaux.nb_proprietaires} label="Propriétaires" couleur="border-t-purple-500" />
                      <StatCard icone="🏠" valeur={r.totaux.nb_biens} label="Biens gérés" couleur="border-t-cyan-500" />
                      <StatCard icone="📋" valeur={r.totaux.nb_contrats_actifs} label="Contrats actifs" couleur="border-t-emerald-500" />
                      <StatCard icone="🏦" valeur={formaterMontant(r.totaux.commissions_generees)} label="Commissions" couleur="border-t-accent-500" />
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-100">
                      <div className="grid min-w-[760px] grid-cols-[1.6fr_1fr_0.8fr_1.3fr_1.3fr_1.2fr_0.9fr] bg-slate-50 px-4.5 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                        <span>Agent</span>
                        <span>Propriétaires</span>
                        <span>Biens</span>
                        <span>Recouvrement</span>
                        <span>Loyers collectés</span>
                        <span>Commissions</span>
                        <span>Statut</span>
                      </div>
                      {r.agents.map(a => (
                        <div key={a.id} className="grid min-w-[760px] grid-cols-[1.6fr_1fr_0.8fr_1.3fr_1.3fr_1.2fr_0.9fr] items-center border-t border-slate-50 px-4.5 py-3.5 text-[13px]">
                          <div className="text-sm font-bold text-slate-900">{a.nom}</div>
                          <div className="font-bold text-accent-600">{a.nb_proprietaires}</div>
                          <div className="font-bold text-cyan-600">{a.nb_biens}</div>
                          <div className={`font-bold ${a.taux_recouvrement >= 80 ? 'text-emerald-600' : a.taux_recouvrement >= 50 ? 'text-accent-600' : 'text-red-600'}`}>
                            {a.taux_recouvrement}% <span className="text-[11px] font-normal text-slate-400">({a.echeances_payees}/{a.total_echeances})</span>
                          </div>
                          <div className="font-semibold text-emerald-600">{formaterMontant(a.revenus_collectes)}</div>
                          <div className="font-semibold text-purple-600">{formaterMontant(a.commissions_generees)}</div>
                          <div>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${a.actif ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                              {a.actif ? '● Actif' : '○ Inactif'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
