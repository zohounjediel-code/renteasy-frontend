import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const navBtn = 'rounded-lg border border-slate-200 px-3.5 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50';
const navBtnActif = 'rounded-lg border border-brand-600 bg-brand-50 px-3.5 py-1.5 text-[13px] font-semibold text-brand-700';

export default function SuperAdminErreurs() {
  const [erreurs, setErreurs] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [erreurDepliee, setErreurDepliee] = useState(null);
  const { deconnecter } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { chargerErreurs(); }, []);

  async function chargerErreurs() {
    try {
      const r = await api.get('/superadmin/erreurs');
      setErreurs(r.data);
    } catch (e) {
      console.error(e);
    } finally {
      setChargement(false);
    }
  }

  function formaterDateHeure(d) {
    return new Date(d).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'medium' });
  }

  const erreursFiltrees = erreurs.filter(e => {
    if (!recherche) return true;
    const r = recherche.toLowerCase();
    return e.message?.toLowerCase().includes(r) || e.route?.toLowerCase().includes(r);
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
          <button className={navBtn} onClick={() => navigate('/superadmin/rappels')}>Rappels</button>
          <button className={navBtnActif}>Erreurs</button>
          <button className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50" onClick={deconnecter}>Déconnexion</button>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Erreurs serveur</h2>
            <p className="mt-1.5 max-w-xl text-[13px] text-slate-500">
              Historique des erreurs 500, exceptions non attrapées et rejets de promesse non gérés — chaque nouvelle erreur déclenche aussi une alerte email (au maximum une toutes les 30 minutes par erreur identique).
            </p>
          </div>
          <span className="rounded-full border border-purple-200 bg-purple-50 px-4 py-1.5 text-sm font-semibold text-purple-700">{erreursFiltrees.length} erreur(s)</span>
        </div>

        <div className="mb-5 flex items-center gap-3">
          <input
            className="w-[320px] rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
            placeholder="🔍 Message, route..."
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
          />
          <button className="rounded-xl border border-brand-300 bg-brand-50 px-4 py-2.5 text-[13px] font-semibold text-brand-700" onClick={chargerErreurs}>↻ Actualiser</button>
        </div>

        {chargement ? (
          <p className="py-10 text-center text-slate-400">Chargement...</p>
        ) : erreursFiltrees.length === 0 ? (
          <div className="rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 py-16 text-center text-slate-400 shadow-card">Aucune erreur enregistrée 🎉</div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {erreursFiltrees.map(err => {
              const depliee = erreurDepliee === err.id;
              return (
                <div key={err.id} className="overflow-hidden rounded-xl border border-red-100 bg-white shadow-card">
                  <div className="flex cursor-pointer items-center justify-between gap-4 px-4.5 py-3.5" onClick={() => setErreurDepliee(depliee ? null : err.id)}>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {err.statut_http && <span className="rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-extrabold text-red-600">{err.statut_http}</span>}
                        {err.methode && <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-bold text-purple-700">{err.methode}</span>}
                        {err.route && <span className="font-mono text-xs text-slate-400">{err.route}</span>}
                      </div>
                      <div className="mt-1.5 break-words text-sm text-slate-800">{err.message}</div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="whitespace-nowrap text-xs text-slate-400">{formaterDateHeure(err.created_at)}</span>
                      <span className="text-xs text-purple-600">{depliee ? '▲' : '▼'}</span>
                    </div>
                  </div>
                  {depliee && err.stack && (
                    <pre className="m-0 overflow-x-auto border-t border-red-100 bg-slate-900 px-4.5 py-3.5 font-mono text-xs leading-relaxed text-red-400">{err.stack}</pre>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
