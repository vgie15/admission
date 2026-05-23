# Deployment Guide

## Production Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database backed up
- [ ] SSL certificates ready
- [ ] Domain registered
- [ ] Dependencies updated

## Backend Deployment

### Option 1: Deploy to Heroku

#### Step 1: Create Heroku Account
- Go to https://www.heroku.com
- Sign up and verify email

#### Step 2: Install Heroku CLI
```bash
# Windows/macOS/Linux
npm install -g heroku

# Verify installation
heroku --version
```

#### Step 3: Prepare Backend for Heroku

Create `Procfile` in backend folder:
```
web: gunicorn app:create_app()
```

Install gunicorn:
```bash
pip install gunicorn
pip freeze > requirements.txt
```

#### Step 4: Deploy
```bash
cd backend

# Login to Heroku
heroku login

# Create Heroku app
heroku create your-app-name

# Set environment variables
heroku config:set SUPABASE_URL=https://...
heroku config:set SUPABASE_KEY=your_key
heroku config:set JWT_SECRET_KEY=your_secret

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

**Backend URL:** `https://your-app-name.herokuapp.com`

### Option 2: Deploy to AWS

#### Step 1: Create EC2 Instance
- Instance type: t3.micro (free tier)
- OS: Ubuntu 20.04

#### Step 2: Connect via SSH
```bash
ssh -i your-key.pem ubuntu@your-instance-ip
```

#### Step 3: Install Dependencies
```bash
sudo apt update
sudo apt install python3-pip python3-venv nginx

# Clone repo
git clone your-repo-url
cd admission/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### Step 4: Configure Nginx
Create `/etc/nginx/sites-available/default`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### Step 5: Run with Gunicorn
```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:create_app()
```

### Option 3: Deploy with Docker

Create `Dockerfile` in backend:
```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:create_app()"]
```

Build and run:
```bash
docker build -t admission-backend .
docker run -p 5000:5000 -e SUPABASE_URL=... admission-backend
```

## Frontend Deployment

### Option 1: Deploy to Vercel (Recommended)

#### Step 1: Create Vercel Account
- Go to https://vercel.com
- Sign up with GitHub

#### Step 2: Connect GitHub Repository
1. Push code to GitHub
2. Go to Vercel.com
3. Click "New Project"
4. Select your repository
5. Select "frontend" as root directory

#### Step 3: Configure Environment Variables
1. In Vercel dashboard, go to Settings → Environment Variables
2. Add:
   ```
   VITE_API_BASE_URL=https://your-backend-url.com/api
   ```

#### Step 4: Deploy
- Vercel auto-deploys on git push
- Visit your Vercel URL

### Option 2: Deploy to Netlify

#### Step 1: Build Frontend
```bash
cd frontend
npm run build
```

#### Step 2: Deploy
1. Go to https://netlify.com
2. Drag and drop `dist` folder
3. Add environment variable for API URL
4. Deploy

### Option 3: Deploy to GitHub Pages

```bash
cd frontend
npm run build

# Deploy dist folder to gh-pages branch
npm install --save-dev gh-pages
```

### Option 4: AWS S3 + CloudFront

#### Step 1: Create S3 Bucket
```bash
aws s3 mb s3://your-app-name --region us-east-1
```

#### Step 2: Build and Upload
```bash
cd frontend
npm run build

aws s3 sync dist/ s3://your-app-name --delete
```

#### Step 3: Set up CloudFront
- Create CloudFront distribution
- Point to S3 bucket
- Use your domain

## Database Setup (Supabase)

### Production Database

1. Create new Supabase project for production
2. Get production credentials
3. Run database schema:
   ```sql
   -- Paste database_schema.sql content
   ```

### Database Backup
```sql
-- Backup before deploying
pg_dump -h db.supabase.co -U postgres -d postgres > backup.sql
```

## Environment Variables

### Backend Production (.env)
```
FLASK_ENV=production
FLASK_DEBUG=False
SUPABASE_URL=https://your-prod.supabase.co
SUPABASE_KEY=your_prod_key
SUPABASE_SERVICE_KEY=your_prod_service_key
JWT_SECRET_KEY=your-very-secure-secret-key
UPLOAD_FOLDER=/var/www/admission/uploads
ALLOWED_EXTENSIONS=pdf,jpg,jpeg,png,doc,docx
FLASK_PORT=5000
```

### Frontend Production (.env)
```
VITE_API_BASE_URL=https://your-backend-domain.com/api
VITE_APP_NAME=Admission Management System
```

## SSL/HTTPS Setup

### Free SSL with Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx

sudo certbot certonly --nginx -d your-domain.com

# Auto-renew
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

## Performance Optimization

### Frontend Optimization
```bash
# Minify and optimize
npm run build

# Use Gzip compression
# In Vercel: Auto-enabled
# In Netlify: Auto-enabled
# In nginx: 
# gzip on;
# gzip_types text/plain text/javascript;
```

### Backend Optimization
```python
# Use connection pooling
# Use caching (Redis)
# Enable compression
```

### Database Optimization
```sql
-- Create indexes
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_status ON students(status);
```

## Monitoring & Logging

### Monitor Backend
```bash
# Heroku
heroku logs --tail

# AWS/Linux
tail -f /var/log/app.log
```

### Monitor Frontend
- Use Vercel/Netlify analytics
- Use browser DevTools

### Setup Error Tracking
- Add Sentry integration
- Setup CloudWatch alerts

## Scaling Strategy

### Phase 1: Initial Launch
- Single backend server
- CDN for frontend

### Phase 2: Growth
- Load balancer
- Multiple backend instances
- Database replication

### Phase 3: Enterprise
- Multi-region deployment
- Advanced caching
- Auto-scaling groups

## Domain Configuration

### Update DNS Records
```
A Record: your-domain.com → your-server-ip
CNAME Record: www.your-domain.com → your-domain.com
```

### SSL Certificate
- Auto with Vercel/Netlify
- Manual with Let's Encrypt on AWS

## Backup & Recovery

### Daily Backup
```bash
# Database backup
pg_dump ... > backup_$(date +%Y%m%d).sql

# Store in S3
aws s3 cp backup.sql s3://your-backups/
```

### Recovery
```bash
psql -h host -U user < backup.sql
```

## Security Checklist

- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] JWT secret strong
- [ ] Password hashing verified
- [ ] CORS properly configured
- [ ] SQL injection prevented
- [ ] XSS protection enabled
- [ ] Rate limiting implemented
- [ ] Firewall configured
- [ ] Regular backups scheduled

## Post-Deployment

### Testing
1. Test all features in production
2. Verify API endpoints
3. Check database connectivity
4. Monitor performance

### Monitoring
- Set up error alerts
- Monitor server resources
- Track API performance
- Review user analytics

### Updates
- Plan maintenance windows
- Test updates in staging
- Deploy during low traffic
- Have rollback plan

## Troubleshooting

### Backend Won't Start
```
- Check environment variables
- Check Supabase connection
- Review error logs
- Check port availability
```

### Frontend Won't Connect
```
- Verify API URL in .env
- Check CORS settings
- Verify network connectivity
- Check browser console
```

### Database Connection Failed
```
- Verify Supabase URL
- Check credentials
- Verify firewall rules
- Test connection string
```

## Cost Estimation

| Service | Tier | Cost |
|---------|------|------|
| Supabase | Starter | Free |
| Vercel | Pro | $20/mo |
| Heroku | Eco | $5/mo |
| AWS EC2 | t3.micro | Free (1 year) |
| Domain | .com | ~$10/year |

**Total (Basic):** ~$25/month

## Support & Maintenance

### Regular Tasks
- Monitor logs (daily)
- Check backups (daily)
- Update dependencies (weekly)
- Review security (monthly)
- Capacity planning (quarterly)

### Escalation Process
1. Monitor alerts
2. Check logs
3. Restart service
4. Rollback if needed
5. Contact support

---

**Last Updated:** April 22, 2026
**Version:** 1.0.0

For questions, refer to:
- Provider documentation
- README.md
- PROJECT_SUMMARY.md
