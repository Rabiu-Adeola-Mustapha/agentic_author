# Contributing Guide

Thank you for contributing to Agentic Author! This guide will help you make meaningful contributions.

## Before You Start

1. **Read the documentation**:
   - [docs/README.md](./docs/README.md) - Documentation index
   - [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md) - Setup and workflows
   - [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) - System design

2. **Set up your environment**:
   ```bash
   git clone <repo>
   cd agentic_author
   npm install
   cp .env.example .env
   # Fill in environment variables
   npm run dev
   ```

3. **Check existing issues** to avoid duplicate work

## Code Standards

### TypeScript

- Use strict type checking: `npm run typecheck`
- Avoid `any` types - be specific
- Export interfaces for public APIs
- Document complex types

```typescript
// ✅ Good
interface CreateProjectRequest {
  title: string;
  description?: string;
  category: ProjectCategory;
}

export async function createProject(
  req: CreateProjectRequest
): Promise<Project> {
  // ...
}

// ❌ Bad
export async function createProject(req: any): any {
  // ...
}
```

### Code Style

- **Format**: Use Prettier (auto-formatted on save with VS Code)
- **Naming**: camelCase for variables, PascalCase for types/classes
- **Comments**: Only for WHY, not WHAT (code should be self-explanatory)

```typescript
// ✅ Good - explains WHY
// bcrypt.compare is async to prevent timing attacks
const isValid = await bcrypt.compare(password, hash);

// ❌ Bad - explains WHAT (obvious)
// Compare password with hash
const isValid = await bcrypt.compare(password, hash);
```

### File Organization

- **One component per file** (exceptions: small related components)
- **Exports at top of file** for easy scanning
- **Group related logic** in folders

```
src/
├── components/
│   ├── Button.tsx        # Single component
│   ├── Form/
│   │   ├── index.ts     # Exports
│   │   ├── Form.tsx
│   │   ├── Field.tsx
│   │   └── hooks.ts
```

### Imports

Organize imports in this order:
1. React/Next.js
2. External libraries
3. Internal imports (from @/)
4. Relative imports

```typescript
// ✅ Good
import { useState } from 'react';
import axios from 'axios';
import { UserModel } from '@/lib/db/models/User';
import { formatDate } from './utils';

// ❌ Bad
import { formatDate } from './utils';
import axios from 'axios';
import { UserModel } from '@/lib/db/models/User';
import { useState } from 'react';
```

## Commit Conventions

### Format

```
<type>: <description>

<optional body with more details>
```

### Types

- `feature`: New feature
- `bugfix`: Bug fix
- `refactor`: Code restructuring
- `docs`: Documentation changes
- `test`: Test additions/modifications
- `chore`: Dependencies, config, etc.

### Examples

```
feature: Add project filtering by category

- Implement category filter in projects list
- Add filter UI component
- Update API to support filtering

bugfix: Fix OTP expiry calculation

The expiry time was calculated using Date.now() instead of new Date(),
causing timezone issues. Changed to consistent Date handling.

docs: Update API documentation

Add request/response examples for all endpoints.
```

### Guidelines

- Be specific: `feature: Add dark mode` ✅ vs `feature: Updates` ❌
- Use lowercase (except proper nouns)
- No period at end
- Reference issues: `fix: Resolve #123`

## Pull Request Process

### Before Creating PR

1. **Update from main**:
```bash
git checkout main
git pull origin main
git checkout feature/my-feature
git rebase main
```

2. **Run checks locally**:
```bash
npm run typecheck    # No TypeScript errors
npm run lint         # No linting errors
npm run build        # Production build succeeds
```

3. **Test your changes**:
   - Test happy path
   - Test error cases
   - Test edge cases
   - Manual browser testing if UI change

### Create PR

**Title format**: `[TYPE] Brief description`

```
[Feature] Add user preferences page
[Bugfix] Fix OTP validation error
[Docs] Update deployment guide
```

**PR Description template**:

```markdown
## Description
Clear description of changes and why they're needed.

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Breaking change
- [ ] Documentation

## How to Test
Steps to verify the changes:
1. ...
2. ...

## Checklist
- [ ] Code follows style guidelines
- [ ] TypeScript types checked (`npm run typecheck`)
- [ ] No console.log statements
- [ ] No hardcoded values
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Tested locally
- [ ] No breaking changes

## Screenshots (if UI changes)
[Add screenshots showing before/after]
```

### Code Review Expectations

**Reviewers will check for**:
- ✅ Functionality works as intended
- ✅ Code quality and readability
- ✅ No unrelated changes
- ✅ Proper error handling
- ✅ Performance impact
- ✅ Security considerations

**Respond to feedback**:
- Don't take comments personally - they're about the code
- Ask for clarification if needed
- Make requested changes in new commits (don't force push)
- Mark conversations as resolved after addressing

## Feature Development

### Adding a Feature

1. **Create feature branch**:
```bash
git checkout -b feature/my-feature
```

2. **Start with tests** (TDD approach):
   - Write test for feature
   - Implement feature
   - Test passes

3. **Update documentation**:
   - Code comments for complex logic
   - Update [docs/FEATURES.md](./docs/FEATURES.md)
   - Update [docs/API.md](./docs/API.md) if applicable

4. **Test thoroughly**:
   - Happy path
   - Error cases
   - Edge cases
   - Integration with existing features

5. **Create PR and get review**

6. **Merge to main** (reviewer approval)

### Adding an API Endpoint

Follow the pattern in [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md#adding-a-new-api-endpoint):

```typescript
// app/api/resource/route.ts
import { auth } from '@/lib/auth/options';
import { json } from 'next/server';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const body = await req.json();
    // Validate input
    // Process request
    return json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error(error);
    return json({ error: 'Server error' }, 500);
  }
}
```

Document in [docs/API.md](./docs/API.md):
- Endpoint path and method
- Request body format
- Response format
- Error responses
- Example curl command

### Adding a Database Model

Follow the pattern in [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md#adding-a-new-database-model):

```typescript
// lib/db/models/NewModel.ts
import { Schema, model, Document } from 'mongoose';

export interface INewModel extends Document {
  userId: any;
  field1: string;
  createdAt: Date;
}

const schema = new Schema<INewModel>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  field1: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const NewModel = model<INewModel>('NewModel', schema);
```

Document in [docs/DATABASE.md](./docs/DATABASE.md).

## Bug Reports

### Report a Bug

Create an issue with:
- **Title**: Clear, specific description
- **Steps to reproduce**: Exact steps to trigger bug
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Environment**: Browser, OS, Node version
- **Screenshots**: If applicable

Example:
```
Title: OTP verification fails on refresh

Steps to reproduce:
1. Go to /verify-otp page
2. Enter valid OTP code
3. Refresh page before clicking verify
4. Click verify button

Expected: Code still accepted
Actual: "Code expired" error shown

Environment: Chrome 120, macOS, Node 18
```

### Fixing a Bug

1. **Create issue** (if not exists)
2. **Create branch**: `bugfix/issue-description`
3. **Fix the bug**
4. **Write test** to prevent regression
5. **Reference issue in commit**: `bugfix: Fix OTP validation (#123)`
6. **Create PR** with issue reference

## Performance Guidelines

### Database

- ✅ Use `.lean()` for read-only queries
- ✅ Use projections to limit fields
- ✅ Implement pagination for large datasets
- ✅ Add indexes for frequently queried fields
- ❌ Avoid N+1 queries

### Frontend

- ✅ Lazy load components: `const Component = lazy(() => import(...))`
- ✅ Use React.memo for expensive components
- ✅ Cache API responses when appropriate
- ❌ Don't fetch data in every render

### API

- ✅ Return only needed fields
- ✅ Implement request validation early
- ✅ Cache where appropriate
- ❌ Don't compute large operations on every request

## Security Guidelines

### Never

- ❌ Commit secrets or API keys
- ❌ Include hardcoded credentials
- ❌ Trust user input without validation
- ❌ Log sensitive data
- ❌ Use eval or dangerous operations

### Always

- ✅ Validate input on API boundary
- ✅ Use parameterized queries (Mongoose does this)
- ✅ Check authentication/authorization
- ✅ Use HTTPS in production
- ✅ Keep dependencies updated

## Testing

While formal tests aren't currently implemented, follow these practices:

**Manual Testing**:
1. Test happy path
2. Test error cases
3. Test edge cases
4. Browser testing for UI changes

**Areas requiring careful testing**:
- Authentication flows
- Payment processing
- Data validation
- Error handling

## Documentation Requirements

### For Features

Update [docs/FEATURES.md](./docs/FEATURES.md):
- What it does
- How to use it
- Related endpoints/models
- Example flows

### For APIs

Update [docs/API.md](./docs/API.md):
- Endpoint path and method
- Request/response formats
- Status codes
- Error responses
- Example curl

### For Database

Update [docs/DATABASE.md](./docs/DATABASE.md):
- Schema fields
- Relationships
- Indexes
- Usage examples

### For Architecture

Update [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) if:
- Adding new architectural pattern
- Changing data flow
- Adding new integration

### Code Comments

Only comment WHY, not WHAT:

```typescript
// ✅ Good
// Must use async bcrypt.compare to prevent timing attacks
const isValid = await bcrypt.compare(password, hash);

// ❌ Bad
// Check if password matches hash
const isValid = await bcrypt.compare(password, hash);
```

## Getting Help

- **Documentation**: Check [docs/README.md](./docs/README.md)
- **Code Review**: Ask questions in PR
- **Issues**: Create GitHub issue
- **Team**: Ask senior engineers

## Recognition

Contributors are recognized in:
- Project README (maintainers section)
- Release notes
- Team appreciation

## Questions?

1. Check documentation
2. Search existing issues
3. Ask in PR discussion
4. Contact project leads

---

**Happy contributing! 🎉**
