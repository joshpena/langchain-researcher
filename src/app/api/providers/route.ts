import { getAvailableProviders } from "@/lib/agents/llm";

export async function GET() {
  return Response.json(getAvailableProviders());
}
