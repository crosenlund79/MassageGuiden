import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getMuscle, getRegion, getTechnique } from '../domain/content';
import { TechniqueRow, useFormatDate } from '../components/common';
import { IconArrow, IconHeart, IconNote } from '../components/Icons';
import { useFavorites, useNotes } from '../storage/hooks';
import { useI18n } from '../i18n/I18nProvider';
import { muscleName, regionName, techName } from '../i18n/localize';

type Tab = 'greb' | 'muskler' | 'noter';

export function FavoritesPage() {
  const { s, lang } = useI18n();
  const formatDate = useFormatDate();
  const { favorites } = useFavorites();
  const { notes } = useNotes();
  const [tab, setTab] = useState<Tab>('greb');
  const favTech = favorites.filter((f) => f.kind === 'technique').map((f) => getTechnique(f.refId)).filter((t) => t !== undefined);
  const favMuscles = favorites.filter((f) => f.kind === 'muscle').map((f) => getMuscle(f.refId)).filter((m) => m !== undefined);

  const tabs: [Tab, string, number][] = [
    ['greb', s.favorites.techniques, favTech.length],
    ['muskler', s.favorites.muscles, favMuscles.length],
    ['noter', s.favorites.notes, notes.length],
  ];

  return (
    <div className="fade-in">
      <div className="eyebrow">{s.favorites.eyebrow}</div>
      <h1>{s.favorites.title}</h1>
      <p className="soft">{s.favorites.intro}</p>

      <div className="segmented" role="tablist" aria-label={s.favorites.choose} style={{ marginBottom: 18 }}>
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
            <h3>{s.favorites.noTech}</h3>
            <p>{s.favorites.noTechText}</p>
            <Link className="btn btn-secondary" to="/greb">{s.favorites.toTechniques}</Link>
          </div>
        ) : (
          <div className="tech-list">{favTech.map((t) => <TechniqueRow key={t.id} t={t} showRegion />)}</div>
        )
      )}

      {tab === 'muskler' && (
        favMuscles.length === 0 ? (
          <div className="empty card">
            <h3>{s.favorites.noMuscles}</h3>
            <p>{s.favorites.noMusclesText}</p>
            <Link className="btn btn-secondary" to="/atlas">{s.favorites.toAtlas}</Link>
          </div>
        ) : (
          <div className="card"><ul className="list">
            {favMuscles.map((m) => (
              <li key={m.id}>
                <Link to={`/atlas/${m.id}`} className="list-item">
                  <span className="li-body">
                    <span className="li-title">{muscleName(m, lang)}</span>
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
            <h3>{s.favorites.noNotes}</h3>
            <p>{s.favorites.noNotesText}</p>
          </div>
        ) : (
          <div className="stack">
            {notes.map((n) => {
              const t = getTechnique(n.techniqueId);
              if (!t) return null;
              const r = getRegion(t.region);
              return (
                <Link key={n.techniqueId} to={`/greb/${t.id}`} className="note-card" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                  <div className="row small soft" style={{ marginBottom: 6 }}>
                    <span className="badge badge-user">{s.favorites.yourNote}</span>
                    <span>{r ? regionName(r, lang) : ''} · {s.common.stepLower(t.step)}</span>
                    <span className="spacer" />
                    <span>{formatDate(n.updatedAt)}</span>
                  </div>
                  <div className="li-title" style={{ marginBottom: 4 }}>{techName(t, lang)}</div>
                  {/* user-written text is shown exactly as written, in its original language */}
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
