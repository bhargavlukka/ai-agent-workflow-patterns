# AI Agent Workflow Patterns

Module 1 Lab: **Build Five Agent Workflow Patterns**. Implementations of the five core agentic workflow patterns using the [Vercel AI SDK](https://ai-sdk.dev) (`ai` v7) in Node.js.

| # | Pattern | Code | Documentation | Execution log |
|---|---|---|---|---|
| 1 | Prompt Chaining | [`prompt-chaining.js`](prompt-chaining.js) | [docs/01](docs/01-prompt-chaining.md) | [logs/prompt-chaining.log](logs/prompt-chaining.log) |
| 2 | Routing | [`routing.js`](routing.js) | [docs/02](docs/02-routing.md) | [logs/routing.log](logs/routing.log) |
| 3 | Parallelization | [`parallelization.js`](parallelization.js) | [docs/03](docs/03-parallelization.md) | [logs/parallelization.log](logs/parallelization.log) |
| 4 | Orchestrator-Workers | [`orchestrator.js`](orchestrator.js) | [docs/04](docs/04-orchestrator-workers.md) | [logs/orchestrator.log](logs/orchestrator.log) |
| 5 | Evaluator-Optimizer | [`evaluator.js`](evaluator.js) | [docs/05](docs/05-evaluator-optimizer.md) | [logs/evaluator.log](logs/evaluator.log) |

Reflection: [REFLECTION.md](REFLECTION.md)

## Execution results (live run, 2026-09-25)
All five patterns were run end-to-end. The full console output is in [`logs/`](logs/).

| Pattern | LLM calls | Elapsed | What the log shows |
|---|---|---|---|
| Prompt Chaining | 3 | 6.4s | Both gates passed (3 outline points, 296-word article) |
| Routing | 6 | 9.7s | 3 questions routed to `coding`, `billing`, and `general`, each with the router's reasoning |
| Parallelization | 5 | 10.7s | 3 reviewers finished at +3.3s / +4.5s / +6.0s, so they overlapped; average score 7.0/10 plus aggregated verdict |
| Orchestrator-Workers | 8 | 26.8s | Orchestrator planned 5 subtasks, 5 workers ran in parallel, synthesizer produced the briefing |
| Evaluator-Optimizer | 4 | 15.4s | Draft scored **2/10 → 10/10**, accepted on iteration 2 |

**Model used for the logs:** `gpt-oss:120b`, served through the SharedLLM gateway using the Anthropic-compatible endpoint (`LLM_PROVIDER=anthropic`). My original OpenAI key had been revoked, and the gateway account has no Claude balance (`claude-sonnet-5` returned `Payment Required`). The pattern code is provider-independent: set `LLM_PROVIDER=openai` to run the same scripts on `gpt-4.1-mini`.

LLM call counts include structured-output retries (see `[retry]` lines in the logs and the note in [REFLECTION.md](REFLECTION.md)).

## Project structure
```
├── lib/llm.js              # shared helpers: model setup, ask(), askObject(), usage stats
├── index.js                # setup check (one LLM call)
├── prompt-chaining.js      # Pattern 1
├── routing.js              # Pattern 2
├── parallelization.js      # Pattern 3
├── orchestrator.js         # Pattern 4
├── evaluator.js            # Pattern 5
├── docs/                   # one document per pattern
├── logs/                   # captured execution output of each pattern
└── REFLECTION.md
```

## Setup
Requires **Node.js 20+**.

```bash
git clone https://github.com/bhargavlukka/ai-agent-workflow-patterns.git
cd ai-agent-workflow-patterns
npm install
cp .env.example .env      # then fill in your key(s)
npm run check             # one test call to confirm the key works
```

### Choosing a model provider
`lib/llm.js` supports two backends, selected with `LLM_PROVIDER` in `.env`. The pattern code is identical for both.

| `LLM_PROVIDER` | Required variables | Default model |
|---|---|---|
| `openai` | `OPENAI_API_KEY` | `gpt-4.1-mini` (`OPENAI_MODEL`) |
| `anthropic` | `ANTHROPIC_API_KEY`, optional `ANTHROPIC_BASE_URL` + `ANTHROPIC_EXTRA_HEADERS` for a gateway such as SharedLLM | `claude-sonnet-5` (`ANTHROPIC_MODEL`; logs used `gpt-oss:120b`) |

If a required key is missing, the scripts exit with a clear message instead of a stack trace.

## Running
```bash
npm run chaining       # Pattern 1
npm run routing        # Pattern 2
npm run parallel       # Pattern 3
npm run orchestrator   # Pattern 4
npm run evaluator      # Pattern 5
npm run all            # all five, in order
```

To regenerate the execution logs:
```bash
for p in prompt-chaining routing parallelization orchestrator evaluator; do
  node $p.js 2>&1 | tee logs/$p.log
done
```

Each run ends with a stats line: model, number of LLM calls, input/output tokens, and elapsed time.

## Design notes
- **Structured output** (`generateText` + `Output.object` with zod schemas) is used wherever code has to act on the LLM's answer: the router's category, reviewer scores, the orchestrator's plan, and the evaluator's verdict. This avoids fragile string parsing.
- **Deterministic control flow stays in code**: gates, loops, iteration caps, and score thresholds are JavaScript, not prompts.
- `node_modules/` and `.env` are git-ignored. Keys are never committed.
