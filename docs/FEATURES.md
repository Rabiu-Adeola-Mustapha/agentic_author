# Features Documentation

## User Authentication & Authorization

### Registration Flow

**Endpoint**: `POST /api/auth/register`

1. User submits email and password
2. Password hashed with bcryptjs
3. User created in MongoDB with `isVerified = false`
4. OTP code generated and emailed
5. User redirected to OTP verification page

**Related Components**:
- `app/(auth)/signup/page.tsx` - Signup UI
- `components/auth/SignupForm.tsx` - Form handling
- `lib/db/models/User.ts` - User schema
- `lib/email/mailer.ts` - Email sending

### Email Verification (OTP)

**Endpoints**:
- `POST /api/otp/send` - Send OTP to email
- `POST /api/otp/verify` - Verify OTP code

**Flow**:
1. OTP code generated (6 digits, 10-min expiry)
2. Code sent via Gmail
3. User enters code on verification page
4. Code matched against database
5. User marked as verified

**Related Models**:
- `OtpCode` - Stores OTP codes and expiry times

### Session Management

Uses NextAuth.js v5 with JWT strategy:
- Token expires after 30 days
- Session data includes userId and subscription plan
- Middleware protects dashboard routes

**Protected Routes**:
- `/dashboard/*`
- `/api/projects/*`
- `/api/pipeline/*`

## Project Management

### Creating Projects

**Endpoint**: `POST /api/projects`

**Payload**:
```json
{
  "title": "Project Title",
  "description": "Project description",
  "category": "Technology|Business|Health|Education|Other",
  "contentType": "Blog Post|Article|Report|Guide|Other"
}
```

**Validation**:
- Title: required, 1-200 characters
- Description: optional, max 500 characters
- Category: must match allowed categories

**Database Model** (`Project`):
```typescript
{
  userId: ObjectId,
  title: String,
  description: String,
  category: String,
  contentType: String,
  status: 'draft' | 'in_progress' | 'completed',
  createdAt: Date,
  updatedAt: Date
}
```

### Viewing Projects

**Endpoint**: `GET /api/projects`

Returns list of all projects for authenticated user with pagination support.

### Project Details

**Endpoint**: `GET /api/projects/:id`

Returns detailed project info including:
- Generated content outline
- Research findings
- Final output
- Export history
- Generation status

### Deleting Projects

**Endpoint**: `DELETE /api/projects/:id`

Soft deletes project - marks as deleted without removing data.

## Content Generation Pipeline

### Overview

The pipeline orchestrates 5 AI agents to generate content:

```
User Input → Planner → Researcher → Writer → Prompt Writer → Evaluator → Output
```

### Pipeline Execution

**Endpoint**: `POST /api/pipeline/run`

**Payload**:
```json
{
  "projectId": "project-id",
  "topic": "Content topic",
  "additionalContext": "Optional context"
}
```

### Agent Details

#### 1. Planner Agent
- **Purpose**: Creates detailed content outline
- **Input**: User topic and context
- **Output**: JSON outline with sections and subsections
- **Model**: Claude (via OpenRouter)
- **File**: `lib/agents/planner.ts`

```typescript
interface OutlineSection {
  title: string;
  subsections: string[];
  estimatedLength: number;
}

interface ContentOutline {
  mainTopic: string;
  outline: OutlineSection[];
  keyPoints: string[];
}
```

#### 2. Researcher Agent
- **Purpose**: Gathers information for each section
- **Input**: Content outline, topic
- **Output**: Research findings per section
- **Data Sources**:
  - DuckDuckGo Search (Primary)
- **Features**:
  - Sequential execution to avoid rate limits.
  - Jittered delays for human-like behavior.
  - Automatic retries with exponential backoff.
- **File**: `lib/agents/researcher.ts`

```typescript
interface ResearchFinding {
  section: string;
  findings: string;
  sources: Array<{ title: string; url: string }>;
}
```

#### 3. Writer Agent
- **Purpose**: Drafts content based on outline and research
- **Input**: Outline, research findings
- **Output**: Complete drafted content
- **Features**:
  - Maintains consistent tone
  - Follows outline structure
  - Incorporates research seamlessly
- **File**: `lib/agents/writer.ts`

#### 4. Prompt Writer Agent
- **Purpose**: Generates optimized prompts for content
- **Input**: Generated content
- **Output**: SEO-optimized prompts and meta descriptions
- **File**: `lib/agents/prompt-writer.ts`

```typescript
interface GeneratedPrompt {
  mainPrompt: string;
  metadata: {
    description: string;
    keywords: string[];
    seoTitle: string;
  };
}
```

#### 5. Evaluator Agent
- **Purpose**: Assesses content quality and suggests improvements.
- **Input**: Generated content
- **Output**: Quality scores (Overall, Alignment, Quality), issues, and suggestions.
- **Criteria**:
  - Identity and Role adherence.
  - Adherence to formatting rules.
  - Integration of key insights.
- **Status**: Always marks project as `completed` to allow user review of feedback.
- **File**: `lib/agents/evaluator.ts`

```typescript
interface EvaluationResult {
  qualityScore: number; // 0-100
  feedback: string;
  suggestions: string[];
  readyForPublish: boolean;
}
```

### Pipeline Orchestration

**File**: `lib/orchestrator/pipeline.ts`

**Flow**:
1. Validate user input and project
2. Check subscription limits
3. Execute agents in sequence
4. Store intermediate results
5. Update project status
6. Send completion email

**Database Models**:
- `Plan` - Stores outline from Planner
- `Research` - Stores research findings
- `Output` - Stores final generated content
- `Evaluation` - Stores quality assessment

### Guardrails

**Input Sanitization** (`lib/guardrails/sanitizer.ts`):
- Validates topic length (5-500 characters)
- Removes malicious patterns
- Normalizes whitespace

**Output Validation** (`lib/guardrails/validator.ts`):
- Ensures content quality
- Checks for completeness
- Validates JSON structures

## Content Export

### Export Formats

#### DOCX Export

**Endpoint**: `GET /api/export/:id?format=docx`

**Features**:
- Formatted document with title and styling
- Proper heading hierarchy
- Page breaks between sections
- Metadata (author, creation date)
- File**: `lib/export/docx.ts`

**Limitations**:
- Max 2MB output
- Basic formatting only

#### PDF Export

**Endpoint**: `GET /api/export/:id?format=pdf`

**Features**:
- Professional PDF layout
- Headers and footers
- Page numbers
- Table of contents
- **File**: `lib/export/pdf.ts`

**Limitations**:
- Single-page or multi-page based on content length

## Subscription & Payments

### Subscription Plans

#### Free Plan
- 3 active projects
- 5 generations per month
- Basic features only

#### Pro Plan
- Unlimited projects
- Unlimited generations
- Priority API access
- Premium support

### Payment Integration

**Stripe Integration**: Paystack

**Payment Flow**:
1. User initiates subscription upgrade
2. Redirected to Paystack checkout
3. Payment processed
4. Webhook confirms payment
5. Subscription status updated

**Endpoints**:
- `POST /api/payments/initialize` - Create payment link
- `POST /api/payments/webhook` - Paystack webhook handler

**Database Models**:
- `Subscription` - Tracks user plan and status
- `Payment` - Records all transactions

```typescript
interface Subscription {
  userId: ObjectId;
  plan: 'free' | 'pro';
  status: 'active' | 'inactive';
  expiresAt?: Date;
  paymentHistory: ObjectId[]; // References to Payment docs
}

interface Payment {
  userId: ObjectId;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  paymentRef: string;
  createdAt: Date;
}
```

### Subscription Limits

Free users limited by:
- Project count (checked on creation)
- Monthly generation quota (tracked in store)
- Feature access (enforced in UI)

Pro users bypass all limits.

## Search Integration

### Tavily Search

**Primary search engine** - Real-time web search

**Integration**: `lib/search/tavily.ts`

```typescript
interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

async function searchWithTavily(query: string): Promise<SearchResult[]>
```

**Usage**:
- Called by Researcher agent for data gathering
- Returns top 5-10 most relevant results

### DuckDuckGo Fallback

Used if Tavily fails or rate-limited

**Integration**: `lib/search/tavily.ts` (with fallback)

## Email Services

### OTP Emails

Sent via Gmail with:
- 6-digit OTP code
- 10-minute expiry warning
- Clear instructions

### Verification Completion

Confirms successful email verification

### Generation Completion

Notifies user when content generation finishes

**Configuration**: `lib/email/mailer.ts`

```typescript
interface EmailOptions {
  to: string;
  subject: string;
  template: 'otp' | 'verification' | 'completion';
  data: Record<string, any>;
}
```

## Dashboard & UI

### Dashboard Home

Shows:
- User statistics (total projects, generations)
- Recent projects
- Subscription status
- Quick actions

**Page**: `app/(dashboard)/dashboard/page.tsx`

### Projects Page

Lists all user projects with:
- Create new project button
- Project cards showing status
- Search and filter options
- Delete functionality

**Page**: `app/(dashboard)/projects/page.tsx`

### Project Details

Shows project status and allows:
- Viewing generated content
- Exporting content
- Running new generation
- Deleting project

**Page**: `app/(dashboard)/projects/[id]/page.tsx`

### Billing Page

Displays:
- Current subscription plan
- Usage statistics
- Upgrade button
- Payment history

**Page**: `app/(dashboard)/billing/page.tsx`

## State Management

Uses Zustand for pipeline state:

**Store**: `store/pipeline.store.ts`

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

Tracks pipeline progress in real-time and updates UI accordingly.

---

**For implementation details**, refer to the code and comments in each module.
