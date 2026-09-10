import type { Platform, Project } from "../types";

const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
const UNAVAILABLE_MESSAGE = "The media processing service is unavailable. Restart the app with `npm run dev`, then try again.";

export async function parseProcessResponse(response: Response): Promise<Project> {
  const body = await response.text();
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    if (response.status === 404 || /the page c|<!doctype|<html/i.test(body)) throw new Error(UNAVAILABLE_MESSAGE);
    throw new Error(`The media service returned an invalid response (${response.status}).`);
  }

  let payload: Project | { error?: string };
  try {
    payload = JSON.parse(body) as Project | { error?: string };
  } catch {
    throw new Error(`The media service returned malformed JSON (${response.status}).`);
  }

  if (!response.ok || "error" in payload) throw new Error("error" in payload && payload.error ? payload.error : `Video processing failed (${response.status}).`);
  if (!("clips" in payload) || !Array.isArray(payload.clips)) throw new Error("The media service response did not contain any clips.");

  if (API_BASE) {
    payload.clips = payload.clips.map((clip) => ({
      ...clip,
      mediaUrl: clip.mediaUrl?.startsWith("/") ? `${API_BASE}${clip.mediaUrl}` : clip.mediaUrl,
    }));
  }
  return payload;
}

export async function processVideo(sourceUrl: string, platform: Platform): Promise<Project> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/api/projects/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceUrl, platform }),
    });
  } catch {
    throw new Error(UNAVAILABLE_MESSAGE);
  }
  return parseProcessResponse(response);
}
