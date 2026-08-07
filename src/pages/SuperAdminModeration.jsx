import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const LABELS_MOTIFS = {
  photos_non_conformes: 'Photos non conformes au bien',
  coordonnees_trompeuses: 'Coordonnées trompeuses',
  annonce_en_double: 'Annonce en double',
  bien_indisponible: 'Bien déjà loué / indisponible',
  contenu_inapproprie: 'Contenu inapproprié',
  autre: 'Autre',
};

const navBtn = 'whitespace-nowrap rounded-lg border border-slate-200 px-3.5 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50';
const navBtnActif = 'whitespace-nowrap rounded-lg border border-brand-600 bg-brand-50 px-3.5 py-1.5 text-[13px] font-semibold text-brand-700';

export default function SuperAdminModeration() {
  const [annonces, setAnnonces] = useState([]);
  const [signalements, setSignalements] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [filtre, setFiltre] = useState('signalements');
  const [modalRetrait, setModalRetrait] = useState(null);
  const [raison, setRaison] = useState('');
  const [envoi, setEnvoi] = useState(null);
  const { deconnecter } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { chargerDonnees(); }, []);

  async function chargerDonnees() {
    try {
      const [rAnnonces, rSignalements] = await Promise.all([
        api.get('/superadmin/marche'),
        api.get('/superadmin/signalements'),
      ]);
      setAnnonces(rAnnonces.data);
      setSignalements(rSignalements.data);
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

  async function confirmerRetrait() {
    if (!raison.trim()) return;
    setEnvoi(modalRetrait.id);
    try {
      await api.patch(`/superadmin/marche/${modalRetrait.id}/moderer`, { masquer: true, raison: raison.trim() });
      setModalRetrait(null);
      setRaison('');
      chargerDonnees();
    } catch (e) {
      console.error(e);
    } finally {
      setEnvoi(null);
    }
  }

  async function republier(id) {
    setEnvoi(id);
    try {
      await api.patch(`/superadmin/marche/${id}/moderer`, { masquer: false });
      chargerDonnees();
    } catch (e) {
      console.error(e);
    } finally {
      setEnvoi(null);
    }
  }

  // Ouvre la même modale de retrait que depuis la grille d'annonces, mais à partir d'une ligne
  // de signalement — masquer l'annonce résout automatiquement CE signalement et tous les autres
  // en attente sur le même bien (cf. modererAnnonce côté backend).
  function ouvrirRetraitDepuisSignalement(s) {
    setModalRetrait({ id: s.bien_id, adresse: s.adresse, proprietaire_nom: s.proprietaire_nom });
    setRaison(`Signalement d'un utilisateur : ${LABELS_MOTIFS[s.motif] || s.motif}${s.description ? ` — ${s.description}` : ''}`);
  }

  async function rejeterSignalement(id) {
    setEnvoi(id);
    try {
      await api.patch(`/superadmin/signalements/${id}`, { action: 'rejete' });
      chargerDonnees();
    } catch (e) {
      console.error(e);
    } finally {
      setEnvoi(null);
    }
  }

  const annoncesFiltrees = annonces.filter(a => {
    if (filtre === 'masquees') return a.moderation_masque;
    if (filtre === 'publiees') return !a.moderation_masque;
    return true;
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
          <button className={navBtnActif}>Modération</button>
          <button className={navBtn} onClick={() => navigate('/superadmin/rapport-financier')}>Rapport financier</button>
          <button className={navBtn} onClick={() => navigate('/superadmin/rappels')}>Rappels</button>
          <button className={navBtn} onClick={() => navigate('/superadmin/erreurs')}>Erreurs</button>
          <button className="whitespace-nowrap rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50" onClick={deconnecter}>Déconnexion</button>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Modération du marché</h2>
            <p className="mt-1.5 max-w-xl text-[13px] text-slate-500">Signalements des utilisateurs et annonces publiées par les propriétaires — retire une annonce inappropriée avec un motif, ou remets-en une en ligne.</p>
          </div>
          <span className="rounded-full border border-purple-200 bg-purple-50 px-4 py-1.5 text-sm font-semibold text-purple-700">{filtre === 'signalements' ? `${signalements.length} signalement(s)` : `${annoncesFiltrees.length} annonce(s)`}</span>
        </div>

        <div className="mb-5 flex gap-2">
          {[
            { valeur: 'signalements', label: `🚩 Signalements${signalements.length > 0 ? ` (${signalements.length})` : ''}` },
            { valeur: 'publiees', label: '✅ En ligne' },
            { valeur: 'masquees', label: '🚫 Retirées' },
            { valeur: 'toutes', label: 'Toutes' },
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

        {filtre === 'signalements' ? (
          chargement ? (
            <p className="py-10 text-center text-slate-400">Chargement...</p>
          ) : signalements.length === 0 ? (
            <div className="rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 py-16 text-center text-slate-400 shadow-card">Aucun signalement en attente 🎉</div>
          ) : (
            <div className="flex flex-col gap-3">
              {signalements.map(sig => (
                <div key={sig.id} className="flex items-start justify-between gap-4 rounded-2xl border border-red-100 bg-white p-5 shadow-card">
                  <div className="flex-1">
                    <div className="text-[15px] font-bold text-slate-900">{sig.adresse} <span className="text-xs font-normal text-slate-400">· {sig.ville} · N° {sig.numero_bien}</span></div>
                    <div className="mt-1.5">
                      <span className="rounded-full bg-accent-50 px-2.5 py-1 text-[11px] font-bold text-accent-700">{LABELS_MOTIFS[sig.motif] || sig.motif}</span>
                      {sig.moderation_masque && <span className="ml-2 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-600 whitespace-nowrap">🚫 Déjà retirée</span>}
                    </div>
                    {sig.description && <p className="my-2 text-[13px] italic text-slate-400">« {sig.description} »</p>}
                    <div className="text-xs text-slate-400">
                      Signalé par {sig.signale_par_nom} ({sig.signale_par_role}) le {formaterDate(sig.created_at)}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {!sig.moderation_masque && (
                      <button className="whitespace-nowrap rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-[13px] font-semibold text-red-600" onClick={() => ouvrirRetraitDepuisSignalement(sig)}>
                        🚫 Retirer l'annonce
                      </button>
                    )}
                    <button className="whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-slate-500" onClick={() => rejeterSignalement(sig.id)} disabled={envoi === sig.id}>
                      {envoi === sig.id ? '...' : 'Rejeter'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : chargement ? (
          <p className="py-10 text-center text-slate-400">Chargement...</p>
        ) : annoncesFiltrees.length === 0 ? (
          <div className="rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/50 py-16 text-center text-slate-400 shadow-card">Aucune annonce trouvée</div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
            {annoncesFiltrees.map(a => (
              <div key={a.id} className={`overflow-hidden rounded-2xl border bg-white shadow-card ${a.moderation_masque ? 'border-red-300' : 'border-slate-100'}`}>
                {a.photos?.[0] && <img src={a.photos[0]} alt="" className="h-40 w-full object-cover" />}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[15px] font-bold text-slate-900">{a.adresse}</div>
                      <div className="mt-0.5 text-xs text-slate-400">{a.ville} · {a.quartier} · N° {a.numero_bien}</div>
                    </div>
                    {a.moderation_masque && <span className="whitespace-nowrap rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-600">🚫 Retirée</span>}
                  </div>
                  <div className="mt-2.5 text-base font-bold text-accent-600">{formaterMontant(a.loyer_mensuel)}</div>
                  <div className="mt-1.5 text-[13px] text-brand-600">👤 {a.proprietaire_nom} · {a.proprietaire_telephone}</div>
                  {a.description_marche && <p className="mt-2.5 text-[13px] leading-relaxed text-slate-400">{a.description_marche}</p>}
                  <div className="mt-2.5 text-[11px] text-slate-400">Publiée le {formaterDate(a.created_at)}</div>

                  {a.moderation_masque && (
                    <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
                      <div className="mb-1 font-bold text-red-600">Motif du retrait ({a.moderation_par_nom}, {formaterDate(a.moderation_le)})</div>
                      <div>{a.moderation_raison}</div>
                    </div>
                  )}

                  <div className="mt-3.5">
                    {a.moderation_masque ? (
                      <button className="w-full rounded-xl border border-brand-300 bg-brand-50 px-3 py-2.5 text-[13px] font-semibold text-brand-700" onClick={() => republier(a.id)} disabled={envoi === a.id}>
                        {envoi === a.id ? 'En cours...' : '↩️ Remettre en ligne'}
                      </button>
                    ) : (
                      <button className="w-full rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-[13px] font-semibold text-red-600" onClick={() => setModalRetrait(a)} disabled={envoi === a.id}>
                        🚫 Retirer du marché
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalRetrait && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/50 p-5 backdrop-blur-sm" onClick={() => setModalRetrait(null)}>
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="mb-2 text-lg font-bold text-slate-900">Retirer cette annonce</h3>
            <p className="mb-4 text-sm text-slate-400">
              {modalRetrait.adresse} — {modalRetrait.proprietaire_nom} sera notifié par email avec le motif ci-dessous.
            </p>
            <textarea
              className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
              rows={4}
              placeholder="Motif du retrait (obligatoire) — ex : photos non conformes au bien, coordonnées trompeuses, annonce en doublon..."
              value={raison}
              onChange={e => setRaison(e.target.value)}
            />
            <div className="mt-4 flex gap-2.5">
              <button className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm text-slate-500 hover:bg-slate-50" onClick={() => { setModalRetrait(null); setRaison(''); }}>Annuler</button>
              <button className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60" onClick={confirmerRetrait} disabled={!raison.trim() || envoi === modalRetrait.id}>
                {envoi === modalRetrait.id ? 'Retrait...' : 'Confirmer le retrait'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
