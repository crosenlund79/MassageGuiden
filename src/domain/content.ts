/**
 * Read-only access to the reference content. All feature modules (techniques,
 * atlas, quiz) resolve muscles through these lookups so IDs stay consistent.
 */
import musclesJson from '../content/muscles.json';
import techniquesJson from '../content/techniques.json';
import regionsJson from '../content/regions.json';
import sourceJson from '../content/source.json';
import type { Muscle, Program, Region, SequenceEntry, Technique, TechniqueGap } from './types';

export const muscles = musclesJson as Muscle[];
export const sequence = (techniquesJson as SequenceEntry[]).slice().sort((a, b) => a.order - b.order);
export const techniques = sequence.filter((e): e is Technique => !e.gap);
export const gaps = sequence.filter((e): e is TechniqueGap => e.gap === true);
export const programs = regionsJson.programs as Program[];
export const regions = regionsJson.regions as Region[];
export const source = sourceJson;

const muscleById = new Map(muscles.map((m) => [m.id, m]));
const techniqueById = new Map(techniques.map((t) => [t.id, t]));
const regionById = new Map(regions.map((r) => [r.id, r]));
const programById = new Map(programs.map((p) => [p.id, p]));

export const getMuscle = (id: string) => muscleById.get(id);
export const getTechnique = (id: string) => techniqueById.get(id);
export const getRegion = (id: string) => regionById.get(id);
export const getProgram = (id: string) => programById.get(id);

export function techniquesForMuscle(muscleId: string): Technique[] {
  return techniques.filter((t) => t.muscles.some((m) => m.id === muscleId));
}

export function techniquesInRegion(regionId: string): Technique[] {
  return techniques.filter((t) => t.region === regionId);
}

export function sequenceInRegion(regionId: string): SequenceEntry[] {
  return sequence.filter((e) => e.region === regionId);
}

/** Previous/next technique in booklet order (gaps are skipped). */
export function neighbours(id: string): { prev?: Technique; next?: Technique } {
  const i = techniques.findIndex((t) => t.id === id);
  if (i < 0) return {};
  return { prev: techniques[i - 1], next: techniques[i + 1] };
}

/** Booklet notes such as "Punkt 1–11 gentages på modsatte side" that follow a step. */
export function sequenceNoteAfter(t: { program: string; step: string }): string | undefined {
  return getProgram(t.program)?.sequenceNotes.find((n) => n.afterStep === t.step)?.text;
}

// ---------- search ----------

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip accents (é → e) but keep æ, ø, å
    .replace(/\bmm?\.\s*/g, '') // "m. trapezius" → "trapezius"
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function muscleHaystack(m: Muscle): string {
  return normalize([m.nameDa, m.nameLatin, ...m.aliases].join(' '));
}

const techniqueIndex = new Map(
  techniques.map((t) => {
    const region = getRegion(t.region);
    const parts = [
      t.name,
      t.description,
      t.source.caption ?? '',
      t.type,
      t.tools.join(' '),
      region?.name ?? '',
      `trin ${t.step}`,
      ...t.muscles.map((l) => {
        const m = getMuscle(l.id);
        return m ? `${m.nameDa} ${m.nameLatin} ${m.aliases.join(' ')}` : '';
      }),
    ];
    return [t.id, normalize(parts.join(' '))];
  }),
);

function matchesAll(haystack: string, query: string): boolean {
  const tokens = normalize(query).split(' ').filter(Boolean);
  return tokens.every((tok) => haystack.includes(tok));
}

export function searchTechniques(query: string, list: Technique[] = techniques): Technique[] {
  if (!normalize(query)) return list;
  return list.filter((t) => matchesAll(techniqueIndex.get(t.id) ?? '', query));
}

export function searchMuscles(query: string, list: Muscle[] = muscles): Muscle[] {
  const q = normalize(query);
  if (!q) return list;
  const hits = list.filter((m) => matchesAll(muscleHaystack(m), query));
  // Names starting with the query rank first
  return hits.sort((a, b) => {
    const sa = normalize(a.nameDa).startsWith(q) || normalize(a.nameLatin).startsWith(q) ? 0 : 1;
    const sb = normalize(b.nameDa).startsWith(q) || normalize(b.nameLatin).startsWith(q) ? 0 : 1;
    return sa - sb || a.nameDa.localeCompare(b.nameDa, 'da');
  });
}

export const contentStats = {
  techniques: techniques.length,
  gaps: gaps.length,
  needsReview: techniques.filter((t) => t.status === 'til-gennemsyn').length,
  confirmed: techniques.filter((t) => t.status === 'kilde').length,
  muscles: muscles.length,
};

// ---------- hand-position demonstrations ----------
import demosJson from '../content/demonstrations.json';
import type { Demonstration } from '../demos/types';
export const demonstrations = demosJson as unknown as Demonstration[];
const demoByTechnique = new Map(demonstrations.map((d) => [d.techniqueId, d]));
export const getDemonstration = (techniqueId: string) => demoByTechnique.get(techniqueId);
