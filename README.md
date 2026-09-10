# Cutwise

Cutwise is an OpusClip-style MVP for turning long-form video links into ranked, editable social clips. It includes account creation, per-account project storage, URL ingestion, eight platform-aware playable MP4 clips, deterministic highlight scoring, caption generation/editing, direct-video preview, aspect-ratio controls, and MP4 download.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Choose **Try with a sample video** for a source that can be previewed directly in the browser.

Accounts and sessions are stored in browser `localStorage` for this frontend MVP. Name, email, phone number, generated clips, and edits persist on the same browser and are separated by account. Production authentication should move these records to a secure server-side database and add verified credentials.

## Commands

```bash
npm run test
npm run typecheck
npm run build
```

## Production media boundary

The included Express media service downloads authorised public sources and renders eight MP4 files using bundled FFmpeg. Generated media is stored under the ignored `storage/media` directory and served at `/media`.

To make the media pipeline production-ready:

1. Move synchronous rendering from the included local API into a durable job queue.
2. Use an authorised provider API or direct upload to acquire source media in deployed environments.
3. Transcribe with a speech-to-text provider and replace `analyzeVideo` in `src/lib/analysis.ts` with transcript-window scoring.
4. Burn edited captions into final exports in a render worker.
5. Replace `src/lib/accounts.ts` with authenticated server endpoints and persist users, projects, and output assets in a database/object store.

The local media service accepts direct public media URLs and YouTube/Vimeo pages. Only process media you own or are authorised to download and repurpose.
