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

    let article = await ask(
        "Write a bad article about AI."
    );

    const feedback = await ask(
`
Evaluate this article:

${article}

Tell me how to improve it.
`
    );

    const improved = await ask(
`
Improve this article:

${article}

Feedback:

${feedback}
`
    );

    console.log(improved);
}

run();