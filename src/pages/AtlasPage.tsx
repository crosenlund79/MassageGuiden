import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AtlasFigure } from '../anatomy/AtlasFigure';
import { viewsForMuscle, type AtlasView } from '../anatomy/figure2d';
import { getMuscle, getRegion, muscles, searchMuscles, techniquesForMuscle } from '../domain/content';
import { GROUP_LABELS, KIND_LABELS } from '../domain/types';
import { FavoriteButton, SearchInput } from '../components/common';
import { usePrefs } from '../storage/hooks';
import { recordActivity } from '../storage/db';
import { displayName } from '../quiz/engine';

export function AtlasPage() {
  const { muscleId } = useParams();
  const nav = useNavigate();
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
    return m ? displayName(m, prefs.terminology) : id;
  };

  const highlights = selected ? { [selected.id]: 'selected' as const } : {};
  const selectedInOtherViewOnly = selected && !viewsForMuscle(selected.id).includes(view);

  return (
    <div className="fade-in">
      <div className="eyebrow">Muskelatlas</div>
      <h1>Kroppens muskler</h1>

      <div className="atlas-layout">
        <section className="card atlas-stage" aria-label="Interaktiv muskelfigur">
          <div className="stage-bar">
            <div className="segmented" role="group" aria-label="Visning">
              <button type="button" className={view === 'anterior' ? 'on' : ''} aria-pressed={view === 'anterior'} onClick={() => changeView('anterior')}>Forfra</button>
              <button type="button" className={view === 'posterior' ? 'on' : ''} aria-pressed={view === 'posterior'} onClick={() => changeView('posterior')}>Bagfra</button>
            </div>
            <label className="toggle">
              <input type="checkbox" checked={prefs.showDeep} onChange={(e) => setPrefs({ showDeep: e.target.checked })} />
              Vis dybe muskler
            </label>
          </div>
          <div className="fig-wrap">
            <AtlasFigure
              view={view}
              highlights={highlights}
              onSelect={select}
              onHover={setHover}
              showDeep={showDeep}
              zoomable
              labelFor={label}
            />
          </div>
          <div className="hover-cap" aria-live="polite">
            {hovered ? (
              <span><strong>{hovered.nameDa}</strong> <i className="muted">{hovered.nameLatin}</i></span>
            ) : selected && !selectedInOtherViewOnly ? (
              <span className="row" style={{ gap: 8 }}>
                <span><strong>{selected.nameDa}</strong> <i className="muted">{selected.nameLatin}</i></span>
                <span className="spacer" />
                <a href="#mp-h" className="small mobile-only" onClick={(e) => { e.preventDefault(); document.getElementById('mp-h')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>Detaljer ↓</a>
              </span>
            ) : selectedInOtherViewOnly ? (
              <span>{selected?.nameDa} ses fra den anden side.</span>
            ) : (
              <span className="muted">Tryk på en muskel. Knib eller scroll for at zoome, træk for at panorere. {view === 'anterior' ? 'H/V = figurens højre/venstre side.' : ''}</span>
            )}
          </div>
        </section>

        <aside className="stack">
          <div>
            <SearchInput
              value={q}
              onChange={(v) => { setQ(v); setActive(0); }}
              label="Søg muskel"
              placeholder="Søg muskel – dansk eller latin"
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, suggestions.length - 1)); }
                if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
                if (e.key === 'Enter' && suggestions[active]) select(suggestions[active].id);
              }}
            />
            {q.trim() && (
              <div className="suggest" role="listbox" aria-label="Forslag">
                {suggestions.length === 0 && <div className="empty small">Ingen muskler matcher ”{q}”.</div>}
                {suggestions.map((m, i) => (
                  <button key={m.id} type="button" role="option" aria-selected={i === active} className={i === active ? 'on' : ''} onClick={() => select(m.id)}>
                    <span>{m.nameDa}</span> <span className="s-latin">{m.nameLatin}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selected ? (
            <section className="card card-l muscle-panel fade-in" key={selected.id} aria-labelledby="mp-h">
              <div className="title-row">
                <div style={{ flex: 1 }}>
                  <h2 id="mp-h">{selected.nameDa}</h2>
                  <div className="latin">{selected.nameLatin}</div>
                </div>
                <FavoriteButton kind="muscle" id={selected.id} label={selected.nameDa} />
              </div>
              <div className="row" style={{ marginBottom: 12 }}>
                <span className="badge">{GROUP_LABELS[selected.group]}</span>
                <span className="badge">{KIND_LABELS[selected.kind]}</span>
                {selected.layer === 'deep' && <span className="badge badge-deep">Dybtliggende</span>}
                {selected.danishNameUncertain && <span className="badge badge-review" title="Det danske navn bør bekræftes">Dansk navn til gennemsyn</span>}
              </div>
              {selected.note && <p className="small soft">{selected.note}</p>}
              <dl className="kv">
                <dt>Udspring</dt><dd>{selected.origin}</dd>
                <dt>Hæfte</dt><dd>{selected.insertion}</dd>
                <dt>Funktion</dt><dd>{selected.action}</dd>
              </dl>
              <p className="small muted">Standardanatomi – ikke fra kildehæftet. Bør gennemses med lærebog/underviser.</p>

              <h3 style={{ marginTop: 14 }}>Massagegreb ({related.length})</h3>
              {related.length === 0 ? (
                <p className="small muted">Ingen greb i hæftet er koblet til denne muskel.</p>
              ) : (
                <div className="mini-tech">
                  {related.map((t) => {
                    const basis = t.muscles.find((l) => l.id === selected.id)?.basis;
                    return (
                      <Link key={t.id} to={`/greb/${t.id}`}>
                        <span className="step-badge">{t.step}</span>
                        <span className="li-body">
                          <span className="li-title">{t.name}</span>
                          <span className="li-sub">{getRegion(t.region)?.name}{basis === 'afledt' ? ' · afledt kobling' : ''}</span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          ) : (
            <section className="card card-l">
              <h3>Vælg en muskel</h3>
              <p className="soft small">Tryk på figuren eller søg. Atlasset viser {muscles.filter((m) => m.layer === 'superficial').length} overfladiske strukturer og {muscles.filter((m) => m.layer === 'deep').length} dybe muskler, der nævnes i hæftet.</p>
              <p className="small muted">Figuren er en forenklet, original illustration. Muskelformerne er skematiske – brug en anatomibog til detaljer.</p>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
