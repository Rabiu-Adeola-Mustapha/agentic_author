# Admin Metrics Dashboard - Complete Guide

## 📊 Overview

Your project now has a real-time metrics dashboard accessible to authenticated users. Admins can monitor:

- **Token Usage** - Real-time and all-time statistics
- **Cost Tracking** - Estimated API costs by agent and model
- **Error Monitoring** - Error counts and types
- **Performance Metrics** - API call success rates and latencies
- **Model Breakdown** - Usage statistics per AI model
- **Agent Analysis** - Top costly agents and performance

## 🚀 Accessing the Dashboard

### Navigate to Metrics Page
```
http://localhost:3000/dashboard/metrics
```

### Sidebar Navigation
The "Metrics" link has been added to the sidebar for easy access:
- Dashboard
- Projects
- **Metrics** ← NEW
- Billing

## 📁 Files Created/Modified

### New Files
```
app/
└── api/
    └── admin/
        └── metrics/
            └── route.ts              # API endpoint for metrics

components/
└── admin/
    └── MetricsDashboard.tsx         # React component for dashboard

app/
└── (dashboard)/
    └── metrics/
        └── page.tsx                 # Metrics page

lib/
└── ADMIN_DASHBOARD_GUIDE.md         # This guide
```

### Modified Files
```
components/shared/Sidebar.tsx        # Added metrics link
```

## 🎯 Features

### 1. Session Metrics (Current)
Real-time statistics for the current session:
- **Total API Calls** - Number of calls made
- **Success Rate** - Percentage of successful calls
- **Total Tokens** - Tokens used in session
- **Estimated Cost** - Dollar amount for tokens used

### 2. All-Time Statistics
Historical metrics across all sessions:
- **Total API Calls** - All-time call count
- **Total Tokens** - All-time token usage (in millions)
- **Total Cost** - All-time estimated cost
- **Average Cost per Call** - Cost efficiency metric

### 3. Model Breakdown
Per-model statistics:
- **Calls per model** - How many times each model was used
- **Tokens per model** - Token distribution across models
- **Cost per model** - Which models are most expensive

Available models tracked:
- grok-2 (OpenRouter)
- gpt-4
- gpt-4-turbo
- gpt-3.5-turbo

### 4. Agent Analysis
Top agents by cost:
- **Agent Name** - Which agent used the most tokens/cost
- **Cost** - Estimated cost for that agent
- **Call Count** - How many times the agent was used

Shows top 5 most costly agents.

### 5. Error Monitoring
Error statistics:
- **Total Errors** - Count of all errors
- **Error Types** - Breakdown by error type
- **Recent Errors** - Last few error messages

## 🔄 Auto-Refresh

The dashboard automatically refreshes every **30 seconds** to show real-time data.

You can also manually refresh by clicking the "Refresh" button.

## 🔧 API Endpoint

### GET /api/admin/metrics
Fetch current metrics

**Response:**
```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "session": {
    "totalCalls": 5,
    "successfulCalls": 5,
    "failedCalls": 0,
    "totalTokens": 2500,
    "totalCost": 0.025,
    "averageTokensPerCall": 500,
    "averageCostPerCall": 0.005
  },
  "allTime": {
    "totalCalls": 150,
    "totalTokens": 500000,
    "totalCost": 25.50,
    "averageTokensPerCall": 3333,
    "averageCostPerCall": 0.17,
    "modelBreakdown": {
      "grok-2": { "calls": 100, "tokens": 300000, "cost": 15.00 },
      "gpt-4": { "calls": 50, "tokens": 200000, "cost": 10.50 }
    },
    "agentBreakdown": {
      "Planner": { "calls": 50, "tokens": 150000, "cost": 7.50 },
      "Writer": { "calls": 100, "tokens": 350000, "cost": 18.00 }
    },
    "topCostlyAgents": [
      { "agent": "Writer", "cost": 18.00, "calls": 100 },
      { "agent": "Planner", "cost": 7.50, "calls": 50 }
    ]
  },
  "errors": {
    "totalErrors": 2,
    "errorsByType": {
      "TimeoutError": 1,
      "ValidationError": 1
    }
  }
}
```

### POST /api/admin/metrics/reset (Development Only)
Reset session metrics to zero

**Note:** Only available in development environment

**Response:**
```json
{
  "success": true,
  "message": "Metrics reset"
}
```

## 🔐 Security

### Authentication Required
- User must be logged in to access metrics
- Unauthenticated requests return 401 Unauthorized

### Future: Role-Based Access
To restrict to admins only, uncomment in `app/(dashboard)/metrics/page.tsx`:

```typescript
if (!session.user.isAdmin) {
  redirect('/dashboard');
}
```

## 📊 Dashboard Sections

### Top Section
- Last updated timestamp
- Refresh button
- Reset button (dev only)

### Session Cards (2x4 grid)
Shows current session metrics:
- API calls made
- Success rate with breakdown
- Tokens consumed
- Estimated cost

### All-Time Cards (2x4 grid)
Shows historical metrics:
- Total API calls
- Total tokens (in millions)
- Total estimated cost
- Average cost per call

### Model Breakdown (Grid)
Card for each model showing:
- Number of calls
- Token usage
- Estimated cost

### Top Agents (Single Card)
Ranked list of most expensive agents:
1. Agent name
2. Call count
3. Total cost

### Error Statistics (Alert Card)
Red-themed card showing:
- Total error count
- Error type breakdown

## 🎨 UI/UX Features

- **Real-time updates** - Auto-refresh every 30 seconds
- **Color coding** - Green for costs, red for errors
- **Responsive layout** - Works on mobile and desktop
- **Loading states** - Shows loading and error messages
- **Refresh indicator** - Spinning icon during refresh
- **Readable numbers** - Tokens in K/M, costs to 4 decimals

## 💡 Usage Examples

### Check Token Usage
1. Navigate to Metrics page
2. Look at "Total Tokens" in Session section
3. Compare to previous days to track trends

### Monitor Costs
1. Check "Estimated Cost" in All-Time section
2. Review "Top Agents by Cost" to optimize usage
3. Monitor "Model Breakdown" to identify expensive models

### Debug Errors
1. Scroll to "Error Statistics" section
2. Check error types and counts
3. Review logs for details: `tail -f logs/error.log`

### Track Agent Performance
1. See which agents use most tokens
2. Compare success rates across sessions
3. Identify opportunities for optimization

## 🔄 Integration with Logging System

The dashboard integrates with:
- **AIMonitor.getSessionSummary()** - Current session data
- **LogAnalyzer** - Historical data from log files
- **Request Logger** - Error tracking

All data is automatically populated by the logging system you set up!

## 📱 Mobile Responsiveness

The dashboard is responsive and works on:
- Desktop (full 4-column grid)
- Tablet (2-column grid)
- Mobile (1-column grid)

## ⚙️ Configuration

### Auto-Refresh Interval
To change refresh interval, edit `components/admin/MetricsDashboard.tsx`:

```typescript
// Change 30000 (30 seconds) to desired interval
const interval = setInterval(fetchMetrics, 30000);
```

### Color Scheme
Colors are defined in component:
- Green for costs: `text-green-400`
- Red for errors: `text-red-400`/`text-red-500`
- Zinc for neutral: `text-zinc-400`

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Metrics page won't load | Ensure you're logged in |
| Data shows as 0 | No API calls made yet, try running an operation |
| Refresh button stuck | Try refreshing page manually |
| Reset button greyed out | Only available in development mode |
| High costs shown | Check Model Breakdown to see which model is expensive |

## 🚀 Next Steps

1. **View the dashboard**: Navigate to `/dashboard/metrics`
2. **Run a project**: Create a project to generate metrics
3. **Monitor in real-time**: Watch metrics update automatically
4. **Set cost alerts**: (Optional) Implement threshold alerts
5. **Export metrics**: (Optional) Add CSV export feature

## 📈 Future Enhancements

Potential improvements:
- [ ] Filter by date range
- [ ] Export to CSV/PDF
- [ ] Cost trends chart (graph)
- [ ] Alert thresholds (email on high cost)
- [ ] Webhook integrations
- [ ] Detailed agent performance breakdown
- [ ] Token usage projections
- [ ] Cost forecasting

## 🔗 Related Documentation

- [Winston Logging Setup](./LOGGING_SETUP.md)
- [OpenAI Monitoring](./openai-monitoring.ts)
- [API Integration Examples](./INTEGRATION_EXAMPLES.md)
- [Log Analyzer](./log-analyzer.ts)

---

**Status:** ✅ Ready for production  
**Last Updated:** 2024-01-15  
**Refresh Rate:** 30 seconds (configurable)
