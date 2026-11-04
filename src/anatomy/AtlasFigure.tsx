import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { FIGURE, FIGURE_SIZE, type AtlasView } from './figure2d';

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

function clampBox(b: Box): Box {
  const minW = 40;
  const maxW = FIGURE_SIZE.width * 1.6;
  const w = Math.min(Math.max(b.w, minW), maxW);
  const h = (b.h / b.w) * w;
  const x = Math.min(Math.max(b.x, -w * 0.6), FIGURE_SIZE.width - w * 0.4);
  const y = Math.min(Math.max(b.y, -h * 0.6), FIGURE_SIZE.height - h * 0.4);
  return { x, y, w, h };
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
    setBox(null);
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
    setBox({ x: x1 - pad, y: y1 - pad, w: x2 - x1 + pad * 2, h: y2 - y1 + pad * 2 });
  }, [focusKey, view, resetKey, baseBox]);

  const vb = fitAspect(box ?? baseBox, aspect);

  // ---------- pointer handling: tap to select, drag to pan, pinch/wheel to zoom ----------
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ moved: boolean; startTarget: string | null; startDist?: number; startBox?: Box }>({
    moved: false,
    startTarget: null,
  });

  const toUnits = useCallback(
    (dxPx: number, dyPx: number) => {
      const r = svgRef.current!.getBoundingClientRect();
      return { dx: (dxPx / r.width) * vb.w, dy: (dyPx / r.height) * vb.h };
    },
    [vb.w, vb.h],
  );

  const zoomAt = useCallback(
    (factor: number, clientX?: number, clientY?: number) => {
      const cur = fitAspect(box ?? baseBox, aspect);
      const r = svgRef.current?.getBoundingClientRect();
      const fx = r && clientX !== undefined ? (clientX - r.left) / r.width : 0.5;
      const fy = r && clientY !== undefined ? (clientY - r.top) / r.height : 0.5;
      const w = cur.w * factor;
      const h = cur.h * factor;
      setBox(clampBox({ x: cur.x + (cur.w - w) * fx, y: cur.y + (cur.h - h) * fy, w, h }));
    },
    [box, baseBox, aspect],
  );

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !zoomable) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomAt(e.deltaY > 0 ? 1.12 : 1 / 1.12, e.clientX, e.clientY);
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, [zoomable, zoomAt]);

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const target = (e.target as Element).closest('[data-muscle]') as SVGElement | null;
    if (pointers.current.size === 1) {
      gesture.current = { moved: false, startTarget: target?.dataset.muscle ?? null };
    }
    if (zoomable && pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      gesture.current.startDist = Math.hypot(a.x - b.x, a.y - b.y);
      gesture.current.startBox = fitAspect(box ?? baseBox, aspect);
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
    if (pointers.current.size === 2 && gesture.current.startDist && gesture.current.startBox) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const factor = gesture.current.startDist / Math.max(dist, 1);
      const sb = gesture.current.startBox;
      const w = sb.w * factor, h = sb.h * factor;
      setBox(clampBox({ x: sb.x + (sb.w - w) / 2, y: sb.y + (sb.h - h) / 2, w, h }));
      return;
    }
    const dxPx = cur.x - prev.x, dyPx = cur.y - prev.y;
    if (!gesture.current.moved && Math.hypot(dxPx, dyPx) < 1) return;
    // Treat as drag only after a small threshold, so taps stay taps
    const total = Math.abs(dxPx) + Math.abs(dyPx);
    if (total > 0) {
      const { dx, dy } = toUnits(dxPx, dyPx);
      const curBox = fitAspect(box ?? baseBox, aspect);
      if (gesture.current.moved || total > 3) {
        gesture.current.moved = true;
        setBox(clampBox({ ...curBox, x: curBox.x - dx, y: curBox.y - dy }));
      }
    }
  };

  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    pointers.current.delete(e.pointerId);
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
        aria-label={ariaLabel ?? (view === 'anterior' ? 'Muskelfigur set forfra' : 'Muskelfigur set bagfra')}
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
          <text x="40" y="990">{view === 'anterior' ? 'H' : 'V'}</text>
          <text x="360" y="990" textAnchor="end">{view === 'anterior' ? 'V' : 'H'}</text>
        </g>
      </svg>
      {zoomable && (
        <div className="zoom-controls" role="group" aria-label="Zoom">
          <button type="button" onClick={() => zoomAt(1 / 1.35)} aria-label="Zoom ind">+</button>
          <button type="button" onClick={() => zoomAt(1.35)} aria-label="Zoom ud">−</button>
          <button type="button" onClick={() => setBox(null)} aria-label="Nulstil zoom" className="zoom-reset">⤢</button>
        </div>
      )}
    </div>
  );
}
