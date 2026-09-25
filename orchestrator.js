// Pattern 4: Orchestrator-Workers
// An orchestrator LLM decides at runtime which subtasks are needed,
// worker LLMs complete each subtask in parallel, and a synthesizer
// combines their results into one report. Unlike parallelization, the
// subtasks are not hard-coded; the orchestrator plans them.

import { z } from "zod";
import { ask, askObject, header, step, printUsage } from "./lib/llm.js";

const REQUEST = "Prepare a short investment briefing on Tesla for a retail investor.";

const planSchema = z.object({
    subtasks: z
        .array(
            z.object({
                title: z.string().describe("Short name of the subtask"),
                instructions: z.string().describe("What the specialist worker should do")
            })
        )
        .min(2)
        .max(5)
});

async function run() {
    const startedAt = Date.now();
    header("ORCHESTRATOR-WORKERS: plan -> parallel workers -> synthesize");
    console.log(`Request: ${REQUEST}`);

    step("ORCHESTRATOR: plan subtasks");
    const plan = await askObject(
        `Break this request into 2-5 independent analysis subtasks that ` +
        `different specialists could work on in parallel. Return JSON with a ` +
        `"subtasks" array where each item has exactly two string fields: ` +
        `"title" and "instructions".\n\nRequest: ${REQUEST}`,
        planSchema,
        "You are a lead research analyst who plans work for a team."
    );
    plan.subtasks.forEach((task, i) =>
        console.log(`${i + 1}. ${task.title} - ${task.instructions}`)
    );

    step(`WORKERS: running ${plan.subtasks.length} workers in parallel`);
    const results = await Promise.all(
        plan.subtasks.map(async task => {
            const output = await ask(
                `${task.instructions}\n\nKeep it under 120 words.`,
                `You are a specialist analyst. Your only job: ${task.title}.`
            );
            console.log(`[worker done] ${task.title}`);
            return { title: task.title, output };
        })
    );

    step("SYNTHESIZER: combine worker outputs");
    const report = await ask(
        `Combine these specialist sections into one coherent briefing for: ` +
        `${REQUEST}\nEnd with a one-line overall takeaway.\n\n` +
        results.map(r => `## ${r.title}\n${r.output}`).join("\n\n")
    );
    console.log(report);

    printUsage(startedAt);
}

run().catch(err => {
    console.error("Run failed:", err.message);
    process.exitCode = 1;
});
