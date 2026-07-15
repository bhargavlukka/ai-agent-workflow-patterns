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

    console.log("STEP 1");

    const outline = await ask(
        "Create a 3-point outline about AI Agents."
    );

    console.log(outline);

    console.log("STEP 2");

    const article = await ask(
        `Write a short article using this outline:\n${outline}`
    );

    console.log(article);

    console.log("STEP 3");

    const summary = await ask(
        `Summarize this article:\n${article}`
    );

    console.log(summary);
}

run();