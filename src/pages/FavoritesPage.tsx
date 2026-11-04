import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getMuscle, getRegion, getTechnique } from '../domain/content';
import { TechniqueRow, formatDate } from '../components/common';
import { IconArrow, IconHeart, IconNote } from '../components/Icons';
import { useFavorites, useNotes } from '../storage/hooks';

type Tab = 'greb' | 'muskler' | 'noter';

export function FavoritesPage() {
  const { favorites } = useFavorites();
  const { notes } = useNotes();
  const [tab, setTab] = useState<Tab>('greb');
  const favTech = favorites.filter((f) => f.kind === 'technique').map((f) => getTechnique(f.refId)).filter((t) => t !== undefined);
  const favMuscles = favorites.filter((f) => f.kind === 'muscle').map((f) => getMuscle(f.refId)).filter((m) => m !== undefined);

  const tabs: [Tab, string, number][] = [
    ['greb', 'Greb', favTech.length],
    ['muskler', 'Muskler', favMuscles.length],
    ['noter', 'Mine noter', notes.length],
  ];

  return (
    <div className="fade-in">
      <div className="eyebrow">Dit indhold</div>
      <h1>Favoritter og noter</h1>
      <p className="soft">Alt her er dit eget og gemmes kun lokalt på denne enhed.</p>

      <div className="segmented" role="tablist" aria-label="Vælg liste" style={{ marginBottom: 18 }}>
        {tabs.map(([id, label, n]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>
            {label} <span className="muted">{n}</span>
          </button>
        ))}
      </div>

      {tab === 'greb' && (
        favTech.length === 0 ? (
          <div className="empty card">
            <IconHeart width={32} height={32} />
            <h3>Ingen favoritgreb endnu</h3>
            <p>Tryk på hjertet på et greb for at gemme det her.</p>
            <Link className="btn btn-secondary" to="/greb">Gå til massagegreb</Link>
          </div>
        ) : (
          <div className="tech-list">{favTech.map((t) => <TechniqueRow key={t.id} t={t} showRegion />)}</div>
        )
      )}

      {tab === 'muskler' && (
        favMuscles.length === 0 ? (
          <div className="empty card">
            <h3>Ingen favoritmuskler endnu</h3>
            <p>Gem muskler fra muskelatlasset.</p>
            <Link className="btn btn-secondary" to="/atlas">Åbn muskelatlas</Link>
          </div>
        ) : (
          <div className="card"><ul className="list">
            {favMuscles.map((m) => (
              <li key={m.id}>
                <Link to={`/atlas/${m.id}`} className="list-item">
                  <span className="li-body">
                    <span className="li-title">{m.nameDa}</span>
                    <span className="li-sub"><i>{m.nameLatin}</i></span>
                  </span>
                  <IconArrow width={18} height={18} />
                </Link>
              </li>
            ))}
          </ul></div>
        )
      )}

      {tab === 'noter' && (
        notes.length === 0 ? (
          <div className="empty card">
            <IconNote width={32} height={32} />
            <h3>Ingen noter endnu</h3>
            <p>Skriv noter direkte på hvert greb.</p>
          </div>
        ) : (
          <div className="stack">
            {notes.map((n) => {
              const t = getTechnique(n.techniqueId);
              if (!t) return null;
              return (
                <Link key={n.techniqueId} to={`/greb/${t.id}`} className="note-card" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                  <div className="row small soft" style={{ marginBottom: 6 }}>
                    <span className="badge badge-user">Din note</span>
                    <span>{getRegion(t.region)?.name} · trin {t.step}</span>
                    <span className="spacer" />
                    <span>{formatDate(n.updatedAt)}</span>
                  </div>
                  <div className="li-title" style={{ marginBottom: 4 }}>{t.name}</div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{n.text}</div>
                </Link>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
