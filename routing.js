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

    const question = "How do SQL joins work?";

    if (
        question.includes("SQL") ||
        question.includes("Python")
    ) {

        console.log("Routing to Coding Agent");

        const answer = await ask(
            `Answer this coding question: ${question}`
        );

        console.log(answer);

    } else {

        console.log("Routing to General Agent");

        const answer = await ask(question);

        console.log(answer);
    }
}

run();