import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const navBtn = 'rounded-lg border border-slate-200 px-3.5 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50';
const navBtnActif = 'rounded-lg border border-brand-600 bg-brand-50 px-3.5 py-1.5 text-[13px] font-semibold text-brand-700';

export default function SuperAdminBiens() {
  const [biens, setBiens] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [filtre, setFiltre] = useState('tous');
  const { deconnecter } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { chargerBiens(); }, []);

  async function chargerBiens() {
    try {
      const r = await api.get('/superadmin/biens');
      setBiens(r.data);
    } catch (e) {
      console.error(e);
    } finally {
      setChargement(false);
    }
  }

  function formaterMontant(n) {
    return parseInt(n || 0).toLocaleString('fr-FR') + ' FCFA';
  }

  const STATUT = {
    libre: { cls: 'bg-emerald-50 text-emerald-700', label: '● Libre' },
    occupe: { cls: 'bg-accent-50 text-accent-700', label: '● Occupé' },
  };

  const biensFiltres = biens.filter(b => {
    const matchFiltre = filtre === 'tous' || b.statut === filtre;
    const matchRecherche = !recherche ||
      b.proprietaire_nom?.toLowerCase().includes(recherche.toLowerCase()) ||
      b.adresse?.toLowerCase().includes(recherche.toLowerCase()) ||
      String(b.numero_bien).toLowerCase().includes(recherche.toLowerCase());
    return matchFiltre && matchRecherche;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="re-nav sticky top-0 z-[100] flex h-16 items-center justify-between border-b border-slate-100 bg-white/95 px-6 backdrop-blur">
        <div className="flex cursor-pointer items-center gap-2.5 text-lg font-bold text-slate-900" onClick={() => navigate('/superadmin/dashboard')}>
          ⚡ RentEasy <span className="text-accent-600">Bénin</span>
          <span className="rounded-full bg-purple-600 px-2.5 py-0.5 text-[10px] font-extrabold tracking-wide text-white">SUPER ADMIN</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button className={navBtn} onClick={() => navigate('/superadmin/dashboard')}>Dashboard</button>
          <button className={navBtn} onClick={() => navigate('/superadmin/utilisateurs')}>Utilisateurs</button>
          <button className={navBtn} onClick={() => navigate('/superadmin/contrats')}>Contrats</button>
          <button className={navBtnActif}>Biens</button>
          <button className={navBtn} onClick={() => navigate('/superadmin/locataires')}>Locataires</button>
          <button className={navBtn} onClick={() => navigate('/superadmin/journal')}>Journal</button>
          <button className={navBtn} onClick={() => navigate('/superadmin/parametres')}>Paramètres</button>
          <button className={navBtn} onClick={() => navigate('/superadmin/moderation')}>Modération</button>
          <button className={navBtn} onClick={() => navigate('/superadmin/rapport-financier')}>Rapport financier</button>
          <button className={navBtn} onClick={() => navigate('/superadmin/rappels')}>Rappels</button>
          <button className={navBtn} onClick={() => navigate('/superadmin/erreurs')}>Erreurs</button>
          <button className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50" onClick={deconnecter}>Déconnexion</button>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-slate-900">Tous les biens</h2>
          <span className="rounded-full border border-purple-200 bg-purple-50 px-4 py-1.5 text-sm font-semibold text-purple-700">{biensFiltres.length} bien(s)</span>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-3">
          <input
            className="w-[320px] rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
            placeholder="🔍 Propriétaire, adresse, numéro de bien..."
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
          />
          <div className="flex gap-2">
            {['tous', 'libre', 'occupe'].map(f => (
              <button
                key={f}
                className={`rounded-full border px-4 py-1.5 text-[13px] font-semibold ${filtre === f ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 bg-white text-slate-500'}`}
                onClick={() => setFiltre(f)}
              >
                {f === 'tous' ? 'Tous' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {chargement ? (
          <p className="py-10 text-center text-slate-400">Chargement...</p>
        ) : biensFiltres.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-white py-16 text-center text-slate-400 shadow-card">Aucun bien trouvé</div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-card">
            <div className="grid min-w-[680px] grid-cols-[2fr_1.5fr_1fr_1fr_1.2fr_1fr] bg-purple-50 px-5 py-3.5 text-[11px] font-bold uppercase tracking-wide text-purple-700">
              <span>Bien</span>
              <span>Propriétaire</span>
              <span>Agent</span>
              <span>Type</span>
              <span>Loyer</span>
              <span>Statut</span>
            </div>
            {biensFiltres.map(b => {
              const st = STATUT[b.statut] || { cls: 'bg-slate-100 text-slate-500', label: b.statut };
              return (
                <div key={b.id} className="grid min-w-[680px] grid-cols-[2fr_1.5fr_1fr_1fr_1.2fr_1fr] items-center border-t border-slate-50 px-5 py-3.5 text-sm">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{b.adresse || b.lieu_depot}</div>
                    <div className="mt-0.5 text-xs text-slate-400">{b.ville} · N° {b.numero_bien}</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{b.proprietaire_nom}</div>
                    <div className="mt-0.5 text-xs text-slate-400">{b.proprietaire_telephone}</div>
                  </div>
                  <div className="text-[13px] text-slate-400">{b.agent_nom || '—'}</div>
                  <div className="text-[13px] capitalize text-slate-400">{b.type_bien}</div>
                  <div className="font-bold text-accent-600">{formaterMontant(b.loyer_mensuel)}</div>
                  <div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${st.cls}`}>
                      {st.label}
                    </span>
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
