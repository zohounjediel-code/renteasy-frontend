import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const LABELS_TYPE_RAPPEL = {
  avant_3j: { label: '⏳ Avant échéance (J-3)', cls: 'text-cyan-600 bg-cyan-50' },
  jour_j: { label: '📅 Jour J', cls: 'text-accent-600 bg-accent-50' },
  retard_3j: { label: '⚠️ Retard (J+3)', cls: 'text-red-600 bg-red-50' },
  retard_7j: { label: '🚨 Retard (J+7)', cls: 'text-red-700 bg-red-100' },
};

const navBtn = 'rounded-lg border border-slate-200 px-3.5 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50';
const navBtnActif = 'rounded-lg border border-brand-600 bg-brand-50 px-3.5 py-1.5 text-[13px] font-semibold text-brand-700';

export default function SuperAdminRappels() {
  const [rappels, setRappels] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [filtreType, setFiltreType] = useState('tous');
  const [recherche, setRecherche] = useState('');
  const { deconnecter } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { chargerRappels(); }, []);

  async function chargerRappels() {
    try {
      const r = await api.get('/superadmin/rappels-echeances');
      setRappels(r.data);
    } catch (e) {
      console.error(e);
    } finally {
      setChargement(false);
    }
  }

  function formaterMontant(n) {
    return parseInt(n || 0).toLocaleString('fr-FR') + ' FCFA';
  }
  function formaterDateHeure(d) {
    return new Date(d).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
  }
  function formaterDate(d) {
    return new Date(d).toLocaleDateString('fr-FR');
  }

  const rappelsFiltres = rappels.filter(r => {
    const matchType = filtreType === 'tous' || r.type_rappel === filtreType;
    const matchRecherche = !recherche ||
      r.locataire_nom?.toLowerCase().includes(recherche.toLowerCase()) ||
      r.proprietaire_nom?.toLowerCase().includes(recherche.toLowerCase()) ||
      r.adresse?.toLowerCase().includes(recherche.toLowerCase()) ||
      String(r.numero_bien).toLowerCase().includes(recherche.toLowerCase());
    return matchType && matchRecherche;
  });

  return (
    <div className="min-h-screen bg-brand-50">
      <nav className="re-nav sticky top-0 z-[100] flex h-16 flex-wrap items-center justify-between border-b border-slate-100 bg-white/95 px-6 backdrop-blur">
        <div className="flex cursor-pointer items-center gap-2.5 text-lg font-bold text-slate-900" onClick={() => navigate('/superadmin/dashboard')}>
          ⚡ RentEasy <span className="text-accent-600">Bénin</span>
          <span className="rounded-full bg-purple-600 px-2.5 py-0.5 text-[10px] font-extrabold tracking-wide text-white">SUPER ADMIN</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button className={navBtn} onClick={() => navigate('/superadmin/dashboard')}>Dashboard</button>
          <button className={navBtn} onClick={() => navigate('/superadmin/utilisateurs')}>Utilisateurs</button>
          <button className={navBtn} onClick={() => navigate('/superadmin/contrats')}>Contrats</button>
          <button className={navBtn} onClick={() => navigate('/superadmin/biens')}>Biens</button>
          <button className={navBtn} onClick={() => navigate('/superadmin/locataires')}>Locataires</button>
          <button className={navBtn} onClick={() => navigate('/superadmin/journal')}>Journal</button>
          <button className={navBtn} onClick={() => navigate('/superadmin/parametres')}>Paramètres</button>
          <button className={navBtn} onClick={() => navigate('/superadmin/moderation')}>Modération</button>
          <button className={navBtn} onClick={() => navigate('/superadmin/rapport-financier')}>Rapport financier</button>
          <button className={navBtnActif}>Rappels</button>
          <button className={navBtn} onClick={() => navigate('/superadmin/erreurs')}>Erreurs</button>
          <button className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50" onClick={deconnecter}>Déconnexion</button>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Rappels d'échéances</h2>
            <p className="mt-1.5 max-w-xl text-[13px] text-slate-500">Historique des relances automatiques envoyées aux locataires (et aux propriétaires en cas de retard).</p>
          </div>
          <span className="rounded-full border border-purple-200 bg-purple-50 px-4 py-1.5 text-sm font-semibold text-purple-700">{rappelsFiltres.length} rappel(s)</span>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-3">
          <input
            className="w-[320px] rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
            placeholder="🔍 Locataire, propriétaire, adresse, N° bien..."
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <button
              className={`rounded-full border px-4 py-1.5 text-[13px] font-semibold ${filtreType === 'tous' ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 bg-white text-slate-500'}`}
              onClick={() => setFiltreType('tous')}
            >
              Tous
            </button>
            {Object.entries(LABELS_TYPE_RAPPEL).map(([valeur, info]) => (
              <button
                key={valeur}
                className={`rounded-full border px-4 py-1.5 text-[13px] font-semibold ${filtreType === valeur ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 bg-white text-slate-500'}`}
                onClick={() => setFiltreType(valeur)}
              >
                {info.label}
              </button>
            ))}
          </div>
        </div>

        {chargement ? (
          <p className="py-10 text-center text-slate-400">Chargement...</p>
        ) : rappelsFiltres.length === 0 ? (
          <div className="rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 py-16 text-center text-slate-400 shadow-card">Aucun rappel envoyé pour l'instant</div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 shadow-card">
            <div className="grid min-w-[700px] grid-cols-[1.1fr_1.3fr_1.6fr_1.1fr_1.1fr_1.3fr] bg-purple-50 px-5 py-3.5 text-[11px] font-bold uppercase tracking-wide text-purple-700">
              <span>Envoyé le</span>
              <span>Type</span>
              <span>Bien</span>
              <span>Locataire</span>
              <span>Propriétaire</span>
              <span>Montant / échéance</span>
            </div>
            {rappelsFiltres.map(r => {
              const info = LABELS_TYPE_RAPPEL[r.type_rappel] || { label: r.type_rappel, cls: 'text-slate-500 bg-slate-100' };
              return (
                <div key={r.id} className="grid min-w-[700px] grid-cols-[1.1fr_1.3fr_1.6fr_1.1fr_1.1fr_1.3fr] items-center border-t border-slate-50 px-5 py-3.5 text-sm">
                  <div className="text-[13px] text-slate-400">{formaterDateHeure(r.envoye_le)}</div>
                  <div>
                    <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${info.cls}`}>{info.label}</span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{r.adresse}</div>
                    <div className="mt-0.5 text-xs text-slate-400">{r.ville} · N° {r.numero_bien}</div>
                  </div>
                  <div className="text-[13px] text-slate-700">{r.locataire_nom}</div>
                  <div className="text-[13px] text-slate-700">{r.proprietaire_nom}</div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{formaterMontant(r.montant_du)}</div>
                    <div className="mt-0.5 text-xs text-slate-400">Échéance du {formaterDate(r.date_limite)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
