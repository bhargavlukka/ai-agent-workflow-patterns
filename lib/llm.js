import { generateText, Output, NoObjectGeneratedError, NoOutputGeneratedError } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

// Keep execution logs readable; provider compatibility notices are not errors.
globalThis.AI_SDK_LOG_WARNINGS = false;

// LLM_PROVIDER picks the backend: "openai" (direct) or "anthropic"
// (Claude, optionally through a gateway such as SharedLLM via
// ANTHROPIC_BASE_URL + ANTHROPIC_EXTRA_HEADERS). The pattern code in the
// five scripts is identical either way.
const PROVIDER = (process.env.LLM_PROVIDER || "openai").toLowerCase();

function requireEnv(name) {
    if (!process.env[name]) {
        console.error(`${name} is not set. Copy .env.example to .env and fill it in.`);
        process.exit(1);
    }
    return process.env[name];
}

function createModel() {
    if (PROVIDER === "anthropic") {
        const base = process.env.ANTHROPIC_BASE_URL;
        const anthropic = createAnthropic({
            apiKey: requireEnv("ANTHROPIC_API_KEY"),
            // The AI SDK appends "/messages", so the base must end in /v1.
            baseURL: base ? base.replace(/\/+$/, "").replace(/(\/v1)?$/, "/v1") : undefined,
            headers: process.env.ANTHROPIC_EXTRA_HEADERS
                ? JSON.parse(process.env.ANTHROPIC_EXTRA_HEADERS)
                : undefined
        });
        const name = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
        return { name, model: anthropic(name) };
    }

    const openai = createOpenAI({ apiKey: requireEnv("OPENAI_API_KEY") });
    const name = process.env.OPENAI_MODEL || "gpt-4.1-mini";
    return { name, model: openai(name) };
}

const { name: MODEL, model } = createModel();
export { MODEL };
const usage = { calls: 0, inputTokens: 0, outputTokens: 0 };

function track(result) {
    usage.calls += 1;
    usage.inputTokens += result.usage?.inputTokens ?? 0;
    usage.outputTokens += result.usage?.outputTokens ?? 0;
}

// Plain text completion.
export async function ask(prompt, system) {
    const result = await generateText({ model, system, prompt, maxOutputTokens: 4096 });
    track(result);
    return result.text;
}

// Structured completion validated against a zod schema. Some models
// (e.g. gpt-oss) occasionally return JSON that fails validation, so a
// failed parse is retried a bounded number of times and logged.
const MAX_OBJECT_ATTEMPTS = 3;

export async function askObject(prompt, schema, system) {
    for (let attempt = 1; ; attempt++) {
        try {
            const result = await generateText({
                model,
                system,
                prompt,
                maxOutputTokens: 4096,
                output: Output.object({ schema })
            });
            track(result);
            return result.output;
        } catch (err) {
            usage.calls += 1;
            if (!NoOutputGeneratedError.isInstance(err) && !NoObjectGeneratedError.isInstance(err)
                || attempt >= MAX_OBJECT_ATTEMPTS) {
                throw err;
            }
            console.log(`[retry] structured output did not match schema (attempt ${attempt}/${MAX_OBJECT_ATTEMPTS})`);
        }
    }
}

export function header(title) {
    console.log(`\n${"=".repeat(70)}\n${title}\n${"=".repeat(70)}`);
}

export function step(label) {
    console.log(`\n--- ${label} ---`);
}

export function printUsage(startedAt) {
    const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
    console.log(
        `\n[run stats] model=${MODEL} llm_calls=${usage.calls} ` +
        `input_tokens=${usage.inputTokens} output_tokens=${usage.outputTokens} ` +
        `elapsed=${seconds}s`
    );
}
