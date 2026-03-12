# CLAUDE.md

## Project overview

Multi-agent research pipeline: Next.js frontend + LangChain agents streamed via SSE. Five agents run in sequence per LLM provider: Planner → Researcher (parallel) → Critic (loops up to 2x) → Writer → Notifier. Users can select one or more LLM providers; when multiple are chosen, pipelines run in parallel with events merged via async generator interleaving.

## Key files

- `src/lib/agents/orchestrator.ts` — pipeline coordinator; `runSinglePipeline()` per provider, `mergeGenerators()` for parallel execution
- `src/lib/agents/types.ts` — all shared types including `AgentEvent` discriminated union and `LLMProviderConfig`
- `src/lib/agents/llm.ts` — provider registry (`PROVIDERS` array), `createLLM()` factory, `getAvailableProviders()`, `getProviderLabel()`
- `src/app/api/research/route.ts` — SSE endpoint; streams `AgentEvent` objects as `data: <json>\n\n`
- `src/app/api/providers/route.ts` — GET endpoint; returns providers whose API key is configured
- `src/app/page.tsx` — SSE client; parses events and routes them by `providerId`
- `src/components/` — extracted UI components (ProviderSelector, ResearchForm, PipelineProgress, etc.)

## Conventions

- All agents live in `src/lib/agents/` and export a single async function that takes `providerId` as a parameter
- Agent communication is through plain TypeScript types in `types.ts`, not shared state
- All `AgentEvent` variants carry a `providerId` field (except `all_done`) for multi-provider event routing
- Streaming uses native `ReadableStream` + `TextEncoder`, not a library
- LLM calls use `RunnableSequence` from `@langchain/core/runnables`
- Structured outputs use `StructuredOutputParser` + Zod schemas
- UI components live in `src/components/` with shared types in `src/components/types.ts`
- To add a new LLM provider: add an entry to the `PROVIDERS` array in `llm.ts` and a `case` in the `createLLM()` switch

## Environment

- LLMs: OpenAI (GPT-4o Mini, GPT-4o) and Anthropic (Claude Sonnet) — only providers with a configured API key appear in the UI
- Search: Tavily via `@langchain/tavily` — `TavilySearch.invoke()` returns `{ results: [...] }`, not a plain array
- Email: Resend via `resend` package — user enters email in the UI; skipped if no email provided or `RESEND_API_KEY` is unset
