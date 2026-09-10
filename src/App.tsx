import { useEffect, useRef, useState } from "react";
import {
  AlignCenter,
  ArrowLeft,
  ArrowRight,
  Captions,
  Check,
  ChevronDown,
  Download,
  Film,
  FolderOpen,
  LayoutGrid,
  Link2,
  LoaderCircle,
  LogOut,
  Pause,
  Play,
  Scissors,
  Sparkles,
  UserRound,
  WandSparkles,
  X,
  Zap,
} from "lucide-react";
import { createAccount, projectsFor, restoreSession, saveProject, signIn, signOut, validateAccount } from "./lib/accounts";
import { analyzeVideo, formatTime, isDirectVideoUrl, isValidVideoUrl, PLATFORM_LENGTHS } from "./lib/analysis";
import type { Account, AspectRatio, CaptionStyle, Clip, Platform, Project } from "./types";

const DEMO_URL = "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
const PLATFORMS: Platform[] = ["TikTok", "Reels", "Shorts", "LinkedIn"];
const STAGES = ["Reading source", "Finding high-retention moments", "Writing captions", "Scoring clips"];

function Logo() {
  return <div className="logo"><span><Scissors size={17} strokeWidth={2.8} /></span>CUTWISE</div>;
}

interface HeaderProps {
  compact?: boolean;
  account: Account | null;
  onAuth: () => void;
  onLibrary: () => void;
  onSignOut: () => void;
  onNew?: () => void;
}

function Header({ compact = false, account, onAuth, onLibrary, onSignOut, onNew }: HeaderProps) {
  return (
    <header className={compact ? "app-header compact" : "app-header"}>
      <button className="logo-button" onClick={onNew}><Logo /></button>
      {!compact && <nav><a href="#workflow">How it works</a><a href="#features">Features</a></nav>}
      {account ? <div className="account-actions"><button className="account-button" onClick={onLibrary}><span>{account.name.charAt(0).toUpperCase()}</span><b>{account.name}</b><small>{projectsFor(account.id).reduce((total, project) => total + project.clips.length, 0)} clips</small></button><button className="icon-button" onClick={onSignOut} aria-label="Sign out"><LogOut /></button></div> : <button className="ghost-button" onClick={onAuth}>Sign in</button>}
    </header>
  );
}

function AuthModal({ onClose, onAuthenticated }: { onClose: () => void; onAuthenticated: (account: Account) => void }) {
  const [mode, setMode] = useState<"create" | "signin">("create");
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [error, setError] = useState("");

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (mode === "create") {
        const validationError = validateAccount(form);
        if (validationError) return setError(validationError);
        onAuthenticated(createAccount(form));
      } else {
        if (!form.email.trim()) return setError("Enter your email address.");
        onAuthenticated(signIn(form.email));
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not access this account.");
    }
  };

  return <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Account access"><div className="auth-modal"><button className="modal-close" onClick={onClose} aria-label="Close"><X /></button><div className="auth-mark"><UserRound /></div><span className="processing-kicker">YOUR CUTWISE ACCOUNT</span><h2>{mode === "create" ? "Keep every good cut." : "Welcome back."}</h2><p>{mode === "create" ? "Create an account to store your generated clips and edits on this device." : "Sign in with the email used for your Cutwise account."}</p><div className="auth-tabs"><button className={mode === "create" ? "active" : ""} onClick={() => { setMode("create"); setError(""); }}>Create account</button><button className={mode === "signin" ? "active" : ""} onClick={() => { setMode("signin"); setError(""); }}>Sign in</button></div><form onSubmit={submit}>{mode === "create" && <label>Name<input autoFocus value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Your full name" autoComplete="name" /></label>}<label>Email<input autoFocus={mode === "signin"} type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" autoComplete="email" /></label>{mode === "create" && <label>Phone number<input type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="+1 555 012 3456" autoComplete="tel" /></label>}{error && <p className="form-error">{error}</p>}<button className="primary-button" type="submit">{mode === "create" ? "Create my account" : "Sign in"}<ArrowRight /></button></form><small>Accounts in this MVP are stored locally in your browser.</small></div></div>;
}

interface ScreenProps { account: Account | null; onAuth: () => void; onLibrary: () => void; onSignOut: () => void; onNew: () => void; }

function Landing({ onAnalyze, ...screen }: { onAnalyze: (url: string, platform: Platform) => void } & ScreenProps) {
  const [url, setUrl] = useState("");
  const [platform, setPlatform] = useState<Platform>("TikTok");
  const [error, setError] = useState("");

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!isValidVideoUrl(url)) {
      setError("Enter a complete video URL beginning with http:// or https://");
      return;
    }
    onAnalyze(url, platform);
  };

  return (
    <main className="landing">
      <Header {...screen} />
      <section className="hero">
        <div className="eyebrow"><Sparkles size={14} /> AI-POWERED VIDEO REPURPOSING</div>
        <h1>Find the moment.<br /><em>Make it move.</em></h1>
        <p className="hero-copy">Turn long conversations into sharp, captioned clips built to hold attention.</p>
        <form className="url-card" onSubmit={submit}>
          <div className="url-row">
            <Link2 size={21} />
            <input value={url} onChange={(event) => { setUrl(event.target.value); setError(""); }} placeholder="Paste a YouTube, Vimeo, or direct video link" aria-label="Video URL" />
            <button className="primary-button" type="submit">Find clips <ArrowRight size={17} /></button>
          </div>
          <div className="source-options">
            <span>Optimise for</span>
            <div className="platform-tabs">
              {PLATFORMS.map((item) => <button type="button" className={platform === item ? "active" : ""} onClick={() => setPlatform(item)} key={item}>{item}</button>)}
            </div>
            <span className="duration-label">{PLATFORM_LENGTHS[platform][0]}–{PLATFORM_LENGTHS[platform][1]} sec</span>
          </div>
          {error && <p className="form-error">{error}</p>}
        </form>
        <button className="demo-link" onClick={() => onAnalyze(DEMO_URL, platform)}><Play size={14} fill="currentColor" /> Try with a sample video</button>
      </section>

      <section className="proof-strip" aria-label="Product benefits">
        <div><strong>10×</strong><span>faster editing</span></div>
        <div><strong>8</strong><span>clips per analysis</span></div>
        <div><strong>1 click</strong><span>caption styling</span></div>
      </section>

      <section className="workflow" id="workflow">
        <div className="section-heading"><span>THE WORKFLOW</span><h2>Long video in.<br />Best moments out.</h2></div>
        <div className="steps">
          <article><b>01</b><Link2 /><h3>Drop the link</h3><p>Paste a public video URL. Cutwise prepares it for analysis.</p></article>
          <article><b>02</b><Zap /><h3>Find the spark</h3><p>Hooks, clarity, emotion, and standalone value shape every score.</p></article>
          <article><b>03</b><Captions /><h3>Make it yours</h3><p>Edit timing and captions, choose a format, then hand off to render.</p></article>
        </div>
      </section>
      <section className="feature-band" id="features"><WandSparkles /><p><strong>Not random cuts.</strong> Each candidate includes a clear reason it was chosen, editable word-level captions, and platform-aware timing.</p></section>
      <footer><Logo /><span>Built for stories worth sharing.</span></footer>
    </main>
  );
}

function Processing({ stage, ...screen }: { stage: number } & ScreenProps) {
  return (
    <main className="processing-page">
      <Header compact {...screen} />
      <section className="processing-card">
        <div className="orbit"><LoaderCircle className="spin" /><Sparkles /></div>
        <span className="processing-kicker">ANALYSING YOUR VIDEO</span>
        <h1>Looking for the moments<br />people won't scroll past.</h1>
        <div className="progress"><i style={{ width: `${((stage + 1) / STAGES.length) * 100}%` }} /></div>
        <ul>{STAGES.map((item, index) => <li className={index <= stage ? "complete" : ""} key={item}><span>{index < stage ? <Check /> : index === stage ? <LoaderCircle className="spin" /> : index + 1}</span>{item}</li>)}</ul>
      </section>
    </main>
  );
}

function ClipCard({ clip, selected, onClick }: { clip: Clip; selected: boolean; onClick: () => void }) {
  return (
    <button className={`clip-card ${selected ? "selected" : ""}`} onClick={onClick}>
      <div className="clip-thumb" style={{ "--accent": clip.color } as React.CSSProperties}>
        <div className="fake-person"><span /></div>
        <div className="thumb-caption">{clip.hook.split(" ").slice(0, 5).join(" ")}</div>
        <span className="play-dot"><Play size={13} fill="currentColor" /></span>
      </div>
      <div className="clip-info">
        <div className="score"><strong>{clip.score}</strong><span>viral score</span></div>
        <div><h3>{clip.title}</h3><p>{formatTime(clip.start)} · {Math.round(clip.end - clip.start)} sec</p></div>
      </div>
      <p className="reason"><Sparkles size={13} /> {clip.reason}</p>
    </button>
  );
}

function Results({ project, onOpen, onBack, ...screen }: { project: Project; onOpen: (clip: Clip) => void; onBack: () => void } & ScreenProps) {
  const [selected, setSelected] = useState(project.clips[0].id);
  return (
    <main className="workspace-page">
      <Header compact {...screen} />
      <section className="results-head">
        <button className="back-link" onClick={onBack}><ArrowLeft /> Projects</button>
        <div><span className="success-pill"><Check /> ANALYSIS COMPLETE</span><h1>Your video has <em>range.</em></h1><p>We found {project.clips.length} moments with strong standalone potential.</p></div>
        <button className="primary-button" onClick={() => onOpen(project.clips.find((clip) => clip.id === selected)!)}>Edit selected <ArrowRight /></button>
      </section>
      <div className="source-summary"><Film /><div><strong>{project.title}</strong><span>{formatTime(project.duration)} source · {project.clips[0].platform} optimised</span></div><div className="summary-score"><strong>{project.clips[0].score}</strong><span>top score</span></div></div>
      <section className="clips-section">
        <div className="clips-toolbar"><div><h2>Ranked moments</h2><p>Choose a clip to refine.</p></div><button className="filter-button"><LayoutGrid /> Best match <ChevronDown /></button></div>
        <div className="clip-grid">{project.clips.map((clip) => <ClipCard key={clip.id} clip={clip} selected={selected === clip.id} onClick={() => setSelected(clip.id)} />)}</div>
      </section>
    </main>
  );
}

function Library({ account, projects, onOpen, ...screen }: { account: Account; projects: Project[]; onOpen: (project: Project) => void } & Omit<ScreenProps, "account">) {
  const clipCount = projects.reduce((total, project) => total + project.clips.length, 0);
  return <main className="workspace-page"><Header compact account={account} {...screen} /><section className="library-head"><div><span className="processing-kicker">YOUR LIBRARY</span><h1>{account.name.split(" ")[0]}'s best moments.</h1><p>{clipCount} clips saved across {projects.length} {projects.length === 1 ? "project" : "projects"}.</p></div><button className="primary-button" onClick={screen.onNew}>New project <ArrowRight /></button></section><section className="library-content">{projects.length === 0 ? <div className="empty-library"><FolderOpen /><h2>No clips saved yet</h2><p>Analyse your first long-form video and all eight clips will appear here.</p><button className="primary-button" onClick={screen.onNew}>Find my first clips</button></div> : <div className="project-list">{projects.map((project) => <button className="project-row" key={project.id} onClick={() => onOpen(project)}><div className="project-icon"><Film /></div><div><h2>{project.title}</h2><p>{formatTime(project.duration)} source · {project.clips[0]?.platform}</p></div><span><strong>{project.clips.length}</strong> clips</span><ArrowRight /></button>)}</div>}<aside className="profile-card"><div className="profile-avatar">{account.name.charAt(0).toUpperCase()}</div><span>ACCOUNT DETAILS</span><h3>{account.name}</h3><p>{account.email}</p><p>{account.phone}</p><button className="ghost-button" onClick={screen.onSignOut}><LogOut /> Sign out</button></aside></section></main>;
}

function VideoPreview({ project, clip }: { project: Project; clip: Clip }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (videoRef.current) videoRef.current.currentTime = clip.start;
  }, [clip.start]);

  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play(); else video.pause();
  };

  return (
    <div className={`video-stage ratio-${clip.aspectRatio.replace(":", "-")}`}>
      {isDirectVideoUrl(project.sourceUrl) ? (
        <video ref={videoRef} src={project.sourceUrl} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onTimeUpdate={(event) => { if (event.currentTarget.currentTime >= clip.end) event.currentTarget.pause(); }} />
      ) : <div className="video-placeholder"><Film /><span>Source preview requires a direct video URL</span></div>}
      <div className={`preview-caption style-${clip.captionStyle}`}>{clip.captions[0]?.text}</div>
      <button className="preview-play" onClick={toggle}>{playing ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}</button>
    </div>
  );
}

function Editor({ project, initialClip, onBack, onUpdate }: { project: Project; initialClip: Clip; onBack: () => void; onUpdate: (clip: Clip) => void }) {
  const [clip, setClip] = useState(initialClip);
  const [exported, setExported] = useState(false);
  const duration = Math.max(5, clip.end - clip.start);

  const update = (patch: Partial<Clip>) => {
    const next = { ...clip, ...patch };
    setClip(next);
    onUpdate(next);
  };

  const exportManifest = () => {
    const spec = { version: 1, source: project.sourceUrl, projectId: project.id, clip, output: { container: "mp4", videoCodec: "h264", burnCaptions: true } };
    const file = new Blob([JSON.stringify(spec, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(file);
    link.download = `${clip.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-render.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    setExported(true);
    window.setTimeout(() => setExported(false), 2500);
  };

  return (
    <main className="editor-page">
      <header className="editor-header"><button className="back-link" onClick={onBack}><ArrowLeft /> All clips</button><Logo /><div><span className="saved"><Check /> Saved</span><button className="primary-button" onClick={exportManifest}>{exported ? <Check /> : <Download />} {exported ? "Manifest downloaded" : "Export"}</button></div></header>
      <div className="editor-layout">
        <section className="preview-panel">
          <div className="preview-top"><div><span>CLIP PREVIEW</span><h2>{clip.title}</h2></div><span className="score-chip"><Sparkles /> {clip.score} score</span></div>
          <VideoPreview project={project} clip={clip} />
          <div className="timeline">
            <div className="timeline-labels"><span>{formatTime(clip.start)}</span><strong>{Math.round(duration)} seconds</strong><span>{formatTime(clip.end)}</span></div>
            <div className="track"><i /><b style={{ left: "5%", right: "5%" }} /></div>
          </div>
        </section>
        <aside className="controls-panel">
          <div className="control-tabs"><button className="active"><Captions /> Captions</button><button><AlignCenter /> Layout</button></div>
          <section className="control-section"><label>Clip title</label><input value={clip.title} onChange={(event) => update({ title: event.target.value })} /></section>
          <section className="control-section"><div className="label-row"><label>Timing</label><span>{Math.round(duration)}s</span></div><div className="time-inputs"><label>Start<input type="number" min="0" max={clip.end - 5} value={Math.round(clip.start)} onChange={(event) => update({ start: Number(event.target.value) })} /></label><label>End<input type="number" min={clip.start + 5} max={project.duration} value={Math.round(clip.end)} onChange={(event) => update({ end: Number(event.target.value) })} /></label></div></section>
          <section className="control-section"><label>Format</label><div className="segmented">{(["9:16", "1:1", "16:9"] as AspectRatio[]).map((ratio) => <button className={clip.aspectRatio === ratio ? "active" : ""} onClick={() => update({ aspectRatio: ratio })} key={ratio}>{ratio}</button>)}</div></section>
          <section className="control-section"><label>Caption style</label><div className="style-grid">{(["bold", "minimal", "karaoke"] as CaptionStyle[]).map((style) => <button className={clip.captionStyle === style ? "active" : ""} onClick={() => update({ captionStyle: style })} key={style}><span className={`style-sample ${style}`}>Aa</span>{style}</button>)}</div></section>
          <section className="control-section captions-list"><div className="label-row"><label>Transcript</label><span>{clip.captions.length} lines</span></div>{clip.captions.map((caption) => <div className="caption-row" key={caption.id}><span>{formatTime(caption.start - clip.start)}</span><textarea value={caption.text} rows={2} onChange={(event) => update({ captions: clip.captions.map((item) => item.id === caption.id ? { ...item, text: event.target.value } : item) })} /></div>)}</section>
        </aside>
      </div>
    </main>
  );
}

export default function App() {
  const [view, setView] = useState<"landing" | "processing" | "results" | "editor" | "library">("landing");
  const [account, setAccount] = useState<Account | null>(() => restoreSession());
  const [authOpen, setAuthOpen] = useState(false);
  const [pendingAnalysis, setPendingAnalysis] = useState<{ url: string; platform: Platform } | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [activeClip, setActiveClip] = useState<Clip | null>(null);
  const [stage, setStage] = useState(0);
  const analysisTimer = useRef<number | null>(null);

  const runAnalysis = (url: string, platform: Platform, owner: Account) => {
    if (analysisTimer.current !== null) window.clearInterval(analysisTimer.current);
    setView("processing");
    setStage(0);
    let current = 0;
    analysisTimer.current = window.setInterval(() => {
      current += 1;
      if (current >= STAGES.length) {
        if (analysisTimer.current !== null) window.clearInterval(analysisTimer.current);
        analysisTimer.current = null;
        const generated = analyzeVideo(url, platform);
        setProject(generated);
        saveProject(owner.id, generated);
        setView("results");
      } else setStage(current);
    }, 620);
  };

  const startAnalysis = (url: string, platform: Platform) => {
    if (!account) {
      setPendingAnalysis({ url, platform });
      setAuthOpen(true);
      return;
    }
    runAnalysis(url, platform, account);
  };

  const handleAuthenticated = (authenticated: Account) => {
    setAccount(authenticated);
    setAuthOpen(false);
    if (pendingAnalysis) {
      runAnalysis(pendingAnalysis.url, pendingAnalysis.platform, authenticated);
      setPendingAnalysis(null);
    } else setView("library");
  };

  const handleSignOut = () => {
    if (analysisTimer.current !== null) window.clearInterval(analysisTimer.current);
    analysisTimer.current = null;
    signOut();
    setAccount(null);
    setProject(null);
    setActiveClip(null);
    setView("landing");
  };

  const screen: ScreenProps = {
    account,
    onAuth: () => setAuthOpen(true),
    onLibrary: () => account && setView("library"),
    onSignOut: handleSignOut,
    onNew: () => {
      if (analysisTimer.current !== null) window.clearInterval(analysisTimer.current);
      analysisTimer.current = null;
      setView("landing");
    },
  };

  let content: React.ReactNode;
  if (view === "processing") content = <Processing stage={stage} {...screen} />;
  else if (view === "results" && project) content = <Results project={project} onBack={() => setView("library")} onOpen={(clip) => { setActiveClip(clip); setView("editor"); }} {...screen} />;
  else if (view === "editor" && project && activeClip) content = <Editor project={project} initialClip={activeClip} onBack={() => setView("results")} onUpdate={(updated) => { const changed = { ...project, clips: project.clips.map((clip) => clip.id === updated.id ? updated : clip) }; setActiveClip(updated); setProject(changed); if (account) saveProject(account.id, changed); }} />;
  else if (view === "library" && account) content = <Library account={account} projects={projectsFor(account.id)} onOpen={(saved) => { setProject(saved); setView("results"); }} onAuth={screen.onAuth} onLibrary={screen.onLibrary} onSignOut={screen.onSignOut} onNew={screen.onNew} />;
  else content = <Landing onAnalyze={startAnalysis} {...screen} />;

  return <>{content}{authOpen && <AuthModal onClose={() => { setAuthOpen(false); setPendingAnalysis(null); }} onAuthenticated={handleAuthenticated} />}</>;
}
