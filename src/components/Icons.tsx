import type { SVGProps } from 'react';

const base = (p: SVGProps<SVGSVGElement>) => ({
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  ...p,
});

export const IconHome = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z" /></svg>
);
export const IconHands = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M7 20c-2-1.5-3-3.6-3-6V9.5a1.5 1.5 0 0 1 3 0V12" /><path d="M7 12V6.5a1.5 1.5 0 0 1 3 0V11" /><path d="M10 11V5.5a1.5 1.5 0 0 1 3 0V11" /><path d="M13 11V7a1.5 1.5 0 0 1 3 0v6c0 3.5-2 6-5 7" /><path d="M16 12.5c1-1.5 3.5-1.3 3.8.4" /></svg>
);
export const IconBody = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="12" cy="4.5" r="2" /><path d="M8 8.5c2.5 1 5.5 1 8 0" /><path d="M9 9v5l-1.5 7M15 9v5l1.5 7M9 14h6" /><path d="M8 8.5 5.5 14M16 8.5l2.5 5.5" /></svg>
);
export const IconQuiz = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="8.5" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6" /><circle cx="12" cy="17" r=".6" fill="currentColor" /></svg>
);
export const IconHeart = ({ filled, ...p }: SVGProps<SVGSVGElement> & { filled?: boolean }) => (
  <svg {...base(p)} fill={filled ? 'currentColor' : 'none'}><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></svg>
);
export const IconSearch = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></svg>
);
export const IconAlert = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M12 4 3 19.5h18z" /><path d="M12 10v4.5" /><circle cx="12" cy="17" r=".6" fill="currentColor" /></svg>
);
export const IconTarget = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="1" fill="currentColor" /></svg>
);
export const IconTag = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M4 12V5a1 1 0 0 1 1-1h7l8 8-8 8z" /><circle cx="8.5" cy="8.5" r="1.3" /></svg>
);
export const IconNote = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M6 4h9l3 3v13H6z" /><path d="M9 11h6M9 14.5h6M9 18h3" /></svg>
);
export const IconBook = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v15H7.5A2.5 2.5 0 0 0 5 20.5z" /><path d="M5 20.5A2.5 2.5 0 0 1 7.5 18H19v3H7.5" /></svg>
);
export const IconArrow = ({ dir = 'right', ...p }: SVGProps<SVGSVGElement> & { dir?: 'left' | 'right' }) => (
  <svg {...base(p)}>{dir === 'right' ? <path d="M5 12h14M13 6l6 6-6 6" /> : <path d="M19 12H5M11 6l-6 6 6 6" />}</svg>
);
export const IconCheck = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
);
export const IconX = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M6 6l12 12M18 6 6 18" /></svg>
);

export function BrandMark(p: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 512 512" aria-hidden="true" {...p}>
      <rect width="512" height="512" rx="112" fill="#343A32" />
      <circle cx="256" cy="256" r="168" fill="#F7F2E9" />
      <path d="M256 132c-38 0-62 30-62 66 0 28 14 46 30 58-34 14-58 46-58 94h180c0-48-24-80-58-94 16-12 30-30 30-58 0-36-24-66-62-66z" fill="#9BAA91" />
      <path d="M166 350c22 30 54 46 90 46s68-16 90-46" fill="none" stroke="#776657" strokeWidth="14" strokeLinecap="round" />
    </svg>
  );
}
