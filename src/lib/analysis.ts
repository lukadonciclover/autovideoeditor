import type { Caption, Clip, Platform, Project } from "../types";

const MOMENTS = [
  {
    title: "The mistake everyone makes",
    hook: "Most people think consistency means doing more. It doesn't.",
    reason: "Contrarian opening + clear takeaway",
    words: ["Most people think consistency means doing more.", "It doesn't.", "The real advantage is removing the decisions that slow you down.", "Build a system simple enough to repeat on your worst day."],
  },
  {
    title: "A better way to start",
    hook: "If I had to begin again, I would ignore almost everything.",
    reason: "Strong curiosity gap + personal insight",
    words: ["If I had to begin again, I would ignore almost everything.", "I would choose one useful problem and solve it in public.", "Feedback beats planning when you are starting from zero.", "Your first hundred attempts are the research."],
  },
  {
    title: "The 24-hour rule",
    hook: "This one rule changed how our whole team ships work.",
    reason: "Specific framework + high share potential",
    words: ["This one rule changed how our whole team ships work.", "When an idea matters, make a rough version within twenty-four hours.", "Not because speed is everything, but because reality gives better feedback than theory.", "Make it real, then make it right."],
  },
  {
    title: "Why good ideas disappear",
    hook: "Your best idea probably won't feel like your best idea at first.",
    reason: "Pattern interrupt + memorable conclusion",
    words: ["Your best idea probably won't feel like your best idea at first.", "Useful ideas often arrive looking small and inconvenient.", "Pay attention to the problems people keep working around.", "That friction is trying to tell you something."],
  },
  {
    title: "The confidence trap",
    hook: "Confidence is usually the result, not the requirement.",
    reason: "Relatable tension + quotable insight",
    words: ["Confidence is usually the result, not the requirement.", "Waiting to feel ready keeps talented people standing still.", "Take the smallest action that creates new information.", "Clarity catches up once you begin."],
  },
  {
    title: "What growth really costs",
    hook: "Growth gets easier when you stop protecting your old identity.",
    reason: "Emotional resonance + identity shift",
    words: ["Growth gets easier when you stop protecting your old identity.", "Every new level asks you to release a habit that once kept you safe.", "That discomfort is not proof you are failing.", "It is proof the old map has ended."],
  },
  {
    title: "The simplest test",
    hook: "Here is how you know if an idea is actually useful.",
    reason: "Immediate promise + practical test",
    words: ["Here is how you know if an idea is actually useful.", "Can someone explain the result without explaining the process?", "People share outcomes they can picture clearly.", "Make the value obvious before making the solution impressive."],
  },
  {
    title: "Stop chasing motivation",
    hook: "Motivation is a terrible plan for work that matters.",
    reason: "Provocative claim + actionable ending",
    words: ["Motivation is a terrible plan for work that matters.", "Energy changes, attention drifts, and life gets noisy.", "Put the next action where you cannot miss it.", "Good environments outperform good intentions."],
  },
];

export const PLATFORM_LENGTHS: Record<Platform, [number, number]> = {
  TikTok: [20, 45],
  Reels: [20, 45],
  Shorts: [25, 60],
  LinkedIn: [30, 75],
};

export function isValidVideoUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

export function isDirectVideoUrl(value: string): boolean {
  try {
    return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(new URL(value).pathname + new URL(value).search);
  } catch {
    return false;
  }
}

function captionsFor(words: string[], start: number, duration: number, clipId: string): Caption[] {
  const slice = duration / words.length;
  return words.map((text, index) => ({
    id: `${clipId}-caption-${index}`,
    start: Math.round((start + index * slice) * 10) / 10,
    end: Math.round((start + (index + 1) * slice) * 10) / 10,
    text,
  }));
}

export function analyzeVideo(sourceUrl: string, platform: Platform): Project {
  const [min, max] = PLATFORM_LENGTHS[platform];
  const seed = [...sourceUrl].reduce((total, character) => total + character.charCodeAt(0), 0);
  const duration = 18 * 60 + (seed % 2400);
  const titleFromUrl = (() => {
    try {
      const url = new URL(sourceUrl);
      return url.hostname.replace("www.", "").split(".")[0];
    } catch {
      return "Untitled video";
    }
  })();

  const clips = MOMENTS.map((moment, index): Clip => {
    const clipDuration = min + ((seed + index * 9) % Math.max(1, max - min));
    const start = Math.round(duration * (0.06 + index * 0.115) + (seed % 37));
    const id = `clip-${seed}-${index}`;
    return {
      id,
      title: moment.title,
      hook: moment.hook,
      start,
      end: start + clipDuration,
      score: Math.min(98, 91 - index * 3 + (seed % 6)),
      reason: moment.reason,
      platform,
      aspectRatio: platform === "LinkedIn" ? "1:1" : "9:16",
      captionStyle: "bold",
      captions: captionsFor(moment.words, start, clipDuration, id),
      color: ["#d7ff3f", "#ff7557", "#91a7ff", "#e8a7ff", "#62d9c2", "#ffc857", "#7cc4ff", "#ff92b2"][index],
    };
  }).sort((a, b) => b.score - a.score);

  return {
    id: `project-${seed}`,
    title: `${titleFromUrl[0].toUpperCase()}${titleFromUrl.slice(1)} conversation`,
    sourceUrl,
    duration,
    clips,
  };
}

export function formatTime(seconds: number): string {
  const safe = Math.max(0, Math.round(seconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
    : `${minutes}:${String(secs).padStart(2, "0")}`;
}
