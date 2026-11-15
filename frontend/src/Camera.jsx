import { useEffect, useRef, useState } from 'react';
import { loadTracker, render } from './engine';
import { api, session } from './api';

export default function Camera({ filters }) {
  const vid = useRef(), cv = useRef(), ref = useRef({});
  const [active, setActive] = useState({}), [status, setStatus] = useState('Loading AI model…');
  ref.current = active;

  useEffect(() => {
    let stop = false, stream, raf, frames = 0, t0 = performance.now();
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 }, audio: false });
        vid.current.srcObject = stream; await vid.current.play();
        const tracker = await loadTracker(); setStatus('Ready');
        const loop = () => {
          if (stop) return;
          const v = vid.current; let res;
          if (v.readyState >= 2) res = tracker.detectForVideo(v, performance.now());
          const a = ref.current;
          const ok = render(cv.current.getContext('2d'), v, res, { color: a.color?.config, overlay: a.overlay?.config, ai: a.ai?.config });
          frames++; const now = performance.now();
          if (now - t0 > 1000) { setStatus(`${ok ? 'Face found' : 'No face'} · ${frames} fps`); frames = 0; t0 = now; }
          raf = requestAnimationFrame(loop);
        };
        loop();
      } catch (e) { setStatus('Error: ' + (e.name === 'NotAllowedError' ? 'camera permission denied' : e.message)); }
    })();
    return () => { stop = true; cancelAnimationFrame(raf); stream?.getTracks().forEach(t => t.stop()); };
  }, []);

  const pick = f => {
    const k = f.type === 'color' ? 'color' : f.type === 'ai' ? 'ai' : 'overlay';   // one filter per category at a time
    setActive(a => ({ ...a, [k]: a[k]?._id === f._id ? null : f }));
    if (session.token) api('/usage', 'POST', { filterId: f._id }).catch(() => {});
  };
  const capture = async () => {
    if (!session.token) return setStatus('Log in to save photos');
    try {
      await api('/photos', 'POST', { filterId: (active.overlay || active.color || active.ai)?._id, imageData: cv.current.toDataURL('image/jpeg', 0.7) });
      setStatus('Photo saved to gallery ✓');
    } catch (e) { setStatus('Save failed: ' + e.message); }
  };

  return (
    <div>
      <div className="stage"><video ref={vid} className="vid" playsInline muted /><canvas ref={cv} width="640" height="480" /><span className="pill">{status}</span></div>
      <div className="chips">{filters.map(f => <button key={f._id} className={Object.values(active).some(a => a?._id === f._id) ? 'on' : ''} onClick={() => pick(f)}>{f.name}</button>)}</div>
      <button className="cap" onClick={capture}>📸 Capture</button>
    </div>
  );
}
