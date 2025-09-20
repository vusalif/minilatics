# Minilatics

A privacy-focused, minimal analytics solution. No cookies, no IP addresses, no tracking. Just the essentials.

## Features

- **Privacy-first**: No cookies, no IP addresses, no personal data collection
- **Minimal data**: Only page views, unique visitors, referrer, and page path
- **One-line setup**: Single script tag to add to your website
- **Secret admin link**: Access your stats without login or signup
- **Clean design**: Black and white, Inter font, minimal interface

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the server**:
   ```bash
   npm start
   ```

3. **Add tracking to your website**:
   ```html
   <script src="https://minilatics.onrender.com/script.js" data-site-key="your-unique-site-key"></script>
   ```

4. **View your stats**:
   Visit: `https://minilatics.onrender.com/admin/your-unique-site-key`

## How It Works

### Data Collection
- **Page Views**: Counts each page load
- **Unique Visitors**: Uses a hash of user agent + referrer (no cookies/IP)
- **Referrer**: Where visitors came from
- **Page Path**: Which pages are being viewed

### Privacy Protection
- No cookies are set
- No IP addresses are stored
- No personal information is collected
- Visitor identification uses anonymous hashing

### Database
Uses SQLite with minimal schema:
- `site_configs`: Stores site keys
- `analytics`: Stores tracking data with foreign key to site

## API Endpoints

### Track Page View
```
POST /track
Content-Type: application/json

{
  "site_key": "your-site-key",
  "page_path": "/page/path",
  "referrer": "https://referrer.com"
}
```

### Get Analytics
```
GET /stats/:site_key?days=30
```

Returns:
```json
{
  "site_key": "your-site-key",
  "period_days": "30",
  "total_views": 1250,
  "unique_visitors": 340,
  "top_pages": [
    {"page_path": "/", "views": 450},
    {"page_path": "/about", "views": 200}
  ],
  "top_referrers": [
    {"referrer": "https://google.com", "visits": 120},
    {"referrer": "https://twitter.com", "visits": 80}
  ]
}
```

## Customization

### Change Port
Set the `PORT` environment variable:
```bash
PORT=8080 npm start
```

### Database Location
The SQLite database (`analytics.db`) is created in the project root. Move it if needed.

## Deployment

### Using PM2
```bash
npm install -g pm2
pm2 start server.js --name minilatics
```

### Using Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables
- `PORT`: Server port (default: 3000)

## Security Notes

- Site keys should be unique and not easily guessable
- Consider adding rate limiting for production use
- The admin interface has no authentication - protect it with your web server

## License

MIT
