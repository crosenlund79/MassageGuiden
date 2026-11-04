import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getProgram, regions, searchTechniques, sequenceInRegion, sequenceNoteAfter, techniques } from '../domain/content';
import { TYPE_LABELS, type SequenceEntry, type TechniqueType } from '../domain/types';
import { SearchInput, TechniqueRow } from '../components/common';

function GapRow({ entries }: { entries: SequenceEntry[] }) {
  const first = entries[0];
  const last = entries[entries.length - 1];
  const label = entries.length > 1 ? `Trin ${first.step}–${last.step}` : `Trin ${first.step}`;
  return (
    <div className="gap-row">
      <span className="step-badge" aria-hidden="true">?</span>
      <span>
        <strong>{label}</strong> – {'reason' in first ? first.reason : ''}{' '}
        <span className="badge badge-missing">Mangler i kilden</span>
      </span>
    </div>
  );
}

/** Groups consecutive gap entries so "Trin 11–14" shows as one row. */
function chunk(entries: SequenceEntry[]): (SequenceEntry | SequenceEntry[])[] {
  const out: (SequenceEntry | SequenceEntry[])[] = [];
  for (const e of entries) {
    const prev = out[out.length - 1];
    if (e.gap && Array.isArray(prev)) prev.push(e);
    else out.push(e.gap ? [e] : e);
  }
  return out;
}

export function TechniquesPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const region = params.get('region') ?? '';
  const type = (params.get('type') ?? '') as TechniqueType | '';

  const set = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    setParams(next, { replace: true });
  };

  const results = useMemo(() => {
    let list = searchTechniques(q, techniques);
    if (region) list = list.filter((t) => t.region === region);
    if (type) list = list.filter((t) => t.type === type);
    return list;
  }, [q, region, type]);

  const filtering = Boolean(q || type);
  const types = Object.keys(TYPE_LABELS) as TechniqueType[];
  const shownRegions = region ? regions.filter((r) => r.id === region) : regions;

  return (
    <div className="fade-in">
      <div className="eyebrow">Massagegreb</div>
      <h1>Greb fra hæftet</h1>
      <p className="soft">I samme rækkefølge som i kildehæftet. Søg på greb, kropsregion eller muskel – på dansk eller latin.</p>

      <div className="tech-toolbar">
        <SearchInput value={q} onChange={(v) => set('q', v)} label="Søg i greb" placeholder="F.eks. trapezius, lænd, knofriktion …" />
        <div className="chip-scroll" role="group" aria-label="Region">
          <button type="button" className={`chip ${!region ? 'on' : ''}`} onClick={() => set('region', '')}>Alle regioner</button>
          {regions.map((r) => (
            <button key={r.id} type="button" className={`chip ${region === r.id ? 'on' : ''}`} aria-pressed={region === r.id} onClick={() => set('region', region === r.id ? '' : r.id)}>
              {r.name}
            </button>
          ))}
        </div>
        <div className="chip-scroll" role="group" aria-label="Type">
          {types.map((ty) => (
            <button key={ty} type="button" className={`chip ${type === ty ? 'on' : ''}`} aria-pressed={type === ty} onClick={() => set('type', type === ty ? '' : ty)}>
              {TYPE_LABELS[ty]}
            </button>
          ))}
        </div>
      </div>

      {filtering ? (
        <section aria-live="polite">
          <p className="muted small">{results.length} {results.length === 1 ? 'greb' : 'greb'} fundet</p>
          {results.length === 0 ? (
            <div className="empty card">
              <h3>Ingen greb matcher</h3>
              <p>Prøv et andet ord, f.eks. et muskelnavn eller en kropsdel.</p>
            </div>
          ) : (
            <div className="tech-list">
              {results.map((t) => <TechniqueRow key={t.id} t={t} showRegion />)}
            </div>
          )}
        </section>
      ) : (
        shownRegions.map((r) => {
          const entries = sequenceInRegion(r.id);
          const program = getProgram(r.program);
          return (
            <section key={r.id} className="region-block" aria-labelledby={`reg-${r.id}`}>
              <h2 id={`reg-${r.id}`}>
                {r.name} <span className="muted">{program ? `s. ${program.pages}` : ''}</span>
              </h2>
              <div className="tech-list">
                {chunk(entries).map((e) => {
                  if (Array.isArray(e)) return <GapRow key={e[0].id} entries={e} />;
                  if (e.gap) return null;
                  const note = sequenceNoteAfter(e);
                  return (
                    <div key={e.id} className="stack" style={{ gap: 8 }}>
                      <TechniqueRow t={e} />
                      {note && <div className="seq-note">{note}</div>}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
