# Aureus

A browser-based personal finance dashboard for tracking transactions, budgets, savings goals, debts, and recurring expenses. It also lets you record retirement assumptions and monthly SIP or other investment contributions to explore an illustrative long-term projection.

## Features

- Import transactions from CSV or pasted statement text, or add them manually.
- Review monthly income, expenses, budgets, recurring bills, and savings goals.
- Compare snowball and avalanche debt payoff scenarios.
- Record retirement age, current savings, desired retirement income, and recurring investment contributions.
- Explore scenario tools based on transactions you have entered.
- Store financial data in browser local storage.

## Important limits

- Aureus does not connect to banks or brokers, fetch live stock prices, recommend investments, or submit trades.
- Retirement projections use the return assumptions you enter. They are illustrations, not forecasts or financial advice.
- Data in local storage is not encrypted by Aureus, does not sync between devices, and may be removed when browser data is cleared. Export important records separately.
- Optional Gemini features send the question and summarized financial figures to Google when configured with an API key. Do not put a production API key in a public client-side deployment.
- Aureus does not provide tax estimates, credit bureau scores, or tax filing advice.

## Run locally

Requirements: Node.js 18+ and npm.

```bash
npm install
npm run dev
```

Create a production build with:

```bash
npm run build
```

Without `VITE_GEMINI_API_KEY`, supported language features use local parsing rules. Set the key only for local/private experimentation; client-side environment values are included in the browser bundle.
