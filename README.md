# Agentic Author

An intelligent content authoring platform powered by AI agents that automates research, planning, writing, and evaluation. Generate high-quality content at scale through an orchestrated multi-agent system.

## 🌟 Features

- **AI-Powered Content Generation**: Multi-agent system handles research, planning, writing, and evaluation
- **User Authentication**: Secure registration with email verification and OTP
- **Project Management**: Organize and track multiple writing projects
- **Subscription Plans**: Free and Pro tiers with different capabilities
- **Payment Integration**: Seamless Paystack integration for subscriptions
- **Content Export**: Export generated content as DOCX and PDF
- **Web Search Integration**: Real-time research using Tavily and DuckDuckGo
- **Email Notifications**: ✅ Working - Verify accounts, send completion notifications, and project updates via Gmail
- **Advanced Logging**: Comprehensive logging for debugging and monitoring
- **SDK Tracing**: OpenAI SDK trace integration for API call debugging and optimization

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas account (free tier works)
- Environment variables (see `.env.example`)

### Installation

1. **Clone and install dependencies**:
```bash
git clone <repository-url>
cd agentic_author
npm install
```

2. **Set up environment variables**:
```bash
# Copy the example file
cp .env.example .env

# Edit .env with your values:
# - NEXTAUTH_SECRET: Generate with: openssl rand -base64 32
# - MONGODB_URI: Your MongoDB Atlas connection string
# - OPENROUTER_API_KEY: OpenRouter for LLM access
# - GMAIL_EMAIL, GMAIL_PASSWORD: For email verification
# - TAVILY_API_KEY: For web search
# - PAYSTACK_SECRET_KEY, PAYSTACK_PUBLIC_KEY: For payments
```

3. **Configure MongoDB Atlas**:
   - Go to https://cloud.mongodb.com
   - Select your cluster → Network Access
   - Click "Add IP Address" → "Add Current IP Address"
   - Create database user with username/password
   - Update MONGODB_URI in .env

4. **Run development server**:
```bash
npm run dev
```
Open http://localhost:3000

## 📁 Project Structure

```
agentic_author/
├── app/                          # Next.js app directory
├── components/                  # React components (UI, editor, dashboard)
├── docs/                        # Project documentation
├── lib/                         # Core business logic
│   ├── agents/                  # AI agents (Planner, Researcher, etc.)
│   ├── auth/                    # Authentication logic
│   ├── config/                  # App configuration
│   ├── db/                      # Database models and connection
│   ├── email/                   # Email services
│   ├── export/                  # DOCX/PDF generators
│   ├── guardrails/              # Security and validation layers
│   ├── orchestrator/            # Pipeline coordination
│   ├── payments/                # Paystack integration
│   └── search/                  # Web search utility
├── store/                       # Zustand state management
├── next.config.js               # Next.js configuration
├── tailwind.config.ts           # Tailwind CSS config
└── tsconfig.json                # TypeScript configuration
```

## 🔧 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Styling**: Vanilla CSS with Tailwind utility integration
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
- **Auth**: [NextAuth.js v5](https://next-auth.js.org/)
- **State**: [Zustand](https://github.com/pmndrs/zustand)
- **AI**: OpenRouter SDK (Claude 3.5 Sonnet, GPT-4o), OpenAI SDK
- **Payments**: [Paystack](https://paystack.com/)
- **Email**: Nodemailer (Gmail)
- **Logging**: Winston (application logging and monitoring)
- **Debugging**: OpenAI SDK trace for API call inspection

## 📚 Documentation

Detailed documentation is available in the `docs/` folder:

- **[PROBLEM_STATEMENT.md](./docs/PROBLEM_STATEMENT.md)** - The "Why" behind Agentic Author
- **[FEATURES.md](./docs/FEATURES.md)** - Detailed feature documentation
- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - System design and agent workflow
- **[GUARDRAILS.md](./docs/GUARDRAILS.md)** - Security and input/output validation
- **[DATABASE.md](./docs/DATABASE.md)** - Schema and model details
- **[API.md](./docs/API.md)** - REST API reference
- **[DEPLOYMENT.md](./docs/DEPLOYMENT.md)** - Production deployment guide
- **[DEVELOPMENT.md](./docs/DEVELOPMENT.md)** - Local setup and contribution

## 🔐 Authentication Flow

1. User signs up with email/password
2. OTP sent to email for verification
3. User verifies OTP and completes signup
4. JWT token issued for authenticated sessions
5. NextAuth middleware protects dashboard routes

## 💳 Subscription System

- **Free Plan**: Limited project creation and content generation
- **Pro Plan**: Unlimited projects and API calls
- Payment via Paystack with email confirmation
- Subscription status tracked in database

## 🚀 Content Generation Pipeline

1. **Planner Agent**: Creates content outline and structure
2. **Researcher Agent**: Gathers information via web search
3. **Writer Agent**: Drafts the content
4. **Prompt Writer Agent**: Generates optimized prompts
5. **Evaluator Agent**: Assesses quality and makes improvements

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start dev server (port 3000)
npm run build        # Production build
npm start            # Start production server
npm run lint         # Run ESLint
npm run typecheck    # TypeScript type checking
```

### Code Quality

```bash
# Type checking
npm run typecheck

# Linting
npm run lint
```

## 📊 Logging & Debugging

### Application Logging

The application uses Winston for comprehensive logging. Logs are output to:
- **Console**: Real-time development feedback
- **Logs Directory**: Persistent logs for production debugging

Log levels:
```
ERROR   - Critical errors that require immediate attention
WARN    - Warnings about potential issues
INFO    - General application flow and milestones
DEBUG   - Detailed debugging information (development only)
```

Example log entries:
```
[2024-04-28 10:30:45] INFO  - Email verification sent to user@example.com
[2024-04-28 10:30:46] DEBUG - Pipeline execution started for project: xyz
[2024-04-28 10:30:48] ERROR - Failed to fetch search results from Tavily API
```

### OpenAI SDK Tracing

Enable OpenAI SDK trace to inspect API calls and debug integration issues:

```bash
# Enable in development
export OPENAI_LOG=true

# Or set in .env
OPENAI_LOG=true
```

This will output detailed information about:
- Request parameters and headers
- Response status and data
- API call timing and latency
- Error details and stack traces

Example trace output:
```
POST /v1/chat/completions
Headers: {
  authorization: "Bearer sk-...",
  content-type: "application/json"
}
Body: {
  model: "gpt-4o",
  messages: [...],
  max_tokens: 2048
}
Status: 200
Response: { "choices": [...], "usage": {...} }
Duration: 1245ms
```

### Debugging Tips

**Enable verbose logging for development**:
```bash
NODE_ENV=development npm run dev
```

**Check email delivery**:
- Verify recipient in console logs
- Check Gmail account for test emails
- Ensure GMAIL_PASSWORD is app-specific password (not main account password)

**Monitor API calls**:
- Watch OpenAI SDK trace output for request/response pairs
- Check logs directory for persistence records
- Use browser DevTools Network tab for frontend requests

## 📝 Environment Variables

See `.env.example` for all required variables. Key ones:

```env
# Authentication
NEXTAUTH_SECRET=your-secret-key (generate: openssl rand -base64 32)
NEXTAUTH_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname

# AI & LLM
OPENROUTER_API_KEY=your-api-key
OPENAI_API_KEY=your-openai-api-key
OPENAI_LOG=true  # Enable SDK tracing for debugging

# Search
TAVILY_API_KEY=your-api-key

# Email (✅ Fully functional)
GMAIL_EMAIL=your-email@gmail.com
GMAIL_PASSWORD=your-app-password  # Use App Password, not main password

# Payments
PAYSTACK_SECRET_KEY=your-secret-key
PAYSTACK_PUBLIC_KEY=your-public-key

# Logging
LOG_LEVEL=debug  # Options: error, warn, info, debug
NODE_ENV=development  # development or production
```

### Email Setup Guide (✅ Now Working)

1. **Generate Gmail App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" → "Windows Computer" (or your OS)
   - Copy the 16-character password

2. **Update .env**:
   ```env
   GMAIL_EMAIL=your-gmail@gmail.com
   GMAIL_PASSWORD=xxxx-xxxx-xxxx-xxxx  # App password from step 1
   ```

3. **Verify Setup**:
   - Watch console logs for: `EMAIL_SERVICE: Sending email...`
   - Check received emails in inbox
   - Check spam folder if not received

4. **Test Email Sending**:
   - Create a new account on the platform
   - OTP verification email should arrive within seconds
   - Check logs for delivery confirmation

## 🐛 Troubleshooting

**MongoDB connection fails**:
- Check IP whitelist in MongoDB Atlas Network Access
- Verify connection string in .env
- Ensure database user has proper permissions

**Email verification & notifications not working**:
- ✅ **NOTE**: Email service is now fully functional
- Use Gmail App Password (not your main account password)
  1. Go to https://myaccount.google.com/apppasswords
  2. Select "Mail" and "Windows Computer"
  3. Copy the generated 16-character password to `GMAIL_PASSWORD` in .env
- Enable "Less secure app access" if using older Gmail accounts
- Check console logs: `EMAIL_SERVICE: Sending email to user@example.com`
- Verify `GMAIL_EMAIL` is correctly set
- Check spam/junk folder for test emails
- Enable debug logging: `NODE_ENV=development npm run dev`

**API/LLM rate limiting**:
- Free tier has daily generation limits
- Upgrade to Pro plan for unlimited access
- Check daily usage in user dashboard
- Monitor OpenAI SDK trace for rate limit responses (429 status)

**OpenAI SDK trace not showing**:
- Ensure `OPENAI_LOG=true` is set in .env
- Check NODE_ENV is not set to production
- Restart dev server after setting environment variable
- View trace output in terminal/console

**NextAuth errors**:
- Clear .next folder: `rm -rf .next`
- Restart dev server
- Check NEXTAUTH_SECRET is set (32+ character random string)
- Verify NEXTAUTH_URL matches your domain

**Pipeline/generation failures**:
- Check logs for specific error messages
- Enable OpenAI SDK trace to see API responses
- Verify all API keys are valid and have sufficient quota
- Check network connectivity for web search features

## 📈 Monitoring & Performance

### Key Metrics to Monitor

**API Response Times**:
- Monitor OpenAI API latency via SDK trace
- Content generation pipeline should complete within 5-30 minutes
- Email delivery typically completes in < 2 seconds

**System Health**:
- Check MongoDB connection status in logs
- Monitor daily generation limits (free tier)
- Track subscription status for rate limiting

**Email Delivery**:
- Verify OTP emails deliver within 5 seconds
- Check Gmail bounce/error logs
- Monitor App Password usage

### Performance Tips

1. **Optimize prompts** for faster generation
2. **Enable caching** for repeated research queries
3. **Monitor quota usage** to avoid unexpected limits
4. **Use appropriate models**:
   - Claude 3.5 Sonnet for complex reasoning
   - GPT-4o for faster, cost-effective responses
5. **Batch operations** when possible to avoid rate limits

## 📚 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Docs](https://next-auth.js.org)
- [MongoDB Mongoose](https://mongoosejs.com)
- [Tailwind CSS](https://tailwindcss.com)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Winston Logger Docs](https://github.com/winstonjs/winston)

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/feature-name`
2. Make changes and test locally
3. Commit with clear messages
4. Push and create a pull request

## 📄 License

ISC

## 👥 Team

- **AI Engineering**: Multi-agent orchestration, model integration
- **Backend Engineering**: API routes, database, authentication
- **Frontend Engineering**: UI components, user experience

## ✅ Current Status

- **Core Features**: ✅ All functioning
- **Email Service**: ✅ Fully operational (OTP, verification, notifications)
- **AI Pipeline**: ✅ Multi-agent orchestration working
- **Payment System**: ✅ Paystack integration complete
- **Logging**: ✅ Comprehensive logging enabled
- **Debugging**: ✅ OpenAI SDK trace available
- **Testing**: Ready for production deployment

---

## Deployement 
  **https://agentic-author.vercel.app/

For issues or questions, check the documentation in the `docs/` folder or review the code comments.
