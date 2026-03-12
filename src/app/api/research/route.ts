import { NextRequest } from "next/server";
import { runResearchPipeline } from "@/lib/agents/orchestrator";
import { getAvailableProviders } from "@/lib/agents/llm";

export const maxDuration = 300; // 5 min timeout for long research tasks

export async function POST(req: NextRequest) {
  const { topic, providerIds } = await req.json();

  if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
    return new Response(JSON.stringify({ error: "Topic is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!Array.isArray(providerIds) || providerIds.length === 0) {
    return new Response(JSON.stringify({ error: "At least one provider must be selected" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Validate all provider IDs exist and are available
  const available = new Set(getAvailableProviders().map((p) => p.id));
  const invalid = providerIds.filter((id: string) => !available.has(id));
  if (invalid.length > 0) {
    return new Response(JSON.stringify({ error: `Unknown or unavailable providers: ${invalid.join(", ")}` }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Stream agent events using Server-Sent Events
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of runResearchPipeline(topic.trim(), providerIds)) {
          const data = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(data));
        }
      } catch (err) {
        const errorEvent = {
          type: "error",
          message: err instanceof Error ? err.message : "Stream error",
          providerId: providerIds[0],
        };
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
