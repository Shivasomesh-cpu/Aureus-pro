# 🏛️ AUREUS — AI-Assisted Financial Management Platform

<p align="center">
  <img src="https://img.shields.io/badge/React-19.1.1-61DAFB?logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.8.2-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-6.4.3-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.4.19-38B2AC?logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/AI-Google%20Gemini-4285F4?logo=google&logoColor=white" alt="Google Gemini" />
  <img src="https://img.shields.io/badge/License-MIT-amber" alt="License" />
</p>

Aureus is an executive-grade, forward-looking personal financial management platform built to model, simulate, and optimize wealth trajectory. Rather than acting as a simple retrospective expense tracker, Aureus pairs **stochastic financial modeling (Monte Carlo simulations, temporal pattern extraction, real-time what-if scenario testing)** with **Generative AI** to provide predictive forecasting, lifestyle creep analysis, and autonomous budget tuning.

---

## 🌟 Key Features

### 📊 Executive Financial Dashboard
- **Real-Time Financial Health Score:** Composite wellness metric (0–100) dynamically calculated from debt-to-income ratios, emergency fund coverage, and savings rates.
- **Velocity & Trend Analysis:** Net cash flow tracking with monthly velocity comparisons and velocity badges.
- **Smart Natural Language Input:** Enter transactions via natural language text or voice recognition with instantaneous category deduction and date inference (supported by offline keyword heuristics).
- **Recent Activities & Controls:** Filter by category chips, toggle by transaction type, search descriptions/notes with instant clear, and export records to CSV.

### ⚗️ Aureus Intelligence Suite
- **Aureus Alchemist (What-If Budget Simulator):** Real-time interactive sliders (-50% to +50%) for discretionary budget categories with instant feedback on Health Score delta, monthly savings impact, and savings goal acceleration.
- **The Life Architect (10-Year Monte Carlo Engine):** 1,000-path stochastic wealth forecasting modeling market variance ($\mu=7\%$, $\sigma=15\%$), inflation assumptions, and major life target milestones.
- **Deep Behavioral DNA Engine:** Transaction clustering and entropy analysis that classifies spending profiles into defined archetypes (e.g. *Disciplined Builder*, *Balanced Growth*, *High-Velocity Spender*).
- **Wealth Momentum Heatmap:** Visualizes daily and weekly net cash flow velocity over 90 days.
- **Interactive Subscription Audit:** Identifies recurring charges and detects "zombie" subscriptions with 1-click status updates.
- **Autonomous Budget Tuning:** Heuristic optimization algorithms that recommend optimal category adjustments.

### 💳 Wealth & Debt Architecture
- **Debt Elimination Strategies:** Side-by-side comparison of **Debt Avalanche** (interest rate priority) vs. **Debt Snowball** (balance priority) with interest savings forecasts.
- **Multi-Currency System:** Dynamic support for USD (`$`), EUR (`€`), GBP (`£`), and INR (`₹`) with locale-aware number formatting.
- **Realistic Multi-Month Demo Seeder:** 1-click realistic demo scenario based on verified demographic income and expense patterns across all supported currencies.

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/VeeraM-SYS/Aureus-AI-Assisted-Financial-Management.git
   cd Aureus-AI-Assisted-Financial-Management
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables (Optional):**
   Copy `.env` and set your Google Gemini API key if you want cloud AI features:
   ```env
   VITE_GEMINI_API_KEY="your-gemini-api-key-here"
   ```
   > *Note:* If no API key is provided, Aureus automatically runs in **offline mode**, using built-in heuristic NLP parsing and localized keyword analysis.

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Build for production:**
   ```bash
   npm run build
   ```

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | [React 19](https://react.dev/) + [TypeScript 5.8](https://www.typescriptlang.org/) |
| **Bundler & Tooling** | [Vite 6](https://vitejs.dev/) |
| **Styling & Design System** | [Tailwind CSS 3](https://tailwindcss.com/) + Glassmorphic luxury fintech tokens |
| **Data Visualization** | [Recharts 3](https://recharts.org/) |
| **AI Integration** | [@google/genai SDK](https://github.com/google/generative-ai-js) (Gemini 1.5 Flash) + Local NLP Fallback |
| **Persistence** | Synchronous LocalStorage Document Architecture |

---

## 📚 Project Documentation

- **[Technical Architecture Specification](README_TECHNICAL_ARCHITECTURE.md):** In-depth topological blueprints, algorithmic formulas, component catalog, and data schemas.
- **[Audit, Bugs & Remediation Log](README_BUGS_AND_DISCREPANCIES.md):** Complete record of functional audits, security scrubs, and verified fixes.
- **[Strategic Roadmap & Advancements](README_IMPROVEMENTS_AND_ADVANCEMENTS.md):** Evolutionary milestones across backend gateways, exact integer cents, and multi-agent AI advisory councils.
- **[System Requirements Specification](Aureus_SRS.md):** Formal functional and non-functional requirements contract.

---

## 📄 License

This project is licensed under the MIT License.
