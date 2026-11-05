# MassageAtlas

En lokal, offline-klar massage- og anatomireference til Sofie (iteration 001).
Bygget med React, TypeScript og Vite som PWA. Der er ingen backend og ingen konto. Personlige data gemmes i IndexedDB i browseren.

## Kom i gang
Kræver Node.js 20 eller nyere.

```bash
npm install
npm run dev        # http://127.0.0.1:5173
```

Produktionsbuild med offline-understøttelse (service worker):

```bash
npm run build
npm run preview    # http://127.0.0.1:4173
```

## Online (GitHub Pages)
Appen udgives automatisk på https://crosenlund79.github.io/MassageGuiden/ ved push til `main`.
Engangsopsætning og detaljer står i `docs/DEPLOY.md`.

## Tjek
```bash
npm run typecheck  # TypeScript
npm test           # enhedstests (indhold, quizmotor, IndexedDB)
npm run build && npm run e2e   # browsertest mod produktionsbuildet (kræver Playwright/Chromium)
```

## Struktur
```
src/content/     referenceindhold (JSON): greb, muskler, regioner, kilde
src/domain/      typer, opslag og søgning – fælles for alle funktioner
src/anatomy/     2D-figurens geometri (figure2d.ts) og den interaktive SVG (AtlasFigure.tsx)
src/quiz/        quizmotor (ren logik)
src/storage/     IndexedDB: favoritter, noter, quizhistorik, aktivitet, indstillinger
src/pages/       skærme: Forside, Massagegreb, Muskelatlas, Quiz, Favoritter, Om
scripts/         indholdsgeneratorer, ikoner og e2e-test
ReferenceImages/ kildefotos (uændrede, indgår ikke i appen)
```

Atlasset er adskilt fra muskeldataene. `figure2d.ts` indeholder kun geometri, som peger på stabile muskel-ID'er. En senere 3D-visning kan bruge de samme ID'er og den samme `onSelect`/`highlights`-kontrakt.

Se `docs/CONTENT.md` for kilder, markering og åbne punkter.

MassageAtlas er et studieværktøj og ikke et diagnose- eller behandlingsværktøj.
