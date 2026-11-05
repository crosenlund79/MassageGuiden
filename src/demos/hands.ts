/**
 * Parametric therapist-hand geometry for technique demonstrations.
 *
 * Local coordinate system (one RIGHT hand, back of the hand towards the viewer,
 * fingers pointing up = -y). The wrist centre is at (0, 0); the middle finger
 * tip is ~100 units away. Left hands are mirrored at render time.
 * Each pose also defines its contact point(s) – the part of the hand that
 * presses on the client – used to anchor the hand on the body.
 */

export type HandPose = 'flat' | 'thumb' | 'fist' | 'tips' | 'heel' | 'edge' | 'grip' | 'pinch' | 'claw';

type Pt = [number, number];
interface Digit { base: Pt; angle: number; length: number; w0: number; w1: number; joints?: number }

export interface PoseGeometry {
  palm: string;
  forearm: string;
  digits: Digit[];
  /** index 0 = thumb */
  contact: { at: Pt; shape: 'dot' | 'band' | 'oval'; rx?: number; ry?: number; rot?: number; extra?: Pt[] };
  /** Point placed on the target position (defaults to contact.at). */
  anchor?: Pt;
  /** short folded-finger knuckles for the fist */
  knuckles?: Pt[];
  /** lines between folded fingers (fist) */
  seams?: string[];
}

const rad = (d: number) => (d * Math.PI) / 180;
/** Direction for an angle measured from "up", clockwise positive. */
const dir = (a: number): Pt => [Math.sin(rad(a)), -Math.cos(rad(a))];

export function digitTip(d: Digit): Pt {
  const [dx, dy] = dir(d.angle);
  return [d.base[0] + dx * d.length, d.base[1] + dy * d.length];
}

/** Tapered capsule from base to tip with a round tip and round base. */
export function digitPath(d: Digit): string {
  const [dx, dy] = dir(d.angle);
  const nx = -dy, ny = dx; // normal (to the right of the direction)
  const [bx, by] = d.base;
  const [tx, ty] = digitTip(d);
  const r0 = d.w0 / 2, r1 = d.w1 / 2;
  const f = (n: number) => n.toFixed(2);
  const bl: Pt = [bx - nx * r0, by - ny * r0];
  const br: Pt = [bx + nx * r0, by + ny * r0];
  const tl: Pt = [tx - nx * r1, ty - ny * r1];
  const tr: Pt = [tx + nx * r1, ty + ny * r1];
  return `M${f(bl[0])},${f(bl[1])} L${f(tl[0])},${f(tl[1])} A${f(r1)},${f(r1)} 0 0 1 ${f(tr[0])},${f(tr[1])} L${f(br[0])},${f(br[1])} A${f(r0)},${f(r0)} 0 0 1 ${f(bl[0])},${f(bl[1])} Z`;
}

const PALM =
  'M-17,2 C-19,-8 -21,-20 -20,-32 C-19.5,-40 -19,-46 -18,-50 C-12,-55 2,-56 12,-52 ' +
  'C17,-50 20,-46 21,-40 C22,-28 21,-14 18,2 Z';
const PALM_FIST =
  'M-17,2 C-19,-8 -21,-20 -20,-32 C-19.5,-40 -19,-46 -18,-50 C-12,-55 2,-56 12,-52 ' +
  'C17,-50 20,-46 21,-40 C22,-28 21,-14 18,2 Z';
const FOREARM = 'M-17,2 C-17,30 -18,60 -19,90 L19,90 C18,60 18,30 18,2 Z';

const fingersStraight = (spread = 0, curl = 1): Digit[] => [
  { base: [-13, -50], angle: -4 - spread, length: 43 * curl, w0: 11, w1: 9, joints: 2 },
  { base: [-3, -53], angle: 0, length: 47 * curl, w0: 11.5, w1: 9.5, joints: 2 },
  { base: [7, -51], angle: 4 + spread, length: 44 * curl, w0: 11, w1: 9, joints: 2 },
  { base: [15.5, -46], angle: 9 + spread * 1.6, length: 34 * curl, w0: 9.5, w1: 8, joints: 2 },
];

export const POSES: Record<HandPose, PoseGeometry> = {
  flat: {
    palm: PALM, forearm: FOREARM,
    digits: [{ base: [-17, -16], angle: -24, length: 46, w0: 14, w1: 10.5, joints: 1 }, ...fingersStraight()],
    contact: { at: [0, -40], shape: 'oval', rx: 17, ry: 30 },
  },
  heel: {
    palm: PALM, forearm: FOREARM,
    digits: [{ base: [-17, -16], angle: -26, length: 46, w0: 14, w1: 10.5, joints: 1 }, ...fingersStraight(1, 0.96)],
    contact: { at: [0, -12], shape: 'oval', rx: 15, ry: 9 },
  },
  edge: {
    palm: PALM, forearm: FOREARM,
    digits: [{ base: [-17, -16], angle: -22, length: 46, w0: 14, w1: 10.5, joints: 1 }, ...fingersStraight()],
    contact: { at: [20, -34], shape: 'oval', rx: 4.5, ry: 30, rot: 4 },
  },
  tips: {
    palm: PALM, forearm: FOREARM,
    digits: [{ base: [-17, -16], angle: -22, length: 44, w0: 14, w1: 10.5, joints: 1 }, ...fingersStraight(2, 0.86)],
    contact: { at: [-1, -94], shape: 'band', rx: 20, ry: 5.5 },
  },
  thumb: {
    palm: PALM, forearm: FOREARM,
    // thumb extended forward, fingers rest relaxed and angled out to the side
    digits: [
      { base: [-16, -20], angle: -6, length: 54, w0: 14, w1: 11, joints: 1 },
      { base: [-12, -50], angle: 26, length: 38, w0: 11, w1: 9, joints: 2 },
      { base: [-2, -53], angle: 33, length: 41, w0: 11.5, w1: 9.5, joints: 2 },
      { base: [8, -51], angle: 40, length: 38, w0: 11, w1: 9, joints: 2 },
      { base: [16, -46], angle: 48, length: 30, w0: 9.5, w1: 8, joints: 2 },
    ],
    contact: { at: [-21.6, -70], shape: 'dot', rx: 7 },
  },
  fist: {
    palm: PALM_FIST, forearm: FOREARM,
    digits: [
      // thumb tucked along the side of the index finger
      { base: [-17, -18], angle: 14, length: 34, w0: 14, w1: 11, joints: 1 },
      { base: [-13, -50], angle: -2, length: 17, w0: 13, w1: 13 },
      { base: [-3, -53], angle: 0, length: 19, w0: 13.5, w1: 13.5 },
      { base: [7, -51], angle: 3, length: 17, w0: 13, w1: 13 },
      { base: [15.5, -46], angle: 7, length: 13, w0: 11.5, w1: 11.5 },
    ],
    knuckles: [[-13.6, -67], [-3, -72], [7.9, -68], [17.1, -59]],
    seams: ['M-8.2,-52 L-8.6,-66', 'M2,-53 L2.6,-69', 'M11.6,-49 L12.6,-63'],
    contact: { at: [1, -73], shape: 'band', rx: 21, ry: 5.5, rot: 4 },
  },
  grip: {
    palm: PALM, forearm: FOREARM,
    // C-grip: thumb abducted wide, fingers together – tissue is held in between
    digits: [{ base: [-17, -18], angle: -62, length: 50, w0: 14, w1: 11, joints: 1 }, ...fingersStraight(0, 0.9)],
    anchor: [-30, -66],
    contact: { at: [-58, -42], shape: 'dot', rx: 7, extra: [[-2, -92]] },
  },
  pinch: {
    palm: PALM, forearm: FOREARM,
    digits: [
      { base: [-17, -18], angle: -18, length: 50, w0: 14, w1: 11, joints: 1 },
      { base: [-13, -50], angle: -14, length: 36, w0: 11, w1: 9, joints: 2 },
      { base: [-3, -53], angle: 6, length: 40, w0: 11.5, w1: 9.5, joints: 2 },
      { base: [7, -51], angle: 12, length: 37, w0: 11, w1: 9, joints: 2 },
      { base: [15.5, -46], angle: 18, length: 29, w0: 9.5, w1: 8, joints: 2 },
    ],
    anchor: [-26, -72],
    contact: { at: [-30, -63], shape: 'dot', rx: 6.5, extra: [[-22, -82]] },
  },
  claw: {
    // fingers strongly flexed (seen from above they look short): heel of the hand
    // rests on one spot while the fingertips work a few centimetres further on
    palm: PALM, forearm: FOREARM,
    digits: [{ base: [-17, -16], angle: -18, length: 40, w0: 14, w1: 10.5, joints: 1 }, ...fingersStraight(2, 0.5)],
    anchor: [0, -12],
    contact: { at: [-1, -74], shape: 'band', rx: 19, ry: 5, extra: [[0, -12]] },
  },
};

/** Fingernail for a digit (visible on the back of the hand). */
export function nailPath(d: Digit): string | null {
  if (d.length < 25) return null;
  const [dx, dy] = dir(d.angle);
  const tip = digitTip(d);
  const len = Math.min(10, d.length * 0.22);
  const c: Pt = [tip[0] - dx * (len / 2 + 1.2), tip[1] - dy * (len / 2 + 1.2)];
  return digitPath({ base: [c[0] - (dx * len) / 2, c[1] - (dy * len) / 2], angle: d.angle, length: len, w0: d.w1 * 0.62, w1: d.w1 * 0.66 });
}

/** Small joint crease marks across a digit. */
export function jointLines(d: Digit): string[] {
  if (!d.joints) return [];
  const [dx, dy] = dir(d.angle);
  const nx = -dy, ny = dx;
  const out: string[] = [];
  const fractions = d.joints === 1 ? [0.55] : [0.42, 0.72];
  for (const fr of fractions) {
    const cx = d.base[0] + dx * d.length * fr, cy = d.base[1] + dy * d.length * fr;
    const hw = (d.w0 + (d.w1 - d.w0) * fr) * 0.28;
    out.push(`M${(cx - nx * hw).toFixed(2)},${(cy - ny * hw).toFixed(2)} Q${(cx + dx * 1.2).toFixed(2)},${(cy + dy * 1.2).toFixed(2)} ${(cx + nx * hw).toFixed(2)},${(cy + ny * hw).toFixed(2)}`);
  }
  return out;
}
