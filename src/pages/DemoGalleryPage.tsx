import { Link } from 'react-router-dom';
import { demonstrations, getRegion, getTechnique } from '../domain/content';
import { DemoPanels } from '../demos/DemoPanel';
import { useI18n } from '../i18n/I18nProvider';
import { regionName, techName } from '../i18n/localize';

/** Overview of all hand-position illustrations – for review together with the teacher. */
export function DemoGalleryPage() {
  const { s, lang } = useI18n();
  const review = demonstrations.filter((d) => d.review.length > 0).length;
  return (
    <div className="fade-in">
      <div className="eyebrow">{s.demo.galleryEyebrow}</div>
      <h1>{s.demo.galleryTitle}</h1>
      <p className="soft">{s.demo.galleryIntro(demonstrations.length, review)}</p>
      <div className="gallery">
        {demonstrations.map((d) => {
          const t = getTechnique(d.techniqueId);
          if (!t) return null;
          const r = getRegion(t.region);
          return (
            <section key={d.techniqueId} className="card gallery-item" id={d.techniqueId}>
              <div className="row small soft" style={{ marginBottom: 6 }}>
                <span className="badge">{r ? regionName(r, lang) : ''}</span>
                <span className="badge">{s.common.step(t.step)}</span>
                {d.review.length > 0 ? <span className="badge badge-review">{s.common.review}</span> : <span className="badge badge-source">{s.demo.fromPhoto}</span>}
              </div>
              <h3><Link to={`/greb/${t.id}`}>{techName(t, lang)}</Link></h3>
              <DemoPanels demo={d} title={techName(t, lang)} />
            </section>
          );
        })}
      </div>
    </div>
  );
}
