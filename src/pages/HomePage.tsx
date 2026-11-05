import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AtlasFigure } from '../anatomy/AtlasFigure';
import { contentStats, getMuscle, getRegion, getTechnique, regions, techniquesInRegion } from '../domain/content';
import { SearchInput, useFormatDate } from '../components/common';
import { IconArrow, IconBody, IconHands, IconHeart, IconQuiz } from '../components/Icons';
import { useActivity, useFavorites, useQuizSessions } from '../storage/hooks';
import { aggregateStats } from '../storage/db';
import { useI18n } from '../i18n/I18nProvider';
import { muscleName, regionName, techName } from '../i18n/localize';

export function RegionCards() {
  const { s, lang } = useI18n();
  return (
    <div className="region-grid">
      {regions.map((r) => {
        const list = techniquesInRegion(r.id);
        const ids = [...new Set(list.flatMap((t) => t.muscles.map((m) => m.id)))];
        return (
          <Link key={r.id} to={`/greb?region=${r.id}`} className="region-card">
            <div className="rc-fig" aria-hidden="true">
              <AtlasFigure view={r.view} frame={r.frame} interactive={false}
                highlights={Object.fromEntries(ids.map((id) => [id, 'related' as const]))} />
            </div>
            <div className="rc-text">
              <div className="rc-name">{regionName(r, lang)}</div>
              <div className="rc-count">{s.common.techniqueCount(list.length)}</div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export function HomePage() {
  const nav = useNavigate();
  const { s, lang } = useI18n();
  const formatDate = useFormatDate();
  const [q, setQ] = useState('');
  const activity = useActivity(6);
  const { favorites } = useFavorites();
  const { sessions } = useQuizSessions();
  const stats = aggregateStats(sessions);
  const totalAnswers = [...stats.values()].reduce((a, x) => a + x.attempts, 0);
  const totalCorrect = [...stats.values()].reduce((a, x) => a + x.correct, 0);
  const weakest = [...stats.values()]
    .filter((x) => x.attempts > 0 && x.correct < x.attempts)
    .sort((a, b) => a.correct / a.attempts - b.correct / b.attempts)
    .slice(0, 3);
  const favTechniques = favorites.filter((f) => f.kind === 'technique').slice(0, 4);

  return (
    <div className="fade-in">
      <section className="hero">
        <div>
          <div className="eyebrow">{s.home.greeting(new Date().getHours())}, Sofie</div>
          <h1>{s.home.title}</h1>
          <p>{s.home.intro}</p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); nav(`/greb?q=${encodeURIComponent(q)}`); }}>
          <SearchInput value={q} onChange={setQ} label={s.home.searchLabel} placeholder={s.home.searchPlaceholder} />
        </form>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>{s.home.regions}</h2>
          <Link to="/greb">{s.home.allTechniques}</Link>
        </div>
        <RegionCards />
      </section>

      <div className="home-grid section">
        <section className="card card-l quiz-card">
          <div className="eyebrow" style={{ color: '#c9c5b8' }}>{s.home.quizEyebrow}</div>
          <h2>{s.home.quizTitle}</h2>
          {totalAnswers > 0 ? (
            <div className="stat-row">
              <div><div className="stat-num">{sessions.length}</div><div className="stat-lbl">{s.home.rounds}</div></div>
              <div><div className="stat-num">{Math.round((totalCorrect / totalAnswers) * 100)}%</div><div className="stat-lbl">{s.home.correctAnswers}</div></div>
              <div><div className="stat-num">{stats.size}</div><div className="stat-lbl">{s.home.musclesPractised}</div></div>
            </div>
          ) : (
            <p className="muted">{s.home.quizIntro}</p>
          )}
          {weakest.length > 0 && (
            <p className="muted small">
              {s.home.practiseEspecially}{weakest.map((w) => getMuscle(w.muscleId)).filter((m) => m !== undefined).map((m) => muscleName(m, lang)).join(', ')}
            </p>
          )}
          <div className="row">
            <Link className="btn" to="/quiz?start=find">{s.quiz.modes.find}</Link>
            <Link className="btn btn-secondary" to="/quiz?start=navn">{s.quiz.modes.navn}</Link>
          </div>
        </section>

        <section className="card card-l">
          <div className="section-head"><h2>{s.home.recent}</h2></div>
          {activity.length === 0 ? (
            <p className="muted">{s.home.recentEmpty}</p>
          ) : (
            <ul className="list">
              {activity.map((a) => {
                if (a.kind === 'technique') {
                  const t = getTechnique(a.refId);
                  if (!t) return null;
                  const r = getRegion(t.region);
                  return (
                    <li key={a.id}>
                      <Link to={`/greb/${t.id}`} className="list-item">
                        <span className="li-ico"><IconHands /></span>
                        <span className="li-body">
                          <span className="li-title">{techName(t, lang)}</span>
                          <span className="li-sub">{r ? regionName(r, lang) : ''} · {s.common.stepLower(t.step)} · {formatDate(a.at)}</span>
                        </span>
                      </Link>
                    </li>
                  );
                }
                if (a.kind === 'muscle') {
                  const m = getMuscle(a.refId);
                  if (!m) return null;
                  return (
                    <li key={a.id}>
                      <Link to={`/atlas/${m.id}`} className="list-item">
                        <span className="li-ico"><IconBody /></span>
                        <span className="li-body">
                          <span className="li-title">{muscleName(m, lang)}</span>
                          <span className="li-sub"><i>{m.nameLatin}</i> · {formatDate(a.at)}</span>
                        </span>
                      </Link>
                    </li>
                  );
                }
                return (
                  <li key={a.id}>
                    <Link to="/quiz" className="list-item">
                      <span className="li-ico"><IconQuiz /></span>
                      <span className="li-body">
                        <span className="li-title">{s.home.quizActivity(a.refId === 'find' ? s.quiz.modes.find : s.quiz.modes.navn)}</span>
                        <span className="li-sub">{formatDate(a.at)}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <section className="section card card-l">
        <div className="section-head">
          <h2>{s.nav.favorites}</h2>
          <Link to="/favoritter">{s.common.seeAll}</Link>
        </div>
        {favTechniques.length === 0 ? (
          <p className="muted">
            {s.home.favEmptyBefore} <IconHeart width={16} height={16} style={{ verticalAlign: '-3px' }} /> {s.home.favEmptyAfter}
          </p>
        ) : (
          <ul className="list">
            {favTechniques.map((f) => {
              const t = getTechnique(f.refId);
              if (!t) return null;
              const r = getRegion(t.region);
              return (
                <li key={f.key}>
                  <Link to={`/greb/${t.id}`} className="list-item">
                    <span className="li-ico">{t.step}</span>
                    <span className="li-body">
                      <span className="li-title">{techName(t, lang)}</span>
                      <span className="li-sub">{r ? regionName(r, lang) : ''}</span>
                    </span>
                    <IconArrow width={18} height={18} className="muted" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="section">
        <Link to="/om" className="card row" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="li-body">
            <div className="li-title">{s.home.sourceTitle}</div>
            <div className="small muted">{s.home.sourceStats(contentStats.techniques, contentStats.confirmed, contentStats.needsReview, contentStats.gaps)}</div>
          </div>
          <IconArrow width={20} height={20} />
        </Link>
      </section>
    </div>
  );
}
