# Development Guide

## Local Setup

### Prerequisites

- Node.js 18.17+ (check: `node --version`)
- npm 9+ (check: `npm --version`)
- Git
- MongoDB Atlas account (free tier)
- Code editor (VS Code recommended)

### Step 1: Clone Repository

```bash
git clone https://github.com/yourusername/agentic_author.git
cd agentic_author
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Environment Setup

1. Copy example file:
```bash
cp .env.example .env
```

2. Get API keys:
   - **NEXTAUTH_SECRET**: Generate with:
     ```bash
     openssl rand -base64 32
     ```
   - **MONGODB_URI**: From MongoDB Atlas connection string
   - **OPENROUTER_API_KEY**: From https://openrouter.ai
   - **TAVILY_API_KEY**: From https://tavily.com
   - **GMAIL_EMAIL & PASSWORD**: From Gmail (use app-specific password)
   - **PAYSTACK_KEYS**: From https://paystack.com

3. Update `.env`:
```bash
NEXTAUTH_SECRET=your-generated-secret
NEXTAUTH_URL=http://localhost:3000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/agentic_author
# ... other keys
```

### Step 4: Database Setup

1. **MongoDB Atlas**:
   - Go to https://cloud.mongodb.com
   - Create free cluster
   - Add IP address (localhost or 0.0.0.0/0 for development)
   - Create database user
   - Get connection string

2. **Test connection**:
```bash
npm run dev
# Visit http://localhost:3000
# Check server logs for "Connected to MongoDB"
```

### Step 5: Start Development Server

```bash
npm run dev
```

Opens: http://localhost:3000

## Development Workflow

### Running the Dev Server

```bash
# Start with hot reload
npm run dev

# The server watches for file changes and auto-reloads
# Check terminal for compilation status and errors
```

### Type Checking

```bash
# Check TypeScript errors (doesn't compile)
npm run typecheck

# Run before committing to catch type issues early
```

### Linting

```bash
# Check code style
npm run lint

# ESLint configuration in .eslintrc.json
# Run this before pushing code
```

### Building for Production

```bash
# Create optimized build
npm run build

# Start production server
npm start
```

## Code Structure

### Frontend (React/Next.js)

```
app/
├── (auth)/              # Public auth routes
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   └── verify-otp/page.tsx
│
├── (dashboard)/         # Protected routes (requires auth)
│   ├── dashboard/page.tsx
│   ├── projects/
│   │   ├── page.tsx          # Projects list
│   │   ├── new/page.tsx       # Create project
│   │   └── [id]/page.tsx      # Project details
│   └── billing/page.tsx
│
├── api/                 # API routes (backend logic)
│   ├── auth/
│   ├── projects/
│   ├── pipeline/
│   └── ...
│
└── layout.tsx           # Root layout
```

**Component Structure**:
```
components/
├── auth/
│   ├── LoginForm.tsx
│   ├── SignupForm.tsx
│   └── OtpForm.tsx
│
├── shared/
│   ├── Navbar.tsx
│   └── Sidebar.tsx
│
└── ...
```

### Backend (API Routes)

All API logic in `app/api/`:
- **Route handlers**: Handle HTTP requests
- **Database queries**: Use Mongoose models
- **Authentication**: Checked via NextAuth middleware
- **Error handling**: Consistent error responses

**Pattern**:
```typescript
// app/api/projects/route.ts
import { auth } from '@/lib/auth/options';
import { json } from 'next/server';

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return json({ error: 'Unauthorized' }, 401);

  // Your logic
  return json({ success: true, data: {} });
}
```

### Business Logic

```
lib/
├── agents/              # AI agents
├── orchestrator/        # Pipeline coordination
├── db/                  # Database models
├── email/               # Email service
├── search/              # Search integration
├── payments/            # Payment processing
├── export/              # Export generators
├── guardrails/          # Input/output validation
└── auth/                # Authentication config
```

## Common Development Tasks

### Adding a New API Endpoint

1. Create file: `app/api/resource/route.ts`

```typescript
import { auth } from '@/lib/auth/options';
import { json } from 'next/server';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return json({ error: 'Unauthorized' }, 401);
    }

    // Your logic here
    const data = { /* ... */ };
    return json({ success: true, data });
  } catch (error) {
    console.error(error);
    return json({ error: 'Server error' }, 500);
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const body = await req.json();
    // Validate and process

    return json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error(error);
    return json({ error: 'Server error' }, 500);
  }
}
```

2. Test with curl or Postman:
```bash
curl -X GET http://localhost:3000/api/resource \
  -H "Authorization: Bearer token"
```

### Adding a New Database Model

1. Create model file: `lib/db/models/NewModel.ts`

```typescript
import { Schema, model, Document } from 'mongoose';

export interface INewModel extends Document {
  userId: any;
  field1: string;
  field2?: number;
  createdAt: Date;
}

const newModelSchema = new Schema<INewModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    field1: {
      type: String,
      required: true,
    },
    field2: Number,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }
);

export const NewModel = model<INewModel>('NewModel', newModelSchema);
```

2. Use in API routes:
```typescript
const { NewModel } = await import('@/lib/db/models/NewModel');
const record = await NewModel.create({ userId, field1 });
```

### Adding a New AI Agent

1. Create agent file: `lib/agents/new-agent.ts`

```typescript
import { BaseAgent } from './base-agent';

class NewAgent extends BaseAgent {
  async execute(input: string): Promise<string> {
    const prompt = this.buildPrompt(input);
    const response = await this.callModel(prompt);
    return this.parseResponse(response);
  }

  protected buildPrompt(input: string): string {
    return `Your system prompt here\n\nUser input: ${input}`;
  }

  protected parseResponse(response: string): string {
    // Parse and validate response
    return response;
  }
}

export const newAgent = new NewAgent('new-agent');
```

2. Integrate into pipeline:
```typescript
// lib/orchestrator/pipeline.ts
const agentOutput = await newAgent.execute(input);
```

### Adding a New UI Component

1. Create component: `components/MyComponent.tsx`

```typescript
'use client'; // Client component

import { useState } from 'react';

interface MyComponentProps {
  title: string;
  onSubmit?: (data: any) => void;
}

export function MyComponent({ title, onSubmit }: MyComponentProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      // Your logic
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>{title}</h1>
      <button onClick={handleClick} disabled={loading}>
        {loading ? 'Loading...' : 'Click me'}
      </button>
    </div>
  );
}
```

2. Use in page:
```typescript
import { MyComponent } from '@/components/MyComponent';

export default function Page() {
  return <MyComponent title="My Title" />;
}
```

## Testing

### Manual Testing

1. **Authentication flow**:
   - Sign up with new email
   - Check OTP email received
   - Verify OTP
   - Login

2. **Project creation**:
   - Create new project
   - Verify saved to database
   - List projects

3. **Content generation** (if services configured):
   - Trigger pipeline
   - Check all agents execute
   - Verify output saved

### Browser DevTools

1. **Console**: Check for JavaScript errors
2. **Network tab**: Monitor API calls and responses
3. **Application tab**: Check cookies, localStorage
4. **Performance**: Identify slow operations

### Debug Mode

```bash
# Start dev server with debug logging
DEBUG=* npm run dev

# Or target specific module
DEBUG=mongoose npm run dev
```

### Database Inspection

```bash
# Connect to MongoDB Atlas
mongosh "mongodb+srv://user:pass@cluster.mongodb.net/agentic_author"

# List collections
show collections

# Query data
db.users.find()
db.projects.find({ userId: ObjectId("...") })

# Check indexes
db.users.getIndexes()

# View document
db.users.findOne({ email: "user@example.com" })
```

## Git Workflow

### Branch Naming

```
feature/feature-name      # New features
bugfix/bug-description    # Bug fixes
refactor/area-name        # Refactoring
docs/doc-name            # Documentation
```

### Commit Messages

Format: `<type>: <description>`

```
feature: Add project filtering by category
bugfix: Fix OTP expiry calculation
refactor: Simplify pipeline orchestration
docs: Add API documentation
```

### Pull Request Process

1. Create feature branch:
```bash
git checkout -b feature/my-feature
```

2. Make changes and commit:
```bash
git add .
git commit -m "feature: Add my feature"
```

3. Push and create PR:
```bash
git push origin feature/my-feature
```

4. PR should include:
   - Clear description of changes
   - Related issue/ticket
   - Testing notes
   - Screenshots (if UI changes)

### Code Review Checklist

- [ ] Code follows project style
- [ ] No hardcoded values or secrets
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No console.log or debugging code
- [ ] Error handling included
- [ ] TypeScript types correct

## Performance Tips

### Database Queries

**Good**:
```typescript
// Only fetch needed fields
const users = await UserModel.find().select('email name').limit(10);

// Use lean() for read-only queries
const projects = await ProjectModel.find({ userId }).lean();
```

**Bad**:
```typescript
// Fetches all fields
const users = await UserModel.find();

// Inefficient pagination
const users = await UserModel.find().skip(10000);  // Better: use id-based pagination
```

### API Responses

**Good**:
```typescript
return json({ success: true, data: result }, { status: 201 });
```

**Bad**:
```typescript
return json(result);  // Unclear if success or error
```

## Debugging Tips

### Browser Console Errors

Common errors and solutions:

1. **"window is not defined"**:
   - Use `'use client'` directive
   - Or check if running in browser: `typeof window !== 'undefined'`

2. **CORS errors**:
   - API routes in same domain (no CORS needed)
   - Check external API CORS headers

3. **Session undefined**:
   - Check NEXTAUTH_SECRET in .env
   - Clear cookies and refresh
   - Check if middleware is configured

### Server Errors

Check console output:

```
Error: ENOENT: no such file or directory
→ Missing file, check import paths

TypeError: Cannot read property 'x' of undefined
→ Null/undefined check needed

MongooseError: Schema hasn't been registered
→ Model not imported before use
```

## Environment Variables

### Development `.env`

```bash
# Core
NEXTAUTH_SECRET=dev-secret-key
NEXTAUTH_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb+srv://dev_user:dev_pass@cluster.mongodb.net/agentic_author

# AI & Search
OPENROUTER_API_KEY=dev-key
TAVILY_API_KEY=dev-key

# Email (Gmail)
GMAIL_EMAIL=dev.email@gmail.com
GMAIL_PASSWORD=dev-app-password

# Payments (test mode)
PAYSTACK_SECRET_KEY=pk_test_xxxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
```

### Production `.env`

Never commit! Use deployment platform's secret management.

## Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm start                # Start production server
npm run lint             # Run linter
npm run typecheck        # TypeScript type check

# Database
mongosh "your-connection-string"

# Git
git status               # Check changes
git log                  # View commit history
git diff                 # View file changes
```

## Useful VS Code Extensions

- **ESLint**: Linting in editor
- **Prettier**: Code formatter
- **MongoDB for VS Code**: Database explorer
- **Thunder Client**: API testing
- **REST Client**: HTTP requests in editor

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Port 3000 already in use | `lsof -i :3000` then kill process or use `npm run dev -- -p 3001` |
| MongoDB connection fails | Check IP whitelist in Atlas, verify connection string |
| Email not sending | Enable less secure apps on Gmail or use app password |
| Hot reload not working | Clear `.next` folder and restart dev server |
| TypeScript errors | Run `npm run typecheck` to see all errors |
| Node modules issues | Delete `node_modules` and `npm install` again |

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [Mongoose Docs](https://mongoosejs.com/docs)
- [NextAuth Docs](https://next-auth.js.org)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

---

For questions or issues, create a GitHub issue or ask the team.
