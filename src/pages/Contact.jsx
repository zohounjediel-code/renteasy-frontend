import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Contact() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nom: '', email: '', sujet: '', message: '' });
  const [envoye, setEnvoye] = useState(false);
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);

  function majChamp(champ, valeur) {
    setForm((f) => ({ ...f, [champ]: valeur }));
  }

  async function handleEnvoi() {
    if (!form.nom || !form.email || !form.message) return;
    setErreur('');
    setChargement(true);
    try {
      await api.post('/contact', form);
      setEnvoye(true);
    } catch (err) {
      setErreur(err.response?.data?.message || "Impossible d'envoyer le message. Réessayez dans un instant.");
    } finally {
      setChargement(false);
    }
  }

  return (
    <div style={s.page}>
      <div style={s.conteneur}>
        <div style={s.entete}>
          <span style={s.lienRetour} onClick={() => navigate(-1)}>← Retour</span>
          <h1 style={s.titre}>Contact & Support</h1>
          <p style={s.sousTitre}>
            Une question, un litige de paiement, ou une demande concernant vos données
            personnelles ? Écrivez-nous, nous répondons dans les meilleurs délais.
          </p>
        </div>

        {envoye ? (
          <div style={s.confirmation}>
            ✅ Votre message a bien été envoyé. Nous vous répondrons à l'adresse indiquée.
            <div>
              <button style={s.bouton} onClick={() => navigate('/connexion')}>Retour à la connexion</button>
            </div>
          </div>
        ) : (
          <div style={s.form}>
            <label style={s.label}>Nom</label>
            <input style={s.input} value={form.nom} onChange={(e) => majChamp('nom', e.target.value)} placeholder="Votre nom" />

            <label style={s.label}>Adresse email</label>
            <input style={s.input} type="email" value={form.email} onChange={(e) => majChamp('email', e.target.value)} placeholder="votre@email.com" />

            <label style={s.label}>Sujet</label>
            <input style={s.input} value={form.sujet} onChange={(e) => majChamp('sujet', e.target.value)} placeholder="Objet de votre message (optionnel)" />

            <label style={s.label}>Message</label>
            <textarea style={s.textarea} value={form.message} onChange={(e) => majChamp('message', e.target.value)} placeholder="Décrivez votre demande..." rows={6} />

            {erreur && <p style={s.erreur}>{erreur}</p>}

            <button
              style={{ ...s.bouton, opacity: chargement || !form.nom || !form.email || !form.message ? 0.7 : 1 }}
              onClick={handleEnvoi}
              disabled={chargement || !form.nom || !form.email || !form.message}
            >
              {chargement ? 'Envoi...' : 'Envoyer le message'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: '#f7f7f9', fontFamily: "'Segoe UI', sans-serif", padding: '40px 20px' },
  conteneur: { maxWidth: '560px', margin: '0 auto', background: '#fff', borderRadius: '12px', padding: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' },
  entete: { marginBottom: '24px' },
  lienRetour: { color: '#e8a020', fontWeight: '600', fontSize: '13px', cursor: 'pointer', display: 'inline-block', marginBottom: '16px' },
  titre: { fontSize: '24px', fontWeight: '800', color: '#1a3a5c', margin: '0 0 8px' },
  sousTitre: { color: '#666', fontSize: '14px', lineHeight: '1.6', margin: 0 },
  form: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#333', marginTop: '10px' },
  input: { padding: '12px 16px', borderRadius: '8px', border: '1.5px solid #ddd', fontSize: '15px', outline: 'none' },
  textarea: { padding: '12px 16px', borderRadius: '8px', border: '1.5px solid #ddd', fontSize: '15px', outline: 'none', fontFamily: 'inherit', resize: 'vertical' },
  erreur: { color: '#e03131', fontSize: '13px', background: '#fff5f5', padding: '10px', borderRadius: '6px', margin: '10px 0 0' },
  bouton: { background: 'linear-gradient(135deg, #e8a020, #c47f10)', color: '#fff', border: 'none', borderRadius: '8px', padding: '14px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginTop: '16px', width: '100%' },
  confirmation: { background: '#f0faf3', border: '1px solid #a3d9b1', borderRadius: '8px', padding: '20px', fontSize: '14px', color: '#1a5c33', lineHeight: '1.6', textAlign: 'center' },
};
