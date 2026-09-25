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

> **Execution logs:** being captured from a live run with the updated code. Until then the log links above return 404. See [logs/README.md](logs/README.md) for how to generate them.

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
| `anthropic` | `ANTHROPIC_API_KEY`, optional `ANTHROPIC_BASE_URL` + `ANTHROPIC_EXTRA_HEADERS` for a gateway such as SharedLLM | `claude-sonnet-5` (`ANTHROPIC_MODEL`) |

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
