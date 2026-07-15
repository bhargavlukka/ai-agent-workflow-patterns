import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import dotenv from "dotenv";

dotenv.config();

async function ask(prompt) {
    const { text } = await generateText({
        model: openai("gpt-4.1-mini"),
        prompt
    });

    return text;
}

async function run() {

    const market = await ask(
        "Give Tesla market analysis."
    );

    const finance = await ask(
        "Give Tesla financial analysis."
    );

    const risk = await ask(
        "Give Tesla risk analysis."
    );

    const report = await ask(
`
Combine these into one report:

${market}

${finance}

${risk}
`
    );

    console.log(report);
}

run();