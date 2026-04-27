# Agentic Author - Logging & Monitoring System

## 📚 Documentation Index

This folder contains the complete logging and monitoring system for Agentic Author. Choose what you need:

### 🚀 Just Getting Started?
**Start here:** [`MONITORING_QUICK_START.md`](./MONITORING_QUICK_START.md)
- 5-minute quickstart
- Two ways to monitor (UI + CLI)
- Common tasks explained

### 🖥️ Want to Use the Admin Dashboard?
**Read:** [`ADMIN_DASHBOARD_GUIDE.md`](./ADMIN_DASHBOARD_GUIDE.md)
- How to access the dashboard
- What each metric means
- Real-time monitoring features

### 💻 Integrating into Your Code?
**Read:** [`INTEGRATION_EXAMPLES.md`](./INTEGRATION_EXAMPLES.md)
- Real code examples
- Copy-paste templates
- Integration patterns

### 🔧 Need Technical Details?
**Read:** [`LOGGING_SETUP.md`](./LOGGING_SETUP.md)
- Complete configuration guide
- All log levels explained
- File locations and rotation

### 📖 Full Overview?
**Read:** [`WINSTON_SETUP_SUMMARY.md`](./WINSTON_SETUP_SUMMARY.md)
- What was set up
- Architecture overview
- Cost tracking explained

### 📋 Need to See Code Examples?
**See:** [`example-usage.ts`](./example-usage.ts)
- Real usage examples
- Different scenarios
- Quick reference

---

## 📁 System Files (Don't Edit)

```
lib/
├── logger.ts                      # Winston configuration
├── openai-monitoring.ts           # Token tracking & cost calculation
├── request-logger.ts              # HTTP request/response logging
├── api-middleware.ts              # Optional middleware
├── log-analyzer.ts                # CLI analytics tool

components/admin/
└── MetricsDashboard.tsx           # Web dashboard component

app/api/admin/metrics/
└── route.ts                       # Metrics API endpoint

app/(dashboard)/metrics/
└── page.tsx                       # Metrics page
```

---

## 🎯 Quick Access Commands

### View Metrics in Browser
```bash
npm run dev
# Then visit: http://localhost:3000/dashboard/metrics
```

### Generate Analytics Report
```bash
npm run logs:analyze
```

### Save Report to File
```bash
npm run logs:analyze:save
```

### Watch Logs in Real-Time
```bash
tail -f logs/combined.log        # All logs
tail -f logs/ai-usage.log        # AI metrics
tail -f logs/error.log           # Errors only
```

---

## 🎯 What Gets Logged Automatically?

✅ **Agent Execution**
- Token usage (prompt + completion)
- Execution time
- Estimated cost
- Success/failure

✅ **HTTP Requests**
- Method and path
- Status code
- Duration
- User ID (if available)

✅ **Errors**
- Error messages
- Stack traces
- Context information

✅ **Database Operations**
- Operation type (create/read/update/delete)
- Model name
- Duration
- Success status

✅ **Tool Execution**
- Tool name
- Duration
- Success status

---

## 💰 Cost Tracking

### Supported Models
- **grok-2** - $0.002 input, $0.01 output
- **gpt-4** - $0.03 input, $0.06 output
- **gpt-3.5-turbo** - $0.0005 input, $0.0015 output

### Where to Find Costs
- **Dashboard**: `/dashboard/metrics` → "Estimated Cost"
- **CLI**: `npm run logs:analyze` → Look for "Total Estimated Cost"
- **Logs**: `logs/ai-usage.log` (JSON format)

---

## 🔄 How It Works

```
Your API Call
    ↓
Agent runs (with logging)
    ↓
OpenAI API called
    ↓
Response received with usage data
    ↓
AIMonitor calculates cost
    ↓
Logs written to:
    ├── Console (dev)
    ├── combined.log
    ├── ai-usage.log (JSON)
    └── error.log (if error)
    ↓
Dashboard queries logs
    ↓
Admin sees metrics in real-time
```

---

## 🌐 Access Points

### Web Dashboard
- **URL**: `http://localhost:3000/dashboard/metrics`
- **Requires**: Authentication
- **Auto-refresh**: Every 30 seconds
- **Best for**: Real-time monitoring

### API Endpoint
- **GET** `/api/admin/metrics` - Fetch current metrics
- **POST** `/api/admin/metrics/reset` - Reset session (dev only)
- **Response**: JSON with all metrics

### CLI Tool
- **Command**: `npm run logs:analyze`
- **Output**: Text report
- **Best for**: Detailed analysis and export

### Log Files
- **Location**: `logs/` directory
- **Files**: combined.log, error.log, ai-usage.log
- **Best for**: Debugging and archival

---

## 📊 Metrics Overview

### Session Metrics (Current)
- Total API calls made
- Success rate
- Token usage
- Estimated cost

### All-Time Metrics
- Total calls ever made
- Total tokens ever used
- Total cost spent
- Model breakdown
- Agent breakdown

### Error Tracking
- Error count
- Error types
- Recent errors

---

## 🔐 Security Notes

✅ **Safe by Default**
- API keys never logged
- User passwords never logged
- Sensitive data filtered

✅ **Authentication Required**
- Dashboard requires login
- API requires session
- Logs stored locally only

✅ **Data Privacy**
- Logs stored in `logs/` (git ignored)
- No external data transmission
- Full control of data

---

## 🚀 Getting Started (5 minutes)

### 1. Start Your App
```bash
npm run dev
```

### 2. View Dashboard
```
http://localhost:3000/dashboard/metrics
```

### 3. Create a Project
Make an API request or create a project to generate logs.

### 4. Watch Metrics Update
The dashboard updates automatically every 30 seconds.

### 5. Generate CLI Report (Optional)
```bash
npm run logs:analyze
```

---

## 📈 Use Cases

### Track Daily Costs
```bash
# View estimated cost for today
npm run dev → dashboard → look at "Estimated Cost"
```

### Find Expensive Agents
```bash
npm run logs:analyze
# Look for "TOP AGENTS BY COST"
```

### Debug Errors
```bash
tail -f logs/error.log
# See all errors in real-time
```

### Monitor API Health
```bash
# Dashboard shows success rate
# View at http://localhost:3000/dashboard/metrics
```

### Analyze Token Usage
```bash
npm run logs:analyze
# See "Total Tokens Used"
# Model Breakdown
# Per-agent usage
```

---

## 🔧 Customization

### Change Auto-Refresh Rate
Edit: `components/admin/MetricsDashboard.tsx:90`
```typescript
const interval = setInterval(fetchMetrics, 30000); // 30 seconds
```

### Update Model Pricing
Edit: `lib/openai-monitoring.ts:11`
```typescript
const MODEL_PRICING = {
  'grok-2': { input: 0.002, output: 0.01 },
  // ...
};
```

### Add Custom Logging
```typescript
import logger from '@/lib/logger';

logger.info('Custom event', { data: 'value' });
logger.error('Custom error', { error: 'details' });
```

---

## 📚 Learn More

| Topic | Location |
|-------|----------|
| Quick Start | `MONITORING_QUICK_START.md` |
| Dashboard Features | `ADMIN_DASHBOARD_GUIDE.md` |
| Code Integration | `INTEGRATION_EXAMPLES.md` |
| Technical Details | `LOGGING_SETUP.md` |
| System Overview | `WINSTON_SETUP_SUMMARY.md` |
| Code Examples | `example-usage.ts` |

---

## ✅ What's Included

- ✅ Winston logging system
- ✅ OpenAI token tracking
- ✅ Cost calculation (all models)
- ✅ Admin dashboard (real-time)
- ✅ CLI analytics tool
- ✅ Error monitoring
- ✅ Log rotation (auto)
- ✅ Database operation logging
- ✅ HTTP request/response logging
- ✅ Tool execution tracking

---

## 🎯 Success Criteria

You'll know it's working when you see:

1. ✅ Logs appearing in `logs/combined.log`
2. ✅ Dashboard showing metrics at `/dashboard/metrics`
3. ✅ AI usage in `logs/ai-usage.log` (JSON)
4. ✅ `npm run logs:analyze` generates report
5. ✅ Estimated costs calculated and displayed

---

## 🆘 Help

### Dashboard won't load
- Ensure you're logged in
- Check that dev server is running

### Metrics show zero
- Create a project or make an API call
- Dashboard needs data to display

### CLI report empty
- Run API calls first to generate logs
- Check that `logs/ai-usage.log` exists

### Want to see more details
- Check `ADMIN_DASHBOARD_GUIDE.md` for dashboard docs
- Check `LOGGING_SETUP.md` for technical details

---

## 🎉 You're Ready!

Your monitoring system is fully operational. 

### Next Steps:
1. Start your app: `npm run dev`
2. Visit dashboard: `http://localhost:3000/dashboard/metrics`
3. Create a project (generates metrics)
4. Watch metrics update in real-time

---

**Status**: ✅ Production Ready  
**Last Updated**: 2024-01-15  
**Version**: 1.0.0

Need help? See the relevant documentation file above or check the code comments.
