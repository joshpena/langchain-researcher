# LangChain Researcher

A multi-agent research pipeline built with LangChain and Next.js. Enter any topic and the system autonomously plans, researches, critiques, and writes a structured report — streamed live to the browser.

## How it works

Five agents run in sequence, with results streamed via Server-Sent Events:

1. **Planner** — breaks the topic into 3–5 focused sub-questions
2. **Researcher** — searches the web in parallel for each sub-question (Tavily)
3. **Critic** — evaluates research completeness; loops back to the Researcher if gaps are found (max 2 revision rounds)
4. **Writer** — synthesizes all findings into a structured markdown report
5. **Notifier** — emails the report via Resend (optional)

## Tech stack

- **Next.js 16** — app router, API routes, SSE streaming
- **LangChain** — agent orchestration, structured output parsing
- **OpenAI** — `gpt-4o-mini` for all LLM calls (swap to `gpt-4o` in `llm.ts` for higher quality)
- **Tavily** — web search
- **Resend** — email delivery (optional)
- **Tailwind CSS + `@tailwindcss/typography`** — styling

## Setup

1. Clone the repo and install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env.local` and fill in your keys:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | Yes | OpenAI API key |
| `TAVILY_API_KEY` | Yes | Tavily search key — free tier at [tavily.com](https://tavily.com) |
| `RESEND_API_KEY` | No | Resend key for email — [resend.com](https://resend.com) |
| `REPORT_EMAIL_TO` | No | Address to send reports to |
| `REPORT_EMAIL_FROM` | No | Sender address (defaults to `onboarding@resend.dev`) |

3. Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), enter a research topic, and watch the pipeline run.

## Project structure

```
src/
  app/
    page.tsx                  # UI — SSE client, live pipeline display
    api/research/route.ts     # SSE endpoint — streams AgentEvents
  lib/agents/
    orchestrator.ts           # Pipeline coordinator
    planner.ts                # Breaks topic into sub-questions
    researcher.ts             # Web search + synthesis per sub-question
    critic.ts                 # Evaluates research, identifies gaps
    writer.ts                 # Produces final markdown report
    notifier.ts               # Sends report by email
    llm.ts                    # Shared LLM factory
    types.ts                  # Shared types and AgentEvent union
```
