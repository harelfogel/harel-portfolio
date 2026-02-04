"use client";

import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";

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

  const filteredDocs = useMemo(() => {
    return docs.filter((doc) => matchesQuery(doc, searchQuery));
  }, [docs, searchQuery]);

  const selectedDoc = useMemo(() => {
    if (!selectedDocId) return null;
    return docs.find((d) => d.id === selectedDocId) ?? null;
  }, [docs, selectedDocId]);

  const previewMarkdown = selectedDoc?.content ?? uiConfig.emptyStateMessage;

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto grid max-w-6xl grid-cols-12 gap-4 p-6">
        <aside className="col-span-12 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 md:col-span-4">
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
                    className={[
                      "w-full rounded-lg border p-3 text-left transition",
                      "border-zinc-800 bg-zinc-950/30 hover:bg-zinc-950/50",
                      isSelected ? "ring-1 ring-zinc-500" : "",
                    ].join(" ")}
                  >
                    <p className="text-sm font-medium">{doc.title}</p>
                    <p className="text-xs text-zinc-500">{doc.relativePath}</p>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="col-span-12 rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 md:col-span-8">
          <div className="mb-4">
            <p className="text-sm text-zinc-400">Preview</p>
            <p className="text-base font-semibold">
              {selectedDoc?.title ?? "Knowledge Base"}
            </p>
          </div>

          <div className="prose prose-invert max-w-none">
            <ReactMarkdown>{previewMarkdown}</ReactMarkdown>
          </div>
        </section>
      </div>
    </main>
  );
}
