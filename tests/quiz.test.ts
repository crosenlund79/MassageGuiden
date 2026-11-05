import { describe, expect, it } from 'vitest';
import { buildQuestions, pickDistractors, quizPool, displayName } from '../src/quiz/engine';
import { getMuscle } from '../src/domain/content';
import { viewsForMuscle } from '../src/anatomy/figure2d';

function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

describe('quiz engine', () => {
  it('only uses superficial muscles that are drawn in the atlas', () => {
    const pool = quizPool();
    expect(pool.length).toBeGreaterThan(20);
    for (const m of pool) {
      expect(m.layer).toBe('superficial');
      expect(viewsForMuscle(m.id).length).toBeGreaterThan(0);
    }
  });

  it('builds randomized questions without duplicates and with a valid view', () => {
    const qs = buildQuestions('find', quizPool(), 10, seeded(1));
    expect(qs).toHaveLength(10);
    expect(new Set(qs.map((q) => q.muscleId)).size).toBe(10);
    for (const q of qs) expect(viewsForMuscle(q.muscleId)).toContain(q.view);
    const other = buildQuestions('find', quizPool(), 10, seeded(2)).map((q) => q.muscleId);
    expect(other).not.toEqual(qs.map((q) => q.muscleId));
  });

  it('gives four distinct, unambiguous options including the answer', () => {
    for (let s = 1; s < 30; s++) {
      for (const q of buildQuestions('navn', quizPool(), 'alle', seeded(s))) {
        expect(q.options).toHaveLength(4);
        expect(new Set(q.options).size).toBe(4);
        expect(q.options).toContain(q.muscleId);
        const names = q.options!.map((id) => getMuscle(id)!.nameDa);
        expect(new Set(names).size).toBe(4);
      }
    }
  });

  it('prefers distractors from the same body group', () => {
    const target = getMuscle('biceps-brachii')!;
    const d = pickDistractors(target, 'anterior', seeded(3));
    expect(d.every((id) => getMuscle(id)!.group === 'arm')).toBe(true);
  });

  it('formats names by terminology', () => {
    const m = getMuscle('trapezius')!;
    expect(displayName(m, 'da')).toBe('Kappemusklen');
    expect(displayName(m, 'latin')).toBe('M. trapezius');
    expect(displayName(m, 'da', 'en')).toBe('Trapezius');
    expect(displayName(m, 'begge')).toBe('Kappemusklen (M. trapezius)');
  });
});
