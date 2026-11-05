/**
 * Personal (user-created) data, stored locally in IndexedDB.
 * Reference content never lives here – only Sofie's own favorites, notes,
 * quiz history, recent activity and preferences.
 */
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export type FavoriteKind = 'technique' | 'muscle';
export interface Favorite { key: string; kind: FavoriteKind; refId: string; createdAt: number }
export interface Note { techniqueId: string; text: string; updatedAt: number }
export type QuizMode = 'find' | 'navn';
export interface QuizAnswer { muscleId: string; correct: boolean; answeredId: string | null }
export interface QuizSession {
  id: string;
  mode: QuizMode;
  startedAt: number;
  finishedAt: number;
  terminology: Terminology;
  answers: QuizAnswer[];
}
export interface Activity { id?: number; kind: 'technique' | 'muscle' | 'quiz'; refId: string; at: number }
/** 'da' = vernacular name in the UI language (Danish or English), kept as 'da' for stored compatibility. */
export type Terminology = 'da' | 'latin' | 'begge';
export type Language = 'da' | 'en';
export interface Prefs { terminology: Terminology; showDeep: boolean; atlasView: 'anterior' | 'posterior'; language: Language }

export const DEFAULT_PREFS: Prefs = { terminology: 'begge', showDeep: false, atlasView: 'anterior', language: 'da' };

interface AtlasDB extends DBSchema {
  favorites: { key: string; value: Favorite };
  notes: { key: string; value: Note };
  quizSessions: { key: string; value: QuizSession; indexes: { finishedAt: number } };
  activity: { key: number; value: Activity; indexes: { at: number } };
  prefs: { key: string; value: unknown };
}

export type StoreName = 'favorites' | 'notes' | 'quizSessions' | 'activity' | 'prefs';

const DB_NAME = 'massageatlas';
let dbPromise: Promise<IDBPDatabase<AtlasDB>> | null = null;

export function getDb(): Promise<IDBPDatabase<AtlasDB>> {
  if (!dbPromise) {
    dbPromise = openDB<AtlasDB>(DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore('favorites', { keyPath: 'key' });
        db.createObjectStore('notes', { keyPath: 'techniqueId' });
        const q = db.createObjectStore('quizSessions', { keyPath: 'id' });
        q.createIndex('finishedAt', 'finishedAt');
        const a = db.createObjectStore('activity', { keyPath: 'id', autoIncrement: true });
        a.createIndex('at', 'at');
        db.createObjectStore('prefs');
      },
    });
  }
  return dbPromise;
}

/** Test helper: forget the cached connection. */
export function resetDbConnection() {
  dbPromise = null;
}

// ---------- change notification (lets hooks re-read after writes) ----------
type Listener = (store: StoreName) => void;
const listeners = new Set<Listener>();
export function subscribe(fn: Listener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function emit(store: StoreName) {
  listeners.forEach((fn) => fn(store));
}

// ---------- favorites ----------
export const favKey = (kind: FavoriteKind, refId: string) => `${kind}:${refId}`;

export async function listFavorites(): Promise<Favorite[]> {
  const all = await (await getDb()).getAll('favorites');
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function toggleFavorite(kind: FavoriteKind, refId: string): Promise<boolean> {
  const db = await getDb();
  const key = favKey(kind, refId);
  const existing = await db.get('favorites', key);
  if (existing) await db.delete('favorites', key);
  else await db.put('favorites', { key, kind, refId, createdAt: Date.now() });
  emit('favorites');
  return !existing;
}

// ---------- notes ----------
export async function getNote(techniqueId: string): Promise<Note | undefined> {
  return (await getDb()).get('notes', techniqueId);
}

export async function listNotes(): Promise<Note[]> {
  const all = await (await getDb()).getAll('notes');
  return all.filter((n) => n.text.trim()).sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function saveNote(techniqueId: string, text: string): Promise<void> {
  const db = await getDb();
  if (!text.trim()) await db.delete('notes', techniqueId);
  else await db.put('notes', { techniqueId, text, updatedAt: Date.now() });
  emit('notes');
}

// ---------- quiz ----------
export async function saveQuizSession(s: QuizSession): Promise<void> {
  await (await getDb()).put('quizSessions', s);
  emit('quizSessions');
}

export async function listQuizSessions(): Promise<QuizSession[]> {
  const all = await (await getDb()).getAll('quizSessions');
  return all.sort((a, b) => b.finishedAt - a.finishedAt);
}

export interface MuscleStat { muscleId: string; attempts: number; correct: number; lastAt: number }

export function aggregateStats(sessions: QuizSession[]): Map<string, MuscleStat> {
  const map = new Map<string, MuscleStat>();
  for (const s of sessions) {
    for (const a of s.answers) {
      const st = map.get(a.muscleId) ?? { muscleId: a.muscleId, attempts: 0, correct: 0, lastAt: 0 };
      st.attempts += 1;
      if (a.correct) st.correct += 1;
      st.lastAt = Math.max(st.lastAt, s.finishedAt);
      map.set(a.muscleId, st);
    }
  }
  return map;
}

// ---------- activity ----------
export async function recordActivity(kind: Activity['kind'], refId: string): Promise<void> {
  const db = await getDb();
  const tx = db.transaction('activity', 'readwrite');
  // keep a single entry per item: remove older duplicates
  let cursor = await tx.store.openCursor();
  while (cursor) {
    if (cursor.value.kind === kind && cursor.value.refId === refId) await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.store.add({ kind, refId, at: Date.now() });
  // cap history length
  const keys = await tx.store.getAllKeys();
  if (keys.length > 60) for (const k of keys.slice(0, keys.length - 60)) await tx.store.delete(k);
  await tx.done;
  emit('activity');
}

export async function listActivity(limit = 8): Promise<Activity[]> {
  const all = await (await getDb()).getAll('activity');
  return all.sort((a, b) => b.at - a.at || (b.id ?? 0) - (a.id ?? 0)).slice(0, limit);
}

// ---------- prefs ----------
export async function getPrefs(): Promise<Prefs> {
  const db = await getDb();
  const stored = (await db.get('prefs', 'prefs')) as Partial<Prefs> | undefined;
  return { ...DEFAULT_PREFS, ...(stored ?? {}) };
}

export async function setPrefs(patch: Partial<Prefs>): Promise<Prefs> {
  const next = { ...(await getPrefs()), ...patch };
  await (await getDb()).put('prefs', next, 'prefs');
  emit('prefs');
  return next;
}

// ---------- export / import / reset ----------
export interface PersonalExport {
  app: 'MassageAtlas';
  version: 1;
  exportedAt: string;
  favorites: Favorite[];
  notes: Note[];
  quizSessions: QuizSession[];
  prefs: Prefs;
}

export async function exportPersonalData(): Promise<PersonalExport> {
  const db = await getDb();
  return {
    app: 'MassageAtlas',
    version: 1,
    exportedAt: new Date().toISOString(),
    favorites: await db.getAll('favorites'),
    notes: await db.getAll('notes'),
    quizSessions: await db.getAll('quizSessions'),
    prefs: await getPrefs(),
  };
}

export async function importPersonalData(data: PersonalExport): Promise<void> {
  if (data?.app !== 'MassageAtlas' || data.version !== 1) throw new Error('NOT_EXPORT');
  const db = await getDb();
  const tx = db.transaction(['favorites', 'notes', 'quizSessions', 'prefs'], 'readwrite');
  for (const f of data.favorites ?? []) await tx.objectStore('favorites').put(f);
  for (const n of data.notes ?? []) await tx.objectStore('notes').put(n);
  for (const s of data.quizSessions ?? []) await tx.objectStore('quizSessions').put(s);
  if (data.prefs) await tx.objectStore('prefs').put({ ...DEFAULT_PREFS, ...data.prefs }, 'prefs');
  await tx.done;
  (['favorites', 'notes', 'quizSessions', 'prefs'] as StoreName[]).forEach(emit);
}

export async function clearPersonalData(): Promise<void> {
  const db = await getDb();
  const names: StoreName[] = ['favorites', 'notes', 'quizSessions', 'activity', 'prefs'];
  const tx = db.transaction(names, 'readwrite');
  await Promise.all(names.map((n) => tx.objectStore(n).clear()));
  await tx.done;
  names.forEach(emit);
}
