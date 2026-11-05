import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AtlasFigure, type HighlightTone } from '../anatomy/AtlasFigure';
import { viewsForMuscle, type AtlasView } from '../anatomy/figure2d';
import { getMuscle } from '../domain/content';
import type { MuscleGroup } from '../domain/types';
import { TerminologySwitch, useFormatDate } from '../components/common';
import { IconCheck, IconQuiz, IconTarget, IconTag, IconX } from '../components/Icons';
import { buildQuestions, displayName, quizPool, type Question } from '../quiz/engine';
import { aggregateStats, recordActivity, saveQuizSession, type QuizAnswer, type QuizMode, type Terminology } from '../storage/db';
import { usePrefs, useQuizSessions } from '../storage/hooks';
import { useI18n } from '../i18n/I18nProvider';
import { muscleAction, muscleName } from '../i18n/localize';

const SKIP = '__skip__';

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
  const { s, lang } = useI18n();
  const { mode, questions } = config;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const q = questions[index];
  // view belongs to the current question; derived synchronously so a new question never shows the previous view
  const [viewState, setViewState] = useState<{ i: number; v: AtlasView }>({ i: 0, v: q.view });
  const view = viewState.i === index ? viewState.v : q.view;
  const setView = (v: AtlasView) => setViewState({ i: index, v });
  const target = getMuscle(q.muscleId)!;
  const answered = answers.length > index;
  const current = answers[index];
  const score = answers.filter((a) => a.correct).length;
  const nextRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setPicked(null);
  }, [index]);

  useEffect(() => {
    if (answered) nextRef.current?.focus();
  }, [answered]);

  const targetViews = viewsForMuscle(q.muscleId);

  const answer = (id: string | null) => {
    if (answered || !id) return;
    const correct = id === q.muscleId;
    setPicked(id);
    setAnswers((a) => [...a, { muscleId: q.muscleId, correct, answeredId: id === SKIP ? null : id }]);
    // skipped: make sure the correct muscle is on screen
    if (id === SKIP && !targetViews.includes(view)) setView(targetViews[0]);
  };

  const next = () => {
    if (index + 1 >= questions.length) onDone(answers);
    else setIndex(index + 1);
  };

  const name = (id: string) => {
    const m = getMuscle(id);
    return m ? displayName(m, terminology, lang) : id;
  };

  // ---- feedback colours: chosen muscle RED, correct muscle GREEN, shown together until "Next" ----
  const wrongPick = answered && !current.correct && picked && picked !== SKIP ? picked : null;
  let highlights: Record<string, HighlightTone> = {};
  if (mode === 'navn') {
    highlights = answered
      ? { ...(wrongPick ? { [wrongPick]: 'wrong' as const } : {}), [q.muscleId]: 'correct' }
      : { [q.muscleId]: 'selected' };
  } else if (answered) {
    highlights = { ...(wrongPick ? { [wrongPick]: 'wrong' as const } : {}), [q.muscleId]: 'correct' };
  }
  // If the correct muscle is not visible in the view the user answered in, show both views side by side.
  // (i.e. whenever the chosen and the correct muscle are not both visible in the current view)
  const splitView = mode === 'find' && Boolean(wrongPick) && !(targetViews.includes(view) && viewsForMuscle(wrongPick!).includes(view));

  const where = targetViews.length > 1 ? s.quiz.where.both : s.quiz.where[targetViews[0]];
  const explanation = s.quiz.explain(where, muscleAction(target, lang));
  const targetLabel = <><strong style={{ display: 'inline' }}>{muscleName(target, lang)}</strong> (<i>{target.nameLatin}</i>)</>;

  return (
    <div className="quiz-shell fade-in">
      <section className="card quiz-stage">
        <div className="stage-bar quiz-bar">
          {mode === 'find' && !splitView ? (
            <div className="segmented" role="group" aria-label={s.atlas.view}>
              <button type="button" className={view === 'anterior' ? 'on' : ''} aria-pressed={view === 'anterior'} onClick={() => setView('anterior')}>{s.atlas.front}</button>
              <button type="button" className={view === 'posterior' ? 'on' : ''} aria-pressed={view === 'posterior'} onClick={() => setView('posterior')}>{s.atlas.back}</button>
            </div>
          ) : (
            <span className="small muted">{splitView ? `${s.atlas.front} · ${s.atlas.back}` : view === 'anterior' ? s.quiz.seenFront : s.quiz.seenBack}</span>
          )}
          <span className="small muted">{mode === 'find' ? s.quiz.tapMuscle : s.quiz.whichMarked}</span>
        </div>
        <div className={`fig-wrap ${splitView ? 'split' : ''}`}>
          {splitView ? (
            <>
              {(['anterior', 'posterior'] as const).map((v) => (
                <div key={v} className="split-pane">
                  <span className="split-label">{v === 'anterior' ? s.atlas.front : s.atlas.back}</span>
                  <AtlasFigure view={v} highlights={highlights} interactive={false} zoomable resetKey={`${index}-split`}
                    ariaLabel={v === 'anterior' ? s.atlas.figureFront : s.atlas.figureBack} />
                </div>
              ))}
            </>
          ) : (
            <AtlasFigure
              view={view}
              highlights={highlights}
              onSelect={mode === 'find' ? answer : undefined}
              interactive={mode === 'find' && !answered}
              zoomable
              focusMuscles={mode === 'navn' ? [q.muscleId] : undefined}
              resetKey={index}
              labelFor={mode === 'find' ? () => s.quiz.muscle : undefined}
              ariaLabel={mode === 'find' ? s.quiz.figureFind : s.quiz.figureMarked}
            />
          )}
        </div>
        {answered && (
          <div className="quiz-key" aria-hidden="true">
            <span><i className="key-dot correct" /> {s.quiz.rightShort}</span>
            {wrongPick && <span><i className="key-dot wrong" /> {s.quiz.wrongShort}</span>}
          </div>
        )}
      </section>

      <aside className="stack">
        <div className="quiz-head">
          <span className="small soft" aria-live="polite">{s.quiz.question(index + 1, questions.length)}</span>
          <div className="progress" aria-hidden="true"><div style={{ width: `${((index + (answered ? 1 : 0)) / questions.length) * 100}%` }} /></div>
          <span className="badge badge-source">{s.quiz.points(score)}</span>
        </div>

        {mode === 'find' ? (
          <div className="card card-l">
            <div className="prompt" data-muscle={q.muscleId}><small>{s.quiz.find}</small>{name(q.muscleId)}</div>
            {targetViews.length > 1 && !answered && <p className="small muted" style={{ margin: '8px 0 0' }}>{s.quiz.bothViews}</p>}
            {!targetViews.includes(view) && !answered && <p className="small muted" style={{ margin: '8px 0 0' }}>{s.quiz.tryOtherSide}</p>}
          </div>
        ) : (
          <div className="options" role="group" aria-label={s.quiz.options} data-muscle={q.muscleId}>
            {q.options!.map((id) => {
              const m = getMuscle(id)!;
              const isCorrect = id === q.muscleId;
              const cls = answered ? (isCorrect ? 'correct' : id === picked ? 'wrong' : '') : '';
              return (
                <button key={id} type="button" data-muscle={id} className={`option ${cls}`} disabled={answered} onClick={() => answer(id)}>
                  {terminology === 'begge' ? (<>{muscleName(m, lang)}<span className="o-latin">{m.nameLatin}</span></>) : displayName(m, terminology, lang)}
                </button>
              );
            })}
          </div>
        )}

        {answered && (
          <div className={`feedback fade-in ${current.correct ? 'ok' : 'bad'}`} role="status">
            {current.correct ? <IconCheck width={24} height={24} /> : <IconX width={24} height={24} />}
            <div>
              <strong>{current.correct ? s.quiz.correct : picked === SKIP ? s.quiz.skipped : s.quiz.wrong}</strong>
              {current.correct ? (
                <span>{targetLabel}</span>
              ) : (
                <span>
                  {wrongPick ? <>{s.quiz.youChose(name(wrongPick))} </> : null}
                  {s.quiz.rightAnswer} {targetLabel} {s.quiz.shownGreen}.
                  {splitView && <> {s.quiz.otherViewShown}</>}
                </span>
              )}
              <span className="explain">{explanation}</span>
            </div>
          </div>
        )}

        <div className="row">
          {answered ? (
            <button ref={nextRef} type="button" className="btn btn-sage" onClick={next}>
              {index + 1 >= questions.length ? s.quiz.seeResult : s.quiz.nextQuestion}
            </button>
          ) : mode === 'find' ? (
            <button type="button" className="btn btn-secondary" onClick={() => answer(SKIP)}>{s.quiz.dontKnow}</button>
          ) : null}
          <span className="spacer" />
          <button type="button" className="btn btn-ghost" onClick={onQuit}>{s.quiz.quit}</button>
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
  const { s, lang } = useI18n();
  const correct = answers.filter((a) => a.correct).length;
  const pct = Math.round((correct / answers.length) * 100);
  const wrong = answers.filter((a) => !a.correct);
  const r = 52, c = 2 * Math.PI * r;
  return (
    <div className="stack fade-in" style={{ maxWidth: 720 }}>
      <div className="eyebrow">{s.quiz.modes[mode]} · {s.quiz.result}</div>
      <div className="card card-l row" style={{ gap: 22 }}>
        <svg className="score-ring" viewBox="0 0 128 128" role="img" aria-label={s.quiz.percent(pct)}>
          <circle cx="64" cy="64" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="12" />
          <circle cx="64" cy="64" r={r} fill="none" stroke="var(--sage)" strokeWidth="12" strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * c} ${c}`} transform="rotate(-90 64 64)" />
          <text x="64" y="70" textAnchor="middle" style={{ font: '500 26px var(--font-serif)', fill: 'var(--olive)' }}>{pct}%</text>
        </svg>
        <div>
          <h1 style={{ marginBottom: 4 }}>{s.quiz.ofTotal(correct, answers.length)}</h1>
          <p className="soft" style={{ margin: 0 }}>{pct === 100 ? s.quiz.perfect : pct >= 70 ? s.quiz.good : s.quiz.keepGoing}</p>
        </div>
      </div>

      <div className="row">
        {wrong.length > 0 && <button type="button" className="btn btn-sage" onClick={onRetry}>{s.quiz.retryWrong(wrong.length)}</button>}
        <button type="button" className="btn btn-secondary" onClick={onNew}>{s.quiz.newRound}</button>
        <button type="button" className="btn btn-ghost" onClick={onBack}>{s.quiz.toOverview}</button>
      </div>

      <section className="card">
        <h3>{s.quiz.review}</h3>
        <ul className="list result-list">
          {answers.map((a, i) => {
            const m = getMuscle(a.muscleId)!;
            return (
              <li key={i}>
                <span className={`dot ${a.correct ? 'ok' : 'bad'}`} aria-label={a.correct ? s.quiz.rightShort : s.quiz.wrongShort} />
                <span className="li-body"><Link to={`/atlas/${m.id}`}>{displayName(m, terminology, lang)}</Link></span>
                <span className="small muted">{a.correct ? s.quiz.rightShort : s.quiz.wrongShort}</span>
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
  const { s, lang } = useI18n();
  const formatDate = useFormatDate();
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
    const st = params.get('start');
    if (st === 'find' || st === 'navn') {
      start(st);
      setParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase.kind === 'play') {
    const { config, startedAt } = phase;
    return (
      <>
        <div className="eyebrow">{s.quiz.eyebrow} · {s.quiz.modes[config.mode]}</div>
        <Session
          key={startedAt}
          config={config}
          terminology={prefs.terminology}
          onQuit={() => setPhase({ kind: 'menu' })}
          onDone={(answers) => {
            void saveQuizSession({
              id: `${startedAt}-${Math.random().toString(36).slice(2, 7)}`,
              mode: config.mode, startedAt, finishedAt: Date.now(), terminology: prefs.terminology, answers,
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
  const weak = statList.filter((x) => x.correct < x.attempts).slice(0, 6);
  const groups: (MuscleGroup | 'alle')[] = ['alle', ...(Object.keys(s.groups) as MuscleGroup[])];
  const n = Math.min(count === 'alle' ? pool.length : count, pool.length);

  return (
    <div className="fade-in">
      <div className="eyebrow">{s.quiz.eyebrow}</div>
      <h1>{s.quiz.title}</h1>
      <p className="soft">{s.quiz.intro}</p>

      <section className="card card-l settings section" aria-label={s.quiz.settings}>
        <div>
          <span className="lbl">{s.terminology.label}</span>
          <TerminologySwitch />
        </div>
        <div>
          <span className="lbl">{s.quiz.group}</span>
          <div className="chip-scroll" role="group" aria-label={s.quiz.group}>
            {groups.map((g) => (
              <button key={g} type="button" className={`chip ${group === g ? 'on' : ''}`} aria-pressed={group === g} onClick={() => setGroup(g)}>
                {g === 'alle' ? s.quiz.wholeBody : s.groups[g]} <span className="muted">{quizPool(g).length}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="lbl">{s.quiz.count}</span>
          <div className="segmented" role="group" aria-label={s.quiz.count}>
            {([5, 10, 20, 'alle'] as const).map((c) => (
              <button key={c} type="button" className={count === c ? 'on' : ''} aria-pressed={count === c} onClick={() => setCount(c)}>
                {c === 'alle' ? s.quiz.all(pool.length) : c}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="mode-grid section">
        <section className="card card-l mode-card">
          <div className="mc-ico"><IconTarget /></div>
          <h2>{s.quiz.modes.find}</h2>
          <p className="soft">{s.quiz.findText}</p>
          <button type="button" className="btn" onClick={() => start('find')}>{s.quiz.start(n)}</button>
        </section>
        <section className="card card-l mode-card">
          <div className="mc-ico"><IconTag /></div>
          <h2>{s.quiz.modes.navn}</h2>
          <p className="soft">{s.quiz.nameText}</p>
          <button type="button" className="btn" onClick={() => start('navn')}>{s.quiz.start(n)}</button>
        </section>
      </div>

      <div className="home-grid section">
        <section className="card card-l">
          <h2>{s.quiz.recentRounds}</h2>
          {sessions.length === 0 ? (
            <p className="muted">{s.quiz.historyEmpty}</p>
          ) : (
            <ul className="list">
              {sessions.slice(0, 8).map((x) => {
                const ok = x.answers.filter((a) => a.correct).length;
                return (
                  <li key={x.id} className="list-item">
                    <span className="li-ico"><IconQuiz /></span>
                    <span className="li-body">
                      <span className="li-title">{s.quiz.modes[x.mode]}</span>
                      <span className="li-sub">{formatDate(x.finishedAt)}</span>
                    </span>
                    <span className="badge badge-source">{ok}/{x.answers.length}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        <section className="card card-l">
          <h2>{s.quiz.practise}</h2>
          {weak.length === 0 ? (
            <p className="muted">{s.quiz.practiseEmpty}</p>
          ) : (
            <>
              <ul className="list">
                {weak.map((x) => {
                  const m = getMuscle(x.muscleId);
                  if (!m) return null;
                  return (
                    <li key={x.muscleId} className="list-item">
                      <span className="li-body">
                        <Link to={`/atlas/${m.id}`} className="li-title">{displayName(m, prefs.terminology, lang)}</Link>
                        <span className="li-sub">{s.quiz.ofCorrect(x.correct, x.attempts)}</span>
                      </span>
                      <span className="bar" aria-hidden="true"><div style={{ width: `${(x.correct / x.attempts) * 100}%` }} /></span>
                    </li>
                  );
                })}
              </ul>
              <div className="row" style={{ marginTop: 12 }}>
                <button type="button" className="btn btn-secondary" onClick={() => start('find', weak.map((w) => w.muscleId))}>{s.quiz.practiseFind}</button>
                <button type="button" className="btn btn-secondary" onClick={() => start('navn', weak.map((w) => w.muscleId))}>{s.quiz.practiseName}</button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
