import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// Libellés lisibles pour chaque type_action déjà utilisé dans le code (agents en délégation +
// actions admin/super_admin). Un type_action non listé ici s'affiche tel quel, en repli.
const LABELS_TYPE_ACTION = {
  creation_bien: '🏠 Création de bien',
  ajout_photos: '📷 Ajout de photos',
  creation_contrat: '📋 Création de contrat',
  approbation_demande: '✅ Approbation de demande',
  refus_demande: '❌ Refus de demande',
  enregistrement_paiement: '💰 Enregistrement de paiement',
  paiement_echeance: '💰 Paiement d\'échéance',
  paiement_partiel_echeance: '💰 Paiement partiel',
  ajout_locataire: '👤 Ajout de locataire',
  compte_active: '🔓 Activation de compte',
  compte_desactive: '🔒 Désactivation de compte',
  reassignation_agent: '🔁 Réassignation d\'agent',
  creation_compte_agent: '👔 Création de compte agent',
  creation_compte_admin: '🛡️ Création de compte admin',
};

// Catégorie visuelle : une action d'admin/super_admin (gestion de comptes) se distingue d'une
// action d'agent en délégation (gestion des biens/contrats/paiements d'un propriétaire) — c'est
// justement cette distinction qui rend le journal utile pour détecter un abus d'un côté ou de l'autre.
const ACTIONS_ADMIN = ['compte_active', 'compte_desactive', 'reassignation_agent', 'creation_compte_agent', 'creation_compte_admin'];

const navBtn = 'whitespace-nowrap rounded-lg border border-slate-200 px-3.5 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50';
const navBtnActif = 'whitespace-nowrap rounded-lg border border-brand-600 bg-brand-50 px-3.5 py-1.5 text-[13px] font-semibold text-brand-700';

export default function SuperAdminJournal() {
  const [journal, setJournal] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [filtre, setFiltre] = useState('tous');
  const { deconnecter } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { chargerJournal(); }, []);

  async function chargerJournal() {
    try {
      const r = await api.get('/superadmin/journal');
      setJournal(r.data);
    } catch (e) {
      console.error(e);
    } finally {
      setChargement(false);
    }
  }

  function formaterDateHeure(d) {
    return new Date(d).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
  }

  const journalFiltre = journal.filter(j => {
    const estActionAdmin = ACTIONS_ADMIN.includes(j.type_action);
    const matchFiltre = filtre === 'tous' || (filtre === 'admin' && estActionAdmin) || (filtre === 'agent' && !estActionAdmin);
    const matchRecherche = !recherche ||
      j.acteur_nom?.toLowerCase().includes(recherche.toLowerCase()) ||
      j.cible_nom?.toLowerCase().includes(recherche.toLowerCase()) ||
      j.description?.toLowerCase().includes(recherche.toLowerCase());
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
          <button className={navBtn} onClick={() => navigate('/superadmin/contrats')}>Contrats</button>
          <button className={navBtn} onClick={() => navigate('/superadmin/biens')}>Biens</button>
          <button className={navBtn} onClick={() => navigate('/superadmin/locataires')}>Locataires</button>
          <button className={navBtnActif}>Journal</button>
          <button className={navBtn} onClick={() => navigate('/superadmin/parametres')}>Paramètres</button>
          <button className={navBtn} onClick={() => navigate('/superadmin/moderation')}>Modération</button>
          <button className={navBtn} onClick={() => navigate('/superadmin/rapport-financier')}>Rapport financier</button>
          <button className={navBtn} onClick={() => navigate('/superadmin/rappels')}>Rappels</button>
          <button className={navBtn} onClick={() => navigate('/superadmin/erreurs')}>Erreurs</button>
          <button className="whitespace-nowrap rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50" onClick={deconnecter}>Déconnexion</button>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Journal d'activité global</h2>
            <p className="mt-1.5 text-[13px] text-slate-500">Toutes les actions des agents (en délégation) et des admins/super admins, horodatées</p>
          </div>
          <span className="rounded-full border border-purple-200 bg-purple-50 px-4 py-1.5 text-sm font-semibold text-purple-700">{journalFiltre.length} action(s)</span>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-3">
          <input
            className="w-[320px] rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
            placeholder="🔍 Acteur, cible, description..."
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
          />
          <div className="flex gap-2">
            {[
              { valeur: 'tous', label: 'Toutes' },
              { valeur: 'admin', label: '🛡️ Admin' },
              { valeur: 'agent', label: '👔 Agent' },
            ].map(f => (
              <button
                key={f.valeur}
                className={`rounded-full border px-4 py-1.5 text-[13px] font-semibold ${filtre === f.valeur ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 bg-white text-slate-500'}`}
                onClick={() => setFiltre(f.valeur)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {chargement ? (
          <p className="py-10 text-center text-slate-400">Chargement...</p>
        ) : journalFiltre.length === 0 ? (
          <div className="rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 py-16 text-center text-slate-400 shadow-card">Aucune action trouvée</div>
        ) : (
          <>
          <p className="mb-1.5 text-[11px] text-slate-400 sm:hidden">↔ Faites glisser pour voir toutes les colonnes</p>
          <div className="overflow-x-auto rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 shadow-card">
            <div className="grid min-w-[560px] grid-cols-[1.2fr_1.5fr_2fr_1.3fr] bg-purple-50 px-5 py-3.5 text-[11px] font-bold uppercase tracking-wide text-purple-700">
              <span>Date</span>
              <span>Acteur</span>
              <span>Action</span>
              <span>Cible</span>
            </div>
            {journalFiltre.map(j => {
              const estActionAdmin = ACTIONS_ADMIN.includes(j.type_action);
              return (
                <div key={j.id} className="grid min-w-[560px] grid-cols-[1.2fr_1.5fr_2fr_1.3fr] items-center border-t border-slate-50 px-5 py-3.5 text-sm">
                  <div className="text-[13px] text-slate-400">{formaterDateHeure(j.created_at)}</div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{j.acteur_nom}</div>
                    <div className={`mt-0.5 text-[11px] font-semibold capitalize ${estActionAdmin ? 'text-accent-600' : 'text-cyan-600'}`}>
                      {(j.acteur_role || '').replace(/,/g, ', ')}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{LABELS_TYPE_ACTION[j.type_action] || j.type_action}</div>
                    <div className="mt-0.5 text-xs text-slate-400">{j.description}</div>
                  </div>
                  <div className="text-[13px] text-slate-400">{j.cible_nom || '—'}</div>
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
