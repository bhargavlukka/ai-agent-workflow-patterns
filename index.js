// Setup check: confirms the API key and model work before running the patterns.

import { ask, MODEL } from "./lib/llm.js";

async function run() {
    const text = await ask("Say hello to Bhargava");
    console.log(`[${MODEL}] ${text}`);
}

run().catch(err => {
    console.error("Run failed:", err.message);
    process.exitCode = 1;
});
