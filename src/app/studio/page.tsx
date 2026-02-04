import ReactMarkdown from "react-markdown";
import { listKnowledgeBaseDocs } from "@/lib/knowledgeBase/knowledgeBaseReader";

export const metadata = {
  title: "Studio | Harel",
};

export default async function StudioPage() {
  const docs = await listKnowledgeBaseDocs();
  const firstDoc = docs[0];

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto grid max-w-6xl grid-cols-12 gap-4 p-6">
        <aside className="col-span-12 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 md:col-span-4">
          <h1 className="text-lg font-semibold">Ask My Portfolio (Studio)</h1>
          <p className="mt-1 text-sm text-zinc-400">
            This panel will become the Cursor-style chat. For now, it proves the
            app reads your real portfolio knowledge base.
          </p>

          <div className="mt-4 space-y-2">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className="rounded-lg border border-zinc-800 bg-zinc-950/30 p-3"
              >
                <p className="text-sm font-medium">{doc.title}</p>
                <p className="text-xs text-zinc-500">{doc.relativePath}</p>
              </div>
            ))}
          </div>
        </aside>

        <section className="col-span-12 rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 md:col-span-8">
          <div className="prose prose-invert max-w-none">
            <ReactMarkdown>
              {firstDoc?.content ?? "No knowledge base documents found."}
            </ReactMarkdown>
          </div>
        </section>
      </div>
    </main>
  );
}
