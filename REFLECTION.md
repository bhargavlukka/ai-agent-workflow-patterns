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

## Challenges
- **Running the code from a fresh clone.** The original repo errored out when run: `package.json` was missing `"type": "module"`, there was no `.env.example` or setup instructions, and `node_modules/` was committed. I fixed all three and made a missing key produce a clear message instead of a stack trace.
- **API key management.** An earlier key was put in a local `.env` early on and later had to be removed and rotated. I now keep `.env` git-ignored from the first commit and ship only `.env.example`.
- **Provider flexibility.** I made the model provider configurable (OpenAI directly, or Claude through a gateway) so the same pattern code runs with whichever key is available.

## Trade-offs I'd weigh in a real system
| Pattern | Main benefit | Main cost |
|---|---|---|
| Prompt chaining | Simple, predictable, easy to debug | Latency adds up; errors carry forward |
| Routing | Specialized, cheaper handling per category | Extra classifier call; misroutes |
| Parallelization | Lower latency, focused reviewers | More total tokens; needs aggregation |
| Orchestrator-workers | Handles tasks with unknown subtasks | Least predictable; hardest to test |
| Evaluator-optimizer | Measurable quality improvement | Multiple calls per output; evaluator can be lenient |

The main takeaway: start with the simplest pattern that solves the problem, and only give the LLM more control over the flow when the task actually requires it.
