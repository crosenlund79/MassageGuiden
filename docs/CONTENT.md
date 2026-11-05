# Indhold og kilder – MassageAtlas iteration 001

## Kildemateriale
**Massørskolen – Fyn: "Massage i Billeder – Fysiurgisk Massage"** (© Massørskolen – Fyn).
Billederne ligger uændret i `ReferenceImages/`. De bliver **ikke** bygget ind i appen. Appen henviser kun til side, trin og billedfil.

| Side | Billedfil | Status | Indhold |
|---|---|---|---|
| forside | 22.45.43 | læst | Forside |
| 3 | 22.45.41 | læst | Ben (bagside) trin 1–5 |
| 4 | 22.45.39 | læst | Ben (bagside) trin 6–10 |
| 5 | 22.45.37 | **ulæselig** | Ben trin 11–14 – for sløret |
| 6 | 22.45.34 | læst | Ben (forside) trin 15–16 |
| 7 | 22.45.32 | læst | Ben (forside) trin 17–19 |
| 8 | 22.45.31 | læst | Ben (forside) trin 20–24 |
| 9 | – | **mangler** | ikke modtaget |
| 10–15 | 22.45.29 … 22.45.19 | læst | Ryg/nakke/skuldre trin 1–22 (inkl. 4a/4b) |
| 16–18 | 22.45.16, .14, .10 | læst | Arm og hånd trin 1–13 |
| 19 | 22.45.09 | læst | Bryst trin 14–18 |
| 20 | – | **mangler** | Ansigt trin 1–4 |
| 21 | 22.45.01 (+ sløret dublet 22.45.07) | læst | Ansigt trin 5–8 |
| 22 | 22.44.50 | læst | Ansigt trin 9–12 |

Der blev modtaget 20 billeder, ikke 21.

## Datafiler
- `src/content/techniques.json` bliver genereret af `scripts/build-content.py`. Ret i scriptet og kør `python3 scripts/build-content.py`.
- `src/content/muscles.json` bliver genereret af `scripts/build-muscles.py`. Muskel-ID'erne er stabile og må ikke omdøbes, fordi atlas, greb, quiz og en fremtidig 3D-model deler dem.
- `src/content/regions.json` indeholder programmer (hæftets afsnit), regioner og rammer til illustrationerne.
- `src/content/source.json` indeholder proveniens pr. side.

## Markering
- `status: "kilde"`: billedteksten er transskriberet ordret (`source.caption`), og beskrivelsen er omskrevet selvstændigt.
- `status: "til-gennemsyn"`: grebet har mindst én afledt muskelkobling, en stavefejl i kilden eller en uklar formulering (se `reviewNotes`).
- Muskelkobling `basis: "kilde"` betyder, at musklen er nævnt i billedteksten. `"afledt"` betyder, at den er udledt af det beskrevne område og skal bekræftes af underviser.
- `handwrittenNotes` er håndskrevne noter på siderne. Læsningen er usikker.
- Muskeldata (udspring, hæfte og funktion) er almindelig lærebogsanatomi, ikke hæftet. De er markeret `standard-til-gennemsyn`, og danske navne med usikkerhed har `danishNameUncertain: true`.

## Åbne punkter
1. Trin 11–14 i benmassagen (side 5) skal fotograferes igen.
2. Ansigtsmassage trin 1–4 (side 20) og side 9 mangler.
3. Arm trin 6: "lillefingersiden til lateral på humerus" er uklart og skal afklares med underviser.
4. Arm trin 12: opdelingen "4 sektioner" er tolket ud fra billedteksten og skal bekræftes.
5. Alle afledte muskelkoblinger (23 greb) skal gennemses.
6. Danske navne markeret som usikre: brachioradialis, infraspinatus, tensor fasciae latae, tractus iliotibialis og suboccipitale muskler.
7. Rettigheder: få afklaret med Massørskolen – Fyn, om fotos må vises i appen. Indtil da vises der kun originale illustrationer.

## Illustrationer af håndgreb
- `src/content/demonstrations.json` bliver genereret af `scripts/build-demos.py`. Ret i scriptet og kør `python3 scripts/build-demos.py`.
- Håndstilling, kontaktpunkt, håndvinkel og pilenes retning er aflæst af hæftets fotos og tegnet som originale illustrationer (`src/demos/`). Fotografierne gengives ikke.
- `support: "foto"` betyder, at håndstilling og retning er tydelige i fotoet. `"delvis"` betyder, at noget er tolket ud fra billedteksten, og så har grebet altid en note i `review`.
- Klientens stilling (f.eks. bøjet knæ eller armen på ryggen) kan den forenklede figur ikke vise. Den står i stedet i `clientPose`.
- Alle illustrationer kan gennemses samlet på siden `#/haandgreb`.

## Engelsk version
- Oversat i hånden fra de danske billedtekster (`scripts/translations_en.py`), ikke maskinoversat. Hver tekst er holdt op mod den ordrette billedtekst.
- Billedteksten selv og de håndskrevne noter vises altid på dansk. På engelsk har håndskrevne noter en kort forklaring i parentes i håndgrebsteksterne.
- Muskelnavne på tre sprog: se `docs/MUSCLE_TERMINOLOGY.md`.
