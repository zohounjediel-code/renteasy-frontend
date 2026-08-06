import { useState } from 'react';

const API_BASE = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

export function estVideo(chemin) {
  return /\.(mp4|webm|mov|quicktime)$/i.test(chemin);
}

// Bouton "Voir" qui ouvre une visionneuse plein écran pour parcourir photos/vidéos
export default function Lightbox({ medias }) {
  const [index, setIndex] = useState(null);

  if (!medias || medias.length === 0) return null;

  function precedent(e) {
    e.stopPropagation();
    setIndex(i => (i - 1 + medias.length) % medias.length);
  }
  function suivant(e) {
    e.stopPropagation();
    setIndex(i => (i + 1) % medias.length);
  }

  return (
    <>
      <button
        type="button"
        onClick={e => { e.stopPropagation(); setIndex(0); }}
        style={sLocal.btnVoir}
      >
        👁️ Voir ({medias.length})
      </button>

      {index !== null && (
        <div style={sLocal.overlay} onClick={() => setIndex(null)}>
          <button style={sLocal.btnFermer} onClick={() => setIndex(null)}>✕</button>

          {medias.length > 1 && (
            <button style={{ ...sLocal.btnNav, left: '16px' }} onClick={precedent}>‹</button>
          )}

          <div style={sLocal.mediaWrapper} onClick={e => e.stopPropagation()}>
            {estVideo(medias[index]) ? (
              <video src={`${API_BASE}${medias[index]}`} controls autoPlay style={sLocal.media} />
            ) : (
              <img src={`${API_BASE}${medias[index]}`} alt="Aperçu" style={sLocal.media} />
            )}
            <p style={sLocal.compteur}>{index + 1} / {medias.length}</p>
          </div>

          {medias.length > 1 && (
            <button style={{ ...sLocal.btnNav, right: '16px' }} onClick={suivant}>›</button>
          )}
        </div>
      )}
    </>
  );
}

const sLocal = {
  btnVoir: { background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.92)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  btnFermer: { position: 'absolute', top: '20px', right: '24px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '50%', width: '36px', height: '36px', fontSize: '18px', cursor: 'pointer' },
  btnNav: { position: 'absolute', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '50%', width: '44px', height: '44px', fontSize: '26px', cursor: 'pointer', lineHeight: '44px', padding: 0 },
  mediaWrapper: { maxWidth: '90vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' },
  media: { maxWidth: '90vw', maxHeight: '78vh', borderRadius: '8px', objectFit: 'contain' },
  compteur: { color: '#9ca3af', fontSize: '13px', margin: 0 },
};
