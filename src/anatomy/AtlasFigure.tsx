import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { FIGURE, FIGURE_SIZE, type AtlasView } from './figure2d';
import { useI18n } from '../i18n/I18nProvider';

export type HighlightTone = 'selected' | 'related' | 'correct' | 'wrong' | 'target';

export interface AtlasFigureProps {
  view: AtlasView;
  highlights?: Record<string, HighlightTone>;
  onSelect?: (muscleId: string | null) => void;
  onHover?: (muscleId: string | null) => void;
  showDeep?: boolean;
  /** Enables wheel/pinch zoom, drag pan and the zoom buttons. */
  zoomable?: boolean;
  /** Initial/forced frame in figure coordinates [x, y, w, h]. */
  frame?: [number, number, number, number];
  /** Fit the view to these muscles (e.g. quiz "name the muscle"). */
  focusMuscles?: string[];
  /** Dim everything that is not highlighted (illustration mode). */
  dimOthers?: boolean;
  interactive?: boolean;
  ariaLabel?: string;
  className?: string;
  /** Changing this key resets zoom/pan. */
  resetKey?: string | number;
  labelFor?: (muscleId: string) => string;
}

type Box = { x: number; y: number; w: number; h: number };
const FULL: Box = { x: 0, y: 0, w: FIGURE_SIZE.width, h: FIGURE_SIZE.height };
const MIRROR = `matrix(-1 0 0 1 ${FIGURE_SIZE.width} 0)`;

/** Keeps at least part of the figure inside the view while panning (does not change the size). */
function panLimit(b: Box): Box {
  const x = Math.min(Math.max(b.x, -b.w * 0.6), FIGURE_SIZE.width - b.w * 0.4);
  const y = Math.min(Math.max(b.y, -b.h * 0.6), FIGURE_SIZE.height - b.h * 0.4);
  return { ...b, x, y };
}

/** Expands a box to the aspect ratio of the container so the figure isn't distorted. */
function fitAspect(b: Box, aspect: number): Box {
  const cur = b.w / b.h;
  if (cur > aspect) {
    const h = b.w / aspect;
    return { x: b.x, y: b.y - (h - b.h) / 2, w: b.w, h };
  }
  const w = b.h * aspect;
  return { x: b.x - (w - b.w) / 2, y: b.y, w, h: b.h };
}

export function AtlasFigure({
  view,
  highlights = {},
  onSelect,
  onHover,
  showDeep = false,
  zoomable = false,
  frame,
  focusMuscles,
  dimOthers = false,
  interactive = true,
  ariaLabel,
  className,
  resetKey,
  labelFor,
}: AtlasFigureProps) {
  const fig = FIGURE[view];
  const { s: str } = useI18n();
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [aspect, setAspect] = useState(0.5);
  const [box, setBox] = useState<Box | null>(null);

  // Track container aspect ratio
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) setAspect(r.width / r.height);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const focusKey = focusMuscles?.join(',') ?? '';

  const baseBox = useMemo<Box>(() => {
    if (frame) return { x: frame[0], y: frame[1], w: frame[2], h: frame[3] };
    return FULL;
  }, [frame]);

  // Reset zoom when view, frame, focus or resetKey changes; fit to focus muscles
  // (using real geometry from the DOM) when given.
  useLayoutEffect(() => {
    commit(null);
    if (!focusKey || !svgRef.current) return;
    const ids = focusKey.split(',');
    let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
    svgRef.current.querySelectorAll<SVGGraphicsElement>('[data-muscle]').forEach((el) => {
      if (!ids.includes(el.dataset.muscle!)) return;
      const bb = el.getBBox();
      const mirrored = el.getAttribute('transform') === MIRROR;
      const bx = mirrored ? FIGURE_SIZE.width - bb.x - bb.width : bb.x;
      x1 = Math.min(x1, bx); y1 = Math.min(y1, bb.y);
      x2 = Math.max(x2, bx + bb.width); y2 = Math.max(y2, bb.y + bb.height);
    });
    if (!isFinite(x1)) return;
    const pad = Math.max(60, (y2 - y1) * 0.6);
    commit({ x: x1 - pad, y: y1 - pad, w: x2 - x1 + pad * 2, h: y2 - y1 + pad * 2 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey, view, resetKey, baseBox]);

  const vb = fitAspect(box ?? baseBox, aspect);
  // Latest box, updated synchronously so fast wheel/pinch events never use a stale value.
  const boxRef = useRef<Box | null>(null);
  boxRef.current = box ? vb : null;
  const commit = useCallback((b: Box | null) => {
    boxRef.current = b;
    setBox(b);
  }, []);
  const currentBox = useCallback(() => boxRef.current ?? fitAspect(baseBox, aspect), [baseBox, aspect]);

  /** Screen → figure coordinates for a given viewBox (exact for preserveAspectRatio="xMidYMid meet"). */
  const geom = useCallback((b: Box) => {
    const r = svgRef.current!.getBoundingClientRect();
    const scale = Math.min(r.width / b.w, r.height / b.h);
    const offX = (r.width - b.w * scale) / 2;
    const offY = (r.height - b.h * scale) / 2;
    return { r, scale, offX, offY };
  }, []);
  const toUser = useCallback((b: Box, cx: number, cy: number) => {
    const { r, scale, offX, offY } = geom(b);
    return { x: b.x + (cx - r.left - offX) / scale, y: b.y + (cy - r.top - offY) / scale };
  }, [geom]);
  /** Box of size w×h positioned so that figure point p sits under screen point (cx, cy). */
  const anchored = useCallback((p: { x: number; y: number }, cx: number, cy: number, w: number, h: number): Box => {
    const { r, scale, offX, offY } = geom({ x: 0, y: 0, w, h });
    return { x: p.x - (cx - r.left - offX) / scale, y: p.y - (cy - r.top - offY) / scale, w, h };
  }, [geom]);

  const MIN_W = 40;
  const MAX_W = FIGURE_SIZE.width * 1.6;
  const limitW = (w: number) => Math.min(Math.max(w, MIN_W), MAX_W);

  /** Zoom by `factor` (<1 = in) keeping the figure point under (clientX, clientY) fixed. */
  const zoomAt = useCallback(
    (factor: number, clientX?: number, clientY?: number) => {
      if (!svgRef.current) return;
      const cur = currentBox();
      const r = svgRef.current.getBoundingClientRect();
      const cx = clientX ?? r.left + r.width / 2;
      const cy = clientY ?? r.top + r.height / 2;
      const w = limitW(cur.w * factor);
      if (Math.abs(w - cur.w) < 1e-6) return; // at a zoom limit: nothing moves
      const h = cur.h * (w / cur.w);
      const p = toUser(cur, cx, cy);
      commit(panLimit(anchored(p, cx, cy, w, h)));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentBox, toUser, anchored, commit],
  );

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !zoomable) return;
    const onWheel = (e: WheelEvent) => {
      // keep the page from scrolling while the pointer is over the atlas
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
      const dy = e.deltaY * unit;
      // smooth, proportional zoom (trackpads send many small deltas, mouse wheels a few large ones)
      const factor = Math.min(2, Math.max(0.5, Math.exp(dy * 0.0015)));
      zoomAt(factor, e.clientX, e.clientY);
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, [zoomable, zoomAt]);

  // ---------- pointer handling: tap to select, drag to pan, pinch to zoom ----------
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ moved: boolean; startTarget: string | null; pinch?: { box: Box; dist: number; anchor: { x: number; y: number } } }>({
    moved: false,
    startTarget: null,
  });

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const target = (e.target as Element).closest('[data-muscle]') as SVGElement | null;
    if (pointers.current.size === 1) {
      gesture.current = { moved: false, startTarget: target?.dataset.muscle ?? null };
    }
    if (zoomable && pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const start = currentBox();
      gesture.current.pinch = {
        box: start,
        dist: Math.hypot(a.x - b.x, a.y - b.y),
        anchor: toUser(start, (a.x + b.x) / 2, (a.y + b.y) / 2),
      };
      gesture.current.moved = true;
    }
    if (zoomable) svgRef.current?.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) {
      if (onHover && e.pointerType === 'mouse') {
        const t = (e.target as Element).closest('[data-muscle]') as SVGElement | null;
        onHover(t?.dataset.muscle ?? null);
      }
      return;
    }
    const cur = { x: e.clientX, y: e.clientY };
    pointers.current.set(e.pointerId, cur);
    if (!zoomable) return;
    const pinch = gesture.current.pinch;
    if (pointers.current.size === 2 && pinch) {
      // pinch: scale around the fingers' midpoint and follow it (two-finger pan)
      const [a, b] = [...pointers.current.values()];
      const dist = Math.max(Math.hypot(a.x - b.x, a.y - b.y), 1);
      const w = limitW(pinch.box.w * (pinch.dist / dist));
      const h = pinch.box.h * (w / pinch.box.w);
      commit(panLimit(anchored(pinch.anchor, (a.x + b.x) / 2, (a.y + b.y) / 2, w, h)));
      return;
    }
    const dxPx = cur.x - prev.x, dyPx = cur.y - prev.y;
    const total = Math.abs(dxPx) + Math.abs(dyPx);
    // Treat as drag only after a small threshold, so taps stay taps
    if (total === 0 || (!gesture.current.moved && total <= 3)) return;
    gesture.current.moved = true;
    const b = currentBox();
    const { scale } = geom(b);
    commit(panLimit({ ...b, x: b.x - dxPx / scale, y: b.y - dyPx / scale }));
  };

  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) gesture.current.pinch = undefined;
    if (pointers.current.size === 0) {
      if (!gesture.current.moved && interactive && onSelect) onSelect(gesture.current.startTarget);
      gesture.current = { moved: false, startTarget: null };
    }
  };

  const onKey = (e: React.KeyboardEvent<SVGPathElement>, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect?.(id);
    }
  };

  const shapes = fig.shapes.filter((s) => (s.layer ?? 'superficial') === 'superficial');
  const deep = fig.shapes.filter((s) => s.layer === 'deep');
  const anyHighlight = Object.keys(highlights).length > 0;
  // Only one focusable element per muscle (keyboard users)
  const focusable = new Set<string>();

  const renderShape = (s: (typeof fig.shapes)[number], i: number, isDeep: boolean) => {
    const tone = highlights[s.muscleId];
    const cls = [
      'm-shape',
      isDeep ? 'm-deep' : '',
      tone ? `m-${tone}` : '',
      dimOthers && anyHighlight && !tone ? 'm-dim' : '',
      interactive ? 'm-interactive' : '',
    ].join(' ');
    const label = labelFor?.(s.muscleId) ?? s.muscleId;
    const canFocus = interactive && !focusable.has(s.muscleId);
    if (canFocus) focusable.add(s.muscleId);
    const common = {
      'data-muscle': s.muscleId,
      className: cls,
      d: s.d,
    };
    return (
      <g key={`${s.muscleId}-${i}`}>
        <path
          {...common}
          tabIndex={canFocus ? 0 : undefined}
          role={interactive ? 'button' : undefined}
          aria-label={interactive ? label : undefined}
          onKeyDown={interactive ? (e) => onKey(e, s.muscleId) : undefined}
        >
          <title>{label}</title>
        </path>
        <path {...common} transform={MIRROR} aria-hidden="true">
          <title>{label}</title>
        </path>
      </g>
    );
  };

  return (
    <div ref={wrapRef} className={`atlas-figure ${className ?? ''}`}>
      <svg
        ref={svgRef}
        viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
        role="img"
        aria-label={ariaLabel ?? (view === 'anterior' ? str.atlas.figureFront : str.atlas.figureBack)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={() => onHover?.(null)}
        style={{ touchAction: zoomable ? 'none' : 'auto' }}
      >
        <defs>
          <linearGradient id="skinGrad" x1="0" x2="1">
            <stop offset="0" stopColor="var(--fig-skin-edge)" />
            <stop offset="0.5" stopColor="var(--fig-skin)" />
            <stop offset="1" stopColor="var(--fig-skin-edge)" />
          </linearGradient>
        </defs>
        {/* body fill (two halves) */}
        <path d={`${fig.outlineHalf} L201,500 L201,18 Z`} className="fig-body" />
        <path d={`${fig.outlineHalf} L201,500 L201,18 Z`} className="fig-body" transform={MIRROR} />
        {fig.underlays.map((u, i) => (
          <g key={`u${i}`} className={`fig-${u.tone}`}>
            <path d={u.d} />
            <path d={u.d} transform={MIRROR} />
          </g>
        ))}
        <g className="fig-muscles">{shapes.map((s, i) => renderShape(s, i, false))}</g>
        <g className="fig-details" aria-hidden="true">
          {fig.detailLines.map((d, i) => (
            <g key={`d${i}`}>
              <path d={d} />
              <path d={d} transform={MIRROR} />
            </g>
          ))}
          {fig.midlineDetails.map((d, i) => (
            <path key={`ml${i}`} d={d} />
          ))}
        </g>
        {showDeep && deep.length > 0 && <g className="fig-deep">{deep.map((s, i) => renderShape(s, i, true))}</g>}
        {/* outline on top */}
        <g className="fig-outline" aria-hidden="true">
          <path d={fig.outlineHalf} />
          <path d={fig.outlineHalf} transform={MIRROR} />
        </g>
        {/* side markers: in the anterior view the figure's right side is on the viewer's left */}
        <g className="fig-side" aria-hidden="true">
          <text x="40" y="990">{view === 'anterior' ? str.atlas.sideRight : str.atlas.sideLeft}</text>
          <text x="360" y="990" textAnchor="end">{view === 'anterior' ? str.atlas.sideLeft : str.atlas.sideRight}</text>
        </g>
      </svg>
      {zoomable && (
        <div className="zoom-controls" role="group" aria-label={str.atlas.zoom}>
          <button type="button" onClick={() => zoomAt(1 / 1.35)} aria-label={str.atlas.zoomIn}>+</button>
          <button type="button" onClick={() => zoomAt(1.35)} aria-label={str.atlas.zoomOut}>−</button>
          <button type="button" onClick={() => commit(null)} aria-label={str.atlas.zoomReset} className="zoom-reset">⤢</button>
        </div>
      )}
    </div>
  );
}
