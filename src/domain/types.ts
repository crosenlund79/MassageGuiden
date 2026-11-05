/** Shared domain types for reference content (read-only, shipped as JSON). */

export type MuscleGroup = 'hoved-hals' | 'skulder-ryg' | 'bryst-mave' | 'arm' | 'hofte-ben';
export type View = 'anterior' | 'posterior';

export interface Muscle {
  id: string;
  nameDa: string;
  nameLatin: string;
  nameEn: string;
  group: MuscleGroup;
  kind: 'muskel' | 'gruppe' | 'sene' | 'bindevæv';
  layer: 'superficial' | 'deep';
  views: View[];
  origin: string;
  insertion: string;
  action: string;
  aliases: string[];
  aliasesEn: string[];
  /** 'gængs' = established Danish name; 'til-gennemsyn' = needs manual review */
  daStatus: 'gængs' | 'til-gennemsyn';
  daReason: string | null;
  danishNameUncertain: boolean;
  note: string | null;
  partOf: string | null;
  en: { origin: string; insertion: string; action: string; note: string | null };
  quizEligible: boolean;
  contentStatus: string;
}

export type MuscleBasis = 'kilde' | 'afledt';

export interface TechniqueMuscleLink {
  id: string;
  basis: MuscleBasis;
  note?: string;
  noteEn?: string;
}

export interface SourceRef {
  page: number;
  image: string | null;
  caption: string | null;
}

export type TechniqueType = 'effleurage' | 'petrissage' | 'friktion' | 'strygning' | 'tryk' | 'løft';

export interface Technique {
  id: string;
  program: string;
  step: string;
  order: number;
  region: string;
  gap?: false;
  name: string;
  type: TechniqueType;
  tools: string[];
  description: string;
  position: string | null;
  muscles: TechniqueMuscleLink[];
  precautions: { text: string; basis: 'kilde' }[];
  handwrittenNotes: { text: string; certain: boolean }[];
  reviewNotes: string[];
  status: 'kilde' | 'til-gennemsyn';
  source: SourceRef;
  /** English version, translated by hand from the Danish source caption. */
  en: { name: string; description: string; position: string | null; precautions: string[]; reviewNotes: string[] };
}

export interface TechniqueGap {
  id: string;
  program: string;
  step: string;
  order: number;
  region: string;
  gap: true;
  reason: string;
  source: SourceRef;
  en: { reason: string };
}

export type SequenceEntry = Technique | TechniqueGap;

export interface Program {
  id: string;
  name: string;
  nameEn: string;
  sourceHeading: string | null;
  pages: string;
  sequenceNotes: { afterStep: string; text: string; textEn: string }[];
}

export interface MuscleGroupRecord {
  id: string;
  nameDa: string;
  nameLatin: string;
  nameEn: string;
  parts: string[];
  aliases: string[];
  aliasesEn: string[];
}

export interface Region {
  id: string;
  name: string;
  short: string;
  nameEn: string;
  shortEn: string;
  program: string;
  view: View;
  /** Illustration frame in figure coordinates: [x, y, width, height]. */
  frame: [number, number, number, number];
}
