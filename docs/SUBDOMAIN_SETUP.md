# Subdomain Configuration Guide

## Overview

This guide will help you set up subdomain routing for your multi-tenant ecommerce platform. Each store will be accessible via `{store-slug}.yourdomain.com`.

## Option 1: Development Environment (Local Testing)

### Using ngrok (Recommended for Development)

1. **Start your backend server:**
```bash
cd backend
npm start
```

2. **Start ngrok to expose your local server:**
```bash
ngrok http 3001
```

3. **Configure ngrok for subdomain routing:**
```bash
# Create ngrok configuration file
cat > ~/.ngrok2/ngrok.yml << EOF
version: "2"
authtoken: YOUR_NGROK_AUTH_TOKEN
tunnels:
  griffin:
    proto: http
    addr: 3001
    subdomain: griffin
EOF
```

4. **Start ngrok with custom subdomain:**
```bash
ngrok start griffin
```

### Using localhost with custom domains

1. **Edit your hosts file:**
```bash
sudo nano /etc/hosts
```

2. **Add these entries:**
```
127.0.0.1    griffin.local
127.0.0.1    store1.griffin.local
127.0.0.1    store2.griffin.local
127.0.0.1    mystore.griffin.local
```

3. **Access your stores:**
- Main platform: `http://griffin.local:3001`
- Store 1: `http://store1.griffin.local:3001`
- Store 2: `http://store2.griffin.local:3001`

## Option 2: Production Environment

### Using Nginx (Recommended for Production)

1. **Install Nginx:**
```bash
# macOS
brew install nginx

# Ubuntu/Debian
sudo apt-get install nginx

# CentOS/RHEL
sudo yum install nginx
```

2. **Create Nginx configuration:**
```bash
sudo nano /etc/nginx/sites-available/griffin
```

3. **Add this configuration:**
```nginx
# Main domain configuration
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Wildcard subdomain configuration
server {
    listen 80;
    server_name *.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Store-Slug $subdomain;
    }
}
```

4. **Enable the site:**
```bash
sudo ln -s /etc/nginx/sites-available/griffin /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Using Apache (Alternative)

1. **Create Apache virtual host configuration:**
```bash
sudo nano /etc/apache2/sites-available/griffin.conf
```

2. **Add this configuration:**
```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    ServerAlias www.yourdomain.com
    
    ProxyPreserveHost On
    ProxyPass / http://localhost:3001/
    ProxyPassReverse / http://localhost:3001/
</VirtualHost>

<VirtualHost *:80>
    ServerName *.yourdomain.com
    ServerAlias *.yourdomain.com
    
    ProxyPreserveHost On
    ProxyPass / http://localhost:3001/
    ProxyPassReverse / http://localhost:3001/
    
    # Pass subdomain to application
    RequestHeader set X-Store-Slug "%{HTTP_HOST}e"
</VirtualHost>
```

3. **Enable required modules and site:**
```bash
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod headers
sudo a2ensite griffin
sudo systemctl reload apache2
```

## Option 3: Cloudflare (Recommended for Production)

1. **Sign up for Cloudflare** and add your domain
2. **Configure DNS records:**
   - A record: `yourdomain.com` → Your server IP
   - A record: `*.yourdomain.com` → Your server IP (wildcard)

3. **Set up Page Rules:**
   - URL: `*.yourdomain.com/*`
   - Settings: Forwarding URL → `https://yourdomain.com/$1`

4. **Configure SSL/TLS:**
   - Set SSL/TLS encryption mode to "Full"
   - Enable "Always Use HTTPS"

## DNS Configuration

### For Production:

1. **Add wildcard DNS record:**
```
Type: A
Name: *.yourdomain.com
Value: YOUR_SERVER_IP
TTL: 300
```

2. **Add main domain record:**
```
Type: A
Name: yourdomain.com
Value: YOUR_SERVER_IP
TTL: 300
```

### For Development:

1. **Using dnsmasq (macOS):**
```bash
# Install dnsmasq
brew install dnsmasq

# Configure dnsmasq
echo 'address=/.griffin.local/127.0.0.1' >> /usr/local/etc/dnsmasq.conf

# Start dnsmasq
sudo brew services start dnsmasq

# Configure macOS to use dnsmasq
sudo networksetup -setdnsservers "Wi-Fi" 127.0.0.1
```

## Testing Your Setup

### 1. Create a test store

```bash
# Using curl to create a store
curl -X POST http://localhost:3001/api/stores \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Test Store",
    "description": "A test store",
    "contactInfo": {
      "email": "test@example.com"
    }
  }'
```

### 2. Test subdomain access

```bash
# Test main domain
curl http://yourdomain.com/api/stores

# Test subdomain
curl http://test-store.yourdomain.com/api/products
```

### 3. Verify store isolation

```bash
# Create another store
curl -X POST http://localhost:3001/api/stores \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Another Store",
    "description": "Another test store",
    "contactInfo": {
      "email": "another@example.com"
    }
  }'

# Test both stores
curl http://test-store.yourdomain.com/api/products
curl http://another-store.yourdomain.com/api/products
```

## Troubleshooting

### Common Issues:

1. **Subdomain not resolving:**
   - Check DNS propagation: `dig *.yourdomain.com`
   - Verify wildcard DNS record is active
   - Wait for DNS propagation (up to 48 hours)

2. **Nginx/Apache not forwarding subdomains:**
   - Check server configuration syntax
   - Verify proxy modules are enabled
   - Check server logs: `sudo tail -f /var/log/nginx/error.log`

3. **Application not receiving subdomain:**
   - Check request headers in your application
   - Verify middleware is extracting subdomain correctly
   - Test with curl: `curl -H "Host: store1.yourdomain.com" http://localhost:3001`

### Debug Commands:

```bash
# Check DNS resolution
nslookup store1.yourdomain.com

# Test HTTP headers
curl -I -H "Host: store1.yourdomain.com" http://localhost:3001

# Check nginx configuration
sudo nginx -t

# View nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Security Considerations

1. **SSL/TLS Certificates:**
   - Use Let's Encrypt for free SSL certificates
   - Configure wildcard certificates for subdomains
   - Enable HTTPS redirect

2. **Rate Limiting:**
   - Implement rate limiting per subdomain
   - Monitor for abuse

3. **CORS Configuration:**
   - Configure CORS for subdomains
   - Set appropriate security headers

## Next Steps

1. **Set up SSL certificates** for production
2. **Configure monitoring** for subdomain performance
3. **Implement caching** strategies
4. **Set up backup** and disaster recovery
5. **Configure logging** for subdomain analytics

Your subdomain configuration is now ready! Each store will be accessible via `{store-slug}.yourdomain.com`. 