# Execution logs

Captured console output from running each pattern. Regenerate with:

```bash
for p in prompt-chaining routing parallelization orchestrator evaluator; do
  node $p.js 2>&1 | tee logs/$p.log
done
```

| Log | Pattern |
|---|---|
| `prompt-chaining.log` | 1. Prompt Chaining |
| `routing.log` | 2. Routing |
| `parallelization.log` | 3. Parallelization |
| `orchestrator.log` | 4. Orchestrator-Workers |
| `evaluator.log` | 5. Evaluator-Optimizer |
