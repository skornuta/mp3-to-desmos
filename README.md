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


## Notes

This is not a mathematically exact full-song Fourier reconstruction. It is a browser-safe, visually interesting approximation meant for demos, portfolios, and experimentation.
