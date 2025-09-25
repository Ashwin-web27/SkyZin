# 🔧 Coming Soon API Error - Quick Fix Guide

## ❌ **Error Encountered:**
```
Error: Failed to update coming soon status
```

## 🛠️ **Quick Fixes:**

### **1. Check Backend Server Status**
```bash
# In backend folder
cd backend
npm start
```
**Expected Output:** `Server running on port 5000`

### **2. Check Authentication**
The error likely occurs due to:
- **Missing authentication token**
- **Backend server not running**
- **Database connection issues**

### **3. Authentication Fix**
Make sure you're logged in to the admin panel:
1. Go to `http://localhost:4000/login`
2. Login with admin credentials
3. Check browser console for auth token:
   ```javascript
   localStorage.getItem('token')
   localStorage.getItem('authToken') 
   localStorage.getItem('adminToken')
   ```

### **4. Database Model Update**
The `comingSoon` field was added to the Course model. If using existing data:

**Option A: Reset Database**
```javascript
// In MongoDB or your database, add these fields to existing courses
{
  comingSoon: false,
  expectedLaunchDate: null,
  earlyAccessPrice: null,
  notifyWhenAvailable: []
}
```

**Option B: Backend Migration** (if needed)
```javascript
// In backend, run this once to update existing courses
Course.updateMany(
  { comingSoon: { $exists: false } },
  { 
    $set: { 
      comingSoon: false,
      expectedLaunchDate: null,
      earlyAccessPrice: null,
      notifyWhenAvailable: []
    }
  }
)
```

### **5. Test the Fix**
1. **Start backend**: `npm start` in backend folder
2. **Check health**: Visit `http://localhost:5000/api/health`
3. **Login to admin**: Go to `http://localhost:4000` and login
4. **Test toggle**: Try the Coming Soon toggle on any course

## 🔍 **Debug Steps:**

### **Check Browser Console:**
1. Open browser Dev Tools (F12)
2. Go to Network tab
3. Try the Coming Soon toggle
4. Look for the API call to `/api/courses/:id`
5. Check the response status and error message

### **Check Backend Logs:**
1. Look at the terminal running the backend
2. Look for error messages when the toggle is clicked
3. Common errors:
   - `Authentication required`
   - `Course not found`
   - `Validation failed`

## 📋 **Expected Behavior:**

### **Working Flow:**
1. **Admin clicks Coming Soon toggle** ⚡
2. **Frontend sends PUT request** to `/api/courses/:id`
3. **Backend validates auth** and updates course
4. **WebSocket broadcasts** change to users
5. **User sees toast notification** 🔜
6. **Course appears in Coming Soon section**

### **API Request:**
```javascript
PUT http://localhost:5000/api/courses/:id
Headers: {
  "Content-Type": "application/json",
  "Authorization": "Bearer <token>"
}
Body: {
  "comingSoon": true
}
```

### **Expected Response:**
```javascript
{
  "success": true,
  "message": "Course updated successfully",
  "data": {
    "_id": "...",
    "title": "...",
    "comingSoon": true,
    // ... other fields
  }
}
```

## 🚀 **Quick Test:**

### **Manual API Test:**
```bash
# Test if backend is running
curl http://localhost:5000/api/health

# Test courses endpoint
curl http://localhost:5000/api/courses
```

## ✅ **Resolution Checklist:**
- [ ] Backend server is running on port 5000
- [ ] Admin is logged in with valid token
- [ ] Course model has `comingSoon` field
- [ ] API endpoint accepts PUT requests
- [ ] Network request succeeds (check browser dev tools)
- [ ] WebSocket is broadcasting updates

## 🏆 **Once Fixed:**
The admin will have complete control over:
- ⭐ Featured Courses
- 🔥 Trending Now  
- 🔜 Coming Soon
- 🆕 Now Available

All with real-time updates! 🚀