// Pattern 2: Routing
// An LLM classifies each input, then the input is sent to a specialized
// handler (its own system prompt) for that category. This replaces the
// earlier keyword check, which missed questions like "How do I reverse a
// linked list?" that contain neither "SQL" nor "Python".

import { z } from "zod";
import { ask, askObject, header, step, printUsage } from "./lib/llm.js";

const ROUTES = {
    coding: "You are a senior software engineer. Answer with a short explanation and a small code example.",
    billing: "You are a polite billing support agent. Be concise and list clear next steps for the customer.",
    general: "You are a helpful general assistant. Answer clearly in a few sentences."
};

const classificationSchema = z.object({
    category: z.enum(["coding", "billing", "general"]),
    confidence: z.number().min(0).max(1),
    reasoning: z.string()
});

const QUESTIONS = [
    "How do SQL joins work?",
    "I was charged twice for my subscription this month, what should I do?",
    "What are some good habits for staying productive while working from home?"
];

async function route(question) {
    step(`INPUT: "${question}"`);

    const decision = await askObject(
        `Classify this user question into one category: coding, billing, or general.\n\nQuestion: ${question}`,
        classificationSchema
    );
    console.log(
        `Router -> ${decision.category} (confidence ${decision.confidence}): ${decision.reasoning}`
    );

    const answer = await ask(question, ROUTES[decision.category]);
    console.log(`\n[${decision.category} agent]\n${answer}`);
}

async function run() {
    const startedAt = Date.now();
    header("ROUTING: LLM classifier -> specialized agent");

    for (const question of QUESTIONS) {
        await route(question);
    }

    printUsage(startedAt);
}

run().catch(err => {
    console.error("Run failed:", err.message);
    process.exitCode = 1;
});
