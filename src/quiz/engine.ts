/**
 * Quiz logic – pure functions, independent of rendering.
 * Questions are only generated for muscles that are quiz-eligible in the content
 * AND actually drawn in the atlas, so every answer maps to a real shape.
 */
import { muscles } from '../domain/content';
import type { Muscle, MuscleGroup, View } from '../domain/types';
import { muscleIdsInView, viewsForMuscle } from '../anatomy/figure2d';
import type { Terminology } from '../storage/db';

export interface Question {
  muscleId: string;
  view: View;
  /** Only for "Navngiv musklen": four distinct options incl. the correct one. */
  options?: string[];
}

export function quizPool(group: MuscleGroup | 'alle' = 'alle'): Muscle[] {
  return muscles.filter(
    (m) =>
      m.quizEligible &&
      viewsForMuscle(m.id).length > 0 &&
      (group === 'alle' || m.group === group),
  );
}

export function shuffle<T>(arr: T[], rand: () => number = Math.random): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Picks three distractors. Prefers muscles from the same body group and the same
 * view (plausible), never the target itself, and never a muscle that shares a
 * displayed name with the target (avoids ambiguous answers).
 */
export function pickDistractors(target: Muscle, view: View, rand: () => number = Math.random): string[] {
  const eligible = muscles.filter(
    (m) =>
      m.id !== target.id &&
      m.layer === 'superficial' &&
      m.nameDa !== target.nameDa &&
      m.nameLatin !== target.nameLatin,
  );
  const inView = new Set(muscleIdsInView(view, 'superficial'));
  const tiers = [
    eligible.filter((m) => m.group === target.group && inView.has(m.id)),
    eligible.filter((m) => m.group === target.group && !inView.has(m.id)),
    eligible.filter((m) => m.group !== target.group && inView.has(m.id)),
    eligible.filter((m) => m.group !== target.group && !inView.has(m.id)),
  ];
  const picked: string[] = [];
  for (const tier of tiers) {
    for (const m of shuffle(tier, rand)) {
      if (picked.length === 3) break;
      picked.push(m.id);
    }
  }
  return picked;
}

export function buildQuestions(
  mode: 'find' | 'navn',
  pool: Muscle[],
  count: number | 'alle',
  rand: () => number = Math.random,
): Question[] {
  const chosen = shuffle(pool, rand).slice(0, count === 'alle' ? pool.length : count);
  return chosen.map((m) => {
    const views = viewsForMuscle(m.id) as View[];
    const view = views[Math.floor(rand() * views.length)];
    const q: Question = { muscleId: m.id, view };
    if (mode === 'navn') q.options = shuffle([m.id, ...pickDistractors(m, view, rand)], rand);
    return q;
  });
}

export function displayName(m: Pick<Muscle, 'nameDa' | 'nameLatin'>, t: Terminology): string {
  if (t === 'da') return m.nameDa;
  if (t === 'latin') return m.nameLatin;
  return `${m.nameDa} (${m.nameLatin})`;
}
