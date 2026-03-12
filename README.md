# LangChain Researcher

A multi-agent research pipeline built with LangChain and Next.js. Enter any topic, pick one or more LLMs, and the system autonomously plans, researches, critiques, and writes a structured report — streamed live to the browser.

## How it works

Five agents run in sequence per selected LLM provider, with results streamed via Server-Sent Events. When multiple providers are selected, pipelines run in parallel and results are displayed side by side.

1. **Planner** — breaks the topic into 3–5 focused sub-questions
2. **Researcher** — searches the web in parallel for each sub-question (Tavily)
3. **Critic** — evaluates research completeness; loops back to the Researcher if gaps are found (max 2 revision rounds)
4. **Writer** — synthesizes all findings into a structured markdown report
5. **Notifier** — emails the report via Resend (optional, one email per provider)

## Tech stack

- **Next.js 16** — app router, API routes, SSE streaming
- **LangChain** — agent orchestration, structured output parsing
- **OpenAI** — GPT-4o Mini, GPT-4o
- **Anthropic** — Claude Sonnet
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
| `OPENAI_API_KEY` | At least one LLM key | OpenAI API key |
| `ANTHROPIC_API_KEY` | At least one LLM key | Anthropic API key |
| `TAVILY_API_KEY` | Yes | Tavily search key — free tier at [tavily.com](https://tavily.com) |
| `RESEND_API_KEY` | No | Resend key for email — [resend.com](https://resend.com) |
| `REPORT_EMAIL_FROM` | No | Sender address (defaults to `onboarding@resend.dev`) |

Only providers whose API key is set will appear in the UI. You need at least one LLM provider configured.

3. Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), select your LLM provider(s), enter a research topic, and watch the pipeline run. Optionally enter an email address to receive the report(s) when complete.

## Project structure

```
src/
  app/
    page.tsx                  # UI — SSE client, state management
    api/research/route.ts     # SSE endpoint — streams AgentEvents
    api/providers/route.ts    # GET endpoint — returns available LLM providers
  components/
    ProviderSelector.tsx      # LLM provider toggle pills
    ResearchForm.tsx          # Topic + email input form
    PipelineProgress.tsx      # Stage indicator bar
    StatusLog.tsx             # Agent activity messages
    ResearchPlan.tsx          # Sub-questions display
    ResearchFindings.tsx      # Collapsible research results
    CriticFeedback.tsx        # Critic gap warnings
    ResearchReport.tsx        # Markdown report viewer
    ErrorBanner.tsx           # Error display
    ProviderPipelineSection.tsx # Composite per-provider section
    types.ts                  # Shared UI types
  lib/agents/
    orchestrator.ts           # Pipeline coordinator (single + multi-provider)
    planner.ts                # Breaks topic into sub-questions
    researcher.ts             # Web search + synthesis per sub-question
    critic.ts                 # Evaluates research, identifies gaps
    writer.ts                 # Produces final markdown report
    notifier.ts               # Sends report by email (with provider label)
    llm.ts                    # Provider registry + LLM factory
    types.ts                  # Shared types and AgentEvent union
```
