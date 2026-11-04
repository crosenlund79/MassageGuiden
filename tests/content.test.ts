import { describe, expect, it } from 'vitest';
import { muscles, techniques, sequence, regions, programs, getMuscle, searchTechniques, searchMuscles, neighbours } from '../src/domain/content';
import { FIGURE, viewsForMuscle } from '../src/anatomy/figure2d';

describe('reference content integrity', () => {
  it('has unique ids', () => {
    expect(new Set(muscles.map((m) => m.id)).size).toBe(muscles.length);
    expect(new Set(sequence.map((t) => t.id)).size).toBe(sequence.length);
  });

  it('every technique references existing muscles, regions and programs', () => {
    for (const t of techniques) {
      expect(regions.some((r) => r.id === t.region), t.id).toBe(true);
      expect(programs.some((p) => p.id === t.program), t.id).toBe(true);
      for (const l of t.muscles) expect(getMuscle(l.id), `${t.id} → ${l.id}`).toBeDefined();
    }
  });

  it('every technique is traceable to a source page, image and caption', () => {
    for (const t of techniques) {
      expect(t.source.page).toBeGreaterThan(0);
      expect(t.source.image, t.id).toMatch(/\.jpg$/);
      expect(t.source.caption, t.id).toBeTruthy();
      expect(t.source.caption!.startsWith(t.step), `${t.id} caption starts with step`).toBe(true);
    }
  });

  it('marks techniques with inferred muscle links as "til-gennemsyn"', () => {
    for (const t of techniques) {
      if (t.muscles.some((m) => m.basis === 'afledt')) expect(t.status, t.id).toBe('til-gennemsyn');
    }
  });

  it('keeps the booklet order within each program', () => {
    for (const p of programs) {
      const steps = sequence.filter((e) => e.program === p.id).map((e) => parseInt(e.step, 10));
      expect([...steps].sort((a, b) => a - b)).toEqual(steps);
    }
  });

  it('every muscle record has geometry in exactly the views it declares', () => {
    for (const m of muscles) {
      expect(viewsForMuscle(m.id).sort(), m.id).toEqual([...m.views].sort());
    }
  });

  it('every shape in the figure references a known muscle with a matching layer', () => {
    for (const view of Object.values(FIGURE)) {
      for (const s of view.shapes) {
        const m = getMuscle(s.muscleId);
        expect(m, s.muscleId).toBeDefined();
        expect(s.layer ?? 'superficial').toBe(m!.layer);
      }
    }
  });
});

describe('search', () => {
  it('finds techniques by muscle name (Latin and Danish), region and type', () => {
    expect(searchTechniques('trapezius').length).toBeGreaterThan(0);
    expect(searchTechniques('m. trapezius').map((t) => t.id)).toEqual(searchTechniques('trapezius').map((t) => t.id));
    expect(searchTechniques('kappemusklen').length).toBeGreaterThan(0);
    expect(searchTechniques('lænden').length).toBeGreaterThan(0);
    expect(searchTechniques('ansigt').every((t) => t.region === 'ansigt' || t.description.toLowerCase().includes('ansigt'))).toBe(true);
    expect(searchTechniques('knofriktion').length).toBeGreaterThan(3);
    expect(searchTechniques('xyzzy')).toEqual([]);
  });

  it('finds muscles by Danish or Latin name', () => {
    expect(searchMuscles('kappe')[0].id).toBe('trapezius');
    expect(searchMuscles('gastrocnemius')[0].id).toBe('gastrocnemius');
    expect(searchMuscles('haserne').map((m) => m.id)).toContain('biceps-femoris');
  });
});

describe('navigation', () => {
  it('links previous/next across the whole booklet sequence', () => {
    expect(neighbours(techniques[0].id).prev).toBeUndefined();
    expect(neighbours(techniques[0].id).next?.id).toBe(techniques[1].id);
    expect(neighbours('ben-10').next?.id).toBe('ben-15'); // skips unreadable steps 11–14
  });
});
