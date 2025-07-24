# Swagger UI Troubleshooting Guide

## Issue: "Failed to fetch" in Swagger UI

### **Problem Description**
When trying to execute API calls in Swagger UI, you get:
```
Failed to fetch.
Possible Reasons:
- CORS
- Network Failure
- URL scheme must be "http" or "https" for CORS request.
```

### **Root Cause**
The most common cause is a **port mismatch**:
- Swagger UI is trying to connect to `http://localhost:3000`
- Your server is running on `http://localhost:3001`

## 🔧 **Solutions**

### **Solution 1: Clear Browser Cache (Most Common Fix)**

1. **Hard refresh** the Swagger UI page:
   - **Chrome/Edge**: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
   - **Firefox**: `Ctrl + F5` (Windows) or `Cmd + Shift + R` (Mac)

2. **Clear browser cache**:
   - Open Developer Tools (`F12`)
   - Right-click the refresh button
   - Select "Empty Cache and Hard Reload"

3. **Try incognito/private mode**:
   - Open a new incognito/private window
   - Navigate to `http://localhost:3001/api-docs`

### **Solution 2: Verify Server Port**

1. **Check what port your server is running on**:
   ```bash
   # Look at the console output when you start the server
   npm run dev
   ```
   You should see: `✅ Server running on port 3001`

2. **Test the health endpoint directly**:
   ```bash
   curl http://localhost:3001/api/v1/health
   ```
   Or visit: `http://localhost:3001/api/v1/health` in your browser

3. **Verify Swagger configuration**:
   - Open `http://localhost:3001/api-docs`
   - Look at the top right corner for the server URL
   - It should show: `http://localhost:3001/api/v1`

### **Solution 3: Check Environment Variables**

1. **Verify your `.env` file**:
   ```env
   PORT=3001
   NODE_ENV=development
   ```

2. **Check if PORT is set in your environment**:
   ```bash
   echo $PORT
   ```

### **Solution 4: Manual URL Correction**

If Swagger UI still shows the wrong URL:

1. **In Swagger UI**:
   - Look for the server dropdown (top right)
   - Select the correct server: `http://localhost:3001/api/v1`
   - If not available, manually edit the URL in the request

2. **Test with curl** to verify the endpoint works:
   ```bash
   curl -X POST http://localhost:3001/api/v1/users/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@platform.com","password":"admin123"}'
   ```

## 🧪 **Testing Steps**

### **Step 1: Test Server Health**
```bash
# Test health endpoint
curl http://localhost:3001/api/v1/health
```

Expected response:
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "port": 3001,
  "environment": "development"
}
```

### **Step 2: Test Login Endpoint**
```bash
# Test login endpoint
curl -X POST http://localhost:3001/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@platform.com","password":"admin123"}'
```

Expected response:
```json
{
  "user": "admin@platform.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### **Step 3: Test Swagger UI**
1. Open: `http://localhost:3001/api-docs`
2. Try the health endpoint first: `GET /health`
3. Then try the login endpoint: `POST /users/login`

## 🚨 **Common Issues and Fixes**

### **Issue: "CORS Error"**
**Solution**: CORS is already configured in the app. If you still get CORS errors:
1. Check if you're accessing the correct URL
2. Ensure the server is running
3. Try a different browser

### **Issue: "Network Failure"**
**Solutions**:
1. **Check if server is running**:
   ```bash
   ps aux | grep node
   ```

2. **Check port availability**:
   ```bash
   lsof -i :3001
   ```

3. **Restart the server**:
   ```bash
   npm run dev
   ```

### **Issue: "URL scheme must be http or https"**
**Solution**: This usually means the URL is malformed. Ensure:
1. You're using `http://localhost:3001` (not `https://`)
2. The port number is correct
3. No extra characters in the URL

### **Issue: Swagger UI shows wrong server**
**Solution**:
1. Clear browser cache
2. Hard refresh the page
3. Check the Swagger configuration in `backend/swagger.js`

## 🔍 **Debugging Steps**

### **Step 1: Check Server Logs**
```bash
npm run dev
```
Look for:
- Server startup messages
- Port number confirmation
- Any error messages

### **Step 2: Check Network Tab**
1. Open Developer Tools (`F12`)
2. Go to Network tab
3. Try the API call in Swagger UI
4. Look for failed requests and their details

### **Step 3: Test with Postman**
1. Use Postman to test the same endpoint
2. If Postman works but Swagger doesn't, it's a Swagger UI issue
3. If both fail, it's a server issue

## 📋 **Verification Checklist**

- [ ] Server is running on port 3001
- [ ] Health endpoint responds: `http://localhost:3001/api/v1/health`
- [ ] Swagger UI loads: `http://localhost:3001/api-docs`
- [ ] Server URL in Swagger shows: `http://localhost:3001/api/v1`
- [ ] Login endpoint works in Postman
- [ ] Browser cache is cleared
- [ ] No CORS errors in browser console

## 🆘 **Still Having Issues?**

If you're still experiencing problems:

1. **Check the server logs** for any error messages
2. **Try a different browser** (Chrome, Firefox, Safari)
3. **Test with curl or Postman** to isolate the issue
4. **Restart your development environment**:
   ```bash
   # Stop the server (Ctrl+C)
   # Clear node modules cache
   npm cache clean --force
   # Restart
   npm run dev
   ```

## 📞 **Support**

If none of the above solutions work:
1. Check the server console for error messages
2. Verify your MongoDB Atlas connection
3. Ensure all environment variables are set correctly
4. Try running the server on a different port:
   ```bash
   PORT=3002 npm run dev
   ``` 