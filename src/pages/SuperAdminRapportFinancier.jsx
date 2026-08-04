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

export default function SuperAdminRapportFinancier() {
  const [debut, setDebut] = useState(debutDuMoisCourant());
  const [fin, setFin] = useState(finDuMoisCourant());
  const [paiements, setPaiements] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [telechargement, setTelechargement] = useState(null); // 'csv' | 'pdf' | null
  const { deconnecter } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { chargerApercu(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
          <button style={s.navBtn} onClick={() => navigate('/superadmin/journal')}>Journal</button>
          <button style={s.navBtn} onClick={() => navigate('/superadmin/parametres')}>Paramètres</button>
          <button style={s.navBtn} onClick={() => navigate('/superadmin/moderation')}>Modération</button>
          <button style={{ ...s.navBtn, ...s.navBtnActif }}>Rapport financier</button>
          <button style={s.navBtn} onClick={() => navigate('/superadmin/rappels')}>Rappels</button>
          <button style={s.navBtn} onClick={() => navigate('/superadmin/erreurs')}>Erreurs</button>
          <button style={s.navDeconnexion} onClick={deconnecter}>Déconnexion</button>
        </div>
      </nav>

      <div style={s.contenu}>
        <div style={s.entete}>
          <h2 style={s.titre}>Rapport financier</h2>
          <span style={s.compteur}>{paiements.length} paiement(s)</span>
        </div>

        <div style={s.carteFiltres}>
          <div style={s.champGroupe}>
            <label style={s.champLabel}>Du</label>
            <input style={s.input} type="date" value={debut} onChange={e => setDebut(e.target.value)} />
          </div>
          <div style={s.champGroupe}>
            <label style={s.champLabel}>Au</label>
            <input style={s.input} type="date" value={fin} onChange={e => setFin(e.target.value)} />
          </div>
          <button style={s.btnFiltrer} onClick={chargerApercu} disabled={chargement}>
            {chargement ? 'Chargement...' : 'Actualiser'}
          </button>
          <div style={{ flex: 1 }} />
          <button style={s.btnExportCSV} onClick={() => exporter('csv')} disabled={telechargement !== null || paiements.length === 0}>
            {telechargement === 'csv' ? 'Génération...' : '⬇️ Export CSV'}
          </button>
          <button style={s.btnExportPDF} onClick={() => exporter('pdf')} disabled={telechargement !== null || paiements.length === 0}>
            {telechargement === 'pdf' ? 'Génération...' : '⬇️ Export PDF'}
          </button>
        </div>

        <div style={s.resume}>
          <div style={s.resumeCarte}>
            <div style={s.resumeLabel}>Total encaissé</div>
            <div style={{ ...s.resumeValeur, color: '#10b981' }}>{formaterMontant(totalMontant)}</div>
          </div>
          <div style={s.resumeCarte}>
            <div style={s.resumeLabel}>Commissions RentEasy</div>
            <div style={{ ...s.resumeValeur, color: '#7c3aed' }}>{formaterMontant(totalCommission)}</div>
          </div>
        </div>

        {chargement ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '40px' }}>Chargement...</p>
        ) : paiements.length === 0 ? (
          <div style={s.vide}>Aucun paiement encaissé sur cette période</div>
        ) : (
          <div style={s.tableau}>
            <div style={s.tableauEntete}>
              <span>Date</span>
              <span>Bien</span>
              <span>Locataire</span>
              <span>Propriétaire</span>
              <span>Méthode</span>
              <span>Montant</span>
              <span>Commission</span>
            </div>
            {paiements.map(p => (
              <div key={p.id} style={s.tableauLigne}>
                <div style={{ color: '#9ca3af', fontSize: '13px' }}>{formaterDate(p.date_paiement)}</div>
                <div>
                  <div style={s.cellPrincipal}>{p.adresse}</div>
                  <div style={s.cellSous}>{p.ville}</div>
                </div>
                <div style={{ fontSize: '13px' }}>{p.locataire_nom}</div>
                <div style={{ fontSize: '13px' }}>{p.proprietaire_nom}</div>
                <div style={{ color: '#9ca3af', fontSize: '13px' }}>{LABELS_METHODE[p.methode] || p.methode}</div>
                <div style={{ color: '#10b981', fontWeight: '700' }}>{formaterMontant(p.montant)}</div>
                <div style={{ color: '#7c3aed', fontWeight: '600' }}>{formaterMontant(p.commission_renteasy)}</div>
              </div>
            ))}
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
  navMenu: { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' },
  navBtn: { background: 'transparent', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa', cursor: 'pointer', padding: '7px 14px', borderRadius: '6px', fontSize: '13px' },
  navBtnActif: { background: 'rgba(124,58,237,0.2)', border: '1px solid #7c3aed', color: '#c4b5fd' },
  navDeconnexion: { background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', cursor: 'pointer', padding: '7px 14px', borderRadius: '6px', fontSize: '13px' },
  contenu: { padding: '32px 24px', maxWidth: '1300px', margin: '0 auto' },
  entete: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  titre: { margin: 0, fontSize: '24px', fontWeight: '800', background: 'linear-gradient(135deg,#c4b5fd,#f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  compteur: { background: 'rgba(124,58,237,0.2)', color: '#a78bfa', padding: '6px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: '600', border: '1px solid rgba(124,58,237,0.3)' },
  carteFiltres: { display: 'flex', gap: '12px', alignItems: 'flex-end', marginBottom: '20px', flexWrap: 'wrap', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px' },
  champGroupe: { display: 'flex', flexDirection: 'column', gap: '6px' },
  champLabel: { fontSize: '12px', color: '#9ca3af', fontWeight: '600' },
  input: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: '#e2e8f0', padding: '9px 12px', borderRadius: '8px', fontSize: '13px', outline: 'none' },
  btnFiltrer: { background: 'rgba(124,58,237,0.2)', border: '1px solid #7c3aed', color: '#c4b5fd', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', height: '38px' },
  btnExportCSV: { background: 'linear-gradient(135deg,#059669,#047857)', color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', height: '38px' },
  btnExportPDF: { background: 'linear-gradient(135deg,#dc2626,#991b1b)', color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', height: '38px' },
  resume: { display: 'flex', gap: '16px', marginBottom: '20px' },
  resumeCarte: { flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px' },
  resumeLabel: { color: '#9ca3af', fontSize: '13px', marginBottom: '6px' },
  resumeValeur: { fontSize: '22px', fontWeight: '800' },
  vide: { textAlign: 'center', color: '#6b7280', padding: '60px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' },
  tableau: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden', overflowX: 'auto' },
  tableauEntete: { display: 'grid', gridTemplateColumns: '0.9fr 1.6fr 1.2fr 1.2fr 1fr 1fr 1fr', minWidth: '760px', padding: '14px 20px', background: 'rgba(124,58,237,0.1)', fontSize: '11px', fontWeight: '700', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.5px' },
  tableauLigne: { display: 'grid', gridTemplateColumns: '0.9fr 1.6fr 1.2fr 1.2fr 1fr 1fr 1fr', minWidth: '760px', padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '14px', alignItems: 'center' },
  cellPrincipal: { fontWeight: '600', color: '#e2e8f0', fontSize: '14px' },
  cellSous: { color: '#6b7280', fontSize: '12px', marginTop: '2px' },
};
