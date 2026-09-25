# Reflection

## What I built
Five agent workflow patterns in Node.js with the Vercel AI SDK: prompt chaining, routing, parallelization, orchestrator-workers, and evaluator-optimizer. Each is a standalone script using one small shared helper (`lib/llm.js`).

## What I learned

**Patterns differ in who controls the flow.** In prompt chaining, routing, and parallelization the code decides the steps in advance, and the LLM only fills them in. In orchestrator-workers the LLM decides what the steps are. Evaluator-optimizer sits in between: the loop structure is fixed, but the LLM decides when the work is good enough. More LLM control means more flexibility and less predictability.

**My first version got the easy patterns right and the harder ones wrong.** Prompt chaining and parallelization were mostly correct from the start. But:
- My "routing" was a keyword `if` statement. It would have sent "How do I reverse a linked list?" to the general agent because the question contains neither "SQL" nor "Python". Routing by meaning needs an LLM (or trained) classifier.
- My "orchestrator" hard-coded three subtasks and ran them one after another. That's really prompt chaining. What makes it an orchestrator is that the model *plans* the subtasks.
- My "evaluator" did one evaluate→improve pass with no loop and no stopping condition. Without the loop and threshold there's nothing to optimize.

**Structured output is what makes the patterns reliable.** Wherever code has to act on an LLM's decision (a route, a score, a plan, a pass/fail), I switched to zod-validated structured output. That removed all string parsing and made each decision point testable.

**Keep deterministic logic in code.** Gates, word counts, score thresholds, and iteration caps are JavaScript, not instructions in a prompt. They're cheaper, can't be "talked out of", and they bound cost. For example, the evaluator loop can never run more than 3 times.

## What the live runs showed
- **Evaluator-optimizer worked as intended:** the deliberately hype-filled first draft scored **2/10**, and after one revision using the evaluator's feedback it scored **10/10** and was accepted on iteration 2. The loop stopped as soon as the threshold was met instead of using all 3 iterations.
- **Parallelization really overlapped:** the three reviewers finished at +3.3s, +4.5s and +6.0s, so the total wait was the slowest reviewer (~6s), not the ~13.8s they would take one after another.
- **Routing picked the right agent for all three test questions** (coding, billing, general), with confidence 0.99 each. The logged reasoning makes each decision easy to check.
- **The orchestrator chose its own plan:** five subtasks (overview, financials, competition, risks/opportunities, summary) that I never hard-coded.
- **Cost scales with pattern complexity:** prompt chaining used 3 LLM calls, while orchestrator-workers used 8 for one request (1 plan + 5 workers + 1 synthesis + 1 retry).

## Structured output isn't guaranteed on every model
The logs were produced with `gpt-oss:120b`, an open-weight model, through my SharedLLM gateway. On the first run, the orchestrator and evaluator both crashed with *"response did not match schema"*. When I inspected the raw response, the orchestrator's plan was valid JSON but used the model's own field names (`description`, `id`, `specialist`) instead of the schema's (`title`, `instructions`). Two fixes:
1. Put the exact field names in the prompt and add `.describe()` to each schema field.
2. Add a bounded retry (max 3 attempts) around structured calls. Each retry is logged as `[retry]` instead of being hidden, and it still shows up in the final logs a couple of times.

Lesson: a schema tells you *whether* the output is valid, but it doesn't make the model produce valid output. Validation, clear field instructions, and a bounded retry are all needed, especially on smaller or open models.

## Challenges
- **Running the code from a fresh clone.** The original repo errored out when run: `package.json` was missing `"type": "module"`, there was no `.env.example` or setup instructions, and `node_modules/` was committed. I fixed all three and made a missing key produce a clear message instead of a stack trace.
- **API key management.** An earlier key was put in a local `.env` early on and later had to be removed and rotated. I now keep `.env` git-ignored from the first commit and ship only `.env.example`.
- **Provider flexibility.** My OpenAI key had been revoked, and my gateway account had no Claude balance (`Payment Required`). Because the model provider is configurable in one file (`lib/llm.js`), I switched to `gpt-oss:120b` through the gateway without touching any pattern code. That's a practical argument for keeping pattern logic separate from model setup.

## Trade-offs I'd weigh in a real system
| Pattern | Main benefit | Main cost |
|---|---|---|
| Prompt chaining | Simple, predictable, easy to debug | Latency adds up; errors carry forward |
| Routing | Specialized, cheaper handling per category | Extra classifier call; misroutes |
| Parallelization | Lower latency, focused reviewers | More total tokens; needs aggregation |
| Orchestrator-workers | Handles tasks with unknown subtasks | Least predictable; hardest to test |
| Evaluator-optimizer | Measurable quality improvement | Multiple calls per output; evaluator can be lenient |

The main takeaway: start with the simplest pattern that solves the problem, and only give the LLM more control over the flow when the task actually requires it.
