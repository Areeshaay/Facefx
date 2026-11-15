import { useEffect, useState } from 'react';
import { api } from './api';

export default function Gallery() {
  const [photos, setPhotos] = useState([]);
  const load = () => api('/photos').then(setPhotos).catch(() => {});
  useEffect(() => { load(); }, []);
  const del = async id => { await api('/photos/' + id, 'DELETE'); load(); };
  return (
    <div className="grid">
      {photos.length === 0 && <p>No photos yet. Capture one from the Camera page.</p>}
      {photos.map(p => (
        <div key={p._id} className="card"><img src={p.imageData} alt="captured" />
          <a href={p.imageData} download={`facefx-${p._id}.jpg`}>Download</a> <button onClick={() => del(p._id)}>Delete</button></div>
      ))}
    </div>
  );
}
