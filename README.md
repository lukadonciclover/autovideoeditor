# Cutwise

Cutwise is an OpusClip-style MVP for turning long-form video links into ranked, editable social clips. It includes URL ingestion, platform-aware clip lengths, deterministic highlight scoring, caption generation/editing, direct-video preview, aspect-ratio controls, and render-manifest export.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Choose **Try with a sample video** for a source that can be previewed directly in the browser.

## Commands

```bash
npm run test
npm run typecheck
npm run build
```

## Production media boundary

This repository implements the complete product workflow and an in-browser analysis adapter. It does not download hosted-platform videos or render MP4s in the browser. The exported JSON is an explicit render specification intended for an asynchronous worker.

To make the media pipeline production-ready:

1. Add a server endpoint that accepts the source URL and enqueues a job.
2. Use an authorised provider API or direct upload to acquire source media.
3. Transcribe with a speech-to-text provider and replace `analyzeVideo` in `src/lib/analysis.ts` with transcript-window scoring.
4. Render the exported timing, ratio, and captions with FFmpeg in a worker.
5. Persist projects and output assets in a database/object store.

Platform pages are accepted as project sources, but only direct `.mp4`, `.webm`, `.ogg`, and `.mov` links can be previewed by the browser MVP.
