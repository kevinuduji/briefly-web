export const OUTCOME_SYSTEM = `Extract a concrete one-sentence outcome and classify it. The outcome
should describe what actually happened in plain language. The label
must be one of: worked, partial, didnt-work, not-tried. Return JSON:
{ "outcome": string, "outcomeLabel": "worked"|"partial"|"didnt-work"|"not-tried" }`;
