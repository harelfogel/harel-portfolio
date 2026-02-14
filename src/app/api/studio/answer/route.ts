import { NextResponse } from "next/server";
import { generateText } from "@/lib/llm/llmClient";
import {
  runRetrieval,
  validateQuery,
  type RetrievalMatch,
  type RetrievalStep,
} from "@/lib/knowledgeBase/retrieval";

type AnswerRequestBody = {
  query: string;
};

type AnswerResponseBody = {
  ok: true;
  steps: RetrievalStep[];
  query: string;
  results: RetrievalMatch[];
  answer: string;
};

type ErrorResponseBody = {
  ok: false;
  errorMessage: string;
};

function buildPrompt(query: string, results: RetrievalMatch[]) {
  const context = results
    .map(
      (r, index) =>
        `Source ${index + 1}: ${r.title} (${r.relativePath})\n${r.snippet}`,
    )
    .join("\n\n");

  const system = `You are Harel Fogel's portfolio assistant, helping recruiters and hiring managers learn about his experience and skills.

PERSONALITY:
- Professional but approachable
- Confident in technical abilities without being arrogant
- Enthusiastic about challenging engineering problems
- Clear and concise in explanations

GUIDELINES:
- Answer ONLY using the provided context about Harel
- If asked about something not in the context, politely say you don't have that information
- When discussing projects, focus on impact and technical decisions
- Don't invent information — stick to what's in the knowledge base
- Keep answers focused and well-structured, using markdown formatting when helpful

TONE:
- First person when speaking as Harel ("I built...", "My experience...")
- Conversational but professional
- Technical but accessible to non-technical recruiters`;

  const user = `Question: ${query}\n\nContext:\n${context}`;

  return { system, user };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<AnswerRequestBody>;
    const query = typeof body.query === "string" ? body.query.trim() : "";

    const errorMessage = validateQuery(query);
    if (errorMessage) {
      const error: ErrorResponseBody = { ok: false, errorMessage };
      return NextResponse.json(error, { status: 400 });
    }

    const retrieval = await runRetrieval(query);

    if (retrieval.results.length === 0) {
      const response: AnswerResponseBody = {
        ok: true,
        steps: retrieval.steps,
        query: retrieval.query,
        results: retrieval.results,
        answer: "I could not find relevant documents for that question.",
      };

      return NextResponse.json(response, { status: 200 });
    }

    const steps: RetrievalStep[] = [];
    for (const step of retrieval.steps) {
      if (step !== "DONE") steps.push(step);
    }
    steps.push("GENERATING_ANSWER");

    const { system, user } = buildPrompt(query, retrieval.results);
    const llmResponse = await generateText({
      system,
      messages: [{ role: "user", content: user }],
    });

    steps.push("DONE");

    const response: AnswerResponseBody = {
      ok: true,
      steps,
      query: retrieval.query,
      results: retrieval.results,
      answer: llmResponse.text || "I could not generate an answer.",
    };

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    const error: ErrorResponseBody = {
      ok: false,
      errorMessage: message,
    };

    return NextResponse.json(error, { status: 500 });
  }
}
