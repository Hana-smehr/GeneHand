# GeneHand

Control 3D DNA and protein structures with your bare hands, using only a webcam and a browser.

**Live demo:** https://hana-smehr.github.com/GeneHand/ (allow camera access)

> Work in progress. Built as a learning project at the intersection of genetics and computer vision.

<!-- Add a demo GIF or screenshot here: ![demo](demo.gif) -->

## What it does

- Loads a molecular structure from the [RCSB Protein Data Bank](https://www.rcsb.org/) (default: `1BNA`, a DNA double helix) and renders it in 3D.
- Tracks your hand through the webcam and turns gestures into view controls. Everything runs locally in the browser; no video is uploaded.

## Gestures

| Gesture | Action |
| --- | --- |
| Pinch (thumb + index) and move one hand | Rotate the molecule |
| Two hands in view, move them apart or together | Zoom in / out |

## Tech stack

- [MediaPipe Hand Landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker) for 21-point hand tracking
- [3Dmol.js](https://3dmol.csb.pitt.edu/) for WebGL molecular rendering
- Plain JavaScript, HTML and CSS (no build step)

## Run locally

1. Clone the repo: `git clone https://github.com/hana-smehr/GeneHand.git`
2. Open the folder in VS Code and start it with the **Live Server** extension (the camera only works on `localhost` or `https`).
3. Allow camera access in your browser.

## Roadmap

- [ ] Molecule picker (DNA, hemoglobin, insulin, GFP, ...) and gesture to switch
- [ ] Smoother, calibrated gestures and an on-screen debug overlay
- [ ] Switch display style (stick / cartoon / sphere) by gesture
- [ ] Select an atom or residue by pointing and show its info
- [ ] Highlight genetic variants on protein structures

## Credits

Structures from the RCSB Protein Data Bank. Hand tracking by Google MediaPipe. Molecular graphics by 3Dmol.js (Rego & Koes, *Bioinformatics*, 2015).

## License

MIT 
