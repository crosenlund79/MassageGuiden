/**
 * 2D anatomical figure – rendering geometry only.
 *
 * This module contains NO anatomical facts beyond geometry. Each shape references a
 * stable muscle ID from src/content/muscles.json. A future 3D renderer can replace
 * this module while keeping the same muscle IDs and interaction contract
 * (select(id), highlight(id[])).
 *
 * Coordinate system: 400 × 1000 user units, body midline at x = 200.
 * Every shape is authored for the LEFT half of the image and mirrored across the
 * midline at render time, so both sides of the body share the same geometry.
 * Shapes are drawn in array order (later = on top), which matters for hit-testing.
 */

export type AtlasView = 'anterior' | 'posterior';

export interface MuscleShape {
  muscleId: string;
  d: string;
  /** Deep muscles are drawn as an optional overlay layer. */
  layer?: 'superficial' | 'deep';
}

export interface FigureView {
  /** Open path tracing the outer silhouette of the left half (top of head → crotch). */
  outlineHalf: string;
  /** Non-interactive anatomical detail lines drawn on top of the muscles. */
  detailLines: string[];
  /** Non-interactive filled detail shapes (e.g. hair), drawn under the muscles. */
  underlays: { d: string; tone: 'hair' | 'skinShade' | 'bone' }[];
  /** Single (non-mirrored) detail lines along the midline. */
  midlineDetails: string[];
  shapes: MuscleShape[];
}

const OUTLINE_HALF =
  'M200,18 C178,18 162,34 160,60 C158,76 160,92 165,106 C169,114 173,120 176,128 ' +
  'C177,138 177,148 179,156 C166,164 148,168 128,172 ' +
  'C108,176 94,190 90,212 C88,232 88,250 90,266 ' +
  'C88,290 84,318 82,340 C76,380 66,430 60,470 C58,484 56,494 56,502 ' +
  'C50,516 46,534 46,556 C46,574 52,592 60,600 C64,602 68,598 68,592 ' +
  'C70,574 72,556 74,540 C76,530 78,520 80,512 C82,504 84,498 86,494 ' +
  'C94,450 104,400 108,360 C110,350 112,342 114,332 C116,310 120,284 124,264 ' +
  'C126,262 128,268 130,278 C134,310 136,350 140,380 ' +
  'C138,400 134,420 132,440 C128,462 124,490 122,520 ' +
  'C120,570 124,620 132,668 C134,684 136,698 138,710 ' +
  'C134,740 134,780 140,810 C146,840 152,870 156,900 ' +
  'C156,914 152,930 150,944 C148,956 156,964 170,964 C182,964 190,962 192,954 ' +
  'C194,944 190,930 188,912 C186,890 186,860 184,830 C182,800 182,770 182,746 ' +
  'C182,730 184,714 186,698 C190,640 194,580 196,540 C198,520 200,506 200,500';

export const FIGURE: Record<AtlasView, FigureView> = {
  anterior: {
    outlineHalf: OUTLINE_HALF,
    underlays: [
      // hairline
      { d: 'M200,18 C178,18 162,34 160,56 C166,40 182,30 200,30 Z', tone: 'hair' },
      // subcutaneous anterior surface of the tibia (shin) – bone, not muscle
      { d: 'M164,716 L172,720 C176,760 178,820 178,880 L172,904 C168,860 166,780 164,716 Z', tone: 'bone' },
    ],
    shapes: [
      // Head
      { muscleId: 'frontalis', d: 'M200,31 C184,31 171,38 166,49 C170,57 177,62 186,65 L200,65 Z' },
      { muscleId: 'temporalis', d: 'M166,51 C162,61 161,75 163,89 L170,93 C170,80 170,67 173,57 Z' },
      { muscleId: 'masseter', d: 'M165,84 L176,88 C179,96 180,104 178,113 L171,114 C167,106 165,95 165,84 Z' },
      // Neck
      { muscleId: 'trapezius', d: 'M177,138 C175,152 158,162 130,171 C142,174 162,172 185,168 C182,158 180,148 177,138 Z' },
      { muscleId: 'sternocleidomastoideus', d: 'M170,112 L177,114 C183,132 191,152 198,168 L191,170 C184,152 176,132 170,112 Z' },
      // Trunk
      { muscleId: 'obliquus-externus', d: 'M152,268 L174,274 C170,320 170,400 176,470 C164,456 150,446 136,436 C138,410 140,385 138,360 C137,330 134,300 132,282 C140,278 146,272 152,268 Z' },
      { muscleId: 'serratus-anterior', d: 'M131,262 C136,258 142,256 146,258 L152,268 L140,276 L156,284 L142,292 L158,300 L144,308 L156,318 L140,326 C136,306 132,284 131,262 Z' },
      { muscleId: 'rectus-abdominis', d: 'M199,268 L174,274 C170,320 170,400 176,470 C182,478 190,482 199,484 Z' },
      { muscleId: 'pectoralis-major', d: 'M146,180 C160,176 180,172 198,172 L199,262 C184,272 160,270 140,256 C132,248 124,236 118,224 C126,206 134,192 146,180 Z' },
      { muscleId: 'deltoideus', d: 'M130,171 C110,175 95,188 91,210 C89,232 90,252 96,272 C104,260 112,240 118,222 C124,206 132,192 144,180 C140,176 136,172 130,171 Z' },
      // Arm
      { muscleId: 'biceps-brachii', d: 'M108,226 C100,240 94,268 94,296 C94,316 98,332 104,344 C110,334 114,316 115,296 C116,272 114,246 108,226 Z' },
      { muscleId: 'flexores-antebrachii', d: 'M92,366 C84,400 74,450 68,494 L84,496 C92,450 102,410 110,360 C106,350 98,352 92,366 Z' },
      { muscleId: 'brachioradialis', d: 'M86,318 C82,340 76,370 70,410 C66,440 62,470 59,494 L67,494 C72,460 80,420 90,380 C94,360 94,340 90,320 Z' },
      // Hip and thigh
      { muscleId: 'tensor-fasciae-latae', d: 'M138,438 C130,452 126,472 126,496 C126,508 128,516 130,522 C136,500 142,474 148,450 C146,444 142,440 138,438 Z' },
      { muscleId: 'tractus-iliotibialis', d: 'M124,520 L131,524 C132,580 136,630 141,690 L135,694 C128,640 123,580 124,520 Z' },
      { muscleId: 'vastus-lateralis', d: 'M132,500 C126,540 126,600 134,648 C140,666 148,676 158,678 L156,664 C146,610 144,550 150,484 C142,490 136,494 132,500 Z' },
      { muscleId: 'rectus-femoris', d: 'M152,478 C144,530 144,600 154,662 L170,662 C175,600 172,530 160,476 Z' },
      { muscleId: 'adductores', d: 'M184,482 C192,486 197,492 198,500 C194,530 186,560 178,600 C170,570 166,530 170,502 C174,492 178,486 184,482 Z' },
      { muscleId: 'vastus-medialis', d: 'M172,604 C166,630 164,660 170,680 C178,688 186,686 190,676 C188,650 184,626 180,606 Z' },
      { muscleId: 'gracilis', d: 'M196,502 L200,504 C198,560 194,630 190,692 L184,692 C188,630 192,560 196,502 Z' },
      { muscleId: 'sartorius', d: 'M146,444 L156,448 C166,520 178,600 188,692 L181,696 C172,620 158,530 146,444 Z' },
      // Lower leg
      { muscleId: 'fibularis-longus', d: 'M140,716 L151,716 C144,760 146,810 152,860 L147,864 C139,820 135,764 140,716 Z' },
      { muscleId: 'tibialis-anterior', d: 'M152,716 C144,744 144,792 150,840 C156,870 164,896 172,912 L177,906 C170,872 164,832 162,792 C160,760 162,734 164,716 Z' },
      { muscleId: 'gastrocnemius', d: 'M176,718 C184,740 186,770 184,804 L179,806 C178,776 176,744 172,720 Z' },
      { muscleId: 'soleus', d: 'M179,808 L184,806 C184,832 182,856 180,876 L176,876 C177,852 178,830 179,808 Z' },
      // Deep layer (overlay)
      { muscleId: 'pectoralis-minor', layer: 'deep', d: 'M138,188 L146,186 C158,200 168,214 176,226 L174,256 L164,258 C156,236 146,212 138,188 Z' },
    ],
    detailLines: [
      // clavicle
      'M146,176 C162,170 182,171 197,167',
      // tendinous intersections of rectus abdominis
      'M174,318 C182,320 192,318 199,318', 'M172,360 C182,362 192,360 199,360', 'M173,404 C182,404 192,404 199,404',
      // patella
      'M156,672 C156,662 172,662 172,672 C172,686 156,686 156,672 Z',
      // face: eye, brow, nose, mouth, ear
      'M178,72 C182,69 188,69 192,72', 'M176,63 C182,60 188,60 193,62',
      'M196,80 C195,90 193,96 192,99 C195,101 198,101 200,101', 'M188,112 C192,114 196,115 200,115',
      // jaw line
      'M166,108 C174,120 186,130 200,133',
      'M160,72 C155,74 154,86 158,94 C160,96 162,94 162,90',
      // hand: thumb & finger hints
      'M78,516 C72,530 66,540 62,548', 'M58,560 L60,590', 'M64,562 L66,592',
      // foot
      'M164,950 C170,946 178,946 186,950',
    ],
    midlineDetails: [
      'M200,268 L200,484', // linea alba
      'M197,410 C197,406 203,406 203,410 C203,414 197,414 197,410 Z', // umbilicus
    ],
  },

  posterior: {
    outlineHalf: OUTLINE_HALF,
    underlays: [
      { d: 'M200,18 C178,18 162,34 160,60 C158,80 161,96 168,110 C178,116 190,118 200,118 Z', tone: 'hair' },
    ],
    shapes: [
      // Back and shoulder (drawn deep-to-superficial: latissimus under trapezius, deltoid on top)
      { muscleId: 'infraspinatus', d: 'M146,192 C154,194 162,200 166,210 C170,232 170,254 164,272 C152,270 140,264 130,254 C128,236 134,212 146,192 Z' },
      { muscleId: 'teres-major', d: 'M130,254 C140,264 152,270 164,274 C162,284 156,292 148,294 C136,288 126,276 120,262 C122,256 126,254 130,254 Z' },
      { muscleId: 'latissimus-dorsi', d: 'M148,294 C156,292 162,286 166,278 C174,296 182,320 190,344 C194,360 197,376 199,392 L199,424 C186,432 168,440 148,444 L138,438 C138,404 136,360 134,320 C132,296 126,276 120,262 C128,276 138,288 148,294 Z' },
      { muscleId: 'erector-spinae', d: 'M199,392 L187,396 C182,420 182,446 187,470 L199,474 Z' },
      { muscleId: 'trapezius', d: 'M199,112 C192,120 184,128 178,140 C168,156 150,166 128,172 C138,180 150,190 160,202 C170,236 184,306 199,386 Z' },
      { muscleId: 'deltoideus', d: 'M128,172 C108,176 94,190 91,212 C89,234 90,254 96,272 C104,256 114,236 122,220 C128,206 136,194 146,186 C140,180 134,176 128,172 Z' },
      // Arm
      { muscleId: 'triceps-brachii', d: 'M96,272 C90,296 88,322 92,344 L114,342 C116,318 118,290 120,264 C112,262 102,266 96,272 Z' },
      { muscleId: 'extensores-antebrachii', d: 'M84,352 C76,400 66,450 60,494 L84,496 C92,450 102,404 112,352 C104,346 92,346 84,352 Z' },
      // Gluteal region
      { muscleId: 'tractus-iliotibialis', d: 'M124,500 L133,504 C134,580 138,640 144,694 L137,696 C130,640 124,580 124,500 Z' },
      { muscleId: 'gluteus-medius', d: 'M138,440 C152,436 168,438 182,446 C170,456 152,470 134,488 C130,472 132,454 138,440 Z' },
      { muscleId: 'gluteus-maximus', d: 'M182,446 C190,452 197,460 199,468 L199,532 C186,546 162,552 142,546 C132,532 128,508 134,488 C152,470 170,456 182,446 Z' },
      // Hamstrings
      { muscleId: 'biceps-femoris', d: 'M140,548 C134,590 136,640 146,692 L158,692 C158,640 158,596 160,550 Z' },
      { muscleId: 'semitendinosus', d: 'M160,550 C160,600 164,650 172,694 L182,692 C182,640 184,592 188,552 Z' },
      { muscleId: 'semimembranosus', d: 'M188,552 C188,600 186,650 182,692 L190,694 C196,644 198,594 198,546 Z' },
      // Calf
      { muscleId: 'soleus', d: 'M142,786 C140,826 148,858 160,880 L178,880 C186,858 188,826 186,790 C180,812 172,822 164,822 C154,822 146,812 142,786 Z' },
      { muscleId: 'gastrocnemius', d: 'M146,708 C138,732 138,772 148,814 C154,822 160,824 164,824 C166,786 166,744 162,708 Z' },
      { muscleId: 'gastrocnemius', d: 'M164,708 C168,746 168,790 166,824 C174,822 182,814 184,806 C190,778 190,740 182,708 Z' },
      { muscleId: 'tendo-calcaneus', d: 'M164,880 L176,880 C175,896 174,910 174,924 L166,924 C166,910 165,896 164,880 Z' },
      // Deep layer (overlay)
      { muscleId: 'suboccipitales', layer: 'deep', d: 'M182,110 C188,107 196,107 199,109 L199,121 C192,121 186,119 182,117 Z' },
      { muscleId: 'levator-scapulae', layer: 'deep', d: 'M186,116 L193,120 C186,146 176,170 166,194 L158,190 C168,166 178,140 186,116 Z' },
    ],
    detailLines: [
      // spine of scapula
      'M134,190 C150,194 168,200 184,212',
      // popliteal crease
      'M148,700 C160,704 176,704 188,700',
      // ear
      'M160,72 C155,74 154,86 158,94',
      // heel
      'M160,948 C168,954 180,954 188,948',
    ],
    midlineDetails: [
      'M200,140 L200,470', // spinous processes line
      'M200,470 L200,534', // natal cleft
    ],
  },
};

/** Muscle IDs drawn in a view (optionally restricted to a layer). */
export function muscleIdsInView(view: AtlasView, layer?: 'superficial' | 'deep'): string[] {
  const ids = FIGURE[view].shapes
    .filter((s) => !layer || (s.layer ?? 'superficial') === layer)
    .map((s) => s.muscleId);
  return [...new Set(ids)];
}

/** Views in which a muscle has geometry. */
export function viewsForMuscle(muscleId: string): AtlasView[] {
  return (Object.keys(FIGURE) as AtlasView[]).filter((v) =>
    FIGURE[v].shapes.some((s) => s.muscleId === muscleId),
  );
}

export const FIGURE_SIZE = { width: 400, height: 1000 };
