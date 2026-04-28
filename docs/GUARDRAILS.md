# Security & Guardrails

Agentic Author implements a multi-layered security architecture to protect against malicious prompts, ensure output quality, and prevent prompt injection attacks.

## 🛡️ Input Guardrails

### 1. Input Sanitizer
**Path**: `lib/guardrails/input-sanitizer.ts`

- **Purpose**: Cleans raw user input before it reaches the AI agents.
- **Actions**:
    - Trims whitespace.
    - Removes common malicious character patterns.
    - Enforces length constraints (minimum 5, maximum 500 characters).
    - Normalizes text encoding.

### 2. Prompt Guard
**Path**: `lib/guardrails/prompt-guard.ts`

- **Purpose**: Detects malicious intent, such as attempts to jailbreak the model or extract system prompts.
- **Logic**:
    - **Regex Layer**: Scans for "ignore previous instructions", "system prompt", and "developer mode" patterns.
    - **Semantic Layer**: Uses a lightweight LLM call to categorize the prompt's intent.
- **Outcomes**: Triggers a rejection if a high-risk pattern is detected.

### 3. Security Check (Hybrid Model)
**Path**: `lib/guardrails/security-check.ts`

- **Purpose**: Orchestrates multiple security providers to provide a "Risk Level" (Safe, Low, Medium, High).
- **Architecture**:
    - **Primary**: Claude/OpenRouter analysis.
    - **Secondary**: Llama Guard (if configured/available).
- **Decision Logic**: Blocks "High" risk prompts and sanitizes "Medium" risk prompts.

---

## 🏗️ Output Guardrails

### 1. Output Validator
**Path**: `lib/guardrails/output-validator.ts`

- **Purpose**: Ensures that AI-generated responses are safe, complete, and correctly formatted.
- **Verification Steps**:
    - **Schema Validation**: Uses **Zod** to ensure JSON responses match the expected structure (crucial for agents).
    - **Safety Scan**: Checks for prohibited content in the generated prose.
    - **Format Check**: Verifies Markdown integrity and citation accuracy.

### 2. Evaluator Agent
**Path**: `lib/agents/evaluator.ts`

- **Purpose**: A specialized agent that acts as a quality gate.
- **Logic**:
    - Scores the final content on **Alignment**, **Quality**, and **Accuracy**.
    - If the score is low, it provides a list of `issues` and `suggestions` for the user.
    - Marks the project as `completed` with a quality assessment.

---

## 🔐 System Security

- **Authentication**: NextAuth.js v5 with JWT strategy and middleware-level route protection.
- **Verification**: Mandatory email OTP verification for all new accounts.
- **Database**: Mongoose schemas with strict typing and input validation.
- **API Security**: Request rate limiting (via DDG loop) and authenticated-only endpoints.
