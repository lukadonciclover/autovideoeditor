import { describe, expect, it } from "vitest";
import { analyzeVideo, formatTime, isDirectVideoUrl, isValidVideoUrl } from "./analysis";

describe("video analysis", () => {
  it("validates web URLs", () => {
    expect(isValidVideoUrl("https://youtube.com/watch?v=abc")).toBe(true);
    expect(isValidVideoUrl("not a url")).toBe(false);
  });

  it("recognises direct video URLs", () => {
    expect(isDirectVideoUrl("https://cdn.example.com/video.mp4?token=1")).toBe(true);
    expect(isDirectVideoUrl("https://youtube.com/watch?v=abc")).toBe(false);
  });

  it("creates editable clips in the platform range", () => {
    const project = analyzeVideo("https://example.com/talk.mp4", "Shorts");
    expect(project.clips).toHaveLength(8);
    expect(project.clips.every((clip) => clip.end - clip.start >= 25 && clip.end - clip.start <= 60)).toBe(true);
    expect(project.clips.every((clip) => clip.captions.length > 0)).toBe(true);
  });

  it("formats timestamps", () => {
    expect(formatTime(65)).toBe("1:05");
    expect(formatTime(3661)).toBe("1:01:01");
  });
});
