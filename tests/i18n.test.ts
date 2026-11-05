import { describe, expect, it } from 'vitest';
import { STRINGS } from '../src/i18n/strings';
import { demonstrations, gaps, getMuscle, muscleGroups, muscles, programs, regions, techniques, searchMuscles, searchTechniques } from '../src/domain/content';
import { displayName } from '../src/quiz/engine';

// Danish letters may appear in English text only inside quotations/proper names
const DANISH_ALLOWED = /Massørskolen|“[^”]*”|”[^”]*”|DA: /g;
const hasDanish = (s: string) => /[æøåÆØÅ]/.test(s.replace(DANISH_ALLOWED, ''));

function leaves(o: unknown, path = ''): [string, unknown][] {
  if (o && typeof o === 'object') return Object.entries(o).flatMap(([k, v]) => leaves(v, `${path}.${k}`));
  return [[path, o]];
}

describe('UI strings', () => {
  it('have the same keys in Danish and English', () => {
    const da = leaves(STRINGS.da).map(([k]) => k).sort();
    const en = leaves(STRINGS.en).map(([k]) => k).sort();
    expect(en).toEqual(da);
  });
  it('English strings contain no untranslated Danish', () => {
    for (const [k, v] of leaves(STRINGS.en)) {
      const text = typeof v === 'function' ? String((v as (...a: unknown[]) => unknown)('Xyz', 'M. xyz', '3', '4')) : String(v);
      expect(hasDanish(text), `${k}: ${text}`).toBe(false);
    }
  });
});

describe('content translations', () => {
  it('every technique, gap, region and program has English text', () => {
    for (const t of techniques) {
      expect(t.en.name, t.id).toBeTruthy();
      expect(t.en.description, t.id).toBeTruthy();
      expect(t.en.precautions.length).toBe(t.precautions.length);
      expect(t.en.reviewNotes.length).toBe(t.reviewNotes.length);
      for (const s of [t.en.name, t.en.description, ...t.en.precautions, ...t.en.reviewNotes]) expect(hasDanish(s), `${t.id}: ${s}`).toBe(false);
    }
    for (const g of gaps) expect(g.en.reason).toBeTruthy();
    for (const r of regions) expect(r.nameEn && r.shortEn).toBeTruthy();
    for (const p of programs) {
      expect(p.nameEn).toBeTruthy();
      for (const n of p.sequenceNotes) expect(n.textEn).toBeTruthy();
    }
  });
  it('every demonstration frame has an English instruction', () => {
    for (const d of demonstrations) {
      expect(d.en.frames.length, d.techniqueId).toBe(d.frames.length);
      expect(d.en.review.length, d.techniqueId).toBe(d.review.length);
      for (const s of d.en.frames) expect(hasDanish(s), `${d.techniqueId}: ${s}`).toBe(false);
    }
  });
});

describe('muscle terminology', () => {
  it('uses the required Danish distinctions', () => {
    expect(getMuscle('soleus')!.nameDa).toBe('Flyndermusklen');
    expect(getMuscle('gastrocnemius')!.nameDa).toBe('Den tohovedede lægmuskel');
    const ts = muscleGroups.find((g) => g.id === 'triceps-surae')!;
    expect(ts.nameDa).toBe('Den trehovedede lægmuskel');
    expect(ts.parts.sort()).toEqual(['gastrocnemius', 'soleus']);
    expect(getMuscle('soleus')!.partOf).toBe('triceps-surae');
    expect(getMuscle('gastrocnemius')!.partOf).toBe('triceps-surae');
  });
  it('has unique Danish, English and Latin names and an English name for every muscle', () => {
    for (const key of ['nameDa', 'nameEn', 'nameLatin'] as const) {
      const names = muscles.map((m) => m[key]);
      expect(new Set(names).size, key).toBe(names.length);
    }
    for (const m of muscles) {
      expect(m.en.origin && m.en.insertion && m.en.action, m.id).toBeTruthy();
      expect(['gængs', 'til-gennemsyn']).toContain(m.daStatus);
      if (m.daStatus === 'til-gennemsyn') expect(m.daReason, m.id).toBeTruthy();
    }
  });
  it('no longer uses the incorrect old names, but still finds them by search', () => {
    const names = muscles.map((m) => m.nameDa).join('|');
    expect(names).not.toMatch(/Fladfisk|Tvillinge|Underkams|spoleben/i);
    expect(searchMuscles('flynder')[0].id).toBe('soleus');
    expect(searchMuscles('calf').map((m) => m.id)).toEqual(expect.arrayContaining(['gastrocnemius', 'soleus']));
    expect(searchTechniques('hamstrings').length).toBeGreaterThan(0);
  });
  it('shows vernacular names in the chosen language and Latin in both', () => {
    const m = getMuscle('soleus')!;
    expect(displayName(m, 'da', 'da')).toBe('Flyndermusklen');
    expect(displayName(m, 'da', 'en')).toBe('Soleus');
    expect(displayName(m, 'latin', 'en')).toBe('M. soleus');
    expect(displayName(m, 'begge', 'en')).toBe('Soleus (M. soleus)');
  });
});
