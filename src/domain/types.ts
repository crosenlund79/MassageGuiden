/** Shared domain types for reference content (read-only, shipped as JSON). */

export type MuscleGroup = 'hoved-hals' | 'skulder-ryg' | 'bryst-mave' | 'arm' | 'hofte-ben';
export type View = 'anterior' | 'posterior';

export interface Muscle {
  id: string;
  nameDa: string;
  nameLatin: string;
  group: MuscleGroup;
  kind: 'muskel' | 'gruppe' | 'sene' | 'bindevæv';
  layer: 'superficial' | 'deep';
  views: View[];
  origin: string;
  insertion: string;
  action: string;
  aliases: string[];
  danishNameUncertain: boolean;
  note: string | null;
  quizEligible: boolean;
  contentStatus: string;
}

export type MuscleBasis = 'kilde' | 'afledt';

export interface TechniqueMuscleLink {
  id: string;
  basis: MuscleBasis;
  note?: string;
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
}

export type SequenceEntry = Technique | TechniqueGap;

export interface Program {
  id: string;
  name: string;
  sourceHeading: string | null;
  pages: string;
  sequenceNotes: { afterStep: string; text: string }[];
}

export interface Region {
  id: string;
  name: string;
  short: string;
  program: string;
  view: View;
  /** Illustration frame in figure coordinates: [x, y, width, height]. */
  frame: [number, number, number, number];
}

export const GROUP_LABELS: Record<MuscleGroup, string> = {
  'hoved-hals': 'Hoved og hals',
  'skulder-ryg': 'Skulder og ryg',
  'bryst-mave': 'Bryst og mave',
  arm: 'Arm',
  'hofte-ben': 'Hofte og ben',
};

export const TYPE_LABELS: Record<TechniqueType, string> = {
  effleurage: 'Effleurage',
  petrissage: 'Petrissage',
  friktion: 'Friktion',
  strygning: 'Strygning',
  tryk: 'Tryk',
  løft: 'Løft',
};

export const KIND_LABELS: Record<Muscle['kind'], string> = {
  muskel: 'Muskel',
  gruppe: 'Muskelgruppe',
  sene: 'Sene',
  bindevæv: 'Bindevævsbånd',
};
