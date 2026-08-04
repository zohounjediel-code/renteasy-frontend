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
    <div style={s.page}>
      <nav style={s.nav} className="re-nav">
        <div style={s.navLogo} onClick={() => navigate('/superadmin/dashboard')}>
          ⚡ RentEasy <span style={s.navBenin}>Bénin</span>
          <span style={s.superBadge}>SUPER ADMIN</span>
        </div>
        <div style={s.navMenu}>
          <button style={s.navBtn} onClick={() => navigate('/superadmin/dashboard')}>Dashboard</button>
          <button style={s.navBtn} onClick={() => navigate('/superadmin/utilisateurs')}>Utilisateurs</button>
          <button style={s.navBtn} onClick={() => navigate('/superadmin/contrats')}>Contrats</button>
          <button style={s.navBtn} onClick={() => navigate('/superadmin/biens')}>Biens</button>
          <button style={s.navBtn} onClick={() => navigate('/superadmin/locataires')}>Locataires</button>
          <button style={{ ...s.navBtn, ...s.navBtnActif }}>Journal</button>
          <button style={s.navBtn} onClick={() => navigate('/superadmin/parametres')}>Paramètres</button>
          <button style={s.navBtn} onClick={() => navigate('/superadmin/moderation')}>Modération</button>
          <button style={s.navBtn} onClick={() => navigate('/superadmin/rapport-financier')}>Rapport financier</button>
          <button style={s.navBtn} onClick={() => navigate('/superadmin/rappels')}>Rappels</button>
          <button style={s.navBtn} onClick={() => navigate('/superadmin/erreurs')}>Erreurs</button>
          <button style={s.navDeconnexion} onClick={deconnecter}>Déconnexion</button>
        </div>
      </nav>

      <div style={s.contenu}>
        <div style={s.entete}>
          <div>
            <h2 style={s.titre}>Journal d'activité global</h2>
            <p style={s.sousTitre}>Toutes les actions des agents (en délégation) et des admins/super admins, horodatées</p>
          </div>
          <span style={s.compteur}>{journalFiltre.length} action(s)</span>
        </div>

        <div style={s.filtres}>
          <input
            style={s.recherche}
            placeholder="🔍 Acteur, cible, description..."
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { valeur: 'tous', label: 'Toutes' },
              { valeur: 'admin', label: '🛡️ Admin' },
              { valeur: 'agent', label: '👔 Agent' },
            ].map(f => (
              <button
                key={f.valeur}
                style={{ ...s.filtreBouton, background: filtre === f.valeur ? '#7c3aed' : 'rgba(255,255,255,0.05)', color: filtre === f.valeur ? '#fff' : '#9ca3af', border: filtre === f.valeur ? '1px solid #7c3aed' : '1px solid rgba(255,255,255,0.1)' }}
                onClick={() => setFiltre(f.valeur)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {chargement ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '40px' }}>Chargement...</p>
        ) : journalFiltre.length === 0 ? (
          <div style={s.vide}>Aucune action trouvée</div>
        ) : (
          <div style={s.tableau}>
            <div style={s.tableauEntete}>
              <span>Date</span>
              <span>Acteur</span>
              <span>Action</span>
              <span>Cible</span>
            </div>
            {journalFiltre.map(j => {
              const estActionAdmin = ACTIONS_ADMIN.includes(j.type_action);
              return (
                <div key={j.id} style={s.tableauLigne}>
                  <div style={{ color: '#9ca3af', fontSize: '13px' }}>{formaterDateHeure(j.created_at)}</div>
                  <div>
                    <div style={s.cellPrincipal}>{j.acteur_nom}</div>
                    <div style={{ ...s.badgeRole, color: estActionAdmin ? '#f59e0b' : '#06b6d4' }}>
                      {(j.acteur_role || '').replace(/,/g, ', ')}
                    </div>
                  </div>
                  <div>
                    <div style={s.cellPrincipal}>{LABELS_TYPE_ACTION[j.type_action] || j.type_action}</div>
                    <div style={s.cellSous}>{j.description}</div>
                  </div>
                  <div style={{ color: '#9ca3af', fontSize: '13px' }}>{j.cible_nom || '—'}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: 'linear-gradient(135deg,#0a0a0f 0%,#0f0a1e 50%,#0a0f0a 100%)', fontFamily: "'Segoe UI',sans-serif", color: '#e2e8f0' },
  nav: { background: 'rgba(10,10,20,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(124,58,237,0.3)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' },
  navLogo: { display: 'flex', alignItems: 'center', gap: '10px', color: '#e2e8f0', fontSize: '18px', fontWeight: '700', cursor: 'pointer' },
  navBenin: { color: '#f59e0b' },
  superBadge: { background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: '#fff', fontSize: '10px', padding: '3px 10px', borderRadius: '20px', fontWeight: '800', letterSpacing: '1px' },
  navMenu: { display: 'flex', gap: '8px', alignItems: 'center' },
  navBtn: { background: 'transparent', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa', cursor: 'pointer', padding: '7px 14px', borderRadius: '6px', fontSize: '13px' },
  navBtnActif: { background: 'rgba(124,58,237,0.2)', border: '1px solid #7c3aed', color: '#c4b5fd' },
  navDeconnexion: { background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', cursor: 'pointer', padding: '7px 14px', borderRadius: '6px', fontSize: '13px' },
  contenu: { padding: '32px 24px', maxWidth: '1300px', margin: '0 auto' },
  entete: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  titre: { margin: 0, fontSize: '24px', fontWeight: '800', background: 'linear-gradient(135deg,#c4b5fd,#f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  sousTitre: { color: '#6b7280', margin: '6px 0 0', fontSize: '13px' },
  compteur: { background: 'rgba(124,58,237,0.2)', color: '#a78bfa', padding: '6px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: '600', border: '1px solid rgba(124,58,237,0.3)' },
  filtres: { display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' },
  recherche: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', padding: '10px 16px', borderRadius: '8px', fontSize: '14px', width: '320px', outline: 'none' },
  filtreBouton: { padding: '6px 16px', borderRadius: '20px', fontSize: '13px', cursor: 'pointer', fontWeight: '600' },
  vide: { textAlign: 'center', color: '#6b7280', padding: '60px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' },
  tableau: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden', overflowX: 'auto' },
  tableauEntete: { display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 2fr 1.3fr', minWidth: '560px', padding: '14px 20px', background: 'rgba(124,58,237,0.1)', fontSize: '11px', fontWeight: '700', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.5px' },
  tableauLigne: { display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 2fr 1.3fr', minWidth: '560px', padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '14px', alignItems: 'center' },
  cellPrincipal: { fontWeight: '600', color: '#e2e8f0', fontSize: '14px' },
  cellSous: { color: '#6b7280', fontSize: '12px', marginTop: '2px' },
  badgeRole: { fontSize: '11px', fontWeight: '600', textTransform: 'capitalize', marginTop: '2px' },
};
