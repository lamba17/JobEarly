# JobEarly launch promo

HyperFrames composition for a 9:16 Instagram promo (1080x1920, 30 fps, 35 s).

- `index.html`: the composition (scenes, camera moves, captions, end card)
- `screens/`: screenshots captured from this repo's landing page, cropped and otherwise unedited
- `audio/track.m4a`: background music (120 BPM); `beats/` holds the detected beat grid
- `renders/jobearly-promo-9x16.mp4`: the rendered video

Re-render with `npx hyperframes@0.8.163 render --fps 30 --quality delivery -o renders/jobearly-promo-9x16.mp4`
(needs ffmpeg and `npx hyperframes browser ensure`).
