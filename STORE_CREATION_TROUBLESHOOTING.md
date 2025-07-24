# Store Creation Troubleshooting Guide

## 🚨 **Error: "Cannot read properties of undefined (reading '_id')"**

### **Problem Description**
When trying to create a store, you get this error:
```
TypeError: Cannot read properties of undefined (reading '_id')
    at /Users/jzubair/Documents/griffin/backend/controllers/storeController.js:29:25
```

### **Root Cause**
This error occurs because the JWT authentication middleware is not properly setting the `req.user` object. The issue was a mismatch between the JWT token field names:

1. **JWT Token Generation**: Used `userID` field
2. **JWT Token Verification**: Expected `id` field
3. **Result**: `req.user` was undefined

## ✅ **How I Fixed It**

### **1. Updated JWT Middleware**
Modified `backend/middleware/jwt.js` to handle both field names:
```javascript
// Handle both 'id' and 'userID' field names for backward compatibility
const userId = decoded.id || decoded.userID;
req.user = { _id: userId, email: decoded.email };
```

### **2. Standardized JWT Token Generation**
Updated `backend/routes/users.js` to use consistent field names:
```javascript
const token = jwt.sign({
    id: user.id,           // ✅ Now uses 'id' consistently
    email: user.email,
    isAdmin: user.isAdmin,
    role: user.role
}, secret, { expiresIn: '1d' });
```

## 🧪 **Test the Fix**

### **Method 1: Using the Test Script**
```bash
# Test store creation end-to-end
npm run test-store
```

### **Method 2: Manual Testing**
1. **Register a store owner**:
   ```bash
   curl -X POST http://localhost:3001/api/v1/users/register \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test Owner",
       "email": "test@store.com",
       "password": "password123",
       "phone": "+1234567890",
       "role": "store_owner"
     }'
   ```

2. **Login**:
   ```bash
   curl -X POST http://localhost:3001/api/v1/users/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@store.com",
       "password": "password123"
     }'
   ```

3. **Create store** (use the token from step 2):
   ```bash
   curl -X POST http://localhost:3001/api/v1/stores \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test Store",
       "slug": "test-store",
       "description": "A test store"
     }'
   ```

## 🔍 **Debugging Steps**

### **Step 1: Check JWT Token**
Decode your JWT token to see what fields it contains:
```javascript
// In browser console or Node.js
const token = 'YOUR_JWT_TOKEN';
const payload = JSON.parse(atob(token.split('.')[1]));
console.log(payload);
```

**Expected output**:
```json
{
  "id": "user_id_here",
  "email": "user@example.com",
  "isAdmin": true,
  "role": "store_owner",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### **Step 2: Check Authentication Middleware**
Add logging to see what's happening:
```javascript
// In backend/middleware/jwt.js, add this logging:
console.log('Decoded token:', decoded);
console.log('User ID:', decoded.id || decoded.userID);
console.log('Req.user:', req.user);
```

### **Step 3: Check Store Controller**
Add logging to see the request object:
```javascript
// In backend/controllers/storeController.js, add this logging:
console.log('Request user:', req.user);
console.log('Request headers:', req.headers);
```

## 🛠️ **Common Issues and Solutions**

### **Issue 1: "Access token required"**
**Solution**: Make sure you're including the Authorization header:
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" ...
```

### **Issue 2: "Invalid token"**
**Solutions**:
1. **Check JWT_SECRET**: Ensure your `.env` file has `JWT_SECRET` set
2. **Token expiration**: Generate a new token by logging in again
3. **Token format**: Ensure token starts with "Bearer "

### **Issue 3: "User not found or inactive"**
**Solutions**:
1. **Check user exists**: Verify the user was created successfully
2. **Check user status**: Ensure `isActive: true` in the database
3. **Check user role**: Ensure user has `store_owner` role

### **Issue 4: "Store slug already exists"**
**Solution**: Use a unique slug:
```json
{
  "name": "My Store",
  "slug": "my-store-2",  // Add a number or unique identifier
  "description": "Store description"
}
```

## 📋 **Verification Checklist**

- [ ] JWT token contains `id` field (not `userID`)
- [ ] User exists in database with `store_owner` role
- [ ] User has `isActive: true`
- [ ] Authorization header includes `Bearer ` prefix
- [ ] JWT_SECRET environment variable is set
- [ ] Token is not expired
- [ ] Store slug is unique

## 🔧 **Prevention Tips**

### **1. Use Consistent JWT Field Names**
Always use `id` for user ID in JWT tokens:
```javascript
const token = jwt.sign({
    id: user.id,           // ✅ Consistent
    email: user.email,
    // ... other fields
}, secret, { expiresIn: '1d' });
```

### **2. Add Error Handling**
Add proper error handling in controllers:
```javascript
const createStore = asyncHandler(async (req, res) => {
    // Check if user exists
    if (!req.user || !req.user._id) {
        return res.status(401).json({
            success: false,
            error: 'User not authenticated'
        });
    }
    
    // ... rest of the function
});
```

### **3. Use Middleware Validation**
Add validation middleware to ensure required fields:
```javascript
const validateStoreData = (req, res, next) => {
    const { name, slug } = req.body;
    
    if (!name || !slug) {
        return res.status(400).json({
            success: false,
            error: 'Name and slug are required'
        });
    }
    
    next();
};
```

## 📚 **Related Documentation**

- [Store Creation Guide](./STORE_CREATION_GUIDE.md) - Complete store creation process
- [JWT Authentication Guide](./SWAGGER_AUTHENTICATION_GUIDE.md) - Authentication setup
- [API Documentation](./API_DOCUMENTATION.md) - Complete API reference
- [Route Ordering Guide](./ROUTE_ORDERING_GUIDE.md) - Express.js route organization

## 🎯 **Summary**

The error was caused by a JWT token field name mismatch. The fix involved:

1. **Standardizing JWT field names** to use `id` consistently
2. **Adding backward compatibility** in the middleware
3. **Creating test scripts** to verify the fix
4. **Adding comprehensive error handling**

After applying these fixes, store creation should work correctly! 🚀 