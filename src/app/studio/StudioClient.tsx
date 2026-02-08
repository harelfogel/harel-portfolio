"use client";

import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { cx } from "@/lib/ui/classNames";

export type KnowledgeBaseDocument = {
  id: string;
  title: string;
  relativePath: string;
  content: string;
};

type StudioClientProps = {
  docs: KnowledgeBaseDocument[];
};

type UiConfig = {
  emptyStateMessage: string;
  searchPlaceholder: string;
};

const uiConfig: UiConfig = {
  emptyStateMessage: "No knowledge base documents found.",
  searchPlaceholder: "Search docs (title or path)...",
};

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

type RetrieveResponse =
  | {
      ok: true;
      steps: RetrievalStep[];
      query: string;
      results: RetrievalMatch[];
    }
  | { ok: false; errorMessage: string };

type AnswerResponse =
  | {
      ok: true;
      steps: RetrievalStep[];
      query: string;
      results: RetrievalMatch[];
      answer: string;
    }
  | { ok: false; errorMessage: string };

type ChatState =
  | { status: "idle" }
  | { status: "searching"; steps: RetrievalStep[] }
  | {
      status: "done";
      steps: RetrievalStep[];
      results: RetrievalMatch[];
      answer?: string;
    }
  | { status: "error"; errorMessage: string };

async function retrieveFromKnowledgeBase(
  query: string,
): Promise<RetrieveResponse> {
  const res = await fetch("/api/studio/retrieve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  const data = (await res.json()) as RetrieveResponse;

  if (!res.ok) {
    return data.ok ? { ok: false, errorMessage: "Request failed." } : data;
  }

  return data;
}

async function answerFromKnowledgeBase(
  query: string,
): Promise<AnswerResponse> {
  const res = await fetch("/api/studio/answer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  const data = (await res.json()) as AnswerResponse;

  if (!res.ok) {
    return data.ok ? { ok: false, errorMessage: "Request failed." } : data;
  }

  return data;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function matchesQuery(doc: KnowledgeBaseDocument, query: string): boolean {
  const q = normalize(query);
  if (!q) return true;

  return (
    normalize(doc.title).includes(q) || normalize(doc.relativePath).includes(q)
  );
}

export default function StudioClient({ docs }: StudioClientProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedDocId, setSelectedDocId] = useState<string | null>(
    docs.length > 0 ? docs[0].id : null,
  );

  const [chatInput, setChatInput] = useState<string>("");
  const [chatState, setChatState] = useState<ChatState>({ status: "idle" });

  const filteredDocs = useMemo(() => {
    return docs.filter((doc) => matchesQuery(doc, searchQuery));
  }, [docs, searchQuery]);

  const runSearch = async () => {
    const query = chatInput.trim();
    if (!query) return;

    setChatState({
      status: "searching",
      steps: ["VALIDATING_QUERY", "LOADING_KB"],
    });

    const response = await retrieveFromKnowledgeBase(query);

    if (!response.ok) {
      setChatState({ status: "error", errorMessage: response.errorMessage });
      return;
    }

    setChatState({
      status: "done",
      steps: response.steps,
      results: response.results,
    });

    if (response.results[0]) {
      setSelectedDocId(response.results[0].docId);
    }
  };

  const runAnswer = async () => {
    const query = chatInput.trim();
    if (!query) return;

    setChatState({
      status: "searching",
      steps: ["VALIDATING_QUERY", "LOADING_KB"],
    });

    const response = await answerFromKnowledgeBase(query);

    if (!response.ok) {
      setChatState({ status: "error", errorMessage: response.errorMessage });
      return;
    }

    setChatState({
      status: "done",
      steps: response.steps,
      results: response.results,
      answer: response.answer,
    });

    if (response.results[0]) {
      setSelectedDocId(response.results[0].docId);
    }
  };

  const selectedDoc = useMemo(() => {
    if (!selectedDocId) return null;
    return docs.find((d) => d.id === selectedDocId) ?? null;
  }, [docs, selectedDocId]);

  const previewMarkdown = selectedDoc?.content ?? uiConfig.emptyStateMessage;

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-950/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="space-y-0.5">
            <p className="text-sm text-zinc-400">Harel’s Portfolio</p>
            <h1 className="text-lg font-semibold">Studio</h1>
          </div>

          <div className="text-xs text-zinc-500">
            Retrieval → LLM grounded answers (Cursor-style)
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-12 gap-4 px-6 py-6">
        <aside className="col-span-12 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4 md:col-span-4">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold">Ask My Portfolio (Studio)</h1>
            <p className="text-sm text-zinc-400">
              Browse your portfolio knowledge base. Next step: add a
              Cursor-style chat that retrieves relevant snippets.
            </p>
          </div>

          <div className="mt-4">
            <label className="sr-only" htmlFor="kb-search">
              Search knowledge base
            </label>
            <input
              id="kb-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={uiConfig.searchPlaceholder}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm outline-none focus:border-zinc-600"
            />
          </div>

          <div className="mt-4 space-y-2">
            {filteredDocs.length === 0 ? (
              <div className="rounded-lg border border-zinc-800 bg-zinc-950/30 p-3">
                <p className="text-sm text-zinc-400">No matching documents.</p>
              </div>
            ) : (
              filteredDocs.map((doc) => {
                const isSelected = doc.id === selectedDocId;

                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => setSelectedDocId(doc.id)}
                    className={cx(
                      "w-full rounded-xl border p-3 text-left transition",
                      "border-zinc-800 bg-zinc-950/30 hover:bg-zinc-950/60",
                      isSelected && "ring-1 ring-zinc-500",
                    )}
                  >
                    <p className="text-sm font-medium">{doc.title}</p>
                    <p className="text-xs text-zinc-500">{doc.relativePath}</p>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="col-span-12 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 md:col-span-8">
          <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
            <p className="text-sm font-medium">Ask my portfolio</p>
            <p className="mt-1 text-xs text-zinc-500">
              Retrieval + LLM mode: we search your knowledge base, show the best
              matching snippets, and draft a grounded answer.
            </p>

            <div className="mt-3 flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") runSearch();
                }}
                placeholder="Ask about a project, stack, or experience…"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 font-mono text-sm outline-none focus:border-zinc-600"
              />
              <button
                type="button"
                onClick={runSearch}
                className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 font-mono text-sm hover:bg-zinc-800"
              >
                Search
              </button>
              <button
                type="button"
                onClick={runAnswer}
                className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 font-mono text-sm hover:bg-zinc-800"
              >
                Answer
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {chatState.status === "searching" && (
                <div className="font-mono text-xs text-zinc-400">
                  <p className="font-medium text-zinc-300">Tool logs</p>
                  <ul className="mt-1 list-inside list-disc">
                    {chatState.steps.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {chatState.status === "error" && (
                <div className="text-xs text-red-300">
                  <p className="font-medium">Error</p>
                  <p className="mt-1">{chatState.errorMessage}</p>
                </div>
              )}

              {chatState.status === "done" && (
                <div className="space-y-3">
                  {chatState.answer && (
                    <div className="rounded-lg border border-zinc-800 bg-zinc-950/30 p-3 text-sm text-zinc-200">
                      <p className="text-xs text-zinc-500">Answer</p>
                      <p className="mt-2 whitespace-pre-wrap">
                        {chatState.answer}
                      </p>
                    </div>
                  )}
                  <div className="font-mono text-xs text-zinc-400">
                    <p className="font-medium text-zinc-300">Top matches</p>
                    <ul className="mt-2 space-y-2">
                      {chatState.results.length === 0 ? (
                        <li className="rounded-lg border border-zinc-800 bg-zinc-950/30 p-3">
                          No matches found. Add more KB content or try different
                          keywords.
                        </li>
                      ) : (
                        chatState.results.map((r) => (
                          <li
                            key={r.docId}
                            className="rounded-lg border border-zinc-800 bg-zinc-950/30 p-3"
                          >
                            <p className="text-sm font-medium text-zinc-200">
                              {r.title}{" "}
                              <span className="text-xs text-zinc-500">
                                ({r.score})
                              </span>
                            </p>
                            <p className="text-xs text-zinc-500">
                              {r.relativePath}
                            </p>
                            <p className="mt-2 text-xs">{r.snippet}</p>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm text-zinc-400">Preview</p>
            <p className="text-base font-semibold">
              {selectedDoc?.title ?? "Knowledge Base"}
            </p>
          </div>

          <div className="prose prose-invert max-w-none prose-headings:scroll-mt-24">
            <ReactMarkdown>{previewMarkdown}</ReactMarkdown>
          </div>
        </section>
      </div>
    </main>
  );
}
