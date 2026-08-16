import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const navBtn = 'whitespace-nowrap rounded-lg border border-slate-200 px-3.5 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50';
const navBtnActif = 'whitespace-nowrap rounded-lg border border-brand-600 bg-brand-50 px-3.5 py-1.5 text-[13px] font-semibold text-brand-700';

export default function SuperAdminContrats() {
  const [contrats, setContrats] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [filtre, setFiltre] = useState('tous');
  const { deconnecter } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { chargerContrats(); }, []);

  async function chargerContrats() {
    try {
      const r = await api.get('/superadmin/contrats');
      setContrats(r.data);
    } catch (e) {
      console.error(e);
    } finally {
      setChargement(false);
    }
  }

  function formaterMontant(n) {
    return parseInt(n || 0).toLocaleString('fr-FR') + ' FCFA';
  }
  function formaterDate(d) {
    return new Date(d).toLocaleDateString('fr-FR');
  }

  const STATUT = {
    actif: { cls: 'bg-emerald-50 text-emerald-700', label: '● Actif' },
    resilie: { cls: 'bg-red-50 text-red-600', label: '○ Résilié' },
    expire: { cls: 'bg-slate-100 text-slate-500', label: '○ Expiré' },
  };

  const contratsFiltres = contrats.filter(c => {
    const matchFiltre = filtre === 'tous' || c.statut === filtre;
    const matchRecherche = !recherche ||
      c.proprietaire_nom?.toLowerCase().includes(recherche.toLowerCase()) ||
      c.locataire_nom?.toLowerCase().includes(recherche.toLowerCase()) ||
      c.adresse?.toLowerCase().includes(recherche.toLowerCase());
    return matchFiltre && matchRecherche;
  });

  return (
    <div className="min-h-screen bg-brand-50">
      <nav className="re-nav sticky top-0 z-[100] flex h-16 items-center justify-between border-b border-slate-100 bg-white/95 px-6 backdrop-blur">
        <div className="flex cursor-pointer items-center gap-2.5 text-lg font-bold text-slate-900" onClick={() => navigate('/superadmin/dashboard')}>
          ⚡ RentEasy <span className="text-accent-600">Bénin</span>
          <span className="rounded-full bg-purple-600 px-2.5 py-0.5 text-[10px] font-extrabold tracking-wide text-white">SUPER ADMIN</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button className={navBtn} onClick={() => navigate('/superadmin/dashboard')}>Dashboard</button>
          <button className={navBtn} onClick={() => navigate('/superadmin/utilisateurs')}>Utilisateurs</button>
          <button className={navBtnActif}>Contrats</button>
          <button className={navBtn} onClick={() => navigate('/superadmin/biens')}>Biens</button>
          <button className={navBtn} onClick={() => navigate('/superadmin/locataires')}>Locataires</button>
          <button className={navBtn} onClick={() => navigate('/superadmin/journal')}>Journal</button>
          <button className={navBtn} onClick={() => navigate('/superadmin/parametres')}>Paramètres</button>
          <button className={navBtn} onClick={() => navigate('/superadmin/moderation')}>Modération</button>
          <button className={navBtn} onClick={() => navigate('/superadmin/rapport-financier')}>Rapport financier</button>
          <button className={navBtn} onClick={() => navigate('/superadmin/rappels')}>Rappels</button>
          <button className={navBtn} onClick={() => navigate('/superadmin/erreurs')}>Erreurs</button>
          <button className="rounded-lg bg-accent-500 px-3.5 py-1.5 text-[13px] font-semibold text-white hover:bg-accent-600" onClick={() => navigate('/superadmin/utilisateurs?action=creer-admin')}>+ Créer compte</button>
          <button className="whitespace-nowrap rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50" onClick={deconnecter}>Déconnexion</button>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-slate-900">Tous les contrats</h2>
          <span className="rounded-full border border-purple-200 bg-purple-50 px-4 py-1.5 text-sm font-semibold text-purple-700">{contratsFiltres.length} contrat(s)</span>
        </div>

        {/* Filtres */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <input
            className="w-[300px] rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
            placeholder="🔍 Propriétaire, locataire, adresse..."
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
          />
          <div className="flex gap-2">
            {['tous', 'actif', 'resilie'].map(f => (
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
        ) : contratsFiltres.length === 0 ? (
          <div className="rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 py-16 text-center text-slate-400 shadow-card">Aucun contrat trouvé</div>
        ) : (
          <>
          <p className="mb-1.5 text-[11px] text-slate-400 sm:hidden">↔ Faites glisser pour voir toutes les colonnes</p>
          <div className="overflow-x-auto rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 shadow-card">
            <div className="grid min-w-[700px] grid-cols-[2fr_1.5fr_1.5fr_1.2fr_1fr_1fr] bg-purple-50 px-5 py-3.5 text-[11px] font-bold uppercase tracking-wide text-purple-700">
              <span>Bien</span>
              <span>Propriétaire</span>
              <span>Locataire</span>
              <span>Loyer</span>
              <span>Début</span>
              <span>Statut</span>
            </div>
            {contratsFiltres.map(c => {
              const st = STATUT[c.statut] || { cls: 'bg-slate-100 text-slate-500', label: c.statut };
              return (
                <div key={c.id} className="grid min-w-[700px] grid-cols-[2fr_1.5fr_1.5fr_1.2fr_1fr_1fr] items-center border-t border-slate-50 px-5 py-3.5 text-sm">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{c.adresse}</div>
                    <div className="mt-0.5 text-xs text-slate-400">{c.ville} · {c.type_bien}</div>
                    <div className="mt-0.5 font-mono text-[11px] text-slate-300">#{c.id.slice(0, 8)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{c.proprietaire_nom}</div>
                    <div className="mt-0.5 text-xs text-slate-400">{c.proprietaire_email}</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{c.locataire_nom}</div>
                    <div className="mt-0.5 text-xs text-slate-400">{c.locataire_telephone}</div>
                  </div>
                  <div>
                    <div className="font-bold text-accent-600">{formaterMontant(c.loyer_mensuel)}</div>
                    {c.caution > 0 && (
                      <div className={`mt-0.5 text-[11px] font-semibold ${c.statut_caution === 'payee' ? 'text-emerald-600' : 'text-accent-600'}`}>
                        🔒 {formaterMontant(c.caution)} {c.statut_caution === 'payee' ? '✅' : c.statut_caution === 'transferee' ? '↩️' : '⏳'}
                      </div>
                    )}
                  </div>
                  <div className="text-[13px] text-slate-400">{formaterDate(c.date_debut)}</div>
                  <div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${st.cls}`}>
                      {st.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          </>
        )}
      </div>
    </div>
  );
}
