# Production Deployment Guide

## Quick Deploy Options

### 1. Railway (Recommended)
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/yourusername/minilatics)

1. Click the Railway button above
2. Connect your GitHub account
3. Deploy automatically

### 2. Heroku
```bash
# Create Heroku app
heroku create your-minilatics-app

# Set environment variables
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

### 3. DigitalOcean App Platform
1. Connect your GitHub repository
2. Set Node.js as the runtime
3. Set build command: `npm install`
4. Set run command: `npm start`

### 4. VPS/Server (Ubuntu)
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone and setup
git clone <your-repo>
cd minilatics
npm install --production

# Install PM2
sudo npm install -g pm2

# Start with PM2
pm2 start server.js --name minilatics
pm2 startup
pm2 save
```

## Environment Variables

Set these for production:

```bash
NODE_ENV=production
PORT=3000
```

## Nginx Configuration (Optional)

```nginx
server {
    listen 80;
    server_name your-analytics-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## SSL Certificate (Recommended)

Use Let's Encrypt:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-analytics-domain.com
```

## Database Backup

The SQLite database (`analytics.db`) contains all your data. Backup regularly:

```bash
# Create backup
cp analytics.db analytics-backup-$(date +%Y%m%d).db

# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cp analytics.db backups/analytics-$DATE.db
find backups/ -name "analytics-*.db" -mtime +30 -delete
```

## Monitoring

### Health Check Endpoint
Add to your server.js:
```javascript
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
```

### PM2 Monitoring
```bash
pm2 monit
pm2 logs minilatics
```

## Usage After Deployment

Once deployed to `https://your-domain.com`:

1. **Add to your website**:
   ```html
   <script src="https://your-domain.com/script.js" data-site-key="your-unique-site-key"></script>
   ```

2. **View analytics**:
   Visit: `https://your-domain.com/admin/your-unique-site-key`

## Security Considerations

- Use a unique, hard-to-guess site key
- Consider adding rate limiting for production
- Protect the admin interface with basic auth if needed
- Regular database backups
- Monitor server resources

## Performance Tips

- The script is cached for 1 hour
- SQLite handles thousands of requests easily
- For high traffic, consider PostgreSQL migration
- Use a CDN for the tracking script
