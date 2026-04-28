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
- **Email Notifications**: Verify accounts and send completion notifications via Gmail

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
- **AI**: OpenRouter SDK (Claude 3.5 Sonnet, GPT-4o)
- **Payments**: [Paystack](https://paystack.com/)
- **Email**: Nodemailer (Gmail)

## 📚 Documentation

Detailed documentation is available in the `docs/` folder:

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

## 📝 Environment Variables

See `.env.example` for all required variables. Key ones:

```env
# Authentication
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname

# AI
OPENROUTER_API_KEY=your-api-key

# Search
TAVILY_API_KEY=your-api-key

# Email
GMAIL_EMAIL=your-email@gmail.com
GMAIL_PASSWORD=your-app-password

# Payments
PAYSTACK_SECRET_KEY=your-secret-key
PAYSTACK_PUBLIC_KEY=your-public-key
```

## 🐛 Troubleshooting

**MongoDB connection fails**:
- Check IP whitelist in MongoDB Atlas Network Access
- Verify connection string in .env

**Email verification not working**:
- Enable "Less secure app access" on Gmail (or use App Password)
- Check GMAIL_EMAIL and GMAIL_PASSWORD

**NextAuth errors**:
- Clear .next folder: `rm -rf .next`
- Restart dev server
- Check NEXTAUTH_SECRET is set

## 📚 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Docs](https://next-auth.js.org)
- [MongoDB Mongoose](https://mongoosejs.com)
- [Tailwind CSS](https://tailwindcss.com)

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

---

For issues or questions, check the documentation in the `docs/` folder or review the code comments.
