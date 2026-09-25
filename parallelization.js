// Pattern 3: Parallelization (sectioning)
// Independent reviewers look at the same resume at the same time with
// Promise.all, then an aggregator combines their scores into one verdict.

import { z } from "zod";
import { askObject, ask, header, step, printUsage } from "./lib/llm.js";

const RESUME = `
Jordan Lee - Data Analyst
Experience: Data Analyst, RetailCo (2022-2025)
- Built dashboards in Tableau used by 40 store managers
- Wrote SQL queries to track weekly sales, reducing report time by 60%
- Cleaned datasets in Python (pandas) for forecasting team
Skills: SQL, Python, Tableau, Excel, communicate with stakeholders
Education: B.S. Statistics, 2022
`;

const reviewSchema = z.object({
    score: z.number().min(1).max(10),
    strengths: z.array(z.string()),
    issues: z.array(z.string())
});

const REVIEWERS = {
    grammar: "You review resumes only for grammar, clarity, and consistent formatting.",
    ats: "You review resumes only for ATS (applicant tracking system) keyword match for a Data Analyst role.",
    technical: "You review resumes only for depth and relevance of technical skills for a Data Analyst role."
};

async function run() {
    const startedAt = Date.now();
    header("PARALLELIZATION: 3 reviewers in parallel -> aggregator");

    step("Running reviewers in parallel");
    const t0 = Date.now();
    const entries = await Promise.all(
        Object.entries(REVIEWERS).map(async ([name, system]) => {
            const review = await askObject(
                `Review this resume and return a score from 1-10.\n${RESUME}`,
                reviewSchema,
                system
            );
            console.log(`[${name}] finished at +${Date.now() - t0}ms`);
            return [name, review];
        })
    );
    console.log(`All reviewers done in ${Date.now() - t0}ms (wall clock)`);

    const reviews = Object.fromEntries(entries);
    for (const [name, review] of entries) {
        step(`${name.toUpperCase()} review (score ${review.score}/10)`);
        console.log("Strengths:", review.strengths.join("; "));
        console.log("Issues:   ", review.issues.join("; "));
    }

    step("AGGREGATOR");
    const average =
        entries.reduce((sum, [, review]) => sum + review.score, 0) / entries.length;
    console.log(`Average score: ${average.toFixed(1)}/10`);

    const verdict = await ask(
        `Three reviewers scored a resume. Combine their findings into a final ` +
        `verdict and the top 3 prioritized fixes.\n${JSON.stringify(reviews, null, 2)}`
    );
    console.log(verdict);

    printUsage(startedAt);
}

run().catch(err => {
    console.error("Run failed:", err.message);
    process.exitCode = 1;
});
