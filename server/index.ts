import { spawn } from "node:child_process";
import { lookup } from "node:dns/promises";
import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import express from "express";
import ffmpegPath from "ffmpeg-static";
import ffprobe from "ffprobe-static";
import youtubeDl from "youtube-dl-exec";
import { analyzeVideo } from "../src/lib/analysis.js";
import type { AspectRatio, Platform, Project } from "../src/types.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const mediaRoot = join(root, "storage", "media");
const app = express();
const port = Number(process.env.PORT ?? 8787);
const supportedPlatforms: Platform[] = ["TikTok", "Reels", "Shorts", "LinkedIn"];

app.use(express.json({ limit: "32kb" }));
app.use("/media", express.static(mediaRoot, { maxAge: "1h", acceptRanges: true }));

function run(binary: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, args, { windowsHide: true });
    let output = "";
    let errors = "";
    child.stdout.on("data", (chunk) => { output += String(chunk); });
    child.stderr.on("data", (chunk) => { errors += String(chunk); });
    child.on("error", reject);
    child.on("close", (code) => code === 0 ? resolve(output) : reject(new Error(errors.split("\n").slice(-8).join("\n") || `Media command failed (${code})`)));
  });
}

function isPrivateAddress(address: string): boolean {
  return address === "::1" || address === "0.0.0.0" || address.startsWith("127.") || address.startsWith("10.") || address.startsWith("192.168.") || /^172\.(1[6-9]|2\d|3[01])\./.test(address) || address.startsWith("fc") || address.startsWith("fd") || address.startsWith("fe80:");
}

async function assertPublicUrl(value: string): Promise<URL> {
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Only HTTP and HTTPS video links are supported.");
  const addresses = await lookup(url.hostname, { all: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) throw new Error("Private network video URLs are not allowed.");
  return url;
}

function isHostedPlatform(url: URL): boolean {
  return /(^|\.)(youtube\.com|youtu\.be|vimeo\.com)$/.test(url.hostname.toLowerCase());
}

async function downloadSource(url: URL, outputPath: string): Promise<void> {
  if (isHostedPlatform(url)) {
    await youtubeDl.exec(url.toString(), {
      output: outputPath,
      format: "best[height<=720][ext=mp4]/best[height<=720]/best",
      noPlaylist: true,
      noWarnings: true,
      maxFilesize: "1G",
    });
    return;
  }

  const response = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(120_000) });
  if (!response.ok || !response.body) throw new Error(`Could not download the video (${response.status}).`);
  const size = Number(response.headers.get("content-length") ?? 0);
  if (size > 1_000_000_000) throw new Error("Video exceeds the 1 GB processing limit.");
  await pipeline(Readable.fromWeb(response.body), createWriteStream(outputPath));
}

async function probeDuration(sourcePath: string): Promise<number> {
  const output = await run(ffprobe.path, ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", sourcePath]);
  const duration = Number(output.trim());
  if (!Number.isFinite(duration) || duration <= 0) throw new Error("The source does not contain a readable video duration.");
  return duration;
}

function dimensions(ratio: AspectRatio): [number, number] {
  if (ratio === "1:1") return [720, 720];
  if (ratio === "16:9") return [1280, 720];
  return [720, 1280];
}

async function renderClips(project: Project, sourcePath: string, directory: string): Promise<Project> {
  const available = project.duration;
  for (const [index, clip] of project.clips.entries()) {
    const originalStart = clip.start;
    const requestedDuration = clip.end - clip.start;
    const clipDuration = Math.min(requestedDuration, available);
    const maxStart = Math.max(0, available - clipDuration);
    clip.start = Math.round((maxStart * index / Math.max(1, project.clips.length - 1)) * 10) / 10;
    clip.end = Math.round((clip.start + clipDuration) * 10) / 10;
    const captionOffset = clip.start - originalStart;
    clip.captions = clip.captions.map((caption) => ({
      ...caption,
      start: Math.max(clip.start, Math.round((caption.start + captionOffset) * 10) / 10),
      end: Math.min(clip.end, Math.round((caption.end + captionOffset) * 10) / 10),
    }));
    const outputName = `clip-${index + 1}.mp4`;
    const outputPath = join(directory, outputName);
    const [width, height] = dimensions(clip.aspectRatio);
    const filter = `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}`;
    await run(ffmpegPath!, ["-y", "-ss", String(clip.start), "-i", sourcePath, "-t", String(clipDuration), "-vf", filter, "-c:v", "libx264", "-preset", "veryfast", "-crf", "25", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", outputPath]);
    clip.mediaUrl = `/media/${project.id}/${outputName}`;
  }
  return project;
}

app.post("/api/projects/process", async (request, response) => {
  try {
    const { sourceUrl, platform } = request.body as { sourceUrl?: string; platform?: Platform };
    if (!sourceUrl || !platform || !supportedPlatforms.includes(platform)) return response.status(400).json({ error: "A valid source URL and platform are required." });
    const url = await assertPublicUrl(sourceUrl);
    const project = analyzeVideo(sourceUrl, platform);
    project.id = `${project.id}-${Date.now().toString(36)}`;
    const directory = join(mediaRoot, project.id);
    await mkdir(directory, { recursive: true });
    const sourcePath = join(directory, `source${extname(url.pathname) || ".mp4"}`);
    await downloadSource(url, sourcePath);
    project.duration = await probeDuration(sourcePath);
    response.json(await renderClips(project, sourcePath, directory));
  } catch (error) {
    console.error(error);
    response.status(422).json({ error: error instanceof Error ? error.message : "Video processing failed." });
  }
});

app.use(express.static(join(root, "dist")));
app.get("/{*path}", (_request, response) => response.sendFile(join(root, "dist", "index.html")));

await mkdir(mediaRoot, { recursive: true });
app.listen(port, () => console.log(`Cutwise media service running at http://localhost:${port}`));
