import { Link } from 'react-router-dom';
import { getMuscle, getRegion } from '../domain/content';
import { TYPE_LABELS, type Muscle, type Technique } from '../domain/types';
import { useFavorites, usePrefs } from '../storage/hooks';
import type { FavoriteKind, Terminology } from '../storage/db';
import { IconHeart, IconSearch, IconX } from './Icons';

export function StatusBadge({ status }: { status: Technique['status'] | 'mangler' }) {
  if (status === 'kilde') return <span className="badge badge-source" title="Transskriberet direkte fra kildehæftet">Fra kilden</span>;
  if (status === 'mangler') return <span className="badge badge-missing">Mangler i kilden</span>;
  return <span className="badge badge-review" title="Indeholder afledte koblinger eller uklarheder, der bør gennemses">Til gennemsyn</span>;
}

export function FavoriteButton({ kind, id, label }: { kind: FavoriteKind; id: string; label: string }) {
  const { isFavorite, toggle } = useFavorites();
  const on = isFavorite(kind, id);
  return (
    <button
      type="button"
      className={`icon-btn fav-btn ${on ? 'on' : ''}`}
      aria-pressed={on}
      aria-label={on ? `Fjern ${label} fra favoritter` : `Tilføj ${label} til favoritter`}
      title={on ? 'Fjern fra favoritter' : 'Tilføj til favoritter'}
      onClick={() => void toggle(kind, id)}
    >
      <IconHeart filled={on} />
    </button>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  label,
  autoFocus,
  onKeyDown,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  label: string;
  autoFocus?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="search">
      <IconSearch />
      <input
        className="input"
        type="search"
        value={value}
        placeholder={placeholder}
        aria-label={label}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        enterKeyHint="search"
      />
      {value && (
        <button type="button" className="clear" aria-label="Ryd søgning" onClick={() => onChange('')}>
          <IconX width={18} height={18} />
        </button>
      )}
    </div>
  );
}

export function useTerminology(): Terminology {
  return usePrefs()[0].terminology;
}

/** Muscle name according to the preferred terminology. */
export function MuscleName({ muscle, terminology }: { muscle: Muscle; terminology?: Terminology }) {
  const pref = useTerminology();
  const t = terminology ?? pref;
  if (t === 'da') return <>{muscle.nameDa}</>;
  if (t === 'latin') return <i>{muscle.nameLatin}</i>;
  return (
    <>
      {muscle.nameDa} <span className="muted"><i>{muscle.nameLatin}</i></span>
    </>
  );
}

export function TechniqueRow({ t, showRegion = false }: { t: Technique; showRegion?: boolean }) {
  const { isFavorite } = useFavorites();
  const fav = isFavorite('technique', t.id);
  const region = getRegion(t.region);
  const muscleNames = t.muscles
    .map((l) => getMuscle(l.id)?.nameLatin)
    .filter(Boolean)
    .slice(0, 2)
    .join(', ');
  return (
    <Link to={`/greb/${t.id}`} className="tech-row">
      <span className="step-badge" aria-label={`Trin ${t.step}`}>{t.step}</span>
      <span className="tr-body">
        <span className="tr-title">{t.name}</span>
        <span className="tr-meta">
          {showRegion && region && <span>{region.name} ·</span>}
          <span>{TYPE_LABELS[t.type]}</span>
          {muscleNames && <span>· <i>{muscleNames}</i></span>}
          {t.status === 'til-gennemsyn' && <span className="badge badge-review">Til gennemsyn</span>}
        </span>
      </span>
      {fav && <IconHeart filled className="tr-fav" width={20} height={20} aria-label="Favorit" />}
    </Link>
  );
}

export function TerminologySwitch() {
  const [prefs, setPrefs] = usePrefs();
  const opts: [Terminology, string][] = [
    ['da', 'Dansk'],
    ['latin', 'Latin'],
    ['begge', 'Begge'],
  ];
  return (
    <div className="segmented" role="group" aria-label="Terminologi">
      {opts.map(([v, l]) => (
        <button key={v} type="button" className={prefs.terminology === v ? 'on' : ''} aria-pressed={prefs.terminology === v} onClick={() => setPrefs({ terminology: v })}>
          {l}
        </button>
      ))}
    </div>
  );
}

export function formatDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return `i dag ${d.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}`;
  return d.toLocaleDateString('da-DK', { day: 'numeric', month: 'short' });
}
