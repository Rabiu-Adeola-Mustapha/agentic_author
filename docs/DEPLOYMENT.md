# Deployment Guide

## Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database backed up
- [ ] SSL certificate ready
- [ ] CDN configured
- [ ] Error logging set up
- [ ] Monitoring dashboard configured
- [ ] Team informed of deployment

## Supported Deployment Platforms

1. **Vercel** (Recommended for Next.js)
2. **AWS EC2/ECS**
3. **DigitalOcean**
4. **Heroku**
5. **Railway**
6. **Self-hosted VPS**

---

## Option 1: Vercel (Recommended)

### Setup

1. **Push code to Git**:
```bash
git add .
git commit -m "Ready for production deployment"
git push origin main
```

2. **Connect to Vercel**:
   - Go to https://vercel.com/dashboard
   - Click "New Project"
   - Import your Git repository
   - Select Next.js preset
   - Click "Deploy"

### Environment Variables

1. In Vercel Dashboard:
   - Project Settings → Environment Variables
   - Add all variables from `.env`:

```
NEXTAUTH_SECRET=<your-secret>
NEXTAUTH_URL=https://yourdomain.com
MONGODB_URI=<your-mongodb-atlas-uri>
OPENROUTER_API_KEY=<your-api-key>
TAVILY_API_KEY=<your-api-key>
GMAIL_EMAIL=<your-email>
GMAIL_PASSWORD=<your-app-password>
PAYSTACK_SECRET_KEY=<your-secret-key>
PAYSTACK_PUBLIC_KEY=<your-public-key>
```

2. Click "Save" and redeploy

### Database Whitelist

1. MongoDB Atlas:
   - Go to Network Access
   - Add Vercel IP ranges:
     - `76.76.19.0/24`
     - `76.76.20.0/24`
     - Or enable "Allow from anywhere" for development
   - Recommended: Use environment-specific credentials

### Domain Setup

1. **Update DNS**:
   - Go to your domain provider
   - Add CNAME record pointing to Vercel:
     - `your-subdomain CNAME cname.vercel.com`

2. **SSL Certificate**:
   - Vercel automatically provides SSL
   - Certificate valid for 90 days (auto-renewed)

### Deploy New Changes

```bash
# Push to main branch (auto-deploys)
git push origin main

# Or manually trigger in Vercel Dashboard
# Project → Deployments → Redeploy
```

### Monitor Deployment

1. Vercel Dashboard:
   - Deployments tab shows status
   - Function logs available
   - Real-time metrics

2. Check logs:
```bash
vercel logs --token <your-token>
```

### Rollback

If deployment fails:
```bash
# In Vercel Dashboard
# Deployments → Failed deployment → Redeploy
```

---

## Option 2: AWS EC2

### Prerequisites

- AWS Account
- EC2 instance (t3.micro minimum)
- Security group with ports 80, 443 open
- Domain name
- SSL certificate (ACM or Let's Encrypt)

### Installation

1. **SSH into instance**:
```bash
ssh -i your-key.pem ec2-user@your-instance-ip
```

2. **Install Node.js & npm**:
```bash
curl -sL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs npm
node --version  # Verify
```

3. **Install MongoDB tools** (optional, if using local DB):
```bash
sudo yum install -y mongodb-org
sudo systemctl start mongod
```

4. **Clone repository**:
```bash
git clone <your-repo-url>
cd agentic_author
```

5. **Install dependencies**:
```bash
npm install --production
npm run build
```

6. **Create `.env` file**:
```bash
sudo nano .env
# Paste environment variables
```

7. **Install PM2** (process manager):
```bash
sudo npm install -g pm2
pm2 start npm --name "agentic-author" -- start
pm2 startup
pm2 save
```

### SSL Certificate Setup

Using Let's Encrypt:

1. **Install Certbot**:
```bash
sudo yum install -y certbot python3-certbot-nginx
```

2. **Obtain certificate**:
```bash
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
```

3. **Setup Nginx** (reverse proxy):
```bash
sudo amazon-linux-extras install nginx1.12
sudo systemctl start nginx
```

Create `/etc/nginx/conf.d/app.conf`:
```nginx
upstream app {
    server localhost:3000;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

4. **Enable auto-renewal**:
```bash
sudo systemctl enable certbot-renew.timer
```

### Database Setup

**Use MongoDB Atlas** (recommended):
- More reliable than local
- Automated backups
- No maintenance overhead

### Deployment Updates

1. **Pull latest code**:
```bash
cd agentic_author
git pull origin main
npm install
npm run build
```

2. **Restart application**:
```bash
pm2 restart agentic-author
pm2 logs
```

### Monitoring

```bash
# Check app status
pm2 status

# View logs
pm2 logs agentic-author

# Monitor CPU/Memory
pm2 monit

# Setup monitoring alerts
pm2 web  # Opens web dashboard on port 9615
```

---

## Option 3: Docker Deployment

### Create Dockerfile

Create `Dockerfile` in project root:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build Next.js
RUN npm run build

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

### Create docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - MONGODB_URI=${MONGODB_URI}
      - OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
      - TAVILY_API_KEY=${TAVILY_API_KEY}
      - GMAIL_EMAIL=${GMAIL_EMAIL}
      - GMAIL_PASSWORD=${GMAIL_PASSWORD}
      - PAYSTACK_SECRET_KEY=${PAYSTACK_SECRET_KEY}
      - PAYSTACK_PUBLIC_KEY=${PAYSTACK_PUBLIC_KEY}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Deploy with Docker

```bash
# Build image
docker build -t agentic-author .

# Run container
docker run -d \
  -p 3000:3000 \
  --env-file .env \
  --name agentic-author \
  agentic-author

# View logs
docker logs -f agentic-author

# Stop container
docker stop agentic-author
```

### Push to Docker Registry

```bash
# Login to Docker Hub
docker login

# Tag image
docker tag agentic-author username/agentic-author:latest

# Push
docker push username/agentic-author:latest

# Deploy from registry
docker pull username/agentic-author:latest
docker run -d -p 3000:3000 --env-file .env username/agentic-author:latest
```

---

## Environment Configuration

### Production Variables Template

```bash
# Authentication
NEXTAUTH_SECRET=<generate-with: openssl rand -base64 32>
NEXTAUTH_URL=https://yourdomain.com

# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/agentic_author

# AI Services
OPENROUTER_API_KEY=<get-from-openrouter.ai>

# Search
TAVILY_API_KEY=<get-from-tavily.com>

# Email
GMAIL_EMAIL=your-email@gmail.com
GMAIL_PASSWORD=<app-specific-password>

# Payments
PAYSTACK_SECRET_KEY=<get-from-paystack.co>
PAYSTACK_PUBLIC_KEY=<get-from-paystack.co>

# Logging (optional)
SENTRY_DSN=<get-from-sentry.io>
LOG_LEVEL=info

# Feature Flags (optional)
ENABLE_ANALYTICS=true
MAINTENANCE_MODE=false
```

### Security Best Practices

1. **Never commit `.env`**:
```bash
# .gitignore
.env
.env.local
.env.*.local
```

2. **Use secrets management**:
   - Vercel: Environment Variables
   - AWS: Secrets Manager or Parameter Store
   - Self-hosted: HashiCorp Vault

3. **Rotate secrets regularly**:
   - API keys every 90 days
   - Database passwords every 6 months
   - NEXTAUTH_SECRET on key rotation

4. **Limit permissions**:
   - Database user: Read/write only
   - API keys: Least privilege
   - IAM roles: Specific resource access

---

## Database Migration

### MongoDB Atlas Setup

1. **Create cluster**:
   - Go to https://cloud.mongodb.com
   - Create new cluster (shared/serverless)
   - Select region near deployment
   - Create database user with strong password

2. **Network access**:
   - Add production server IP
   - Or whitelist deployment platform IPs

3. **Backup configuration**:
   - Enable continuous backups
   - Set retention to 90 days
   - Test restore procedure

### Data Migration

From development to production:

```bash
# Export from dev database
mongodump --uri="mongodb+srv://dev_user:dev_pass@dev_cluster.mongodb.net/agentic_author" \
  --out=./backup

# Import to prod database
mongorestore --uri="mongodb+srv://prod_user:prod_pass@prod_cluster.mongodb.net/agentic_author" \
  ./backup/agentic_author
```

---

## Performance Optimization

### Build Optimization

```bash
# Analyze bundle size
npm run build

# Check bundle
npm install -g @next/bundle-analyzer
npm run analyze
```

### Runtime Optimization

1. **Database indexing**:
```typescript
// Ensure indexes exist
db.users.createIndex({ email: 1 });
db.projects.createIndex({ userId: 1, createdAt: -1 });
```

2. **Caching**:
   - Add Redis for session storage
   - Cache search results
   - Cache frequently accessed data

3. **Connection pooling**:
   - Already configured in mongoose
   - Monitor connection usage

### CDN Setup

**Using CloudFlare** (recommended):

1. Change nameservers to CloudFlare
2. Enable caching for:
   - Static assets (images, CSS, JS)
   - API responses (with short TTL)
3. Enable compression
4. Setup DDoS protection

---

## Monitoring & Logging

### Application Monitoring

**Sentry Setup** (error tracking):

1. Create account at https://sentry.io
2. Create Next.js project
3. Add to dependencies:
```bash
npm install @sentry/nextjs
```

4. Configure `sentry.config.js` (auto-generated)

5. Add to `.env`:
```
SENTRY_DSN=your-sentry-dsn
```

### Error Tracking

**Current setup**:
- Application errors logged to console
- Errors visible in server logs

**Recommended additions**:
- Sentry for centralized error tracking
- CloudWatch for AWS deployments
- Datadog for comprehensive monitoring

### Health Checks

Add health endpoint:

```typescript
// app/api/health/route.ts
export async function GET() {
  try {
    await connectDB();
    return json({ status: 'healthy', timestamp: new Date() });
  } catch (error) {
    return json({ status: 'unhealthy', error: error.message }, 500);
  }
}
```

### Log Monitoring

View logs in deployment platform:
- **Vercel**: Dashboard → Logs
- **AWS**: CloudWatch Logs
- **Docker**: `docker logs`
- **PM2**: `pm2 logs`

---

## Scaling Strategy

### Vertical Scaling

For increased load:
1. Upgrade server instance size
2. Increase database connection pool
3. Upgrade to higher-tier database

### Horizontal Scaling

For very high load:
1. Multiple app instances behind load balancer
2. Database replica set for read scaling
3. Cache layer (Redis) for frequently accessed data
4. Queue system (Bull/Celery) for background jobs

### Auto-scaling (Vercel)

Vercel automatically scales:
- Web server capacity
- Serverless function concurrency
- Database connections

No additional configuration needed.

---

## Rollback Procedure

### Vercel Rollback

1. Deployments tab
2. Select previous successful deployment
3. Click "Redeploy"
4. Wait for deployment to complete

### Manual Rollback

```bash
# Revert last commit
git revert HEAD --no-edit
git push origin main

# Or reset to previous tag
git checkout v1.0.0
git push origin main --force
```

### Database Rollback

MongoDB Atlas:
1. Backups tab
2. Select backup timestamp
3. Click "Restore"
4. Choose restore target
5. Wait for completion

---

## Maintenance Windows

Schedule maintenance:
1. **Announce** 24-48 hours in advance
2. **Create backup** before changes
3. **Deploy changes** during low-traffic period
4. **Run smoke tests** after deployment
5. **Monitor** for 30 minutes

---

## Post-Deployment Checklist

- [ ] Application loads without errors
- [ ] Authentication works (register, login, OTP)
- [ ] Projects can be created and retrieved
- [ ] Content generation pipeline works
- [ ] Export functionality works (DOCX/PDF)
- [ ] Payments process successfully
- [ ] Email notifications send
- [ ] Database backups configured
- [ ] Monitoring/logging configured
- [ ] Error tracking working
- [ ] SSL certificate valid
- [ ] DNS resolving correctly
- [ ] Performance metrics acceptable

---

## Troubleshooting

### Application won't start

```bash
# Check logs
vercel logs --tail
# or
pm2 logs agentic-author

# Check environment variables
echo $MONGODB_URI

# Check database connection
mongosh "mongodb+srv://user:pass@cluster.mongodb.net/agentic_author"
```

### High memory usage

1. Check for memory leaks:
```bash
node --inspect app.js
# Open chrome://inspect
```

2. Monitor database:
```bash
db.currentOp()  # Check running operations
```

### Slow requests

1. Check database indexes
2. Check query performance in MongoDB Atlas
3. Add caching layer
4. Monitor API response times

### Payment webhook not working

1. Verify webhook URL in Paystack dashboard
2. Check Paystack IP whitelist
3. Verify API key is correct
4. Test webhook manually

---

## Support & Documentation

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **MongoDB Atlas**: https://docs.mongodb.com/atlas
- **Let's Encrypt**: https://letsencrypt.org/docs

---

For issues or questions, check application logs first, then contact your platform support.
