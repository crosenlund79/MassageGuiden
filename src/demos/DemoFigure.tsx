import { useId } from 'react';
import { FIGURE } from '../anatomy/figure2d';
import { POSES, digitPath, jointLines, nailPath, type HandPose } from './hands';
import type { DemoArrow, DemoFrame, DemoHand, DemoStage, Pt } from './types';

const MIRROR = 'matrix(-1 0 0 1 400 0)';
const HAND_SCALE = 0.92;

function handTransform(h: DemoHand, scale: number) {
  const pose = POSES[h.pose];
  const [cx, cy] = pose.anchor ?? pose.contact.at;
  const sx = h.side === 'L' ? -scale : scale;
  return `translate(${h.at[0]} ${h.at[1]}) rotate(${h.rot}) scale(${sx} ${scale}) translate(${-cx} ${-cy})`;
}

/** A therapist hand drawn in local coordinates (see hands.ts). */
export function HandGlyph({ pose, gradId, variant = 'therapist', showContact = true }: { pose: HandPose; gradId: string; variant?: 'therapist' | 'client'; showContact?: boolean }) {
  const g = POSES[pose];
  const parts = [g.forearm, g.palm, ...g.digits.map(digitPath)];
  const c = g.contact;
  return (
    <g className={`hand hand-${variant}`}>
      {/* outline pass, then fill pass → one merged silhouette */}
      <g className="hand-outline">
        {parts.map((d, i) => <path key={i} d={d} style={i === 0 ? { fill: `url(#${gradId})`, stroke: `url(#${gradId})` } : undefined} />)}
      </g>
      <g className="hand-fill">
        {parts.map((d, i) => <path key={i} d={d} style={i === 0 ? { fill: `url(#${gradId}-f)` } : undefined} />)}
      </g>
      <g className="hand-detail">
        {g.digits.flatMap((d) => jointLines(d)).map((d, i) => <path key={`j${i}`} d={d} />)}
        {g.digits.map((d, i) => {
          const n = nailPath(d);
          return n ? <path key={`n${i}`} d={n} className="nail" /> : null;
        })}
        {/* metacarpal/knuckle hints on the back of the hand */}
        <path d="M-12,-46 C-4,-49 6,-48 15,-43" />
        {g.knuckles?.map(([x, y], i) => <path key={`k${i}`} d={`M${x - 4.5},${y + 4} Q${x},${y - 1} ${x + 4.5},${y + 4}`} />)}
        {g.seams?.map((d, i) => <path key={`s${i}`} d={d} className="seam" />)}
      </g>
      {showContact && (
        <g className="contact">
          {c.shape === 'dot' && <circle cx={c.at[0]} cy={c.at[1]} r={c.rx ?? 6} />}
          {c.shape !== 'dot' && (
            <ellipse cx={c.at[0]} cy={c.at[1]} rx={c.rx} ry={c.ry} transform={c.rot ? `rotate(${c.rot} ${c.at[0]} ${c.at[1]})` : undefined} />
          )}
          {c.extra?.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={c.shape === 'dot' ? (c.rx ?? 6) * 0.9 : 8} />)}
        </g>
      )}
    </g>
  );
}

function arrowPath(a: Extract<DemoArrow, { kind: 'line' }>): string {
  const [x1, y1] = a.from;
  const [x2, y2] = a.to;
  if (!a.bend) return `M${x1},${y1} L${x2},${y2}`;
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const cx = mx + (-dy / len) * a.bend, cy = my + (dx / len) * a.bend;
  return `M${x1},${y1} Q${cx},${cy} ${x2},${y2}`;
}

function circlePath(at: Pt, r: number, ccw?: boolean): string {
  // ~300° arc so the arrowhead shows the direction
  const start = -60, end = 240;
  const p = (deg: number): Pt => [at[0] + r * Math.cos((deg * Math.PI) / 180), at[1] + r * Math.sin((deg * Math.PI) / 180)];
  const [sx, sy] = ccw ? p(end) : p(start);
  const [ex, ey] = ccw ? p(start) : p(end);
  return `M${sx.toFixed(2)},${sy.toFixed(2)} A${r},${r} 0 1 ${ccw ? 0 : 1} ${ex.toFixed(2)},${ey.toFixed(2)}`;
}

function Arrow({ a, markerId, scale }: { a: DemoArrow; markerId: string; scale: number }) {
  const w = 2.2 * scale;
  if (a.kind === 'press') {
    const ang = a.angle ?? 180;
    const len = 16 * scale;
    const r = ((ang - 90) * Math.PI) / 180;
    const to: Pt = a.at;
    const from: Pt = [to[0] - Math.cos(r) * len, to[1] - Math.sin(r) * len];
    const d = `M${from[0]},${from[1]} L${to[0]},${to[1]}`;
    return (
      <g className="demo-arrow">
        <path d={d} className="halo" strokeWidth={w * 2.6} />
        <path d={d} strokeWidth={w} markerEnd={`url(#${markerId})`} />
      </g>
    );
  }
  const d = a.kind === 'circle' ? circlePath(a.at, a.r, a.ccw) : arrowPath(a);
  const dashed = a.kind === 'line' && a.dashed;
  return (
    <g className="demo-arrow">
      <path d={d} className="halo" strokeWidth={w * 2.6} />
      <path
        d={d}
        strokeWidth={w}
        strokeDasharray={dashed ? `${5 * scale} ${4 * scale}` : undefined}
        markerEnd={`url(#${markerId})`}
        markerStart={a.kind === 'line' && a.double ? `url(#${markerId}-s)` : undefined}
      />
      {a.kind === 'line' && a.label && (
        <text x={a.to[0]} y={a.to[1]} dx={4 * scale} dy={-4 * scale} style={{ fontSize: 9 * scale }} className="demo-label">{a.label}</text>
      )}
    </g>
  );
}

/** Client hand close-up stage (therapist works on the client's hand). */
function ClientHand({ surface, gradId }: { surface: 'dorsal' | 'palmar'; gradId: string }) {
  // client's right hand; palmar view = mirrored dorsal silhouette (thumb on the other side)
  return (
    <g transform={`translate(0 40) scale(${surface === 'palmar' ? -1 : 1} 1)`} className="client-hand">
      <HandGlyph pose="flat" gradId={gradId} variant="client" showContact={false} />
      {surface === 'dorsal' ? (
        <g className="tendons">
          {[[-13, -50], [-3, -53], [7, -51], [15.5, -46]].map(([x, y], i) => (
            <path key={i} d={`M${x},${y} C${x * 0.8},${y + 18} ${x * 0.5},${y + 34} ${x * 0.35},-2`} />
          ))}
        </g>
      ) : (
        <g className="palm-lines">
          <path d="M-14,-18 C-8,-30 -10,-40 -17,-46" />
          <path d="M-18,-36 C-6,-40 8,-42 20,-38" />
          <ellipse cx="-14" cy="-24" rx="8" ry="13" className="thenar" />
        </g>
      )}
    </g>
  );
}

export function DemoFigure({ stage, frame, ariaLabel }: { stage: DemoStage; frame: DemoFrame; ariaLabel: string }) {
  const uid = useId().replace(/:/g, '');
  const [x, y, w, h] = stage.frame;
  // stroke/marker sizes scale with the zoom level so they look the same in every panel
  const k = Math.max(w, h) / 220;
  const focus = new Set(stage.kind === 'figure' ? stage.focus ?? [] : []);
  return (
    <svg viewBox={`${x} ${y} ${w} ${h}`} role="img" aria-label={ariaLabel} className="demo-svg" preserveAspectRatio="xMidYMid meet">
      <defs>
        <marker id={`${uid}-m`} viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4.2" markerHeight="4.2" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 L2.5,5 Z" className="arrow-head" />
        </marker>
        <marker id={`${uid}-m-s`} viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4.2" markerHeight="4.2" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 L2.5,5 Z" className="arrow-head" />
        </marker>
        <linearGradient id={`${uid}-g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--hand-line)" stopOpacity="1" />
          <stop offset="0.75" stopColor="var(--hand-line)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${uid}-g-f`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--hand-skin)" stopOpacity="1" />
          <stop offset="0.75" stopColor="var(--hand-skin)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${uid}-c`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--client-line)" stopOpacity="1" />
          <stop offset="0.8" stopColor="var(--client-line)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${uid}-c-f`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--client-skin)" stopOpacity="1" />
          <stop offset="0.8" stopColor="var(--client-skin)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x={x} y={y} width={w} height={h} className="demo-bg" />

      {stage.kind === 'figure' ? (
        <g className="demo-body">
          {(() => {
            const fig = FIGURE[stage.view];
            const body = `${fig.outlineHalf} L201,500 L201,18 Z`;
            return (
              <>
                <path d={body} className="db-skin" />
                <path d={body} className="db-skin" transform={MIRROR} />
                {fig.underlays.filter((u) => u.tone === 'hair').map((u, i) => (
                  <g key={i} className="db-hair"><path d={u.d} /><path d={u.d} transform={MIRROR} /></g>
                ))}
                {fig.shapes.filter((s) => (s.layer ?? 'superficial') === 'superficial' || focus.has(s.muscleId)).map((s, i) => (
                  <g key={i} className={focus.has(s.muscleId) ? 'db-focus' : 'db-muscle'}>
                    <path d={s.d} /><path d={s.d} transform={MIRROR} />
                  </g>
                ))}
                {fig.detailLines.map((d, i) => (
                  <g key={`d${i}`} className="db-detail"><path d={d} /><path d={d} transform={MIRROR} /></g>
                ))}
                <g className="db-outline"><path d={fig.outlineHalf} /><path d={fig.outlineHalf} transform={MIRROR} /></g>
              </>
            );
          })()}
        </g>
      ) : (
        <ClientHand surface={stage.surface} gradId={`${uid}-c`} />
      )}

      {frame.hands.map((hd, i) => (
        <g key={i} transform={handTransform(hd, (hd.scale ?? 1) * (stage.kind === 'hand' ? 1 : HAND_SCALE))} className={hd.role === 'support' ? 'hand-support' : 'hand-active'}>
          <HandGlyph pose={hd.pose} gradId={`${uid}-g`} showContact={hd.role !== 'support'} />
        </g>
      ))}

      {frame.arrows.map((a, i) => <Arrow key={i} a={a} markerId={`${uid}-m`} scale={k} />)}

      {frame.marks?.map((m, i) => (
        <g key={`mk${i}`} className="demo-mark">
          <circle cx={m.at[0]} cy={m.at[1]} r={6.5 * k} />
          <text x={m.at[0]} y={m.at[1]} dy={3.2 * k} style={{ fontSize: 9 * k }} textAnchor="middle">{m.label}</text>
        </g>
      ))}
    </svg>
  );
}
