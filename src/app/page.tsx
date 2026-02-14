import PortfolioIDE from "@/app/PortfolioIDE";
import { listKnowledgeBaseDocs } from "@/lib/knowledgeBase/knowledgeBaseReader";
import type { KnowledgeBaseDocument } from "@/lib/knowledgeBase/knowledgeBaseReader";

export default async function Home() {
  const docs = (await listKnowledgeBaseDocs()) as KnowledgeBaseDocument[];
  return <PortfolioIDE docs={docs} />;
}
