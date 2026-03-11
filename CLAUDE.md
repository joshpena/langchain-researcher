# CLAUDE.md

## Project overview

Multi-agent research pipeline: Next.js frontend + LangChain agents streamed via SSE. Five agents run in sequence: Planner → Researcher (parallel) → Critic (loops up to 2x) → Writer → Notifier.

## Key files

- `src/lib/agents/orchestrator.ts` — pipeline coordinator, the main entry point for agent logic
- `src/lib/agents/types.ts` — all shared types including the `AgentEvent` discriminated union
- `src/lib/agents/llm.ts` — single `createLLM()` factory; change the model name here to switch models
- `src/app/api/research/route.ts` — SSE endpoint; streams `AgentEvent` objects as `data: <json>\n\n`
- `src/app/page.tsx` — SSE client; parses events and drives UI state

## Conventions

- All agents live in `src/lib/agents/` and export a single async function
- Agent communication is through plain TypeScript types in `types.ts`, not shared state
- Streaming uses native `ReadableStream` + `TextEncoder`, not a library
- LLM calls use `RunnableSequence` from `@langchain/core/runnables`
- Structured outputs use `StructuredOutputParser` + Zod schemas

## Environment

- LLM: `gpt-4o-mini` (configured in `llm.ts`) — swap to `gpt-4o` for higher quality
- Search: Tavily via `@langchain/tavily` — `TavilySearch.invoke()` returns `{ results: [...] }`, not a plain array
- Email: Resend via `resend` package — skipped silently if `RESEND_API_KEY` is unset
