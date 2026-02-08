import { promises as fs } from "fs";
import path from "path";
import {
  KNOWLEDGE_BASE_PROJECTS_DIR,
  KNOWLEDGE_BASE_ROOT_DIR,
} from "./knowledgeBasePaths";

export type KnowledgeBaseDocument = {
  id: string;
  title: string;
  relativePath: string;
  content: string;
};

function toDocId(relativePath: string): string {
  return relativePath.replaceAll(path.sep, "/");
}

function inferTitle(markdown: string, fallback: string): string {
  const firstHeading = markdown
    .split("\n")
    .find((line) => line.trim().startsWith("# "));

  if (!firstHeading) return fallback;
  return firstHeading.replace(/^#\s+/, "").trim() || fallback;
}

async function readMarkdownFile(fullPath: string, relativePath: string) {
  const content = await fs.readFile(fullPath, "utf-8");
  const title = inferTitle(content, path.basename(relativePath));
  return {
    id: toDocId(relativePath),
    title,
    relativePath,
    content,
  } satisfies KnowledgeBaseDocument;
}

export async function listKnowledgeBaseDocs(): Promise<
  KnowledgeBaseDocument[]
> {
  const rootDocs = [
    "about.md",
    "overview.md",
    "experience.md",
    "education.md",
    "skills.md",
  ];

  const results: KnowledgeBaseDocument[] = [];

  for (const fileName of rootDocs) {
    const fullPath = path.join(KNOWLEDGE_BASE_ROOT_DIR, fileName);
    const doc = await readMarkdownFile(fullPath, fileName);
    results.push(doc);
  }

  const projectFiles = await fs.readdir(KNOWLEDGE_BASE_PROJECTS_DIR);
  const markdownProjects = projectFiles.filter((f) => f.endsWith(".md"));

  for (const fileName of markdownProjects) {
    const relativePath = path.join("projects", fileName);
    const fullPath = path.join(KNOWLEDGE_BASE_PROJECTS_DIR, fileName);
    const doc = await readMarkdownFile(fullPath, relativePath);
    results.push(doc);
  }

  return results.sort((a, b) => a.title.localeCompare(b.title));
}
