# Audio to Desmos

A stable static web app that converts a **short audio clip** into a small set of **Desmos-friendly trigonometric equations**.

## Why this version exists

The original single-file prototype could crash because it tried to do too much work at once in the browser. This version is intentionally constrained:

- Only analyzes the **first 1–8 seconds** of audio
- Downsamples before frequency estimation
- Caps generated harmonic terms to **6–16**
- Produces a lightweight Desmos result: **partials + one summed function**
- Uses a clean multi-file structure that is easier to maintain

## Project structure

```text
mp3-to-desmos-v2/
├─ index.html
├─ css/
│  └─ styles.css
├─ js/
│  └─ app.js
└─ README.md
```

## Features

- Drag-and-drop upload
- Waveform preview
- Short-clip analysis controls
- Desmos graph output
- Copyable generated equations
- Light/dark theme toggle
- GitHub Pages friendly

## Local usage

Open `index.html` directly in a browser, or serve the folder with a simple static server.

## GitHub Pages deploy

This app is plain static HTML/CSS/JS, so GitHub Pages can host it directly from the root of the repository.

## Updating your current repo

### Option 1: easiest manual replacement

1. Download and unzip this project.
2. Open your repo folder locally.
3. Delete the old single-file app files you do not want anymore.
4. Copy the new files into the repo root so you have:
   - `index.html`
   - `css/styles.css`
   - `js/app.js`
   - `README.md`
5. Then run:

```bash
git add .
git commit -m "refactor: replace prototype with stable multi-file app"
git push
```

### Option 2: wipe repo contents but keep git history

If your repo already only contains the old prototype and you want a clean replacement:

```bash
# from inside your repo
rm -rf *
# if on PowerShell, do not remove .git
# then copy in the new files

git add .
git commit -m "refactor: ship stable multi-file version"
git push
```

### PowerShell-safe replacement

From inside your repo folder on Windows:

```powershell
Remove-Item .\index.html -Force -ErrorAction SilentlyContinue
Remove-Item .\css -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item .\js -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item .\NEW-FOLDER\index.html .\index.html
Copy-Item .\NEW-FOLDER\css -Destination .\css -Recurse
Copy-Item .\NEW-FOLDER\js -Destination .\js -Recurse
Copy-Item .\NEW-FOLDER\README.md .\README.md

git add .
git commit -m "refactor: upgrade to stable multi-file app"
git push
```

## Notes

This is not a mathematically exact full-song Fourier reconstruction. It is a browser-safe, visually interesting approximation meant for demos, portfolios, and experimentation.
