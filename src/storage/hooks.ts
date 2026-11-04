import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_PREFS,
  favKey,
  getPrefs,
  listActivity,
  listFavorites,
  listNotes,
  listQuizSessions,
  setPrefs,
  subscribe,
  toggleFavorite,
  type Activity,
  type Favorite,
  type FavoriteKind,
  type Note,
  type Prefs,
  type QuizSession,
  type StoreName,
} from './db';

/** Re-runs `load` whenever one of the given stores changes. */
function useStore<T>(stores: StoreName[], load: () => Promise<T>, initial: T): [T, boolean] {
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);
  const key = stores.join(',');
  useEffect(() => {
    let alive = true;
    const run = () =>
      load()
        .then((v) => {
          if (alive) {
            setValue(v);
            setReady(true);
          }
        })
        .catch((e) => {
          console.error('IndexedDB read failed', e);
          if (alive) setReady(true);
        });
    run();
    const unsub = subscribe((s) => {
      if (key.split(',').includes(s)) run();
    });
    return () => {
      alive = false;
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return [value, ready];
}

export function useFavorites() {
  const [favorites, ready] = useStore<Favorite[]>(['favorites'], listFavorites, []);
  const isFavorite = useCallback(
    (kind: FavoriteKind, id: string) => favorites.some((f) => f.key === favKey(kind, id)),
    [favorites],
  );
  return { favorites, ready, isFavorite, toggle: toggleFavorite };
}

export function useNotes() {
  const [notes, ready] = useStore<Note[]>(['notes'], listNotes, []);
  return { notes, ready };
}

export function useQuizSessions() {
  const [sessions, ready] = useStore<QuizSession[]>(['quizSessions'], listQuizSessions, []);
  return { sessions, ready };
}

export function useActivity(limit = 8) {
  const [activity] = useStore<Activity[]>(['activity'], () => listActivity(limit), []);
  return activity;
}

export function usePrefs(): [Prefs, (p: Partial<Prefs>) => void] {
  const [stored] = useStore<Prefs>(['prefs'], getPrefs, DEFAULT_PREFS);
  // Optimistic overlay so toggles respond instantly while IndexedDB writes.
  const [pending, setPending] = useState<Partial<Prefs>>({});
  const update = useCallback((p: Partial<Prefs>) => {
    setPending((cur) => ({ ...cur, ...p }));
    void setPrefs(p).then(() => setPending((cur) => {
      const next = { ...cur };
      for (const k of Object.keys(p) as (keyof Prefs)[]) if (next[k] === p[k]) delete next[k];
      return next;
    }));
  }, []);
  return [{ ...stored, ...pending }, update];
}
