import type { HandPose } from './hands';

export type Pt = [number, number];

export interface DemoHand {
  /** Therapist's right or left hand. */
  side: 'R' | 'L';
  pose: HandPose;
  /** Where the contact point of the hand touches the body (stage coordinates). */
  at: Pt;
  /** Direction the fingers point, degrees clockwise from "up" on the drawing. */
  rot: number;
  /** 'support' = stabilising/holding hand, drawn lighter. */
  role?: 'active' | 'support';
  scale?: number;
}

export type DemoArrow =
  | { kind: 'line'; from: Pt; to: Pt; double?: boolean; bend?: number; dashed?: boolean; label?: string }
  | { kind: 'circle'; at: Pt; r: number; ccw?: boolean }
  | { kind: 'press'; at: Pt; angle?: number };

export interface DemoFrame {
  /** Short Danish instruction for this frame. */
  text: string;
  hands: DemoHand[];
  arrows: DemoArrow[];
  /** Optional numbered lanes or markers (e.g. "4 sektioner"). */
  marks?: { at: Pt; label: string }[];
}

export type DemoStage =
  | { kind: 'figure'; view: 'anterior' | 'posterior'; frame: [number, number, number, number]; focus?: string[] }
  | { kind: 'hand'; surface: 'dorsal' | 'palmar'; frame: [number, number, number, number] };

export interface Demonstration {
  techniqueId: string;
  stage: DemoStage;
  frames: DemoFrame[];
  /** Where the therapist stands (from the source). */
  therapist?: string;
  /** Client positioning that the simplified drawing cannot show. */
  clientPose?: string;
  /** 'foto' = hand placement and direction clearly visible in the source photo,
   *  'delvis' = partly visible/partly from the caption. */
  support: 'foto' | 'delvis';
  review: string[];
}
