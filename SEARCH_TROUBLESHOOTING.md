# Search Troubleshooting Guide

## ✅ Changes Made

I've fixed a critical bug in the search service where the API response was being accessed incorrectly, and added detailed logging to help diagnose any remaining issues.

## 🔍 How to Debug

### Step 1: Check Browser Console

1. Open your browser's Developer Tools (Press F12)
2. Go to the **Console** tab
3. Try searching for something (e.g., "layfield")
4. You should see logs like:
   ```
   🔍 Performing search: {query: "layfield", type: "all", page: 1}
   ✅ Search response: {...}
   ```

### Step 2: Check Backend Status

**Is your backend server running?**

Open a new terminal and check if your backend is accessible:

```bash
# Test if backend is running
curl http://localhost:5000/api/v1/health

# OR test the search endpoint directly
curl "http://localhost:5000/api/v1/search?q=test&type=all"
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Search completed successfully",
  "data": {
    "query": "test",
    "type": "all",
    "results": {
      "users": {...},
      "posts": {...},
      "locations": {...}
    },
    "totalResults": 0
  }
}
```

### Step 3: Common Issues & Fixes

#### Issue: "Search failed" error

**Possible Causes:**

1. **Backend not running**
   - Solution: Start your backend server
   - Check if it's on port 5000: `netstat -ano | findstr :5000`

2. **Backend on different port**
   - If backend is on port 3000, edit `.env.local`:
     ```env
     NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
     NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
     ```
   - Restart the Next.js dev server: `pnpm run dev`

3. **Search endpoint not implemented**
   - Check your backend has `GET /api/v1/search` endpoint
   - Verify the endpoint returns the correct response format

4. **CORS issues**
   - Check backend CORS settings allow `http://localhost:3000`
   - Look for CORS errors in browser console

#### Issue: Wrong response format

Check the console logs for the actual response structure. The expected format is:

```typescript
{
  success: true,
  message: string,
  data: {
    query: string,
    type: string,
    results: {
      users?: {...},
      posts?: {...},
      locations?: {...}
    },
    totalResults: number
  }
}
```

### Step 4: Check Network Tab

1. Open Developer Tools (F12)
2. Go to **Network** tab
3. Search for something
4. Look for the request to `search?q=...`
5. Check:
   - Status code (should be 200)
   - Response body (should match format above)
   - Request URL (should point to your backend)

## 🔧 Quick Fixes

### Fix 1: Restart Everything

```bash
# Stop both servers (Ctrl+C)

# Start backend first
cd ../backend
npm start

# Then start frontend
cd ../neyborhuud-PWA
pnpm run dev
```

### Fix 2: Check Backend Search Endpoint

Make sure your backend has implemented the search endpoint according to the API spec in the guide. The endpoint should:

- Accept query params: `q`, `type`, `page`, `limit`
- Return the response format shown above
- Support types: `all`, `users`, `posts`, `locations`

### Fix 3: Test With Postman/cURL

```bash
# Test basic search
curl -X GET "http://localhost:5000/api/v1/search?q=test&type=all" \
  -H "Content-Type: application/json"

# Test with authentication (if required)
curl -X GET "http://localhost:5000/api/v1/search?q=test&type=all" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

## 📋 Checklist

- [ ] Backend server is running
- [ ] Backend is on port 5000 (or .env.local updated to correct port)
- [ ] `/api/v1/search` endpoint exists on backend
- [ ] Browser console shows search request being made
- [ ] Network tab shows 200 response (not 404/500)
- [ ] Response format matches expected structure
- [ ] No CORS errors in console

## 🆘 Still Not Working?

Share the following information:

1. **Console logs** when you search (the 🔍 and ✅/❌ messages)
2. **Network tab** - screenshot of the search request/response
3. **Backend logs** - what the backend shows when search is called
4. **Backend port** - which port is your backend actually running on?

---

**Note:** The search functionality requires the backend search endpoint to be fully implemented and running. If your backend doesn't have the search endpoint yet, the search will fail until it's implemented.
