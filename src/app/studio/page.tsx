import StudioClient, {
  type KnowledgeBaseDocument,
} from "@/app/studio/StudioClient";
import { listKnowledgeBaseDocs } from "@/lib/knowledgeBase/knowledgeBaseReader";

export const metadata = {
  title: "Studio | Harel",
};

export default async function StudioPage() {
  const docs = (await listKnowledgeBaseDocs()) as KnowledgeBaseDocument[];
  return <StudioClient docs={docs} />;
}
