# Monitoring Quick Start Guide

## 🎯 You Now Have Two Ways to Monitor Your AI Usage

### 1. 🖥️ Admin Dashboard (Web UI)
**Easy** | **Real-time** | **Pretty**

### 2. 📊 CLI Analytics (Terminal)
**Detailed** | **Exportable** | **Scriptable**

---

## 🖥️ Option 1: Admin Dashboard (Easiest)

### Step 1: Start Your App
```bash
npm run dev
```

### Step 2: Navigate to Metrics
```
http://localhost:3000/dashboard/metrics
```

### Step 3: View Your Metrics
You'll see:
- ✅ Current session statistics
- ✅ All-time usage by model
- ✅ Top costly agents
- ✅ Error monitoring
- ✅ Auto-refreshes every 30 seconds

**No additional setup needed!** The dashboard pulls data directly from your logs.

---

## 📊 Option 2: CLI Analytics (Advanced)

### Step 1: Make an API Request (to generate logs)
```bash
# Call any of your API endpoints to generate logs
curl http://localhost:3000/api/projects
```

### Step 2: View the Report
```bash
npm run logs:analyze
```

### Output Example:
```
===========================================
        AI USAGE & LOGGING REPORT
===========================================

AI METRICS:
-----------
Total API Calls: 5
Total Tokens Used: 2,500
Total Estimated Cost: $0.025000
Average Tokens/Call: 500
Average Cost/Call: $0.005000

MODEL BREAKDOWN:
----------------
grok-2:
  Calls: 5
  Tokens: 2500
  Cost: $0.025000

TOP AGENTS BY COST:
-------------------
1. Planner
   Cost: $0.010000
   Calls: 2

2. Writer
   Cost: $0.015000
   Calls: 3

ERROR STATISTICS:
-----------------
Total Errors: 0

===========================================
```

### Step 3: Save Report (Optional)
```bash
npm run logs:analyze:save
```

This creates `logs/log-report.txt` with the report.

---

## 📁 Log Files (Behind the Scenes)

All logs are in the `logs/` directory:

```
logs/
├── combined.log       # All events
├── error.log          # Errors only
├── ai-usage.log       # JSON metrics
└── exceptions.log     # Uncaught exceptions
```

View in real-time:
```bash
# Watch all logs
tail -f logs/combined.log

# Watch AI usage
tail -f logs/ai-usage.log

# Watch errors
tail -f logs/error.log
```

---

## 💡 Common Tasks

### Check API Cost for Today
**Dashboard:**
1. Go to `/dashboard/metrics`
2. Look at "Estimated Cost" in Session section

**CLI:**
```bash
npm run logs:analyze
# Look for "Total Estimated Cost" under AI METRICS
```

### Find Which Agent Uses Most Tokens
**Dashboard:**
1. Go to `/dashboard/metrics`
2. Scroll to "Top Agents by Cost"

**CLI:**
```bash
npm run logs:analyze
# Look for "TOP AGENTS BY COST" section
```

### Check Error Rate
**Dashboard:**
1. Go to `/dashboard/metrics`
2. Look at "Success Rate" in Session
3. Or scroll to "Error Statistics"

**CLI:**
```bash
npm run logs:analyze
# Look for "ERROR STATISTICS" section
```

### Monitor Model Usage
**Dashboard:**
1. Go to `/dashboard/metrics`
2. Look at "Model Breakdown" cards

**CLI:**
```bash
npm run logs:analyze
# Look for "MODEL BREAKDOWN" section
```

### Export Report for Review
**CLI:**
```bash
npm run logs:analyze:save
# Opens logs/log-report.txt
```

---

## 🔄 Real-Time Monitoring

### Dashboard
- Auto-refreshes every 30 seconds
- No manual action needed
- Shows current + all-time stats

### Terminal (Advanced)
Real-time log streaming:
```bash
# Watch AI metrics as they're created
jq . logs/ai-usage.log | tail -f

# Or use grep to watch specific agents
grep "Planner" logs/combined.log | tail -f

# Or watch all logs
tail -f logs/combined.log
```

---

## 📈 Daily Workflow

### Morning - Check Daily Costs
```bash
npm run dev
# Visit http://localhost:3000/dashboard/metrics
# Check "Estimated Cost" under Session
```

### Throughout Day - Monitor Performance
```bash
# Keep metrics dashboard open in browser
# Observe token usage and error rates
```

### End of Day - Generate Report
```bash
npm run logs:analyze:save
# Review logs/log-report.txt
# Check costs vs budget
```

### Weekly - Deep Dive Analysis
```bash
# Review all metrics
npm run logs:analyze

# Identify expensive agents
# Plan optimizations

# Check for error patterns
tail -f logs/error.log | head -50
```

---

## 🎯 Key Metrics to Track

### Cost Metrics
- **Total Cost** - Track against budget
- **Cost per Call** - Monitor efficiency
- **Most Expensive Agent** - Optimize high-cost operations

### Performance Metrics
- **Success Rate** - Monitor reliability
- **Avg Tokens per Call** - Track efficiency
- **API Call Count** - Monitor usage volume

### Error Metrics
- **Total Errors** - Track quality
- **Error Types** - Debug specific issues
- **Error Rate** - Monitor health

---

## 🔧 Customization

### Change Dashboard Refresh Rate
Edit `components/admin/MetricsDashboard.tsx`:
```typescript
// Change 30000 to desired milliseconds
const interval = setInterval(fetchMetrics, 30000);
```

### Change Model Pricing
Edit `lib/openai-monitoring.ts`:
```typescript
const MODEL_PRICING = {
  'grok-2': { input: 0.002, output: 0.01 }, // Update these
  // ...
};
```

### Add New Log Format
Edit `lib/logger.ts` to add new transports:
```typescript
new winston.transports.File({
  filename: path.join(logsDir, 'custom.log'),
  // ...
});
```

---

## 🚨 Alerts & Notifications

### Set Cost Alert (Optional)
Add to `lib/openai-monitoring.ts`:
```typescript
if (totalCost > 100) {
  logger.warn('Daily cost exceeds $100!');
}
```

### Monitor Errors in Production
```bash
# Watch for errors
tail -f logs/error.log | grep ERROR
```

---

## 📊 Example Metrics

**From actual run:**
```
Session Metrics:
- Total Calls: 3
- Success Rate: 100%
- Total Tokens: 3,245
- Estimated Cost: $0.032

All-Time Metrics:
- Total Calls: 47
- Total Tokens: 142,500
- Total Cost: $1.23
- Average: $0.026 per call

Top Agent: Writer ($0.75 cost)
```

---

## 🎓 Learning Path

1. **Quick Start** - View dashboard once
2. **Daily Use** - Check metrics daily
3. **Weekly Review** - Analyze trends
4. **Optimization** - Identify improvements
5. **Automation** - Set up alerts

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Dashboard shows no data | Create a project or API call first |
| CLI report is empty | Run `npm run dev` and make API calls |
| Metrics page won't load | Ensure you're logged in |
| Can't find logs directory | It creates automatically on first log |
| Want older logs | Check git history or backup |

---

## 🎉 You're All Set!

### Next Steps:
1. ✅ Start the dev server: `npm run dev`
2. ✅ Create a project (generates logs)
3. ✅ View dashboard: `http://localhost:3000/dashboard/metrics`
4. ✅ Check CLI report: `npm run logs:analyze`

That's it! Your monitoring system is live.

---

## 📚 More Information

For detailed information, see:
- [`ADMIN_DASHBOARD_GUIDE.md`](./ADMIN_DASHBOARD_GUIDE.md) - Dashboard features
- [`LOGGING_SETUP.md`](./LOGGING_SETUP.md) - Technical details
- [`INTEGRATION_EXAMPLES.md`](./INTEGRATION_EXAMPLES.md) - Code examples

---

**Happy Monitoring! 📊**
