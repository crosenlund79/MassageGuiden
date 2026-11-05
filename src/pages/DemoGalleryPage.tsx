import { Link } from 'react-router-dom';
import { demonstrations, getRegion, getTechnique } from '../domain/content';
import { DemoPanels } from '../demos/DemoPanel';

/** Overview of all hand-position illustrations – for review together with the teacher. */
export function DemoGalleryPage() {
  const review = demonstrations.filter((d) => d.review.length > 0).length;
  return (
    <div className="fade-in">
      <div className="eyebrow">Håndgreb</div>
      <h1>Alle illustrationer af håndgreb</h1>
      <p className="soft">
        {demonstrations.length} greb er illustreret ud fra hæftets fotos – {review} har noter til gennemsyn.
        Tegningerne er originale og forenklede; de gengiver ikke fotografierne.
      </p>
      <div className="gallery">
        {demonstrations.map((d) => {
          const t = getTechnique(d.techniqueId);
          if (!t) return null;
          return (
            <section key={d.techniqueId} className="card gallery-item" id={d.techniqueId}>
              <div className="row small soft" style={{ marginBottom: 6 }}>
                <span className="badge">{getRegion(t.region)?.name}</span>
                <span className="badge">Trin {t.step}</span>
                {d.review.length > 0 ? <span className="badge badge-review">Til gennemsyn</span> : <span className="badge badge-source">Fra fotoet</span>}
              </div>
              <h3><Link to={`/greb/${t.id}`}>{t.name}</Link></h3>
              <DemoPanels demo={d} title={t.name} />
            </section>
          );
        })}
      </div>
    </div>
  );
}
