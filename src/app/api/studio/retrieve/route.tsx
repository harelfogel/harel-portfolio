import { NextResponse } from "next/server";
import {
  runRetrieval,
  validateQuery,
  type RetrievalMatch,
  type RetrievalStep,
} from "@/lib/knowledgeBase/retrieval";

type RetrieveRequestBody = {
  query: string;
};

type RetrieveResponseBody = {
  ok: true;
  steps: RetrievalStep[];
  query: string;
  results: RetrievalMatch[];
};

type ErrorResponseBody = {
  ok: false;
  errorMessage: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<RetrieveRequestBody>;
    const query = typeof body.query === "string" ? body.query.trim() : "";

    const errorMessage = validateQuery(query);
    if (errorMessage) {
      const error: ErrorResponseBody = {
        ok: false,
        errorMessage,
      };
      return NextResponse.json(error, { status: 400 });
    }

    const { steps, results } = await runRetrieval(query);

    const response: RetrieveResponseBody = {
      ok: true,
      steps,
      query,
      results,
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
