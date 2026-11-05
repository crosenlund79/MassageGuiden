import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AtlasFigure } from '../anatomy/AtlasFigure';
import { viewsForMuscle } from '../anatomy/figure2d';
import { getDemonstration, getMuscle, getProgram, getRegion, getTechnique, neighbours, sequenceNoteAfter } from '../domain/content';
import { DemoPanels } from '../demos/DemoPanel';
import { FavoriteButton, StatusBadge } from '../components/common';
import { IconAlert, IconArrow, IconBook, IconNote } from '../components/Icons';
import { getNote, recordActivity, saveNote } from '../storage/db';
import { useI18n } from '../i18n/I18nProvider';
import { linkNote, muscleName, programName, regionName, sequenceNoteText, techDescription, techName, techPosition, techPrecautions, techReviewNotes } from '../i18n/localize';

function NoteEditor({ techniqueId }: { techniqueId: string }) {
  const { s } = useI18n();
  const [text, setText] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'saving' | 'saved'>('loading');
  const timer = useRef<number | undefined>(undefined);
  const latest = useRef('');

  useEffect(() => {
    let alive = true;
    setState('loading');
    getNote(techniqueId).then((n) => {
      if (!alive) return;
      setText(n?.text ?? '');
      latest.current = n?.text ?? '';
      setState('idle');
    });
    return () => {
      alive = false;
      // flush pending save when leaving the page
      if (timer.current) {
        window.clearTimeout(timer.current);
        void saveNote(techniqueId, latest.current);
      }
    };
  }, [techniqueId]);

  const onChange = (v: string) => {
    setText(v);
    latest.current = v;
    setState('saving');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      timer.current = undefined;
      await saveNote(techniqueId, v);
      setState('saved');
    }, 500);
  };

  return (
    <section className="note-card" aria-labelledby="notes-h">
      <div className="row" style={{ marginBottom: 8 }}>
        <IconNote width={20} height={20} />
        <h3 id="notes-h" style={{ margin: 0 }}>{s.detail.notes}</h3>
        <span className="badge badge-user">{s.common.yourContent}</span>
        <span className="spacer" />
        <span className="save-state" aria-live="polite">
          {state === 'saving' ? s.detail.saving : state === 'saved' ? s.detail.saved : ''}
        </span>
      </div>
      <textarea
        value={text}
        disabled={state === 'loading'}
        onChange={(e) => onChange(e.target.value)}
        placeholder={s.detail.notesPlaceholder}
        aria-label={s.detail.notesLabel}
      />
      <p className="small muted" style={{ margin: '8px 0 0' }}>{s.detail.notesLocal}</p>
    </section>
  );
}

export function TechniqueDetailPage() {
  const { id = '' } = useParams();
  const { s, lang } = useI18n();
  const t = getTechnique(id);

  useEffect(() => {
    if (t) void recordActivity('technique', t.id);
  }, [t]);

  if (!t) {
    return (
      <div className="empty">
        <h3>{s.detail.notFound}</h3>
        <Link to="/greb">{s.detail.toAll}</Link>
      </div>
    );
  }

  const region = getRegion(t.region)!;
  const demo = getDemonstration(t.id);
  const program = getProgram(t.program);
  const { prev, next } = neighbours(t.id);
  const seqNote = sequenceNoteAfter(t);
  const linked = t.muscles.map((l) => ({ link: l, muscle: getMuscle(l.id)! })).filter((x) => x.muscle);
  // pick the view that shows the linked muscles best, defaulting to the region's view
  const view = linked.length && !linked.some((x) => viewsForMuscle(x.muscle.id).includes(region.view))
    ? viewsForMuscle(linked[0].muscle.id)[0]
    : region.view;
  const name = techName(t, lang);
  const rName = regionName(region, lang);
  const position = techPosition(t, lang);
  const precautions = techPrecautions(t, lang);
  const reviewNotes = techReviewNotes(t, lang);
  const highlights = Object.fromEntries(linked.map((x) => [x.muscle.id, x.link.basis === 'kilde' ? ('selected' as const) : ('related' as const)]));

  return (
    <article className="fade-in" key={t.id}>
      <div className="crumbs">
        <Link to="/greb">{s.nav.techniques}</Link> <span aria-hidden="true">/</span>
        <Link to={`/greb?region=${region.id}`}>{rName}</Link> <span aria-hidden="true">/</span>
        <span>{s.common.step(t.step)}</span>
      </div>

      <div className="detail-grid">
        <div className="card detail-figure">
          <div className="fig-wrap">
            <AtlasFigure
              view={view}
              frame={region.frame}
              highlights={highlights}
              dimOthers={linked.length > 0}
              showDeep={linked.some((x) => x.muscle.layer === 'deep')}
              interactive={false}
              zoomable
              ariaLabel={s.detail.illustration(rName)}
            />
          </div>
          <div className="fig-cap">
            {s.detail.figCaption} {linked.length > 0 ? s.detail.figLegend : s.detail.figNoMuscle}
          </div>
        </div>

        <div className="stack">
          <div>
            <div className="row" style={{ marginBottom: 6 }}>
              <span className="badge">{rName}</span>
              <span className="badge">{s.common.step(t.step)}</span>
              <StatusBadge status={t.status} />
            </div>
            <div className="title-row">
              <h1>{name}</h1>
              <FavoriteButton kind="technique" id={t.id} label={name} />
            </div>
            <p className="lead">{techDescription(t, lang)}</p>
            <div className="row small soft">
              <span><strong>{s.detail.type}</strong> {s.types[t.type]}</span>
              <span>·</span>
              <span><strong>{s.detail.tools}</strong> {t.tools.map((x) => s.tools[x] ?? x).join(', ')}</span>
            </div>
          </div>

          {demo && (
            <section aria-labelledby="demo-h" className="demo-section">
              <div className="row" style={{ marginBottom: 8 }}>
                <h3 id="demo-h" style={{ margin: 0 }}>{s.detail.howTitle}</h3>
                <span className={`badge ${demo.review.length ? 'badge-review' : 'badge-source'}`}>
                  {demo.review.length ? s.detail.demoReview : s.detail.demoFromPhoto}
                </span>
              </div>
              <DemoPanels demo={demo} title={name} />
              <p className="small muted" style={{ margin: '8px 0 0' }}>
                {s.detail.demoNote(t.source.page, t.step)}
              </p>
            </section>
          )}

          {position && (
            <dl className="kv">
              <dt>{s.detail.position}</dt>
              <dd>{position}</dd>
            </dl>
          )}

          {precautions.length > 0 && (
            <div className="caution" role="note">
              <IconAlert />
              <div>
                <strong>{s.detail.caution}</strong>
                {precautions.map((p) => <div key={p}>{p}</div>)}
              </div>
            </div>
          )}

          {seqNote && <div className="seq-note">{sequenceNoteText(seqNote, lang)}</div>}

          <section>
            <h3>{s.detail.muscles}</h3>
            {linked.length === 0 ? (
              <p className="muted small">{s.detail.noMuscles}</p>
            ) : (
              <>
                <div className="muscle-links">
                  {linked.map(({ link, muscle }) => (
                    <Link key={muscle.id} to={`/atlas/${muscle.id}`} className={`muscle-link ${link.basis === 'afledt' ? 'inferred' : ''}`}>
                      <span>{muscleName(muscle, lang)}</span>
                      <span className="ml-latin">
                        {muscle.nameLatin} · {link.basis === 'kilde' ? s.detail.mentioned : s.detail.inferred}
                        {linkNote(link, lang) ? ` · ${linkNote(link, lang)}` : ''}
                      </span>
                    </Link>
                  ))}
                </div>
                {linked.some((x) => x.link.basis === 'afledt') && (
                  <p className="small muted" style={{ marginTop: 8 }}>
                    {s.detail.inferredNote}
                  </p>
                )}
              </>
            )}
          </section>

          <NoteEditor techniqueId={t.id} />

          <section className="source-box" aria-labelledby="src-h">
            <div className="row">
              <IconBook width={20} height={20} />
              <h3 id="src-h" style={{ margin: 0 }}>{s.detail.source}</h3>
            </div>
            <p className="small soft" style={{ margin: '8px 0 0' }}>
              {s.detail.sourceLine(program ? programName(program, lang) : '', t.source.page, t.step)}
            </p>
            <div className="eyebrow" style={{ marginTop: 10 }}>{s.detail.captionLabel}</div>
            <blockquote lang="da">{t.source.caption}</blockquote>
            <p className="small muted" style={{ margin: 0 }}>{s.detail.imageFile} {t.source.image}</p>

            {t.handwrittenNotes.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div className="eyebrow">{s.detail.handwritten}</div>
                <ul className="hand-notes" lang="da">
                  {t.handwrittenNotes.map((h) => <li key={h.text}>{h.text}</li>)}
                </ul>
                <p className="small muted" style={{ margin: 0 }}>{s.detail.handwrittenNote}</p>
              </div>
            )}
          </section>

          {reviewNotes.length > 0 && (
            <div className="review-box">
              <strong>{s.detail.review}</strong>
              <ul>{reviewNotes.map((r) => <li key={r}>{r}</li>)}</ul>
            </div>
          )}
        </div>
      </div>

      <nav className="pager" aria-label={s.detail.pager}>
        {prev ? (
          <Link to={`/greb/${prev.id}`}>
            <span className="pg-dir"><IconArrow dir="left" width={14} height={14} /> {s.detail.prev(prev.step)}</span>
            <span className="pg-name">{techName(prev, lang)}</span>
          </Link>
        ) : <span />}
        {next && (
          <Link to={`/greb/${next.id}`} className="next">
            <span className="pg-dir">{s.detail.next(next.step)} <IconArrow width={14} height={14} /></span>
            <span className="pg-name">{techName(next, lang)}</span>
          </Link>
        )}
      </nav>
    </article>
  );
}
