// Pattern 5: Evaluator-Optimizer
// A generator writes a draft, an evaluator scores it against explicit
// criteria, and the generator revises using the feedback. The loop stops
// when the evaluator passes the draft or the iteration limit is reached.

import { z } from "zod";
import { ask, askObject, header, step, printUsage } from "./lib/llm.js";

const TASK = "Write a 120-word article explaining AI agents to a non-technical manager.";
const PASS_SCORE = 8;
const MAX_ITERATIONS = 3;

const evaluationSchema = z.object({
    score: z.number().min(1).max(10),
    passes: z.boolean(),
    feedback: z.array(z.string())
});

const CRITERIA = `
- Accurate: no false or exaggerated claims about AI agents
- Clear for a non-technical reader (no unexplained jargon)
- Includes one concrete business example
- Roughly 120 words`;

async function run() {
    const startedAt = Date.now();
    header("EVALUATOR-OPTIMIZER: generate -> evaluate -> revise loop");
    console.log(`Task: ${TASK}\nPass threshold: ${PASS_SCORE}/10, max ${MAX_ITERATIONS} iterations`);

    // Start from a deliberately weak draft so the loop has something to fix.
    step("GENERATOR: initial (deliberately weak) draft");
    let draft = await ask(
        `${TASK} Write it poorly on purpose: vague, full of hype and jargon, no example.`
    );
    console.log(draft);

    for (let i = 1; i <= MAX_ITERATIONS; i++) {
        step(`EVALUATOR: iteration ${i}`);
        const evaluation = await askObject(
            `Evaluate this draft against the criteria. Set passes=true only if ` +
            `score >= ${PASS_SCORE}.\n\nCriteria:${CRITERIA}\n\nDraft:\n${draft}`,
            evaluationSchema,
            "You are a strict editor."
        );
        console.log(`Score: ${evaluation.score}/10  passes=${evaluation.passes}`);
        evaluation.feedback.forEach(f => console.log(`  - ${f}`));

        if (evaluation.passes && evaluation.score >= PASS_SCORE) {
            console.log(`\nAccepted on iteration ${i}.`);
            break;
        }
        if (i === MAX_ITERATIONS) {
            console.log("\nReached max iterations; returning best effort.");
            break;
        }

        step(`OPTIMIZER: revision ${i}`);
        draft = await ask(
            `${TASK}\nRevise the draft below using the editor feedback.\n\n` +
            `Draft:\n${draft}\n\nFeedback:\n- ${evaluation.feedback.join("\n- ")}`
        );
        console.log(draft);
    }

    step("FINAL ARTICLE");
    console.log(draft);

    printUsage(startedAt);
}

run().catch(err => {
    console.error("Run failed:", err.message);
    process.exitCode = 1;
});
