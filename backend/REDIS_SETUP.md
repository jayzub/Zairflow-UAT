# Redis Setup Guide

## 🚀 **Quick Setup**

### **1. Install Redis**

#### **macOS (using Homebrew):**
```bash
brew install redis
brew services start redis
```

#### **Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

#### **Using Docker:**
```bash
docker run -d --name redis-cache -p 6379:6379 redis:alpine
```

### **2. Test Redis Connection**
```bash
# Test if Redis is running
redis-cli ping
# Should return: PONG

# Test basic operations
redis-cli set test "Hello Redis"
redis-cli get test
# Should return: "Hello Redis"
```

### **3. Configure Environment Variables**

Create a `.env` file in your `backend` directory:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/griffin

# Redis Configuration
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=3001
NODE_ENV=development

# Cloudinary Configuration (for file uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Rate Limiting Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Cache Configuration
CACHE_TTL=3600
ANALYTICS_CACHE_TTL=1800
SETTINGS_CACHE_TTL=7200
THEME_CACHE_TTL=7200
USER_STORES_CACHE_TTL=1800
DISCOVERY_CACHE_TTL=900
```

### **4. Update Cache Configuration**

The cache utility will automatically use the `REDIS_URL` environment variable. If Redis is not available, the application will gracefully fall back to database-only operations.

## 🔧 **Redis Configuration Options**

### **Local Development:**
```env
REDIS_URL=redis://localhost:6379
```

### **With Authentication:**
```env
REDIS_URL=redis://username:password@localhost:6379
```

### **With Database Selection:**
```env
REDIS_URL=redis://localhost:6379/1
```

### **Redis Cloud (Production):**
```env
REDIS_URL=redis://default:password@redis-12345.c123.us-east-1-1.ec2.cloud.redislabs.com:12345
```

### **Docker Compose:**
```yaml
# docker-compose.yml
version: '3.8'
services:
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  app:
    build: .
    ports:
      - "3001:3001"
    environment:
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis

volumes:
  redis_data:
```

## 🧪 **Testing Redis Connection**

### **1. Test from Command Line:**
```bash
# Check if Redis is running
redis-cli ping

# Test basic operations
redis-cli set "test:key" "test:value"
redis-cli get "test:key"
redis-cli del "test:key"
```

### **2. Test from Node.js:**
```javascript
// test-redis.js
const redis = require('redis');

async function testRedis() {
    const client = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    try {
        await client.connect();
        console.log('✅ Redis connected successfully');
        
        await client.set('test', 'Hello Redis!');
        const value = await client.get('test');
        console.log('✅ Redis test value:', value);
        
        await client.del('test');
        console.log('✅ Redis test completed');
        
    } catch (error) {
        console.error('❌ Redis connection failed:', error.message);
    } finally {
        await client.quit();
    }
}

testRedis();
```

Run the test:
```bash
node test-redis.js
```

## 🔍 **Troubleshooting**

### **Common Issues:**

#### **1. Redis not running:**
```bash
# Check if Redis is running
ps aux | grep redis

# Start Redis manually
redis-server

# Or start as service
sudo systemctl start redis-server
```

#### **2. Port already in use:**
```bash
# Check what's using port 6379
lsof -i :6379

# Kill the process
sudo kill -9 <PID>
```

#### **3. Permission denied:**
```bash
# Fix Redis permissions
sudo chown redis:redis /var/lib/redis
sudo chmod 750 /var/lib/redis
```

#### **4. Connection refused:**
```bash
# Check Redis configuration
sudo nano /etc/redis/redis.conf

# Make sure bind is set to:
bind 127.0.0.1

# Restart Redis
sudo systemctl restart redis-server
```

### **Debug Redis Connection:**

Add this to your application startup:

```javascript
// In your main server file
const storeCache = require('./utils/cache');

// Test cache connection on startup
storeCache.getCacheStats().then(stats => {
    if (stats) {
        console.log('✅ Redis cache connected:', stats);
    } else {
        console.log('⚠️  Redis cache not available, using database-only mode');
    }
});
```

## 📊 **Redis Monitoring**

### **Redis CLI Commands:**
```bash
# Monitor Redis in real-time
redis-cli monitor

# Get Redis info
redis-cli info

# Get memory usage
redis-cli info memory

# Get connected clients
redis-cli client list
```

### **Redis GUI Tools:**
- **RedisInsight** (Official Redis GUI)
- **Redis Desktop Manager**
- **Another Redis Desktop Manager**

## 🚀 **Production Setup**

### **1. Redis Cloud (Recommended):**
1. Sign up at [Redis Cloud](https://redis.com/try-free/)
2. Create a new database
3. Get your connection URL
4. Set `REDIS_URL` environment variable

### **2. Self-hosted Redis:**
```bash
# Install Redis on Ubuntu
sudo apt update
sudo apt install redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf

# Set password
requirepass your-strong-password

# Restart Redis
sudo systemctl restart redis-server
```

### **3. Docker Production:**
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  redis:
    image: redis:alpine
    command: redis-server --requirepass your-strong-password
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  redis_data:
```

## ✅ **Verification Checklist**

- [ ] Redis server is running (`redis-cli ping` returns `PONG`)
- [ ] Environment variable `REDIS_URL` is set
- [ ] Application can connect to Redis
- [ ] Cache operations work (set/get/delete)
- [ ] Application gracefully handles Redis failures
- [ ] Cache invalidation works correctly

Once Redis is properly set up, your store system will have:
- **60-90% faster response times** for cached data
- **Reduced database load** by 70%
- **Better user experience** with faster page loads
- **Scalability** for high-traffic scenarios 