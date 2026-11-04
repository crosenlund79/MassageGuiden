import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  aggregateStats, clearPersonalData, exportPersonalData, getNote, getPrefs, importPersonalData,
  listActivity, listFavorites, listQuizSessions, recordActivity, saveNote, saveQuizSession, setPrefs, toggleFavorite,
} from '../src/storage/db';

beforeEach(async () => {
  await clearPersonalData();
});

describe('personal data (IndexedDB)', () => {
  it('toggles favorites', async () => {
    expect(await toggleFavorite('technique', 'ryg-2')).toBe(true);
    expect((await listFavorites()).map((f) => f.key)).toEqual(['technique:ryg-2']);
    expect(await toggleFavorite('technique', 'ryg-2')).toBe(false);
    expect(await listFavorites()).toEqual([]);
  });

  it('saves and deletes notes', async () => {
    await saveNote('ben-3', 'Let tryk');
    expect((await getNote('ben-3'))?.text).toBe('Let tryk');
    await saveNote('ben-3', '   ');
    expect(await getNote('ben-3')).toBeUndefined();
  });

  it('stores quiz sessions and aggregates per-muscle stats', async () => {
    await saveQuizSession({ id: 'a', mode: 'find', startedAt: 1, finishedAt: 2, terminology: 'da', answers: [
      { muscleId: 'trapezius', correct: true, answeredId: 'trapezius' },
      { muscleId: 'soleus', correct: false, answeredId: 'gastrocnemius' },
    ] });
    await saveQuizSession({ id: 'b', mode: 'navn', startedAt: 3, finishedAt: 4, terminology: 'da', answers: [
      { muscleId: 'soleus', correct: true, answeredId: 'soleus' },
    ] });
    const sessions = await listQuizSessions();
    expect(sessions.map((s) => s.id)).toEqual(['b', 'a']);
    const stats = aggregateStats(sessions);
    expect(stats.get('soleus')).toMatchObject({ attempts: 2, correct: 1 });
  });

  it('keeps preferences and de-duplicates recent activity', async () => {
    expect((await getPrefs()).terminology).toBe('begge');
    await setPrefs({ terminology: 'latin' });
    expect((await getPrefs()).terminology).toBe('latin');
    await recordActivity('technique', 'ryg-1');
    await recordActivity('muscle', 'trapezius');
    await recordActivity('technique', 'ryg-1');
    const act = await listActivity();
    expect(act).toHaveLength(2);
    expect(act[0].refId).toBe('ryg-1');
  });

  it('round-trips an export', async () => {
    await toggleFavorite('muscle', 'deltoideus');
    await saveNote('arm-5', 'Husk ikke over leddet');
    const data = await exportPersonalData();
    await clearPersonalData();
    await importPersonalData(data);
    expect((await listFavorites()).map((f) => f.key)).toEqual(['muscle:deltoideus']);
    expect((await getNote('arm-5'))?.text).toBe('Husk ikke over leddet');
  });
});
