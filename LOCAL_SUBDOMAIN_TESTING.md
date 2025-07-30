# Local Subdomain Testing Guide

## Quick Setup for Testing Subdomains Locally

Since ngrok requires authentication, let's set up local testing using the hosts file method.

### Step 1: Configure Local DNS

1. **Edit your hosts file:**
```bash
sudo nano /etc/hosts
```

2. **Add these entries to the end of the file:**
```
127.0.0.1    griffin.local
127.0.0.1    store1.griffin.local
127.0.0.1    store2.griffin.local
127.0.0.1    mystore.griffin.local
127.0.0.1    test-store.griffin.local
127.0.0.1    another-store.griffin.local
```

3. **Save and exit** (Ctrl+X, then Y, then Enter)

### Step 2: Test the Setup

1. **Test main domain:**
```bash
curl -H "Host: griffin.local" http://localhost:3001/api/v1/stores
```

2. **Test subdomain:**
```bash
curl -H "Host: store1.griffin.local" http://localhost:3001/api/v1/products
```

3. **Test another subdomain:**
```bash
curl -H "Host: test-store.griffin.local" http://localhost:3001/api/v1/stores
```

### Step 3: Create Test Stores

1. **First, create an admin user:**
```bash
npm run create-admin
```

2. **Create a test store:**
```bash
npm run create-store
```

3. **Or use the API directly:**
```bash
# Get a JWT token first (you'll need to implement login)
# Then create a store:
curl -X POST http://localhost:3001/api/v1/stores \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Test Store",
    "description": "A test store for subdomain testing",
    "contactInfo": {
      "email": "test@example.com"
    }
  }'
```

### Step 4: Verify Store Isolation

1. **Create multiple stores with different slugs:**
```bash
# Store 1
curl -X POST http://localhost:3001/api/v1/stores \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Electronics Store",
    "description": "Best electronics in town",
    "contactInfo": {
      "email": "electronics@example.com"
    }
  }'

# Store 2
curl -X POST http://localhost:3001/api/v1/stores \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Fashion Store",
    "description": "Trendy fashion items",
    "contactInfo": {
      "email": "fashion@example.com"
    }
  }'
```

2. **Test subdomain access:**
```bash
# Test electronics store
curl -H "Host: electronics-store.griffin.local" http://localhost:3001/api/v1/products

# Test fashion store
curl -H "Host: fashion-store.griffin.local" http://localhost:3001/api/v1/products
```

### Step 5: Browser Testing

1. **Open your browser and navigate to:**
   - Main platform: `http://griffin.local:3001`
   - Store 1: `http://electronics-store.griffin.local:3001`
   - Store 2: `http://fashion-store.griffin.local:3001`

2. **Test the store creation form:**
   - Go to: `http://griffin.local:3001/create-store`
   - Create a new store and verify the slug generation

### Step 6: Verify Middleware Functionality

The middleware should automatically:
1. Extract the subdomain from the Host header
2. Find the corresponding store in the database
3. Attach the store to the request object
4. Filter all data by store

### Testing Commands

```bash
# Test subdomain extraction
curl -H "Host: my-store.griffin.local" http://localhost:3001/api/v1/stores

# Test with different subdomains
curl -H "Host: store1.griffin.local" http://localhost:3001/api/v1/products
curl -H "Host: store2.griffin.local" http://localhost:3001/api/v1/products

# Test main domain
curl -H "Host: griffin.local" http://localhost:3001/api/v1/stores

# Test invalid subdomain
curl -H "Host: invalid-store.griffin.local" http://localhost:3001/api/v1/products
```

### Expected Results

1. **Valid subdomains:** Should return store-specific data
2. **Invalid subdomains:** Should return 404 or appropriate error
3. **Main domain:** Should work for platform-level operations
4. **Store isolation:** Each store should only see its own data

### Debugging

If subdomain routing isn't working:

1. **Check the middleware:**
```bash
# Add console.log to storeIsolation.js middleware
console.log('Host:', req.get('host'));
console.log('Subdomain:', subdomain);
console.log('Store found:', store);
```

2. **Check database:**
```bash
# Verify stores exist in database
mongo your-database-name
db.stores.find({}, {name: 1, slug: 1})
```

3. **Check server logs:**
```bash
# Monitor server output for errors
tail -f backend/logs/app.log
```

### Production Setup

For production, you'll need:

1. **DNS Configuration:**
   - A record: `yourdomain.com` → Your server IP
   - A record: `*.yourdomain.com` → Your server IP (wildcard)

2. **Web Server Configuration:**
   - Nginx or Apache with wildcard subdomain support
   - SSL certificates for subdomains

3. **SSL Certificates:**
   - Wildcard SSL certificate for `*.yourdomain.com`
   - Or individual certificates for each subdomain

### Next Steps

1. **Test the complete flow:**
   - User registration
   - Store creation
   - Subdomain access
   - Data isolation

2. **Set up production environment:**
   - Configure DNS
   - Set up web server
   - Install SSL certificates

3. **Monitor and optimize:**
   - Performance monitoring
   - Error tracking
   - Analytics per store

Your subdomain configuration is now ready for testing! Each store will be accessible via `{store-slug}.griffin.local:3001` during development. 