import { DemoFigure } from './DemoFigure';
import type { Demonstration } from './types';

/** All frames of a technique's hand-position demonstration with numbered instructions. */
export function DemoPanels({ demo, title }: { demo: Demonstration; title: string }) {
  const multi = demo.frames.length > 1;
  // panel shape follows the region shown (clamped), so tall regions are not letterboxed
  const [, , fw, fh] = demo.stage.frame;
  const aspect = Math.min(1.6, Math.max(0.78, fw / fh));
  return (
    <div className="demo-wrap">
      <div className={`demo-grid ${multi ? 'multi' : ''}`}>
        {demo.frames.map((f, i) => (
          <figure key={i} className="demo-card">
            <div className="demo-stage" style={{ aspectRatio: String(aspect) }}>
              <DemoFigure stage={demo.stage} frame={f} ariaLabel={`${title}${multi ? `, trin ${i + 1}` : ''}: ${f.text}`} />
              {multi && <span className="demo-num" aria-hidden="true">{i + 1}</span>}
            </div>
            <figcaption>
              {multi && <strong>{i + 1}. </strong>}
              {f.text}
            </figcaption>
          </figure>
        ))}
      </div>
      {(demo.therapist || demo.clientPose) && (
        <dl className="demo-meta">
          {demo.therapist && (<><dt>Behandler</dt><dd>{demo.therapist}</dd></>)}
          {demo.clientPose && (<><dt>Klientens stilling</dt><dd>{demo.clientPose}</dd></>)}
        </dl>
      )}
      <div className="demo-legend" aria-label="Signaturforklaring">
        <span><i className="lg-hand" /> Aktiv hånd</span>
        <span><i className="lg-hand support" /> Støttende hånd</span>
        <span><i className="lg-contact" /> Kontaktpunkt</span>
        <span><i className="lg-arrow" /> Bevægelse</span>
      </div>
      {demo.review.length > 0 && (
        <div className="review-box small">
          <strong>Illustration til gennemsyn</strong>
          <ul>{demo.review.map((r) => <li key={r}>{r}</li>)}</ul>
        </div>
      )}
    </div>
  );
}
