# Documentation Index

Welcome! This folder contains comprehensive documentation for the Agentic Author project. Start here based on your role:

## 🎯 Quick Navigation

### For New Team Members
**Start here**: [DEVELOPMENT.md](./DEVELOPMENT.md)
- Local setup instructions
- Project structure overview
- Common development tasks
- Debugging tips

### For Backend/API Developers
1. [API.md](./API.md) - All API endpoints with request/response examples
2. [DATABASE.md](./DATABASE.md) - Database schema and models
3. [ARCHITECTURE.md](./ARCHITECTURE.md) - System design and data flow

### For Frontend Developers
1. [DEVELOPMENT.md](./DEVELOPMENT.md) - Setup and component creation
2. [FEATURES.md](./FEATURES.md) - Feature implementation details
3. [ARCHITECTURE.md](./ARCHITECTURE.md) - Frontend state management

### For DevOps/Infrastructure
1. [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment guide
2. [ARCHITECTURE.md](./ARCHITECTURE.md) - System overview and scaling
3. [DATABASE.md](./DATABASE.md) - Database setup and maintenance

### For Product/Project Managers
1. [FEATURES.md](./FEATURES.md) - Complete feature overview
2. [README.md](../README.md) - Project overview and quick start

---

## 📚 Documentation Files

### [README.md](../README.md) - Main README
**In the project root**
- Project overview
- Quick start guide
- Technology stack
- Troubleshooting

### [DEVELOPMENT.md](./DEVELOPMENT.md) - Development Guide
**15 min read** | For developers setting up locally
- Prerequisites and installation
- Development workflow
- Code structure
- Common development tasks
- Testing approaches
- Git workflow
- Debugging tips

### [FEATURES.md](./FEATURES.md) - Features Documentation
**20 min read** | For understanding what the app does
- User authentication flow
- Project management
- Content generation pipeline (all 5 agents)
- Export functionality (DOCX/PDF)
- Subscription system
- Search integration
- Email services
- Dashboard features
- State management

### [ARCHITECTURE.md](./ARCHITECTURE.md) - Architecture Documentation
**25 min read** | For understanding how it works
- System overview with diagrams
- Architectural patterns (Multi-agent, Orchestrator, etc.)
- Data flow diagrams
- Database relationships
- API architecture
- State management patterns
- Error handling
- External integrations
- Performance considerations
- Scalability approach
- Security considerations

### [DATABASE.md](./DATABASE.md) - Database Documentation
**20 min read** | For working with data
- Database overview
- All 10 collections/models detailed
- Model relationships
- Connection management
- Migration & backup
- Monitoring & maintenance
- Best practices

### [API.md](./API.md) - API Reference
**30 min read** | For API integration
- Base information and error responses
- Authentication endpoints (register, OTP)
- Project endpoints (list, create, get, delete, status)
- Pipeline endpoints (run content generation)
- Export endpoints (DOCX, PDF)
- Payment endpoints (Paystack integration)
- Rate limiting
- CORS configuration
- Pagination and filtering
- Webhooks

### [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment Guide
**20 min read** | For deploying to production
- Pre-deployment checklist
- Multiple deployment options:
  - Vercel (recommended)
  - AWS EC2
  - Docker
- Environment configuration
- Database migration
- Performance optimization
- Monitoring & logging
- Scaling strategy
- Rollback procedures
- Maintenance guidelines

---

## 🔄 Reading Path by Role

### Junior Developer (First Week)
```
1. README.md (project overview)
2. DEVELOPMENT.md (setup and basic concepts)
3. FEATURES.md (what features exist)
4. ARCHITECTURE.md (how it's built)
5. API.md (how to call APIs)
6. DATABASE.md (data structure)
```

### Senior Developer (Onboarding)
```
1. ARCHITECTURE.md (system design)
2. DATABASE.md (data model)
3. API.md (API contracts)
4. FEATURES.md (business logic)
5. DEVELOPMENT.md (workflow)
```

### DevOps Engineer
```
1. DEPLOYMENT.md (production setup)
2. ARCHITECTURE.md (system scaling)
3. DATABASE.md (backup & monitoring)
4. DEVELOPMENT.md (local testing)
```

### Product Manager
```
1. README.md (overview)
2. FEATURES.md (feature details)
3. API.md (integration points)
```

---

## 🎓 Key Concepts

### Multi-Agent Architecture
The app uses 5 specialized AI agents:
1. **Planner** - Creates content outline
2. **Researcher** - Gathers information
3. **Writer** - Drafts content
4. **Prompt Writer** - Optimizes prompts
5. **Evaluator** - Assesses quality

See: [FEATURES.md](./FEATURES.md#content-generation-pipeline) and [ARCHITECTURE.md](./ARCHITECTURE.md#1-multi-agent-architecture)

### Authentication
- Email/password signup with OTP verification
- JWT sessions via NextAuth.js
- Role-based access control (Free vs Pro users)

See: [FEATURES.md](./FEATURES.md#user-authentication--authorization) and [API.md](./API.md#authentication-endpoints)

### Database Models
10 MongoDB collections with clear relationships:
- User, Project, Plan, Research, Output, Evaluation
- OtpCode, Subscription, Payment, Prompt

See: [DATABASE.md](./DATABASE.md#collections--models)

### API Endpoints
RESTful API with clear patterns:
- `/api/projects/*` - Project management
- `/api/pipeline/run` - Content generation
- `/api/export/:id` - Export content
- `/api/payments/*` - Subscription payments

See: [API.md](./API.md)

---

## 🚀 Quick Commands

```bash
# Setup
npm install
cp .env.example .env
# (fill in environment variables)

# Development
npm run dev              # Start dev server
npm run typecheck        # Check TypeScript
npm run lint             # Lint code

# Production
npm run build            # Build for production
npm start                # Start prod server

# Testing
npm run dev              # Test in browser
# Use VS Code debugger
```

---

## 💡 Common Tasks

**Adding a new API endpoint?** → [DEVELOPMENT.md](./DEVELOPMENT.md#adding-a-new-api-endpoint)

**Adding a new database model?** → [DEVELOPMENT.md](./DEVELOPMENT.md#adding-a-new-database-model)

**Adding a new AI agent?** → [DEVELOPMENT.md](./DEVELOPMENT.md#adding-a-new-ai-agent)

**Deploying to production?** → [DEPLOYMENT.md](./DEPLOYMENT.md)

**Understanding the pipeline?** → [FEATURES.md](./FEATURES.md#content-generation-pipeline) + [ARCHITECTURE.md](./ARCHITECTURE.md#content-generation-flow)

**Checking database schema?** → [DATABASE.md](./DATABASE.md)

**Making an API call?** → [API.md](./API.md)

---

## 🆘 Troubleshooting

**Still stuck?**

1. Check the relevant documentation file for your task
2. Search the docs for your error message
3. Check [DEVELOPMENT.md](./DEVELOPMENT.md#common-issues--solutions)
4. Review code comments in the implementation
5. Check application logs: `npm run dev`

---

## 📞 Support

If you can't find what you need:
1. Check all docs (use Ctrl+F to search)
2. Review code comments
3. Check git commit messages for context
4. Ask senior team members

---

## 🎯 Next Steps

Choose your path:

- **Want to set up locally?** → Go to [DEVELOPMENT.md](./DEVELOPMENT.md)
- **Want to understand the architecture?** → Go to [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Want to learn about features?** → Go to [FEATURES.md](./FEATURES.md)
- **Want to deploy to production?** → Go to [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Want to integrate with APIs?** → Go to [API.md](./API.md)
- **Want to work with the database?** → Go to [DATABASE.md](./DATABASE.md)

---

**Last Updated**: April 2026
**Status**: Complete and maintained
