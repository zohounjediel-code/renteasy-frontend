import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function debutDuMoisCourant() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function finDuMoisCourant() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
}

const LABELS_METHODE = { mtn_momo: 'MTN MoMo', moov_money: 'Moov Money', especes: 'Espèces', virement: 'Virement' };

const navBtn = 'whitespace-nowrap rounded-lg border border-slate-200 px-3.5 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50';
const navBtnActif = 'whitespace-nowrap rounded-lg border border-brand-600 bg-brand-50 px-3.5 py-1.5 text-[13px] font-semibold text-brand-700';

export default function SuperAdminRapportFinancier() {
  const [debut, setDebut] = useState(debutDuMoisCourant());
  const [fin, setFin] = useState(finDuMoisCourant());
  const [paiements, setPaiements] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [telechargement, setTelechargement] = useState(null); // 'csv' | 'pdf' | null
  const { deconnecter } = useAuth();
  const navigate = useNavigate();

  // eslint-disable-next-line
  useEffect(() => { chargerApercu(); }, []);

  async function chargerApercu() {
    setChargement(true);
    try {
      const r = await api.get('/superadmin/paiements', { params: { debut, fin } });
      setPaiements(r.data.filter(p => p.statut === 'reussi'));
    } catch (e) {
      console.error(e);
    } finally {
      setChargement(false);
    }
  }

  // Le token JWT est envoyé en en-tête Authorization (pas en cookie), donc un lien <a href>
  // classique vers l'API ne fonctionnerait pas — on télécharge via axios (authentifié), puis on
  // déclenche le téléchargement du navigateur à partir du blob reçu.
  async function exporter(format) {
    setTelechargement(format);
    try {
      const r = await api.get('/superadmin/paiements/export', {
        params: { format, debut, fin },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const lien = document.createElement('a');
      lien.href = url;
      lien.download = `rapport-financier_${debut}_au_${fin}.${format}`;
      document.body.appendChild(lien);
      lien.click();
      lien.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setTelechargement(null);
    }
  }

  function formaterMontant(n) {
    return parseInt(n || 0).toLocaleString('fr-FR') + ' FCFA';
  }
  function formaterDate(d) {
    return new Date(d).toLocaleDateString('fr-FR');
  }

  const totalMontant = paiements.reduce((s, p) => s + parseInt(p.montant || 0), 0);
  const totalCommission = paiements.reduce((s, p) => s + parseInt(p.commission_renteasy || 0), 0);

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
          <button className={navBtnActif}>Rapport financier</button>
          <button className={navBtn} onClick={() => navigate('/superadmin/rappels')}>Rappels</button>
          <button className={navBtn} onClick={() => navigate('/superadmin/erreurs')}>Erreurs</button>
          <button className="whitespace-nowrap rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50" onClick={deconnecter}>Déconnexion</button>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-slate-900">Rapport financier</h2>
          <span className="rounded-full border border-purple-200 bg-purple-50 px-4 py-1.5 text-sm font-semibold text-purple-700">{paiements.length} paiement(s)</span>
        </div>

        <div className="mb-5 flex flex-wrap items-end gap-3 rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 p-4 shadow-card">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500">Du</label>
            <input className="rounded-xl border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30" type="date" value={debut} onChange={e => setDebut(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500">Au</label>
            <input className="rounded-xl border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30" type="date" value={fin} onChange={e => setFin(e.target.value)} />
          </div>
          <button className="h-[38px] rounded-xl border border-brand-300 bg-brand-50 px-4 text-[13px] font-semibold text-brand-700" onClick={chargerApercu} disabled={chargement}>
            {chargement ? 'Chargement...' : 'Actualiser'}
          </button>
          <div className="flex-1" />
          <button className="h-[38px] rounded-xl bg-brand-600 px-4 text-[13px] font-semibold text-white hover:bg-brand-700 disabled:opacity-60" onClick={() => exporter('csv')} disabled={telechargement !== null || paiements.length === 0}>
            {telechargement === 'csv' ? 'Génération...' : '⬇️ Export CSV'}
          </button>
          <button className="h-[38px] rounded-xl bg-red-600 px-4 text-[13px] font-semibold text-white hover:bg-red-700 disabled:opacity-60" onClick={() => exporter('pdf')} disabled={telechargement !== null || paiements.length === 0}>
            {telechargement === 'pdf' ? 'Génération...' : '⬇️ Export PDF'}
          </button>
        </div>

        <div className="mb-5 flex gap-4">
          <div className="flex-1 rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 p-4 shadow-card">
            <div className="mb-1.5 text-[13px] text-slate-400">Total encaissé</div>
            <div className="text-2xl font-extrabold text-emerald-600">{formaterMontant(totalMontant)}</div>
          </div>
          <div className="flex-1 rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 p-4 shadow-card">
            <div className="mb-1.5 text-[13px] text-slate-400">Commissions RentEasy</div>
            <div className="text-2xl font-extrabold text-purple-600">{formaterMontant(totalCommission)}</div>
          </div>
        </div>

        {chargement ? (
          <p className="py-10 text-center text-slate-400">Chargement...</p>
        ) : paiements.length === 0 ? (
          <div className="rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 py-16 text-center text-slate-400 shadow-card">Aucun paiement encaissé sur cette période</div>
        ) : (
          <>
          <p className="mb-1.5 text-[11px] text-slate-400 sm:hidden">↔ Faites glisser pour voir toutes les colonnes</p>
          <div className="overflow-x-auto rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 shadow-card">
            <div className="grid min-w-[760px] grid-cols-[0.9fr_1.6fr_1.2fr_1.2fr_1fr_1fr_1fr] bg-purple-50 px-5 py-3.5 text-[11px] font-bold uppercase tracking-wide text-purple-700">
              <span>Date</span>
              <span>Bien</span>
              <span>Locataire</span>
              <span>Propriétaire</span>
              <span>Méthode</span>
              <span>Montant</span>
              <span>Commission</span>
            </div>
            {paiements.map(p => (
              <div key={p.id} className="grid min-w-[760px] grid-cols-[0.9fr_1.6fr_1.2fr_1.2fr_1fr_1fr_1fr] items-center border-t border-slate-50 px-5 py-3.5 text-sm">
                <div className="text-[13px] text-slate-400">{formaterDate(p.date_paiement)}</div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{p.adresse}</div>
                  <div className="mt-0.5 text-xs text-slate-400">{p.ville}</div>
                </div>
                <div className="text-[13px] text-slate-700">{p.locataire_nom}</div>
                <div className="text-[13px] text-slate-700">{p.proprietaire_nom}</div>
                <div className="text-[13px] text-slate-400">{LABELS_METHODE[p.methode] || p.methode}</div>
                <div className="font-bold text-emerald-600">{formaterMontant(p.montant)}</div>
                <div className="font-semibold text-purple-600">{formaterMontant(p.commission_renteasy)}</div>
              </div>
            ))}
          </div>
          </>
        )}
      </div>
    </div>
  );
}
