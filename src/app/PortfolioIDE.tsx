"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import type { KnowledgeBaseDocument } from "@/lib/knowledgeBase/knowledgeBaseReader";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Props = {
  docs: KnowledgeBaseDocument[];
};

const SUGGESTED_PROMPTS = [
  "Tell me about the click pacing infrastructure",
  "What's your experience with AWS?",
  "What did you build at Thing or Two?",
  "What's your strongest technical skill?",
  "Walk me through a challenging project",
];

const WELCOME_MESSAGE = `Welcome to Harel Fogel's interactive portfolio.

I'm a Full Stack Engineer specializing in React, TypeScript, NestJS, and AWS infrastructure.

You can ask me anything about:
- My experience at Thing or Two, Coretigo, and Atomation
- The distributed click pacing infrastructure I built
- My tech stack and skills
- My projects and education

Try one of the suggested questions below, or ask your own!`;

export default function PortfolioIDE({ docs }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  async function sendMessage(query: string) {
    if (!query.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: query.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/studio/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });

      const data = await res.json();

      const assistantMessage: Message = {
        role: "assistant",
        content: data.ok
          ? data.answer
          : data.errorMessage || "Something went wrong.",
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Network error. Please try again." },
      ]);
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

  return (
    <div className="flex h-screen flex-col bg-zinc-950 font-mono text-zinc-300">
      {/* Title Bar */}
      <div className="flex h-11 shrink-0 items-center gap-3 border-b border-zinc-800 bg-zinc-900 px-4">
        <div className="flex gap-2">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>
        <span className="text-sm text-zinc-400">
          harel-fogel — portfolio
        </span>
        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="ml-auto text-zinc-500 hover:text-zinc-300 md:hidden"
          aria-label="Toggle sidebar"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        </button>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } absolute z-10 h-[calc(100vh-2.75rem)] w-64 shrink-0 overflow-y-auto border-r border-zinc-800 bg-zinc-900 transition-transform md:relative md:translate-x-0 md:h-auto`}
        >
          {/* Profile */}
          <div className="border-b border-zinc-800 p-4">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
              Profile
            </p>
            <p className="text-sm font-semibold text-zinc-100">Harel Fogel</p>
            <p className="text-xs text-zinc-500">Full Stack Engineer</p>
          </div>

          {/* Actions */}
          <div className="border-b border-zinc-800 p-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
              Actions
            </p>
            <div className="flex flex-col gap-1.5">
              <SidebarLink
                href="mailto:fogell06@gmail.com"
                icon="✉"
                label="Email"
              />
              <SidebarLink
                href="/harel-fogel-cv.pdf"
                icon="📄"
                label="Download CV"
                download
              />
              <SidebarLink
                href="https://www.linkedin.com/in/harel-fogel/"
                icon="🔗"
                label="LinkedIn"
                external
              />
              <SidebarLink
                href="https://github.com/harelfogel"
                icon="🐙"
                label="GitHub"
                external
              />
            </div>
          </div>

          {/* Explorer */}
          <div className="p-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
              Explorer
            </p>
            <div className="flex flex-col gap-1">
              {docs.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => handlePromptClick(`Tell me about ${doc.title}`)}
                  className="truncate rounded px-2 py-1 text-left text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  title={doc.relativePath}
                >
                  <span className="mr-1.5 text-zinc-600">📄</span>
                  {doc.relativePath}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Panel */}
        <main className="flex min-w-0 flex-1 flex-col bg-zinc-950">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {/* Welcome */}
            {messages.length === 0 && (
              <div className="mx-auto max-w-2xl">
                <div className="mb-6 rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
                  <div className="terminal-markdown whitespace-pre-line text-sm text-zinc-300">
                    {WELCOME_MESSAGE}
                  </div>
                </div>

                {/* Suggested Prompts */}
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handlePromptClick(prompt)}
                      className="rounded-full border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Messages */}
            {messages.map((msg, i) => (
              <div key={i} className="mx-auto mb-4 max-w-2xl">
                {msg.role === "user" ? (
                  <div className="flex gap-2">
                    <span className="shrink-0 text-green-500">❯</span>
                    <span className="text-sm text-zinc-100">{msg.content}</span>
                  </div>
                ) : (
                  <div className="mt-1 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                    <div className="terminal-markdown prose prose-invert prose-sm max-w-none text-zinc-300">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Loading */}
            {isLoading && (
              <div className="mx-auto mb-4 max-w-2xl">
                <div className="mt-1 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                  <span className="inline-flex gap-1 text-sm text-zinc-500">
                    <span className="animate-pulse">●</span>
                    <span className="animate-pulse" style={{ animationDelay: "0.2s" }}>●</span>
                    <span className="animate-pulse" style={{ animationDelay: "0.4s" }}>●</span>
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-zinc-800 bg-zinc-900/50 p-3 md:p-4">
            <form
              onSubmit={handleSubmit}
              className="mx-auto flex max-w-2xl items-center gap-2"
            >
              <span className="shrink-0 text-green-500">❯</span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything about Harel..."
                disabled={isLoading}
                className="min-w-0 flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-600 outline-none"
                autoFocus
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="shrink-0 rounded bg-zinc-700 px-3 py-1 text-xs text-zinc-300 transition-colors hover:bg-zinc-600 disabled:opacity-40"
              >
                Send
              </button>
            </form>
          </div>
        </main>
      </div>

      {/* Status Bar */}
      <div className="flex h-6 shrink-0 items-center gap-4 border-t border-zinc-800 bg-zinc-900 px-4 text-[11px] text-zinc-500">
        <span className="flex items-center gap-1">
          <span className="text-green-500">✓</span> Ready
        </span>
        <span>claude-sonnet</span>
        <span>main</span>
      </div>
    </div>
  );
}

function SidebarLink({
  href,
  icon,
  label,
  external,
  download,
}: {
  href: string;
  icon: string;
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
      className="flex items-center gap-2 rounded px-2 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
    >
      <span>{icon}</span>
      <span>{label}</span>
    </a>
  );
}
