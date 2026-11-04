import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AtlasFigure } from '../anatomy/AtlasFigure';
import { contentStats, getMuscle, getRegion, getTechnique, regions, techniquesInRegion } from '../domain/content';
import { SearchInput, formatDate } from '../components/common';
import { IconArrow, IconBody, IconHands, IconHeart, IconQuiz } from '../components/Icons';
import { useActivity, useFavorites, useQuizSessions } from '../storage/hooks';
import { aggregateStats } from '../storage/db';

function greeting() {
  const h = new Date().getHours();
  if (h < 10) return 'Godmorgen';
  if (h < 17) return 'Goddag';
  return 'Godaften';
}

export function RegionCards() {
  return (
    <div className="region-grid">
      {regions.map((r) => {
        const list = techniquesInRegion(r.id);
        const ids = [...new Set(list.flatMap((t) => t.muscles.map((m) => m.id)))];
        return (
          <Link key={r.id} to={`/greb?region=${r.id}`} className="region-card">
            <div className="rc-fig" aria-hidden="true">
              <AtlasFigure
                view={r.view}
                frame={r.frame}
                interactive={false}
                highlights={Object.fromEntries(ids.map((id) => [id, 'related' as const]))}
              />
            </div>
            <div className="rc-text">
              <div className="rc-name">{r.name}</div>
              <div className="rc-count">{list.length} greb</div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export function HomePage() {
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const activity = useActivity(6);
  const { favorites } = useFavorites();
  const { sessions } = useQuizSessions();
  const stats = aggregateStats(sessions);
  const totalAnswers = [...stats.values()].reduce((s, x) => s + x.attempts, 0);
  const totalCorrect = [...stats.values()].reduce((s, x) => s + x.correct, 0);
  const weakest = [...stats.values()]
    .filter((s) => s.attempts > 0 && s.correct < s.attempts)
    .sort((a, b) => a.correct / a.attempts - b.correct / b.attempts)
    .slice(0, 3);

  const favTechniques = favorites.filter((f) => f.kind === 'technique').slice(0, 4);

  return (
    <div className="fade-in">
      <section className="hero">
        <div>
          <div className="eyebrow">{greeting()}, Sofie</div>
          <h1>Din personlige massage&shy;reference</h1>
          <p>Greb fra hæftet, muskelatlas og quiz – samlet ét sted og altid tilgængeligt, også offline.</p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            nav(`/greb?q=${encodeURIComponent(q)}`);
          }}
        >
          <SearchInput value={q} onChange={setQ} label="Søg i greb" placeholder="Søg efter greb, region eller muskel …" />
        </form>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Kropsregioner</h2>
          <Link to="/greb">Alle greb</Link>
        </div>
        <RegionCards />
      </section>

      <div className="home-grid section">
        <section className="card card-l quiz-card">
          <div className="eyebrow" style={{ color: '#c9c5b8' }}>Quiz</div>
          <h2>Øv musklerne</h2>
          {totalAnswers > 0 ? (
            <div className="stat-row">
              <div><div className="stat-num">{sessions.length}</div><div className="stat-lbl">runder</div></div>
              <div><div className="stat-num">{Math.round((totalCorrect / totalAnswers) * 100)}%</div><div className="stat-lbl">rigtige svar</div></div>
              <div><div className="stat-num">{stats.size}</div><div className="stat-lbl">muskler øvet</div></div>
            </div>
          ) : (
            <p className="muted">Test dig selv: find musklen på figuren, eller navngiv den markerede muskel.</p>
          )}
          {weakest.length > 0 && (
            <p className="muted small">
              Øv især: {weakest.map((w) => getMuscle(w.muscleId)?.nameDa).filter(Boolean).join(', ')}
            </p>
          )}
          <div className="row">
            <Link className="btn" to="/quiz?start=find">Find musklen</Link>
            <Link className="btn btn-secondary" to="/quiz?start=navn">Navngiv musklen</Link>
          </div>
        </section>

        <section className="card card-l">
          <div className="section-head">
            <h2>Senest set</h2>
          </div>
          {activity.length === 0 ? (
            <p className="muted">Når du åbner greb og muskler, vises de her.</p>
          ) : (
            <ul className="list">
              {activity.map((a) => {
                if (a.kind === 'technique') {
                  const t = getTechnique(a.refId);
                  if (!t) return null;
                  return (
                    <li key={a.id}>
                      <Link to={`/greb/${t.id}`} className="list-item">
                        <span className="li-ico"><IconHands /></span>
                        <span className="li-body">
                          <span className="li-title">{t.name}</span>
                          <span className="li-sub">{getRegion(t.region)?.name} · trin {t.step} · {formatDate(a.at)}</span>
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
                          <span className="li-title">{m.nameDa}</span>
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
                        <span className="li-title">Quiz: {a.refId === 'find' ? 'Find musklen' : 'Navngiv musklen'}</span>
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
          <h2>Favoritter</h2>
          <Link to="/favoritter">Se alle</Link>
        </div>
        {favTechniques.length === 0 ? (
          <p className="muted">
            Tryk på <IconHeart width={16} height={16} style={{ verticalAlign: '-3px' }} /> på et greb for at gemme det her.
          </p>
        ) : (
          <ul className="list">
            {favTechniques.map((f) => {
              const t = getTechnique(f.refId);
              if (!t) return null;
              return (
                <li key={f.key}>
                  <Link to={`/greb/${t.id}`} className="list-item">
                    <span className="li-ico">{t.step}</span>
                    <span className="li-body">
                      <span className="li-title">{t.name}</span>
                      <span className="li-sub">{getRegion(t.region)?.name}</span>
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
            <div className="li-title">Kildemateriale: Massørskolen – Fyn, ”Massage i Billeder”</div>
            <div className="small muted">
              {contentStats.techniques} greb importeret · {contentStats.confirmed} direkte fra kilden · {contentStats.needsReview} til gennemsyn · {contentStats.gaps} trin mangler
            </div>
          </div>
          <IconArrow width={20} height={20} />
        </Link>
      </section>
    </div>
  );
}
