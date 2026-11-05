import { DemoFigure } from './DemoFigure';
import type { Demonstration } from './types';
import { useI18n } from '../i18n/I18nProvider';
import { demoClientPose, demoFrameText, demoReview, demoTherapist } from '../i18n/localize';

/** All frames of a technique's hand-position demonstration with numbered instructions. */
export function DemoPanels({ demo, title }: { demo: Demonstration; title: string }) {
  const { s, lang } = useI18n();
  const multi = demo.frames.length > 1;
  // panel shape follows the region shown (clamped), so tall regions are not letterboxed
  const [, , fw, fh] = demo.stage.frame;
  const aspect = Math.min(1.6, Math.max(0.78, fw / fh));
  const therapist = demoTherapist(demo, lang);
  const clientPose = demoClientPose(demo, lang);
  const review = demoReview(demo, lang);
  return (
    <div className="demo-wrap">
      <div className={`demo-grid ${multi ? 'multi' : ''}`}>
        {demo.frames.map((f, i) => {
          const text = demoFrameText(demo, i, lang);
          return (
            <figure key={i} className="demo-card">
              <div className="demo-stage" style={{ aspectRatio: String(aspect) }}>
                <DemoFigure stage={demo.stage} frame={f} ariaLabel={`${title}${multi ? `, ${s.demo.step(i + 1)}` : ''}: ${text}`} />
                {multi && <span className="demo-num" aria-hidden="true">{i + 1}</span>}
              </div>
              <figcaption>
                {multi && <strong>{i + 1}. </strong>}
                {text}
              </figcaption>
            </figure>
          );
        })}
      </div>
      {(therapist || clientPose) && (
        <dl className="demo-meta">
          {therapist && (<><dt>{s.demo.therapist}</dt><dd>{therapist}</dd></>)}
          {clientPose && (<><dt>{s.demo.clientPose}</dt><dd>{clientPose}</dd></>)}
        </dl>
      )}
      <div className="demo-legend" aria-label={s.demo.legend}>
        <span><i className="lg-hand" /> {s.demo.activeHand}</span>
        <span><i className="lg-hand support" /> {s.demo.supportHand}</span>
        <span><i className="lg-contact" /> {s.demo.contact}</span>
        <span><i className="lg-arrow" /> {s.demo.movement}</span>
      </div>
      {review.length > 0 && (
        <div className="review-box small">
          <strong>{s.demo.reviewTitle}</strong>
          <ul>{review.map((r) => <li key={r}>{r}</li>)}</ul>
        </div>
      )}
    </div>
  );
}
