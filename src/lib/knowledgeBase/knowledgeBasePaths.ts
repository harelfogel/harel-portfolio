import path from "path";

export const KNOWLEDGE_BASE_ROOT_DIR = path.join(
  process.cwd(),
  "app_data",
  "knowledge_base",
);

export const KNOWLEDGE_BASE_PROJECTS_DIR = path.join(
  KNOWLEDGE_BASE_ROOT_DIR,
  "projects",
);
