"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import type { KnowledgeBaseDocument } from "@/lib/knowledgeBase/knowledgeBaseReader";

type RetrievalStep =
  | "VALIDATING_QUERY"
  | "LOADING_KB"
  | "SCORING_DOCUMENTS"
  | "BUILDING_SNIPPETS"
  | "GENERATING_ANSWER"
  | "DONE";

type RetrievalMatch = {
  docId: string;
  title: string;
  relativePath: string;
  score: number;
  snippet: string;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  sources?: RetrievalMatch[];
};

type Props = {
  docs: KnowledgeBaseDocument[];
};

type AnswerApiResponse =
  | {
      ok: true;
      steps: RetrievalStep[];
      query: string;
      results: RetrievalMatch[];
      answer: string;
    }
  | {
      ok: false;
      errorMessage?: string;
    };

const QUICK_COMMANDS = [
  "Give me a quick intro to Harel Fogel in 5 bullets.",
  "How does the click pacing system handle concurrency safely?",
  "Walk me through GoodTok and why it was built.",
  "What is the strongest backend + AWS project here?",
  "What makes Harel strong as a full-stack engineer?",
];

const INTRO_SCRIPT = [
  "booting harel-fogel portfolio...",
  "loading projects, experience, and architecture decisions",
  "connecting AI assistant to verified portfolio knowledge",
  "enabling guided Q&A and deep technical answers",
  "portfolio ready",
];

const USER_ACTIONS = [
  "Start with a quick summary to understand the full profile fast",
  "Open any project and ask about architecture decisions and trade-offs",
  "Use guided prompts to inspect backend, AWS, and full-stack depth",
  "Ask follow-ups naturally, like you would in ChatGPT",
];

const WELCOME_MESSAGE = `Harel Fogel | AI Portfolio Assistant

This is Harel Fogel's interactive portfolio.
Use it like a conversation with an AI assistant.

Start here:
1. Pick a suggested prompt
2. Ask follow-up questions
3. Open source context on the right panel

Coverage includes:
- production distributed systems and AWS infrastructure
- full-stack delivery across React, NestJS, FastAPI, and data layers
- GoodTok (AI newsletter platform) backend + frontend projects
- technical decision making and team-level impact`;

function getDocPreview(content: string, maxLines = 14): string {
  const lines = content
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);

  return lines.slice(0, maxLines).join("\n");
}

function formatStep(step: RetrievalStep): string {
  return step
    .toLowerCase()
    .split("_")
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
    .join(" ");
}

export default function PortfolioIDE({ docs }: Props) {
  const [showIntro, setShowIntro] = useState(true);
  const [introLineIndex, setIntroLineIndex] = useState(0);
  const [introCharIndex, setIntroCharIndex] = useState(0);
  const [introDone, setIntroDone] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const [selectedDocId, setSelectedDocId] = useState<string | null>(
    docs[0]?.id ?? null,
  );
  const [lastSteps, setLastSteps] = useState<RetrievalStep[]>([]);
  const [activeSources, setActiveSources] = useState<RetrievalMatch[]>([]);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const selectedDoc =
    docs.find((doc) => doc.id === selectedDocId) ?? docs[0] ?? null;

  const openTabs = [
    "chat.session.ts",
    selectedDoc?.relativePath ?? "knowledge-base.md",
    "assistant.trace.log",
  ];

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior });
  }, []);

  const updateScrollState = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    const isNearBottom = distanceFromBottom < 88;

    shouldAutoScrollRef.current = isNearBottom;
    setShowJumpToLatest(!isNearBottom);
  }, []);

  useEffect(() => {
    if (!shouldAutoScrollRef.current) return;
    const behavior: ScrollBehavior = messages.length > 0 ? "smooth" : "auto";
    const raf = requestAnimationFrame(() => scrollToBottom(behavior));
    return () => cancelAnimationFrame(raf);
  }, [messages, isLoading, scrollToBottom]);

  useEffect(() => {
    if (showIntro) return;
    const raf = requestAnimationFrame(() => scrollToBottom("auto"));
    return () => cancelAnimationFrame(raf);
  }, [showIntro, scrollToBottom]);

  useEffect(() => {
    if (!showIntro || introDone) return;

    const activeLine = INTRO_SCRIPT[introLineIndex];
    const isAtLineEnd = introCharIndex >= activeLine.length;
    const delay = isAtLineEnd ? 220 : introCharIndex === 0 ? 260 : 22;

    const timer = setTimeout(() => {
      if (introCharIndex < activeLine.length) {
        setIntroCharIndex((prev) => prev + 1);
        return;
      }

      if (introLineIndex < INTRO_SCRIPT.length - 1) {
        setIntroLineIndex((prev) => prev + 1);
        setIntroCharIndex(0);
        return;
      }

      setIntroDone(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [showIntro, introDone, introLineIndex, introCharIndex]);

  useEffect(() => {
    if (showIntro) return;
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 120);
    return () => clearTimeout(timer);
  }, [showIntro]);

  useEffect(() => {
    function handleGlobalShortcut(event: KeyboardEvent) {
      if (showIntro) {
        if (event.key === "Escape") {
          setShowIntro(false);
          setIntroDone(true);
        }
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }

      if (event.key === "Escape") {
        setCommandPaletteOpen(false);
        setSidebarOpen(false);
        setContextOpen(false);
      }
    }

    window.addEventListener("keydown", handleGlobalShortcut);
    return () => window.removeEventListener("keydown", handleGlobalShortcut);
  }, [showIntro]);

  async function sendMessage(query: string) {
    if (!query.trim() || isLoading) return;

    const trimmed = query.trim();

    shouldAutoScrollRef.current = true;
    setShowJumpToLatest(false);

    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    setIsLoading(true);
    setCommandPaletteOpen(false);

    try {
      const res = await fetch("/api/studio/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed }),
      });

      const data = (await res.json()) as AnswerApiResponse;

      if (!data.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.errorMessage || "Something went wrong.",
            sources: [],
          },
        ]);
        setLastSteps([]);
        setActiveSources([]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer, sources: data.results },
      ]);

      setLastSteps(data.steps);
      setActiveSources(data.results);

      if (data.results[0]) {
        setSelectedDocId(data.results[0].docId);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Network error. Please try again.",
          sources: [],
        },
      ]);
      setLastSteps([]);
      setActiveSources([]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  function handlePromptClick(prompt: string) {
    sendMessage(prompt);
  }

  const introLines = introDone
    ? INTRO_SCRIPT
    : [
        ...INTRO_SCRIPT.slice(0, introLineIndex),
        INTRO_SCRIPT[introLineIndex]?.slice(0, introCharIndex) ?? "",
      ];

  return (
    <div className="h-[100dvh] min-h-[100dvh] overflow-hidden bg-[var(--ide-bg)] text-[var(--ide-fg)]">
      <div className="ide-shell relative flex h-full flex-col border border-[var(--ide-border)] bg-[var(--ide-panel)]/95">
        {showIntro && (
          <div className="absolute inset-0 z-50 overflow-y-auto bg-[rgb(4_10_18/96%)] p-4 md:p-8">
            <div className="mx-auto flex min-h-full w-full max-w-5xl items-center">
              <div className="grid w-full gap-4 md:grid-cols-2 md:gap-6">
                <section className="rounded-2xl border border-[var(--ide-border)] bg-[var(--ide-panel-strong)]/95 p-4 md:p-6">
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--ide-fg-muted)]">
                    Portfolio Boot Sequence
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold text-[var(--ide-fg)] md:text-3xl">
                    Harel Fogel Portfolio
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--ide-fg-dim)]">
                    A modern interactive portfolio designed to showcase real
                    engineering depth in a friendly and approachable experience.
                  </p>

                  <div className="mt-4 rounded-xl border border-[var(--ide-border)] bg-[var(--ide-bg)] p-3 font-mono text-xs text-[var(--ide-fg-dim)] md:text-sm">
                    {introLines.map((line, index) => (
                      <p key={`${line}-${index}`} className="mb-1">
                        <span className="mr-2 text-[var(--ide-accent)]">
                          {">"}
                        </span>
                        {line}
                        {index === introLines.length - 1 && !introDone && (
                          <span className="intro-caret" />
                        )}
                      </p>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => setShowIntro(false)}
                      className="rounded-md border border-[var(--ide-accent)] bg-[var(--ide-selection)] px-3 py-1.5 font-mono text-xs text-[var(--ide-fg)] transition hover:brightness-110"
                    >
                      {introDone ? "Enter Portfolio" : "Skip Intro"}
                    </button>
                    <button
                      onClick={() => {
                        setShowIntro(false);
                        handlePromptClick(QUICK_COMMANDS[0]);
                      }}
                      className="rounded-md border border-[var(--ide-border)] bg-[var(--ide-panel)] px-3 py-1.5 font-mono text-xs text-[var(--ide-fg-dim)] transition hover:border-[var(--ide-accent)] hover:text-[var(--ide-fg)]"
                    >
                      Start With Guided Intro
                    </button>
                    {!introDone && (
                      <span className="rounded-md border border-[var(--ide-border)] bg-[var(--ide-panel)] px-3 py-1.5 font-mono text-xs text-[var(--ide-fg-muted)]">
                        Typing sequence in progress...
                      </span>
                    )}
                  </div>
                </section>

                <section className="rounded-2xl border border-[var(--ide-border)] bg-[var(--ide-panel)]/95 p-4 md:p-6">
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--ide-fg-muted)]">
                    What To Do First
                  </p>
                  <div className="mt-3 space-y-2">
                    {USER_ACTIONS.map((item, index) => (
                      <div
                        key={item}
                        className="rounded-lg border border-[var(--ide-border)] bg-[var(--ide-panel-strong)] px-3 py-2"
                      >
                        <p className="text-sm leading-relaxed text-[var(--ide-fg-dim)]">
                          <span className="mr-2 font-mono text-[var(--ide-accent)]">
                            {index + 1}.
                          </span>
                          {item}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-xl border border-[var(--ide-border)] bg-[var(--ide-bg)] p-3">
                    <p className="font-mono text-[11px] text-[var(--ide-fg-muted)]">
                      Recommended first prompts
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {QUICK_COMMANDS.slice(0, 3).map((prompt) => (
                        <button
                          key={`intro-${prompt}`}
                          onClick={() => {
                            setShowIntro(false);
                            handlePromptClick(prompt);
                          }}
                          className="rounded-md border border-[var(--ide-border)] bg-[var(--ide-panel)] px-2.5 py-1.5 text-left text-xs text-[var(--ide-fg-dim)] transition hover:border-[var(--ide-accent)] hover:text-[var(--ide-fg)]"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}

        <header className="flex h-12 shrink-0 items-center gap-3 border-b border-[var(--ide-border)] bg-[var(--ide-panel-strong)] px-3 md:px-4">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ed6a5e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#f4bf4f]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#62c454]" />
          </div>

          <span className="truncate font-mono text-xs text-[var(--ide-fg-dim)] md:text-sm">
            harel-fogel.com / portfolio-assistant
          </span>

          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="ml-auto hidden w-64 items-center justify-between rounded-md border border-[var(--ide-border)] bg-[var(--ide-panel)] px-3 py-1.5 font-mono text-[11px] text-[var(--ide-fg-muted)] transition hover:border-[var(--ide-accent)] md:flex"
          >
            <span>Run command or ask...</span>
            <span>Ctrl/Cmd + K</span>
          </button>

          <div className="ml-auto flex items-center gap-2 md:hidden">
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="rounded border border-[var(--ide-border)] bg-[var(--ide-panel)] px-2 py-1 font-mono text-[11px] text-[var(--ide-fg-dim)]"
              aria-label="Open ask panel"
            >
              Ask
            </button>
            <button
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="rounded border border-[var(--ide-border)] bg-[var(--ide-panel)] px-2 py-1 font-mono text-[11px] text-[var(--ide-fg-dim)]"
              aria-label="Toggle explorer"
            >
              Explorer
            </button>
            <button
              onClick={() => setContextOpen((prev) => !prev)}
              className="rounded border border-[var(--ide-border)] bg-[var(--ide-panel)] px-2 py-1 font-mono text-[11px] text-[var(--ide-fg-dim)]"
              aria-label="Toggle context panel"
            >
              Context
            </button>
          </div>
        </header>

        {commandPaletteOpen && (
          <div className="absolute inset-0 z-40 flex items-start justify-center bg-black/65 p-3 pt-12 md:p-4 md:pt-16">
            <div className="w-full max-w-2xl rounded-xl border border-[var(--ide-border)] bg-[var(--ide-panel-strong)] p-3 shadow-2xl">
              <div className="mb-3 flex items-center gap-2 rounded-md border border-[var(--ide-border)] bg-[var(--ide-panel)] px-3 py-2">
                <span className="font-mono text-xs text-[var(--ide-accent)]">
                  &gt;
                </span>
                <input
                  autoFocus
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      sendMessage(input);
                    }
                  }}
                  placeholder="Ask about Harel architecture, projects, and impact..."
                  className="w-full bg-transparent text-sm text-[var(--ide-fg)] outline-none placeholder:text-[var(--ide-fg-muted)]"
                />
              </div>

              <p className="px-1 pb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--ide-fg-muted)]">
                Suggested
              </p>
              <div className="space-y-1">
                {QUICK_COMMANDS.map((prompt) => (
                  <button
                    key={`palette-${prompt}`}
                    onClick={() => handlePromptClick(prompt)}
                    className="flex w-full items-center justify-between rounded-md border border-transparent px-2 py-2 text-left text-sm text-[var(--ide-fg-dim)] transition hover:border-[var(--ide-border)] hover:bg-[var(--ide-hover)] hover:text-[var(--ide-fg)]"
                  >
                    <span className="truncate">{prompt}</span>
                    <span className="font-mono text-[10px] text-[var(--ide-fg-muted)]">
                      run
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="relative flex min-h-0 flex-1">
          {(sidebarOpen || contextOpen) && (
            <button
              className="absolute inset-0 z-20 bg-black/40 md:hidden"
              onClick={() => {
                setSidebarOpen(false);
                setContextOpen(false);
              }}
              aria-label="Close side panels"
            />
          )}

          <nav className="hidden w-12 shrink-0 border-r border-[var(--ide-border)] bg-[var(--ide-panel-strong)] md:flex md:flex-col md:items-center md:gap-2 md:py-3">
            <ActivityIcon label="Files" active />
            <ActivityIcon label="Search" />
            <ActivityIcon label="Chat" />
            <ActivityIcon label="Git" />
            <ActivityIcon label="Run" />
          </nav>

          <aside
            className={`absolute left-0 z-30 h-full w-[88vw] max-w-72 border-r border-[var(--ide-border)] bg-[var(--ide-panel)] transition-transform duration-200 md:relative md:z-0 md:w-72 md:translate-x-0 ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="border-b border-[var(--ide-border)] px-4 py-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--ide-fg-muted)]">
                Profile
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--ide-fg)]">
                Harel Fogel
              </p>
              <p className="text-xs text-[var(--ide-fg-dim)]">
                Full Stack Engineer
              </p>
            </div>

            <div className="border-b border-[var(--ide-border)] p-4">
              <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--ide-fg-muted)]">
                Quick Links
              </p>
              <div className="space-y-1">
                <SidebarLink href="mailto:fogell06@gmail.com" label="Email" />
                <SidebarLink
                  href="/api/resume"
                  label="Download CV"
                  download
                />
                <SidebarLink
                  href="https://www.linkedin.com/in/harel-fogel/"
                  label="LinkedIn"
                  external
                />
                <SidebarLink
                  href="https://github.com/harelfogel"
                  label="GitHub"
                  external
                />
              </div>
            </div>

            <div className="min-h-0 p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--ide-fg-muted)]">
                  Explorer
                </p>
                <span className="font-mono text-[10px] text-[var(--ide-fg-muted)]">
                  {docs.length} docs
                </span>
              </div>

              <div className="space-y-1 overflow-y-auto">
                {docs.map((doc) => {
                  const isActive = doc.id === selectedDoc?.id;
                  return (
                    <button
                      key={doc.id}
                      onClick={() => {
                        setSelectedDocId(doc.id);
                        setSidebarOpen(false);
                      }}
                      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
                        isActive
                          ? "bg-[var(--ide-selection)] text-[var(--ide-fg)]"
                          : "text-[var(--ide-fg-dim)] hover:bg-[var(--ide-hover)] hover:text-[var(--ide-fg)]"
                      }`}
                      title={doc.relativePath}
                    >
                      <span className="font-mono text-[10px] text-[var(--ide-fg-muted)]">
                        md
                      </span>
                      <span className="truncate">{doc.relativePath}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          <main className="flex min-w-0 flex-1 flex-col bg-[var(--ide-bg)]/80">
            <div className="flex h-10 shrink-0 items-center gap-1 overflow-x-auto border-b border-[var(--ide-border)] bg-[var(--ide-panel-strong)] px-2 md:px-3">
              {openTabs.map((tab, index) => (
                <button
                  key={tab}
                  className={`shrink-0 rounded-t-md border px-3 py-1 font-mono text-xs ${
                    index === 0
                      ? "border-[var(--ide-border)] border-b-transparent bg-[var(--ide-panel)] text-[var(--ide-fg)]"
                      : "border-transparent text-[var(--ide-fg-muted)] hover:text-[var(--ide-fg-dim)]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div
              ref={messagesContainerRef}
              onScroll={updateScrollState}
              className="chat-scroll relative flex-1 overflow-y-auto p-3 md:p-6"
            >
              {messages.length === 0 && (
                <div className="mx-auto max-w-3xl animate-[fade-in_280ms_ease-out]">
                  <div className="rounded-xl border border-[var(--ide-border)] bg-[var(--ide-panel)]/70 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
                    <div className="terminal-markdown whitespace-pre-line font-mono text-sm leading-relaxed text-[var(--ide-fg-dim)]">
                      {WELCOME_MESSAGE}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {QUICK_COMMANDS.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => handlePromptClick(prompt)}
                        className="rounded-md border border-[var(--ide-border)] bg-[var(--ide-panel)] px-3 py-1.5 text-xs text-[var(--ide-fg-dim)] transition hover:border-[var(--ide-accent)] hover:text-[var(--ide-fg)]"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, index) => (
                <div key={index} className="mx-auto mb-5 max-w-3xl">
                  {msg.role === "user" ? (
                    <div className="rounded-xl border border-[var(--ide-border)] bg-[var(--ide-panel)]/80 px-4 py-3">
                      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ide-fg-muted)]">
                        You
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-[var(--ide-fg)]">
                        {msg.content}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-[var(--ide-border)] bg-[var(--ide-panel)]/85 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ide-accent)]">
                          Assistant
                        </p>
                        {msg.sources && msg.sources.length > 0 && (
                          <span className="rounded border border-[var(--ide-border)] bg-[var(--ide-panel-strong)] px-2 py-0.5 font-mono text-[10px] text-[var(--ide-fg-muted)]">
                            {msg.sources.length} source
                            {msg.sources.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <div className="terminal-markdown prose prose-invert prose-sm max-w-none text-[var(--ide-fg-dim)]">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="mx-auto max-w-3xl">
                  <div className="space-y-3 rounded-xl border border-[var(--ide-border)] bg-[var(--ide-panel)]/85 px-4 py-3">
                    <div className="flex items-center gap-2 font-mono text-sm text-[var(--ide-fg-dim)]">
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="ml-1">Analyzing knowledge base...</span>
                    </div>
                    <div className="space-y-1 font-mono text-[11px] text-[var(--ide-fg-muted)]">
                      <p>Retrieving relevant sources</p>
                      <p>Composing grounded answer</p>
                    </div>
                  </div>
                </div>
              )}

              {showJumpToLatest && (
                <button
                  onClick={() => {
                    shouldAutoScrollRef.current = true;
                    setShowJumpToLatest(false);
                    scrollToBottom("smooth");
                  }}
                  className="sticky bottom-3 z-10 ml-auto mr-1 block rounded-md border border-[var(--ide-accent)] bg-[var(--ide-panel-strong)] px-3 py-1.5 font-mono text-xs text-[var(--ide-fg)] shadow-lg transition hover:brightness-110"
                >
                  Jump to latest
                </button>
              )}
            </div>

            <div className="shrink-0 border-t border-[var(--ide-border)] bg-[var(--ide-panel-strong)]/95 p-3 pb-[env(safe-area-inset-bottom)] md:p-4">
              <form
                onSubmit={handleSubmit}
                className="mx-auto max-w-3xl rounded-lg border border-[var(--ide-border)] bg-[var(--ide-panel)] p-3"
              >
                <label htmlFor="portfolio-chat" className="sr-only">
                  Ask about Harel
                </label>
                <textarea
                  id="portfolio-chat"
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(input);
                    }
                  }}
                  placeholder="Ask about Harel projects, architecture, and impact..."
                  disabled={isLoading}
                  rows={2}
                  className="w-full resize-none bg-transparent text-sm leading-relaxed text-[var(--ide-fg)] outline-none placeholder:text-[var(--ide-fg-muted)]"
                />

                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-mono text-[11px] text-[var(--ide-fg-muted)]">
                    <span className="rounded border border-[var(--ide-border)] bg-[var(--ide-panel-strong)] px-2 py-0.5">
                      Enter send
                    </span>
                    <span className="rounded border border-[var(--ide-border)] bg-[var(--ide-panel-strong)] px-2 py-0.5">
                      Shift+Enter newline
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="rounded border border-[var(--ide-border)] bg-[var(--ide-panel-strong)] px-3 py-1.5 font-mono text-xs text-[var(--ide-fg-dim)] transition hover:border-[var(--ide-accent)] hover:text-[var(--ide-fg)] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Send
                  </button>
                </div>
              </form>
            </div>
          </main>

          <aside
            className={`absolute right-0 z-30 h-full w-[88vw] max-w-80 border-l border-[var(--ide-border)] bg-[var(--ide-panel)] transition-transform duration-200 md:relative md:z-0 md:w-80 md:translate-x-0 ${
              contextOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="border-b border-[var(--ide-border)] p-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--ide-fg-muted)]">
                AI Context
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--ide-fg)]">
                {selectedDoc?.title ?? "No document selected"}
              </p>
              <p className="mt-1 font-mono text-xs text-[var(--ide-fg-muted)]">
                {selectedDoc?.relativePath ?? "knowledge-base"}
              </p>

              {selectedDoc && (
                <button
                  onClick={() =>
                    handlePromptClick(
                      `Explain ${selectedDoc.title} as if you are speaking to a technical hiring manager.`,
                    )
                  }
                  className="mt-3 rounded border border-[var(--ide-border)] bg-[var(--ide-panel-strong)] px-2.5 py-1.5 font-mono text-xs text-[var(--ide-fg-dim)] transition hover:border-[var(--ide-accent)] hover:text-[var(--ide-fg)]"
                >
                  Ask About This File
                </button>
              )}
            </div>

            <div className="space-y-4 overflow-y-auto p-4">
              <div>
                <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--ide-fg-muted)]">
                  Retrieval Steps
                </p>
                <div className="space-y-1.5">
                  {lastSteps.length === 0 ? (
                    <p className="rounded-md border border-[var(--ide-border)] bg-[var(--ide-panel-strong)] p-2 text-xs text-[var(--ide-fg-muted)]">
                      No run yet.
                    </p>
                  ) : (
                    lastSteps.map((step) => (
                      <p
                        key={step}
                        className="rounded-md border border-[var(--ide-border)] bg-[var(--ide-panel-strong)] p-2 font-mono text-xs text-[var(--ide-fg-dim)]"
                      >
                        {formatStep(step)}
                      </p>
                    ))
                  )}
                </div>
              </div>

              <div>
                <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--ide-fg-muted)]">
                  Top Sources
                </p>
                <div className="space-y-2">
                  {activeSources.length === 0 ? (
                    <p className="rounded-md border border-[var(--ide-border)] bg-[var(--ide-panel-strong)] p-2 text-xs text-[var(--ide-fg-muted)]">
                      Ask a question to see source grounding.
                    </p>
                  ) : (
                    activeSources.map((source) => (
                      <button
                        key={source.docId}
                        onClick={() => setSelectedDocId(source.docId)}
                        className="w-full rounded-md border border-[var(--ide-border)] bg-[var(--ide-panel-strong)] p-2 text-left text-xs transition hover:border-[var(--ide-accent)]"
                      >
                        <p className="font-medium text-[var(--ide-fg)]">
                          {source.title}
                          <span className="ml-1 font-mono text-[10px] text-[var(--ide-fg-muted)]">
                            {source.score}
                          </span>
                        </p>
                        <p className="font-mono text-[10px] text-[var(--ide-fg-muted)]">
                          {source.relativePath}
                        </p>
                        <p className="snippet-clamp mt-1 text-[var(--ide-fg-dim)]">
                          {source.snippet}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div>
                <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--ide-fg-muted)]">
                  Selected Preview
                </p>
                <pre className="max-h-60 overflow-auto rounded-md border border-[var(--ide-border)] bg-[var(--ide-panel-strong)] p-3 font-mono text-xs leading-relaxed text-[var(--ide-fg-dim)]">
                  {selectedDoc
                    ? getDocPreview(selectedDoc.content)
                    : "No preview available."}
                </pre>
              </div>
            </div>
          </aside>
        </div>

        <footer className="hidden h-6 shrink-0 items-center gap-3 border-t border-[var(--ide-border)] bg-[var(--ide-panel-strong)] px-4 font-mono text-[11px] text-[var(--ide-fg-muted)] md:flex">
          <span className="text-emerald-400">ready</span>
          <span>main</span>
          <span>TypeScript</span>
          <span>{docs.length} knowledge docs</span>
          <span className="ml-auto">harel fogel portfolio</span>
        </footer>
      </div>
    </div>
  );
}

function ActivityIcon({
  label,
  active = false,
}: {
  label: string;
  active?: boolean;
}) {
  return (
    <button
      className={`h-8 w-8 rounded border text-[10px] font-mono transition ${
        active
          ? "border-[var(--ide-accent)] bg-[var(--ide-selection)] text-[var(--ide-fg)]"
          : "border-transparent text-[var(--ide-fg-muted)] hover:border-[var(--ide-border)] hover:text-[var(--ide-fg-dim)]"
      }`}
      aria-label={label}
      title={label}
    >
      {label.slice(0, 2)}
    </button>
  );
}

function SidebarLink({
  href,
  label,
  external,
  download,
}: {
  href: string;
  label: string;
  external?: boolean;
  download?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      download={download || undefined}
      className="flex items-center justify-between rounded-md px-2 py-1.5 font-mono text-xs text-[var(--ide-fg-dim)] transition-colors hover:bg-[var(--ide-hover)] hover:text-[var(--ide-fg)]"
    >
      <span>{label}</span>
      <span className="text-[var(--ide-fg-muted)]">
        {external ? "ext" : "open"}
      </span>
    </a>
  );
}
