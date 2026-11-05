import { Link } from 'react-router-dom';
import { getMuscle, getRegion } from '../domain/content';
import type { Muscle, Technique } from '../domain/types';
import { useFavorites, usePrefs } from '../storage/hooks';
import type { FavoriteKind, Terminology } from '../storage/db';
import { useI18n } from '../i18n/I18nProvider';
import { muscleName, regionName, techName } from '../i18n/localize';
import { IconHeart, IconSearch, IconX } from './Icons';

export function StatusBadge({ status }: { status: Technique['status'] | 'mangler' }) {
  const { s } = useI18n();
  if (status === 'kilde') return <span className="badge badge-source" title={s.common.fromSourceTitle}>{s.common.fromSource}</span>;
  if (status === 'mangler') return <span className="badge badge-missing">{s.common.missing}</span>;
  return <span className="badge badge-review" title={s.common.reviewTitle}>{s.common.review}</span>;
}

export function FavoriteButton({ kind, id, label }: { kind: FavoriteKind; id: string; label: string }) {
  const { isFavorite, toggle } = useFavorites();
  const { s } = useI18n();
  const on = isFavorite(kind, id);
  return (
    <button
      type="button"
      className={`icon-btn fav-btn ${on ? 'on' : ''}`}
      aria-pressed={on}
      aria-label={on ? s.common.favRemove(label) : s.common.favAdd(label)}
      title={on ? s.common.favRemoveTitle : s.common.favAddTitle}
      onClick={() => void toggle(kind, id)}
    >
      <IconHeart filled={on} />
    </button>
  );
}

export function SearchInput({
  value, onChange, placeholder, label, autoFocus, onKeyDown,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  label: string;
  autoFocus?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) {
  const { s } = useI18n();
  return (
    <div className="search">
      <IconSearch />
      <input className="input" type="search" value={value} placeholder={placeholder} aria-label={label}
        autoFocus={autoFocus} onChange={(e) => onChange(e.target.value)} onKeyDown={onKeyDown} enterKeyHint="search" />
      {value && (
        <button type="button" className="clear" aria-label={s.common.clearSearch} onClick={() => onChange('')}>
          <IconX width={18} height={18} />
        </button>
      )}
    </div>
  );
}

export function useTerminology(): Terminology {
  return usePrefs()[0].terminology;
}

/** Muscle name according to the preferred terminology and UI language. */
export function MuscleName({ muscle, terminology }: { muscle: Muscle; terminology?: Terminology }) {
  const pref = useTerminology();
  const { lang } = useI18n();
  const t = terminology ?? pref;
  if (t === 'da') return <>{muscleName(muscle, lang)}</>;
  if (t === 'latin') return <i>{muscle.nameLatin}</i>;
  return <>{muscleName(muscle, lang)} <span className="muted"><i>{muscle.nameLatin}</i></span></>;
}

export function TechniqueRow({ t, showRegion = false }: { t: Technique; showRegion?: boolean }) {
  const { isFavorite } = useFavorites();
  const { s, lang } = useI18n();
  const fav = isFavorite('technique', t.id);
  const region = getRegion(t.region);
  const muscleNames = t.muscles.map((l) => getMuscle(l.id)?.nameLatin).filter(Boolean).slice(0, 2).join(', ');
  return (
    <Link to={`/greb/${t.id}`} className="tech-row">
      <span className="step-badge" aria-label={s.common.step(t.step)}>{t.step}</span>
      <span className="tr-body">
        <span className="tr-title">{techName(t, lang)}</span>
        <span className="tr-meta">
          {showRegion && region && <span>{regionName(region, lang)} ·</span>}
          <span>{s.types[t.type]}</span>
          {muscleNames && <span>· <i>{muscleNames}</i></span>}
          {t.status === 'til-gennemsyn' && <span className="badge badge-review">{s.common.review}</span>}
        </span>
      </span>
      {fav && <IconHeart filled className="tr-fav" width={20} height={20} aria-label={s.common.favorite} />}
    </Link>
  );
}

export function TerminologySwitch() {
  const [prefs, setPrefs] = usePrefs();
  const { s } = useI18n();
  const opts: [Terminology, string][] = [['da', s.terminology.vernacular], ['latin', s.terminology.latin], ['begge', s.terminology.both]];
  return (
    <div className="segmented" role="group" aria-label={s.terminology.label}>
      {opts.map(([v, l]) => (
        <button key={v} type="button" className={prefs.terminology === v ? 'on' : ''} aria-pressed={prefs.terminology === v} onClick={() => setPrefs({ terminology: v })}>
          {l}
        </button>
      ))}
    </div>
  );
}

export function useFormatDate() {
  const { s } = useI18n();
  return (ts: number): string => {
    const d = new Date(ts);
    const sameDay = d.toDateString() === new Date().toDateString();
    if (sameDay) return s.common.today(d.toLocaleTimeString(s.locale, { hour: '2-digit', minute: '2-digit' }));
    return d.toLocaleDateString(s.locale, { day: 'numeric', month: 'short' });
  };
}
