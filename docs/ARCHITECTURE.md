# Architecture Documentation

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  Auth    │  │Dashboard │  │ Projects │  │ Pipeline │    │
│  │  Pages   │  │  Pages   │  │  Pages   │  │   UI     │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
├─────────────────────────────────────────────────────────────┤
│                  NextAuth Middleware                         │
│         (Session validation & route protection)              │
├─────────────────────────────────────────────────────────────┤
│                   API Routes (Backend)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │Auth API  │  │Project   │  │Pipeline  │  │ Export   │    │
│  │          │  │API       │  │API       │  │ API      │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
├─────────────────────────────────────────────────────────────┤
│                   Security & Guardrails                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │Prompt    │  │Security  │  │Input     │  │Output    │    │
│  │Guard     │  │Check     │  │Sanitizer │  │Validator │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
├─────────────────────────────────────────────────────────────┤
│              Core Business Logic Layer                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Orchestrator (Pipeline Coordination)                 │   │
│  │ ┌────────┐ ┌──────────┐ ┌───────┐ ┌───────────────┐ │   │
│  │ │Planner │→│Researcher│→│Writer │→│Evaluator      │ │   │
│  │ │Agent   │ │Agent     │ │Agent  │ │Agent          │ │   │
│  │ └────────┘ └──────────┘ └───────┘ └───────────────┘ │   │
│  └──────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│              External Services Integration                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │OpenRouter│  │  Search  │  │ Email    │  │Payments  │    │
│  │(LLM)     │  │  (DDG)   │  │(Gmail)   │  │(Paystack)│    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
├─────────────────────────────────────────────────────────────┤
│                   Data Layer                                 │
│              MongoDB (Mongoose ODM)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  User    │  │ Project  │  │  Output  │  │Research  │    │
│  │          │  │          │  │          │  │          │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Architectural Patterns

### 1. Multi-Agent Architecture

The system uses a **sequential agent pattern** where each agent is responsible for a specific task:

```
Agent Pattern:
┌─────────────┐
│  Base Agent │ (Abstract base class)
│  - execute()│
│  - prompt() │
└──────┬──────┘
       ↓
┌─────────────────────────────────────┐
│  Specialized Agents                 │
├─────────────────────────────────────┤
│ • PlannerAgent                      │
│ • ResearcherAgent                   │
│ • WriterAgent                       │
│ • EvaluatorAgent                    │
│ • PromptWriterAgent                 │
└─────────────────────────────────────┘
```

**Benefits**:
- Separation of concerns
- Easy to test individual agents
- Simple to add new agents
- Clear data flow

**Implementation**: `lib/agents/base-agent.ts`

### 2. Orchestrator Pattern

**Pipeline Orchestrator** coordinates agent execution:

```typescript
class ContentPipeline {
  async generate(projectId, topic) {
    const outline = await this.planner.execute(topic);
    const research = await this.researcher.execute(outline);
    const draft = await this.writer.execute(outline, research);
    const optimized = await this.promptWriter.execute(draft);
    const evaluation = await this.evaluator.execute(optimized);
    return { outline, research, draft, optimized, evaluation };
  }
}
```

**Key Features**:
- Sequential execution
- Error handling and recovery
- Progress tracking
- State persistence

**Implementation**: `lib/orchestrator/pipeline.ts`

### 3. Repository Pattern

Database operations abstracted through models:

```typescript
// Data access through Mongoose models
const user = await UserModel.findById(id);
const project = await ProjectModel.create(data);
const output = await OutputModel.findByProjectId(projectId);
```

**Benefits**:
- Abstraction over database
- Consistent query patterns
- Easy to unit test

### 4. Middleware Pattern

Request processing pipeline:

```
Request → NextAuth Middleware → Authentication → Route Handler → Response
           (Session validation)  (User identity)
```

Protected routes checked by middleware before reaching handlers.

## Data Flow

### Content Generation Flow

```
1. User Input
   ├─ topic: string
   ├─ projectId: ObjectId
   └─ context?: string

2. Planner Agent
   └─→ Outline (sections, subsections, key points)

3. Researcher Agent
   ├─→ Web Search (Tavily)
   └─→ Research Findings (per section)

4. Writer Agent
   └─→ Draft Content (formatted prose)

5. Prompt Writer Agent
   └─→ Optimized Prompts & Metadata

6. Evaluator Agent
   ├─→ Quality Score
   ├─→ Feedback
   └─→ Suggestions

7. Storage
   ├─→ Save Output
   ├─→ Update Project Status
   └─→ Send Completion Email

8. User Notification
   └─→ Email confirmation
```

### Authentication Flow

```
1. User Signup
   ├─→ Password hashed (bcryptjs)
   ├─→ User created (isVerified: false)
   ├─→ OTP generated
   └─→ OTP sent via email

2. OTP Verification
   ├─→ User submits code
   ├─→ Code validated
   ├─→ User marked verified
   └─→ Redirect to login

3. Login
   ├─→ Email & password submitted
   ├─→ Password verified
   ├─→ JWT token created
   └─→ Session established

4. Protected Access
   └─→ Middleware validates JWT
```

## Database Schema

### Core Models

```
User
├─ email: String (unique)
├─ passwordHash: String
├─ isVerified: Boolean
├─ subscription: {
│  ├─ plan: 'free' | 'pro'
│  ├─ status: 'active' | 'inactive'
│  └─ expiresAt: Date?
├─ createdAt: Date
└─ updatedAt: Date

Project
├─ userId: ObjectId → User
├─ title: String
├─ description: String
├─ category: String
├─ contentType: String
├─ status: 'draft' | 'in_progress' | 'completed'
├─ createdAt: Date
└─ updatedAt: Date

Plan
├─ projectId: ObjectId → Project
├─ outline: JSON
├─ keyPoints: [String]
├─ estimatedLength: Number
└─ createdAt: Date

Research
├─ projectId: ObjectId → Project
├─ findings: JSON
├─ sources: [{ title, url }]
└─ createdAt: Date

Output
├─ projectId: ObjectId → Project
├─ content: String
├─ metadata: JSON
├─ exportedAs: ['docx' | 'pdf']
└─ createdAt: Date

Evaluation
├─ projectId: ObjectId → Project
├─ score: Number (0-100)
├─ feedback: String
├─ suggestions: [String]
└─ createdAt: Date

OtpCode
├─ email: String
├─ code: String (6 digits)
├─ expiresAt: Date
├─ isUsed: Boolean
└─ createdAt: Date

Subscription
├─ userId: ObjectId → User
├─ plan: 'free' | 'pro'
├─ status: 'active' | 'inactive'
├─ expiresAt: Date?
└─ createdAt: Date

Payment
├─ userId: ObjectId → User
├─ amount: Number
├─ currency: String
├─ status: 'pending' | 'completed' | 'failed'
├─ paymentRef: String
└─ createdAt: Date
```

## API Architecture

### Route Organization

```
/api/
├─ auth/
│  ├─ [...nextauth]/route.ts      → NextAuth handler
│  └─ register/route.ts            → User registration
├─ projects/
│  ├─ route.ts                     → GET (list), POST (create)
│  ├─ [id]/route.ts                → GET (detail), DELETE
│  └─ [id]/status/route.ts         → GET (generation status)
├─ pipeline/
│  └─ run/route.ts                 → POST (start generation)
├─ export/
│  └─ [id]/route.ts                → GET (export DOCX/PDF)
├─ otp/
│  ├─ send/route.ts                → POST (send OTP)
│  └─ verify/route.ts              → POST (verify code)
└─ payments/
   ├─ initialize/route.ts          → POST (create order)
   └─ webhook/route.ts             → POST (Paystack webhook)
```

### Request/Response Pattern

**Standard Success Response**:
```typescript
{
  success: true,
  data: T,
  message?: string
}
```

**Standard Error Response**:
```typescript
{
  success: false,
  error: string,
  statusCode: number
}
```

## State Management

### Frontend State (Zustand)

**Pipeline Store** (`store/pipeline.store.ts`):
- Tracks generation progress
- Stores output data
- Manages error states
- Persisted to localStorage

```typescript
interface PipelineState {
  projectId: string | null;
  status: 'idle' | 'running' | 'completed' | 'error';
  progress: {
    planner: boolean;
    researcher: boolean;
    writer: boolean;
    promptWriter: boolean;
    evaluator: boolean;
  };
  output: OutputData | null;
  error: string | null;
}
```

### Backend State

- **Session State**: JWT tokens (NextAuth)
- **Database State**: Persistent project and generation data
- **Cache**: None currently (can be added with Redis)

## Error Handling

### Validation Layer

**Input Sanitization** (`lib/guardrails/sanitizer.ts`):
```typescript
function sanitizeInput(input: string): string {
  // Remove special characters
  // Validate length
  // Normalize whitespace
  return cleaned;
}
```

**Output Validation** (`lib/guardrails/validator.ts`):
```typescript
function validateOutput(output: string): ValidationResult {
  // Check completeness
  // Validate structure
  // Verify quality metrics
  return { isValid, errors };
}
```

### API Error Handling

```typescript
try {
  // Process request
} catch (error) {
  if (error instanceof ValidationError) {
    return json({ success: false, error: "Validation failed" }, 400);
  }
  if (error instanceof AuthenticationError) {
    return json({ success: false, error: "Unauthorized" }, 401);
  }
  // Log error
  return json({ success: false, error: "Server error" }, 500);
}
```

## External Integrations

### OpenRouter (LLM)

**Purpose**: AI model inference for all agents

**Configuration**:
- Base URL: `https://openrouter.ai/api/v1`
- Model: Claude 3.5 Sonnet (configurable)
- Temperature: 0.7 (creative but stable)

**Usage**:
```typescript
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'anthropic/claude-3.5-sonnet',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  }),
});
```

### Tavily Search

**Purpose**: Real-time web search for research

**Configuration**:
- API endpoint: `https://api.tavily.com/search`
- Default: 5 search results
- Fallback: DuckDuckGo search

### Gmail (Email)

**Purpose**: OTP and notification emails

**Configuration**:
- Uses Nodemailer
- App-specific password required
- Rate limited to 100/minute

### Paystack (Payments)

**Purpose**: Subscription billing

**Configuration**:
- API endpoint: `https://api.paystack.co`
- Webhook for payment confirmation
- Support for NGN, GHS currencies

## Performance Considerations

### Database Optimization

- **Indexing**: User emails, project IDs
- **Query optimization**: Lean queries where possible
- **Connection pooling**: MongoDB maxPoolSize: 10

### API Performance

- **Caching**: Consider Redis for search results
- **Rate limiting**: Can be added with express-rate-limit
- **Pagination**: Implement for large result sets

### Content Generation

- **Sequential execution**: Agents run in order (no parallelization)
- **Timeout**: Can be added for long-running agents
- **Progress tracking**: Real-time UI updates

## Scalability Approach

### Horizontal Scaling

1. **Stateless API**: Can run multiple instances behind load balancer
2. **Database**: MongoDB Atlas handles scaling
3. **External services**: OpenRouter, Tavily scale with API

### Vertical Scaling

1. **Model optimization**: Smaller models for faster generation
2. **Caching**: Cache research results
3. **Async jobs**: Move long operations to background queue

### Future Improvements

1. **Message Queue**: Celery/Bull for async generation
2. **Caching**: Redis for frequently accessed data
3. **CDN**: CloudFlare for static assets
4. **Database Sharding**: If user base exceeds 1M

## 🛡️ Security Architecture

The project employs a tiered guardrail system to ensure safety and quality at every stage of the pipeline.

### 1. Input Guardrails
- **Input Sanitizer**: Normalizes user input and prevents XSS/malicious character patterns.
- **Prompt Guard**: Uses regex and semantic analysis to detect "jailbreak" attempts or system prompt extraction.
- **Security Check**: A hybrid model utilizing Claude and LlamaGuard to assign risk levels (Safe, Low, Medium, High).

### 2. Pipeline Guardrails
- **Sequential Search**: Controlled rate of web requests with jitter to prevent blocking and maintain anonymity.
- **Agent Confinement**: Each agent operates within a strictly defined identity and role, limiting the potential impact of hallucination.

### 3. Output Guardrails
- **Output Validator**: Uses Zod schemas to ensure AI responses are structured correctly for the next agent in the chain.
- **Evaluator Agent**: Performs a final "peer review" of the generated content, scoring it and providing actionable improvement suggestions.

---

For implementation details, refer to the code comments and individual module documentation.
