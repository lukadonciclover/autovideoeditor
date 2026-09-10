export type Platform = "TikTok" | "Reels" | "Shorts" | "LinkedIn";
export type AspectRatio = "9:16" | "1:1" | "16:9";
export type CaptionStyle = "bold" | "minimal" | "karaoke";

export interface Caption {
  id: string;
  start: number;
  end: number;
  text: string;
}

export interface Clip {
  id: string;
  title: string;
  hook: string;
  start: number;
  end: number;
  score: number;
  reason: string;
  platform: Platform;
  aspectRatio: AspectRatio;
  captionStyle: CaptionStyle;
  captions: Caption[];
  color: string;
}

export interface Project {
  id: string;
  title: string;
  sourceUrl: string;
  duration: number;
  clips: Clip[];
}

export interface Account {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
}

export interface AccountData {
  profile: Account;
  projects: Project[];
}
