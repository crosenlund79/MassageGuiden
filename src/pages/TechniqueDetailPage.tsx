import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AtlasFigure } from '../anatomy/AtlasFigure';
import { viewsForMuscle } from '../anatomy/figure2d';
import { getDemonstration, getMuscle, getProgram, getRegion, getTechnique, neighbours, sequenceNoteAfter } from '../domain/content';
import { DemoPanels } from '../demos/DemoPanel';
import { TYPE_LABELS } from '../domain/types';
import { FavoriteButton, StatusBadge } from '../components/common';
import { IconAlert, IconArrow, IconBook, IconNote } from '../components/Icons';
import { getNote, recordActivity, saveNote } from '../storage/db';

function NoteEditor({ techniqueId }: { techniqueId: string }) {
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
        <h3 id="notes-h" style={{ margin: 0 }}>Dine noter</h3>
        <span className="badge badge-user">Dit indhold</span>
        <span className="spacer" />
        <span className="save-state" aria-live="polite">
          {state === 'saving' ? 'Gemmer …' : state === 'saved' ? 'Gemt lokalt' : ''}
        </span>
      </div>
      <textarea
        value={text}
        disabled={state === 'loading'}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Skriv dine egne noter – f.eks. tryk, tempo, hvad underviseren sagde …"
        aria-label="Personlige noter"
      />
      <p className="small muted" style={{ margin: '8px 0 0' }}>Gemmes kun på denne enhed.</p>
    </section>
  );
}

export function TechniqueDetailPage() {
  const { id = '' } = useParams();
  const t = getTechnique(id);

  useEffect(() => {
    if (t) void recordActivity('technique', t.id);
  }, [t]);

  if (!t) {
    return (
      <div className="empty">
        <h3>Grebet blev ikke fundet</h3>
        <Link to="/greb">Til alle greb</Link>
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
  const highlights = Object.fromEntries(linked.map((x) => [x.muscle.id, x.link.basis === 'kilde' ? ('selected' as const) : ('related' as const)]));

  return (
    <article className="fade-in" key={t.id}>
      <div className="crumbs">
        <Link to="/greb">Massagegreb</Link> <span aria-hidden="true">/</span>
        <Link to={`/greb?region=${region.id}`}>{region.name}</Link> <span aria-hidden="true">/</span>
        <span>Trin {t.step}</span>
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
              ariaLabel={`Illustration: ${region.name}`}
            />
          </div>
          <div className="fig-cap">
            Original illustration (ikke fra hæftet).{' '}
            {linked.length > 0 ? (
              <>Mørkegrøn: muskel nævnt i kilden. Lysegrøn: afledt kobling.</>
            ) : (
              <>Kilden nævner ingen bestemt muskel for dette greb.</>
            )}
          </div>
        </div>

        <div className="stack">
          <div>
            <div className="row" style={{ marginBottom: 6 }}>
              <span className="badge">{region.name}</span>
              <span className="badge">Trin {t.step}</span>
              <StatusBadge status={t.status} />
            </div>
            <div className="title-row">
              <h1>{t.name}</h1>
              <FavoriteButton kind="technique" id={t.id} label={t.name} />
            </div>
            <p className="lead">{t.description}</p>
            <div className="row small soft">
              <span><strong>Type:</strong> {TYPE_LABELS[t.type]}</span>
              <span>·</span>
              <span><strong>Udføres med:</strong> {t.tools.join(', ')}</span>
            </div>
          </div>

          {demo && (
            <section aria-labelledby="demo-h" className="demo-section">
              <div className="row" style={{ marginBottom: 8 }}>
                <h3 id="demo-h" style={{ margin: 0 }}>Sådan udføres grebet</h3>
                <span className={`badge ${demo.review.length ? 'badge-review' : 'badge-source'}`}>
                  {demo.review.length ? 'Illustration til gennemsyn' : 'Tegnet efter fotoet'}
                </span>
              </div>
              <DemoPanels demo={demo} title={t.name} />
              <p className="small muted" style={{ margin: '8px 0 0' }}>
                Original tegning af håndstillingen ud fra hæftets foto (side {t.source.page}, trin {t.step}) – fotoet gengives ikke.
              </p>
            </section>
          )}

          {t.position && (
            <dl className="kv">
              <dt>Placering af behandler</dt>
              <dd>{t.position}</dd>
            </dl>
          )}

          {t.precautions.length > 0 && (
            <div className="caution" role="note">
              <IconAlert />
              <div>
                <strong>Opmærksomhed (fra kilden)</strong>
                {t.precautions.map((p) => <div key={p.text}>{p.text}</div>)}
              </div>
            </div>
          )}

          {seqNote && <div className="seq-note">{seqNote}</div>}

          <section>
            <h3>Muskler</h3>
            {linked.length === 0 ? (
              <p className="muted small">Ingen muskler er nævnt i kilden for dette greb, og der er ikke tilføjet afledte koblinger.</p>
            ) : (
              <>
                <div className="muscle-links">
                  {linked.map(({ link, muscle }) => (
                    <Link key={muscle.id} to={`/atlas/${muscle.id}`} className={`muscle-link ${link.basis === 'afledt' ? 'inferred' : ''}`}>
                      <span>{muscle.nameDa}</span>
                      <span className="ml-latin">
                        {muscle.nameLatin} · {link.basis === 'kilde' ? 'nævnt i kilden' : 'afledt'}
                      </span>
                    </Link>
                  ))}
                </div>
                {linked.some((x) => x.link.basis === 'afledt') && (
                  <p className="small muted" style={{ marginTop: 8 }}>
                    Stiplede koblinger er afledt af det beskrevne område og er ikke nævnt direkte i hæftet – bør bekræftes af underviser.
                  </p>
                )}
              </>
            )}
          </section>

          <NoteEditor techniqueId={t.id} />

          <section className="source-box" aria-labelledby="src-h">
            <div className="row">
              <IconBook width={20} height={20} />
              <h3 id="src-h" style={{ margin: 0 }}>Kilde</h3>
            </div>
            <p className="small soft" style={{ margin: '8px 0 0' }}>
              Massørskolen – Fyn, ”Massage i Billeder” – {program?.name ?? ''}, side {t.source.page}, trin {t.step}.
            </p>
            <blockquote>{t.source.caption}</blockquote>
            <p className="small muted" style={{ margin: 0 }}>Billedfil: {t.source.image}</p>

            {t.handwrittenNotes.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div className="eyebrow">Håndskrevne noter på siden</div>
                <ul className="hand-notes">
                  {t.handwrittenNotes.map((h) => <li key={h.text}>{h.text}</li>)}
                </ul>
                <p className="small muted" style={{ margin: 0 }}>Håndskrift er svær at læse – transskriptionen er usikker.</p>
              </div>
            )}
          </section>

          {t.reviewNotes.length > 0 && (
            <div className="review-box">
              <strong>Til gennemsyn</strong>
              <ul>{t.reviewNotes.map((r) => <li key={r}>{r}</li>)}</ul>
            </div>
          )}
        </div>
      </div>

      <nav className="pager" aria-label="Forrige og næste greb">
        {prev ? (
          <Link to={`/greb/${prev.id}`}>
            <span className="pg-dir"><IconArrow dir="left" width={14} height={14} /> Forrige · trin {prev.step}</span>
            <span className="pg-name">{prev.name}</span>
          </Link>
        ) : <span />}
        {next && (
          <Link to={`/greb/${next.id}`} className="next">
            <span className="pg-dir">Næste · trin {next.step} <IconArrow width={14} height={14} /></span>
            <span className="pg-name">{next.name}</span>
          </Link>
        )}
      </nav>
    </article>
  );
}
