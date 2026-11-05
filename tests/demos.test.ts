import { describe, expect, it } from 'vitest';
import { demonstrations, getMuscle, getTechnique, techniques } from '../src/domain/content';
import { POSES } from '../src/demos/hands';

describe('hand-position demonstrations', () => {
  it('cover every technique exactly once', () => {
    const ids = demonstrations.map((d) => d.techniqueId);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of techniques) expect(ids, t.id).toContain(t.id);
    for (const id of ids) expect(getTechnique(id), id).toBeDefined();
  });

  it('use valid poses, muscles and Danish instructions', () => {
    for (const d of demonstrations) {
      expect(d.frames.length).toBeGreaterThan(0);
      if (d.stage.kind === 'figure') for (const m of d.stage.focus ?? []) expect(getMuscle(m), `${d.techniqueId} → ${m}`).toBeDefined();
      for (const f of d.frames) {
        expect(f.text.length, d.techniqueId).toBeGreaterThan(15);
        expect(f.hands.length, d.techniqueId).toBeGreaterThan(0);
        expect(f.hands.some((h) => h.role !== 'support'), `${d.techniqueId} has an active hand`).toBe(true);
        for (const h of f.hands) expect(POSES[h.pose], `${d.techniqueId} pose ${h.pose}`).toBeDefined();
      }
    }
  });

  it('place every hand contact point inside the shown frame', () => {
    for (const d of demonstrations) {
      const [x, y, w, h] = d.stage.frame;
      for (const f of d.frames) for (const hd of f.hands) {
        expect(hd.at[0], `${d.techniqueId} x`).toBeGreaterThanOrEqual(x);
        expect(hd.at[0], `${d.techniqueId} x`).toBeLessThanOrEqual(x + w);
        expect(hd.at[1], `${d.techniqueId} y`).toBeGreaterThanOrEqual(y);
        expect(hd.at[1], `${d.techniqueId} y`).toBeLessThanOrEqual(y + h);
      }
    }
  });

  it('flag partly documented demonstrations for review', () => {
    for (const d of demonstrations) if (d.support === 'delvis') expect(d.review.length, d.techniqueId).toBeGreaterThan(0);
  });
});
