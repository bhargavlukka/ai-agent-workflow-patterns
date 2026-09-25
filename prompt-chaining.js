// Pattern 1: Prompt Chaining
// A fixed sequence of LLM calls where each step consumes the previous
// step's output. A programmatic "gate" between steps checks the
// intermediate result before the chain continues.

import { ask, header, step, printUsage } from "./lib/llm.js";

const TOPIC = "AI Agents";
const MIN_WORDS = 150;

function wordCount(text) {
    return text.trim().split(/\s+/).length;
}

async function run() {
    const startedAt = Date.now();
    header(`PROMPT CHAINING: outline -> article -> summary (topic: ${TOPIC})`);

    step("STEP 1: Generate outline");
    const outline = await ask(
        `Create a 3-point outline about ${TOPIC}. Return only the numbered points.`
    );
    console.log(outline);

    step("GATE: Outline must contain 3 numbered points");
    const points = outline.split("\n").filter(line => /^\s*\d+[.)]/.test(line));
    if (points.length < 3) {
        throw new Error(`Gate failed: outline has ${points.length} points, expected 3.`);
    }
    console.log(`PASS - found ${points.length} points`);

    step("STEP 2: Write article from outline");
    let article = await ask(
        `Write a short article (about 250 words) using this outline:\n${outline}`
    );
    console.log(article);

    step(`GATE: Article must be at least ${MIN_WORDS} words`);
    let words = wordCount(article);
    if (words < MIN_WORDS) {
        console.log(`FAIL - ${words} words, asking the model to expand once.`);
        article = await ask(
            `Expand this article to at least ${MIN_WORDS} words:\n${article}`
        );
        words = wordCount(article);
    }
    console.log(`PASS - ${words} words`);

    step("STEP 3: Summarize article");
    const summary = await ask(
        `Summarize this article in 2 sentences:\n${article}`
    );
    console.log(summary);

    printUsage(startedAt);
}

run().catch(err => {
    console.error("Run failed:", err.message);
    process.exitCode = 1;
});
