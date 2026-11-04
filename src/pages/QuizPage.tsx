import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AtlasFigure, type HighlightTone } from '../anatomy/AtlasFigure';
import { viewsForMuscle, type AtlasView } from '../anatomy/figure2d';
import { getMuscle } from '../domain/content';
import { GROUP_LABELS, type MuscleGroup } from '../domain/types';
import { TerminologySwitch, formatDate } from '../components/common';
import { IconCheck, IconQuiz, IconTarget, IconTag, IconX } from '../components/Icons';
import { buildQuestions, displayName, quizPool, type Question } from '../quiz/engine';
import { aggregateStats, recordActivity, saveQuizSession, type QuizAnswer, type QuizMode, type Terminology } from '../storage/db';
import { usePrefs, useQuizSessions } from '../storage/hooks';

const SKIP = '__skip__';
const MODE_LABEL: Record<QuizMode, string> = { find: 'Find musklen', navn: 'Navngiv musklen' };

interface SessionConfig {
  mode: QuizMode;
  questions: Question[];
}

// ---------------------------------------------------------------------------
function Session({ config, terminology, onDone, onQuit }: {
  config: SessionConfig;
  terminology: Terminology;
  onDone: (answers: QuizAnswer[]) => void;
  onQuit: () => void;
}) {
  const { mode, questions } = config;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const q = questions[index];
  const [view, setView] = useState<AtlasView>(q.view);
  const target = getMuscle(q.muscleId)!;
  const answered = answers.length > index;
  const current = answers[index];
  const score = answers.filter((a) => a.correct).length;
  const nextRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setView(q.view);
    setPicked(null);
  }, [index, q.view]);

  useEffect(() => {
    if (answered) nextRef.current?.focus();
  }, [answered]);

  const answer = (id: string | null) => {
    if (answered || !id) return;
    const correct = id === q.muscleId;
    setPicked(id);
    setAnswers((a) => [...a, { muscleId: q.muscleId, correct, answeredId: id === SKIP ? null : id }]);
  };

  const next = () => {
    if (index + 1 >= questions.length) onDone(answers);
    else setIndex(index + 1);
  };

  const name = (id: string) => {
    const m = getMuscle(id);
    return m ? displayName(m, terminology) : id;
  };

  // ---- highlights ----
  let highlights: Record<string, HighlightTone> = {};
  if (mode === 'navn') {
    highlights = { [q.muscleId]: answered ? (current.correct ? 'correct' : 'target') : 'selected' };
  } else if (answered) {
    highlights = current.correct
      ? { [q.muscleId]: 'correct' }
      : { ...(picked ? { [picked]: 'wrong' as const } : {}), [q.muscleId]: 'target' };
  }
  const targetViews = viewsForMuscle(q.muscleId);
  const targetNotInView = answered && !current.correct && !targetViews.includes(view);

  return (
    <div className="quiz-shell fade-in">
      <section className="card quiz-stage">
        <div className="stage-bar" style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderBottom: '1px solid var(--line)', flexWrap: 'wrap' }}>
          {mode === 'find' ? (
            <div className="segmented" role="group" aria-label="Visning">
              <button type="button" className={view === 'anterior' ? 'on' : ''} onClick={() => setView('anterior')}>Forfra</button>
              <button type="button" className={view === 'posterior' ? 'on' : ''} onClick={() => setView('posterior')}>Bagfra</button>
            </div>
          ) : (
            <span className="small muted">{view === 'anterior' ? 'Set forfra' : 'Set bagfra'}</span>
          )}
          <span className="small muted">{mode === 'find' ? 'Tryk på musklen' : 'Hvilken muskel er markeret?'}</span>
        </div>
        <div className="fig-wrap">
          <AtlasFigure
            view={view}
            highlights={highlights}
            onSelect={mode === 'find' ? answer : undefined}
            interactive={mode === 'find' && !answered}
            zoomable
            focusMuscles={mode === 'navn' ? [q.muscleId] : undefined}
            resetKey={index}
            labelFor={mode === 'find' ? () => 'Muskel' : undefined}
            ariaLabel={mode === 'find' ? 'Find musklen på figuren' : 'Figur med markeret muskel'}
          />
        </div>
      </section>

      <aside className="stack">
        <div className="quiz-head">
          <span className="small soft" aria-live="polite">Spørgsmål {index + 1} af {questions.length}</span>
          <div className="progress" aria-hidden="true"><div style={{ width: `${((index + (answered ? 1 : 0)) / questions.length) * 100}%` }} /></div>
          <span className="badge badge-source">{score} point</span>
        </div>

        {mode === 'find' ? (
          <div className="card card-l">
            <div className="prompt" data-muscle={q.muscleId}><small>Find</small>{name(q.muscleId)}</div>
            {targetViews.length > 1 && !answered && <p className="small muted" style={{ margin: '8px 0 0' }}>Kan ses både forfra og bagfra.</p>}
            {!targetViews.includes(view) && !answered && <p className="small muted" style={{ margin: '8px 0 0' }}>Tip: prøv den anden side af figuren.</p>}
          </div>
        ) : (
          <div className="options" role="group" aria-label="Svarmuligheder" data-muscle={q.muscleId}>
            {q.options!.map((id) => {
              const m = getMuscle(id)!;
              const isCorrect = id === q.muscleId;
              const cls = answered ? (isCorrect ? 'correct' : id === picked ? 'wrong' : '') : '';
              return (
                <button key={id} type="button" data-muscle={id} className={`option ${cls}`} disabled={answered} onClick={() => answer(id)}>
                  {terminology === 'begge' ? (
                    <>{m.nameDa}<span className="o-latin">{m.nameLatin}</span></>
                  ) : (
                    displayName(m, terminology)
                  )}
                </button>
              );
            })}
          </div>
        )}

        {answered && (
          <div className={`feedback fade-in ${current.correct ? 'ok' : 'bad'}`} role="status">
            {current.correct ? <IconCheck width={24} height={24} /> : <IconX width={24} height={24} />}
            <div>
              <strong>{current.correct ? 'Rigtigt!' : 'Ikke helt'}</strong>
              {current.correct ? (
                <span>{target.nameDa} – <i>{target.nameLatin}</i></span>
              ) : (
                <span>
                  {mode === 'find' && picked && picked !== SKIP ? <>Du valgte {name(picked)}. </> : null}
                  Det rigtige svar er <strong style={{ display: 'inline' }}>{target.nameDa}</strong> (<i>{target.nameLatin}</i>)
                  {mode === 'find' ? ' – markeret med gult.' : '.'}
                  {targetNotInView && <> Skift til {view === 'anterior' ? 'bagfra' : 'forfra'} for at se den.</>}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="row">
          {answered ? (
            <button ref={nextRef} type="button" className="btn btn-sage" onClick={next}>
              {index + 1 >= questions.length ? 'Se resultat' : 'Næste spørgsmål'}
            </button>
          ) : mode === 'find' ? (
            <button type="button" className="btn btn-secondary" onClick={() => answer(SKIP)}>Ved ikke</button>
          ) : null}
          <span className="spacer" />
          <button type="button" className="btn btn-ghost" onClick={onQuit}>Afslut</button>
        </div>
      </aside>
    </div>
  );
}

// ---------------------------------------------------------------------------
function Summary({ mode, answers, terminology, onRetry, onNew, onBack }: {
  mode: QuizMode;
  answers: QuizAnswer[];
  terminology: Terminology;
  onRetry: () => void;
  onNew: () => void;
  onBack: () => void;
}) {
  const correct = answers.filter((a) => a.correct).length;
  const pct = Math.round((correct / answers.length) * 100);
  const wrong = answers.filter((a) => !a.correct);
  const r = 52, c = 2 * Math.PI * r;
  return (
    <div className="stack fade-in" style={{ maxWidth: 720 }}>
      <div className="eyebrow">{MODE_LABEL[mode]} · resultat</div>
      <div className="card card-l row" style={{ gap: 22 }}>
        <svg className="score-ring" viewBox="0 0 128 128" role="img" aria-label={`${pct} procent rigtige`}>
          <circle cx="64" cy="64" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="12" />
          <circle cx="64" cy="64" r={r} fill="none" stroke="var(--sage)" strokeWidth="12" strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * c} ${c}`} transform="rotate(-90 64 64)" />
          <text x="64" y="70" textAnchor="middle" style={{ font: '500 26px var(--font-serif)', fill: 'var(--olive)' }}>{pct}%</text>
        </svg>
        <div>
          <h1 style={{ marginBottom: 4 }}>{correct} af {answers.length} rigtige</h1>
          <p className="soft" style={{ margin: 0 }}>
            {pct === 100 ? 'Flot – alle rigtige!' : pct >= 70 ? 'Godt gået. Øv de forkerte en gang til.' : 'Godt i gang – gentagelse gør det.'}
          </p>
        </div>
      </div>

      <div className="row">
        {wrong.length > 0 && <button type="button" className="btn btn-sage" onClick={onRetry}>Øv de {wrong.length} forkerte igen</button>}
        <button type="button" className="btn btn-secondary" onClick={onNew}>Ny runde</button>
        <button type="button" className="btn btn-ghost" onClick={onBack}>Til quiz-oversigt</button>
      </div>

      <section className="card">
        <h3>Gennemgang</h3>
        <ul className="list result-list">
          {answers.map((a, i) => {
            const m = getMuscle(a.muscleId)!;
            return (
              <li key={i}>
                <span className={`dot ${a.correct ? 'ok' : 'bad'}`} aria-label={a.correct ? 'Rigtigt' : 'Forkert'} />
                <span className="li-body">
                  <Link to={`/atlas/${m.id}`}>{displayName(m, terminology)}</Link>
                </span>
                <span className="small muted">{a.correct ? 'Rigtigt' : 'Forkert'}</span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
type Phase = { kind: 'menu' } | { kind: 'play'; config: SessionConfig; startedAt: number } | { kind: 'done'; mode: QuizMode; answers: QuizAnswer[] };

export function QuizPage() {
  const [params, setParams] = useSearchParams();
  const [prefs] = usePrefs();
  const { sessions } = useQuizSessions();
  const [group, setGroup] = useState<MuscleGroup | 'alle'>('alle');
  const [count, setCount] = useState<number | 'alle'>(10);
  const [phase, setPhase] = useState<Phase>({ kind: 'menu' });
  const pool = useMemo(() => quizPool(group), [group]);

  const start = (mode: QuizMode, onlyIds?: string[]) => {
    const p = onlyIds ? quizPool('alle').filter((m) => onlyIds.includes(m.id)) : pool;
    const questions = buildQuestions(mode, p, onlyIds ? 'alle' : count);
    if (questions.length === 0) return;
    setPhase({ kind: 'play', config: { mode, questions }, startedAt: Date.now() });
    window.scrollTo({ top: 0 });
  };

  // deep-link from the home page: /quiz?start=find
  useEffect(() => {
    const s = params.get('start');
    if (s === 'find' || s === 'navn') {
      start(s);
      setParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase.kind === 'play') {
    const { config, startedAt } = phase;
    return (
      <>
        <div className="eyebrow">Quiz · {MODE_LABEL[config.mode]}</div>
        <Session
          key={startedAt}
          config={config}
          terminology={prefs.terminology}
          onQuit={() => setPhase({ kind: 'menu' })}
          onDone={(answers) => {
            void saveQuizSession({
              id: `${startedAt}-${Math.random().toString(36).slice(2, 7)}`,
              mode: config.mode,
              startedAt,
              finishedAt: Date.now(),
              terminology: prefs.terminology,
              answers,
            });
            void recordActivity('quiz', config.mode);
            setPhase({ kind: 'done', mode: config.mode, answers });
          }}
        />
      </>
    );
  }

  if (phase.kind === 'done') {
    return (
      <Summary
        mode={phase.mode}
        answers={phase.answers}
        terminology={prefs.terminology}
        onRetry={() => start(phase.mode, phase.answers.filter((a) => !a.correct).map((a) => a.muscleId))}
        onNew={() => start(phase.mode)}
        onBack={() => setPhase({ kind: 'menu' })}
      />
    );
  }

  // ---- menu ----
  const stats = aggregateStats(sessions);
  const statList = [...stats.values()].sort((a, b) => a.correct / a.attempts - b.correct / b.attempts);
  const weak = statList.filter((s) => s.correct < s.attempts).slice(0, 6);
  const groups: (MuscleGroup | 'alle')[] = ['alle', ...(Object.keys(GROUP_LABELS) as MuscleGroup[])];

  return (
    <div className="fade-in">
      <div className="eyebrow">Quiz</div>
      <h1>Træn din anatomi</h1>
      <p className="soft">Spørgsmålene bruger kun muskler, der er tegnet i atlasset. Dybtliggende muskler indgår ikke.</p>

      <section className="card card-l settings section" aria-label="Indstillinger">
        <div>
          <label className="lbl">Terminologi</label>
          <TerminologySwitch />
        </div>
        <div>
          <label className="lbl">Muskelgruppe</label>
          <div className="chip-scroll" role="group">
            {groups.map((g) => (
              <button key={g} type="button" className={`chip ${group === g ? 'on' : ''}`} aria-pressed={group === g} onClick={() => setGroup(g)}>
                {g === 'alle' ? 'Hele kroppen' : GROUP_LABELS[g]} <span className="muted">{quizPool(g).length}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="lbl">Antal spørgsmål</label>
          <div className="segmented" role="group">
            {([5, 10, 20, 'alle'] as const).map((n) => (
              <button key={n} type="button" className={count === n ? 'on' : ''} aria-pressed={count === n} onClick={() => setCount(n)}>
                {n === 'alle' ? `Alle (${pool.length})` : n}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="mode-grid section">
        <section className="card card-l mode-card">
          <div className="mc-ico"><IconTarget /></div>
          <h2>Find musklen</h2>
          <p className="soft">Du får et muskelnavn – tryk på musklen på figuren. Ved forkert svar vises den rigtige placering.</p>
          <button type="button" className="btn" onClick={() => start('find')}>Start ({Math.min(count === 'alle' ? pool.length : count, pool.length)} spørgsmål)</button>
        </section>
        <section className="card card-l mode-card">
          <div className="mc-ico"><IconTag /></div>
          <h2>Navngiv musklen</h2>
          <p className="soft">En muskel er markeret – vælg det rigtige navn blandt fire muligheder.</p>
          <button type="button" className="btn" onClick={() => start('navn')}>Start ({Math.min(count === 'alle' ? pool.length : count, pool.length)} spørgsmål)</button>
        </section>
      </div>

      <div className="home-grid section">
        <section className="card card-l">
          <h2>Seneste runder</h2>
          {sessions.length === 0 ? (
            <p className="muted">Din quizhistorik gemmes her på enheden.</p>
          ) : (
            <ul className="list">
              {sessions.slice(0, 8).map((s) => {
                const ok = s.answers.filter((a) => a.correct).length;
                return (
                  <li key={s.id} className="list-item">
                    <span className="li-ico"><IconQuiz /></span>
                    <span className="li-body">
                      <span className="li-title">{MODE_LABEL[s.mode]}</span>
                      <span className="li-sub">{formatDate(s.finishedAt)}</span>
                    </span>
                    <span className="badge badge-source">{ok}/{s.answers.length}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        <section className="card card-l">
          <h2>Øv disse</h2>
          {weak.length === 0 ? (
            <p className="muted">Muskler du svarer forkert på, samles her.</p>
          ) : (
            <>
              <ul className="list">
                {weak.map((s) => {
                  const m = getMuscle(s.muscleId);
                  if (!m) return null;
                  return (
                    <li key={s.muscleId} className="list-item">
                      <span className="li-body">
                        <Link to={`/atlas/${m.id}`} className="li-title">{displayName(m, prefs.terminology)}</Link>
                        <span className="li-sub">{s.correct} af {s.attempts} rigtige</span>
                      </span>
                      <span className="bar" aria-hidden="true"><div style={{ width: `${(s.correct / s.attempts) * 100}%` }} /></span>
                    </li>
                  );
                })}
              </ul>
              <div className="row" style={{ marginTop: 12 }}>
                <button type="button" className="btn btn-secondary" onClick={() => start('find', weak.map((w) => w.muscleId))}>Øv: Find</button>
                <button type="button" className="btn btn-secondary" onClick={() => start('navn', weak.map((w) => w.muscleId))}>Øv: Navngiv</button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
