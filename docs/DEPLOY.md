# Udgivelse på GitHub Pages (gratis)

Appen udgives som en statisk side på **https://crosenlund79.github.io/MassageGuiden/**.
Der er ingen server eller konto, og alt kører i browseren.

## Sådan virker det
- `.github/workflows/deploy-pages.yml` kører ved hvert push til `main` (og kan startes manuelt under *Actions → Deploy to GitHub Pages → Run workflow*).
- Workflowet kører typecheck og enhedstests. Derefter bygger det med `BASE_PATH=/MassageGuiden/` og udgiver mappen `dist` med GitHubs officielle Pages-actions.
- Lokalt (`npm run dev`, `npm run preview`) bruges en relativ base, så intet skal ændres for udvikling.
- Navigationen bruger `#/`-adresser (f.eks. `…/MassageGuiden/#/greb/ryg-2`), så direkte links og genindlæsning altid virker på Pages.
- Service workeren registreres med scope `/MassageGuiden/`, så appen virker offline efter første besøg og kan installeres som app.

## Engangsopsætning (manuel)
1. Flet appen ind i `main` (f.eks. via en pull request fra `claude/bold-wozniak-9uh0id`).
2. Gå på GitHub til **Settings → Pages**.
3. Vælg **GitHub Actions** under **Build and deployment → Source**. Vælg ikke "Deploy from a branch".
4. Gå til **Actions**, åbn **Deploy to GitHub Pages**, og vælg **Run workflow** på `main`, eller push en ændring til `main`.
5. Når kørslen er grøn (ca. 1–2 min.), ligger siden på https://crosenlund79.github.io/MassageGuiden/.

Hvis deploy-jobbet fejler med *"Branch … is not allowed to deploy to github-pages"*: åbn **Settings → Environments → github-pages**, og sørg for, at `main` er tilladt.

## Personlige data på den udgivne side
Favoritter, noter, quizhistorik og indstillinger gemmes i browserens IndexedDB for adressen `crosenlund79.github.io`.
- De bevares ved nye udgivelser og opdateringer af appen.
- De er **ikke** de samme som dem, du har i den lokale udgave (`127.0.0.1`). Brug *Om indholdet → Eksportér mine data* og *Importér* for at flytte dem.
- Hvis du rydder webstedsdata i browseren, slettes de. Tag derfor en eksport en gang imellem.

## Tjek lokalt, at Pages-buildet virker under en undermappe
```bash
BASE_PATH=/MassageGuiden/ npm run build
mkdir -p /tmp/pages && rm -rf /tmp/pages/MassageGuiden && cp -r dist /tmp/pages/MassageGuiden
(cd /tmp/pages && python3 -m http.server 8080)
# i en anden terminal:
E2E_URL=http://127.0.0.1:8080/MassageGuiden/ npm run e2e
```
