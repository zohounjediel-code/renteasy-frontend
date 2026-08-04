import { useRef, useState, useEffect } from 'react';

// Pavé de signature dessinée à la souris ou au doigt.
// Appelle onChange(dataURL | null) à chaque trait, et onChange(null) quand c'est effacé.
export default function SignaturePad({ onChange, largeur = 400, hauteur = 150 }) {
  const canvasRef = useRef(null);
  const [enTrainDeDessiner, setEnTrainDeDessiner] = useState(false);
  const [aSigne, setASigne] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#0a0a0f';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  function getPos(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const point = e.touches ? e.touches[0] : e;
    return {
      x: (point.clientX - rect.left) * scaleX,
      y: (point.clientY - rect.top) * scaleY,
    };
  }

  function demarrer(e) {
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setEnTrainDeDessiner(true);
  }

  function dessiner(e) {
    if (!enTrainDeDessiner) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!aSigne) setASigne(true);
  }

  function arreter() {
    if (!enTrainDeDessiner) return;
    setEnTrainDeDessiner(false);
    if (onChange) onChange(canvasRef.current.toDataURL('image/png'));
  }

  function effacer() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setASigne(false);
    if (onChange) onChange(null);
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={largeur}
        height={hauteur}
        style={{ width: '100%', maxWidth: `${largeur}px`, height: `${hauteur}px`, background: '#fff', borderRadius: '8px', border: '1.5px dashed rgba(124,58,237,0.4)', cursor: 'crosshair', touchAction: 'none', display: 'block' }}
        onMouseDown={demarrer}
        onMouseMove={dessiner}
        onMouseUp={arreter}
        onMouseLeave={arreter}
        onTouchStart={demarrer}
        onTouchMove={dessiner}
        onTouchEnd={arreter}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
        <span style={{ fontSize: '11px', color: aSigne ? '#10b981' : '#6b7280' }}>
          {aSigne ? '✓ Signature enregistrée' : 'Dessinez votre signature ci-dessus'}
        </span>
        <button
          type="button"
          onClick={effacer}
          style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#9ca3af', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', cursor: 'pointer' }}
        >
          🗑️ Effacer
        </button>
      </div>
    </div>
  );
}
