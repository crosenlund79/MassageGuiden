import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AtlasFigure } from '../anatomy/AtlasFigure';
import { viewsForMuscle, type AtlasView } from '../anatomy/figure2d';
import { getMuscle, getMuscleGroup, getRegion, muscles, searchMuscles, techniquesForMuscle } from '../domain/content';
import { FavoriteButton, SearchInput } from '../components/common';
import { usePrefs } from '../storage/hooks';
import { recordActivity } from '../storage/db';
import { displayName } from '../quiz/engine';
import { useI18n } from '../i18n/I18nProvider';
import { muscleAction, muscleInsertion, muscleName, muscleNote, muscleOrigin, regionName, techName } from '../i18n/localize';

export function AtlasPage() {
  const { muscleId } = useParams();
  const nav = useNavigate();
  const { s, lang } = useI18n();
  const [prefs, setPrefs] = usePrefs();
  const [view, setView] = useState<AtlasView>(prefs.atlasView);
  const [hover, setHover] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const selected = muscleId ? getMuscle(muscleId) : undefined;
  const showDeep = prefs.showDeep || selected?.layer === 'deep';

  // Switch to a view that actually contains the selected muscle
  useEffect(() => {
    if (!selected) return;
    const views = viewsForMuscle(selected.id);
    if (views.length && !views.includes(view)) setView(views[0]);
    void recordActivity('muscle', selected.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  const changeView = (v: AtlasView) => {
    setView(v);
    setPrefs({ atlasView: v });
  };

  const select = (id: string | null) => {
    if (!id) return;
    nav(`/atlas/${id}`, { replace: Boolean(muscleId) });
    setQ('');
  };

  const suggestions = useMemo(() => (q.trim() ? searchMuscles(q).slice(0, 8) : []), [q]);
  const related = selected ? techniquesForMuscle(selected.id) : [];
  const hovered = hover ? getMuscle(hover) : undefined;
  const label = (id: string) => {
    const m = getMuscle(id);
    return m ? displayName(m, prefs.terminology, lang) : id;
  };

  const highlights = selected ? { [selected.id]: 'selected' as const } : {};
  const selectedInOtherViewOnly = selected && !viewsForMuscle(selected.id).includes(view);
  const group = selected?.partOf ? getMuscleGroup(selected.partOf) : undefined;
  const note = selected ? muscleNote(selected, lang) : null;

  return (
    <div className="fade-in">
      <div className="eyebrow">{s.atlas.eyebrow}</div>
      <h1>{s.atlas.title}</h1>

      <div className="atlas-layout">
        <section className="card atlas-stage" aria-label={s.atlas.stage}>
          <div className="stage-bar">
            <div className="segmented" role="group" aria-label={s.atlas.view}>
              <button type="button" className={view === 'anterior' ? 'on' : ''} aria-pressed={view === 'anterior'} onClick={() => changeView('anterior')}>{s.atlas.front}</button>
              <button type="button" className={view === 'posterior' ? 'on' : ''} aria-pressed={view === 'posterior'} onClick={() => changeView('posterior')}>{s.atlas.back}</button>
            </div>
            <label className="toggle">
              <input type="checkbox" checked={prefs.showDeep} onChange={(e) => setPrefs({ showDeep: e.target.checked })} />
              {s.atlas.showDeep}
            </label>
          </div>
          <div className="fig-wrap">
            <AtlasFigure view={view} highlights={highlights} onSelect={select} onHover={setHover} showDeep={showDeep} zoomable labelFor={label} />
          </div>
          <div className="hover-cap" aria-live="polite">
            {hovered ? (
              <span><strong>{muscleName(hovered, lang)}</strong> <i className="muted">{hovered.nameLatin}</i></span>
            ) : selected && !selectedInOtherViewOnly ? (
              <span className="row" style={{ gap: 8 }}>
                <span><strong>{muscleName(selected, lang)}</strong> <i className="muted">{selected.nameLatin}</i></span>
                <span className="spacer" />
                <a href="#mp-h" className="small mobile-only" onClick={(e) => { e.preventDefault(); document.getElementById('mp-h')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>{s.atlas.details}</a>
              </span>
            ) : selectedInOtherViewOnly ? (
              <span>{s.atlas.otherSide(muscleName(selected!, lang))}</span>
            ) : (
              <span className="muted">{s.atlas.hint} {view === 'anterior' ? s.atlas.sides : ''}</span>
            )}
          </div>
        </section>

        <aside className="stack">
          <div>
            <SearchInput
              value={q}
              onChange={(v) => { setQ(v); setActive(0); }}
              label={s.atlas.searchLabel}
              placeholder={s.atlas.searchPlaceholder}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, suggestions.length - 1)); }
                if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
                if (e.key === 'Enter' && suggestions[active]) select(suggestions[active].id);
              }}
            />
            {q.trim() && (
              <div className="suggest" role="listbox" aria-label={s.atlas.suggestions}>
                {suggestions.length === 0 && <div className="empty small">{s.atlas.noMatch(q)}</div>}
                {suggestions.map((m, i) => (
                  <button key={m.id} type="button" role="option" aria-selected={i === active} className={i === active ? 'on' : ''} onClick={() => select(m.id)}>
                    <span>{muscleName(m, lang)}</span> <span className="s-latin">{m.nameLatin}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selected ? (
            <section className="card card-l muscle-panel fade-in" key={selected.id} aria-labelledby="mp-h">
              <div className="title-row">
                <div style={{ flex: 1 }}>
                  <h2 id="mp-h">{muscleName(selected, lang)}</h2>
                  <div className="latin">{selected.nameLatin}</div>
                  <div className="small muted alt-name">{lang === 'en' ? `DA: ${selected.nameDa}` : `EN: ${selected.nameEn}`}</div>
                </div>
                <FavoriteButton kind="muscle" id={selected.id} label={muscleName(selected, lang)} />
              </div>
              <div className="row" style={{ marginBottom: 12 }}>
                <span className="badge">{s.groups[selected.group]}</span>
                <span className="badge">{s.kinds[selected.kind]}</span>
                {selected.layer === 'deep' && <span className="badge badge-deep">{s.atlas.deep}</span>}
                {selected.daStatus !== 'gængs' && <span className="badge badge-review" title={lang === 'da' && selected.daReason ? selected.daReason : s.atlas.daReviewTitle}>{s.atlas.daReview}</span>}
              </div>
              {note && <p className="small soft">{note}</p>}
              {group && <p className="small soft">{s.atlas.partOf(muscleName(group, lang), group.nameLatin)}</p>}
              <dl className="kv">
                <dt>{s.atlas.origin}</dt><dd>{muscleOrigin(selected, lang)}</dd>
                <dt>{s.atlas.insertion}</dt><dd>{muscleInsertion(selected, lang)}</dd>
                <dt>{s.atlas.action}</dt><dd>{muscleAction(selected, lang)}</dd>
              </dl>
              <p className="small muted">{s.atlas.standard}</p>

              <h3 style={{ marginTop: 14 }}>{s.atlas.techniques(related.length)}</h3>
              {related.length === 0 ? (
                <p className="small muted">{s.atlas.noTechniques}</p>
              ) : (
                <div className="mini-tech">
                  {related.map((t) => {
                    const basis = t.muscles.find((l) => l.id === selected.id)?.basis;
                    const r = getRegion(t.region);
                    return (
                      <Link key={t.id} to={`/greb/${t.id}`}>
                        <span className="step-badge">{t.step}</span>
                        <span className="li-body">
                          <span className="li-title">{techName(t, lang)}</span>
                          <span className="li-sub">{r ? regionName(r, lang) : ''}{basis === 'afledt' ? ` · ${s.atlas.inferredLink}` : ''}</span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          ) : (
            <section className="card card-l">
              <h3>{s.atlas.choose}</h3>
              <p className="soft small">{s.atlas.chooseText(muscles.filter((m) => m.layer === 'superficial').length, muscles.filter((m) => m.layer === 'deep').length)}</p>
              <p className="small muted">{s.atlas.simplified}</p>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
