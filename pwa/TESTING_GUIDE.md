# 🧪 Frontend Testing Guide - Interactive Feed

## ✅ Prerequisites

1. **Backend Running**: Ensure your backend server is running on port 5000 (or configured port)
2. **Environment Variables**: Check `.env.local` has correct API URL
3. **Dependencies Installed**: Run `npm install` if needed

## 🚀 Quick Start Testing

### Step 1: Start the Frontend
```bash
npm run dev
```

The app will start on `http://localhost:3000` (or next available port)

### Step 2: Sign Up (Required for Testing)

**Yes, you need to sign up to test the feed** because:
- The feed requires authentication (token in localStorage)
- The feed needs your location to fetch nearby posts
- Post interactions (like, comment, save) require authentication

#### Sign Up Process:
1. Navigate to `http://localhost:3000/signup`
2. Fill in the registration form:
   - **Username**: Choose a unique username
   - **Email**: Use a valid email (can be test email)
   - **Password**: Must meet requirements (8+ chars, uppercase, lowercase, number)
   - **Agree to Terms**: Check the box
3. **Location Permission**: 
   - Browser will prompt for location access
   - **Allow** location access (required for feed)
4. Click **"Create Account"**
5. After successful signup, you'll be redirected or can navigate to `/feed`

### Step 3: Test the Feed

Once signed up and logged in:

1. **Navigate to Feed**: Go to `http://localhost:3000/feed`
2. **Location Permission**: If not already granted, allow location access
3. **Feed Should Load**: You should see:
   - Status reel (stories) at the top
   - Category filters (All, SAFETY, EVENT, MARKETPLACE, BULLETIN)
   - Posts from your area (if any exist)

## 🧪 Testing Checklist

### ✅ Feed Loading
- [ ] Feed loads with location-based posts
- [ ] Loading spinner appears while fetching
- [ ] Empty state shows if no posts found
- [ ] Error state shows if API fails

### ✅ Location-Based Feed
- [ ] Location permission prompt appears
- [ ] Feed uses your current location
- [ ] Posts are filtered by radius (5000m default)
- [ ] Location error handled gracefully

### ✅ Category Filtering
- [ ] "All" filter shows all posts
- [ ] "SAFETY" filter shows only safety posts
- [ ] "EVENT" filter shows only event posts
- [ ] "MARKETPLACE" filter shows only marketplace posts
- [ ] "BULLETIN" filter shows only bulletin posts

### ✅ Like/Unlike Functionality
- [ ] Click like button → Heart fills and count increases (optimistic)
- [ ] Click again → Heart unfills and count decreases
- [ ] Like persists after page refresh
- [ ] Works for multiple posts

### ✅ Comment Functionality
- [ ] Click comment button → Comments section expands
- [ ] Comments load from API
- [ ] Type comment and submit → Comment appears
- [ ] Comment count updates
- [ ] Multiple comments display correctly

### ✅ Save/Unsave Functionality
- [ ] Click bookmark → Bookmark fills (optimistic)
- [ ] Click again → Bookmark unfills
- [ ] Save persists after page refresh
- [ ] Works for multiple posts

### ✅ Infinite Scroll
- [ ] Scroll to bottom → More posts load automatically
- [ ] Loading indicator shows while fetching
- [ ] Stops loading when no more posts

### ✅ Post Display
- [ ] Text posts display correctly
- [ ] Image posts show images
- [ ] Gallery posts show stacked gallery
- [ ] User avatars display
- [ ] Post timestamps format correctly (2m, 1h, etc.)
- [ ] Category badges show correct colors/icons
- [ ] View counts display

## 🔍 Debugging Tips

### Check Browser Console
Open DevTools (F12) and check:
- Network tab: See API calls to `/api/v1/feed`
- Console tab: Look for errors or warnings
- Application tab → Local Storage: Check for `neyborhuud_access_token`

### Common Issues

1. **"Location access required for feed"**
   - Solution: Allow location permission in browser
   - Check: Browser settings → Site permissions → Location

2. **"Failed to load feed"**
   - Check: Backend is running on correct port
   - Check: `.env.local` has correct `NEXT_PUBLIC_API_URL`
   - Check: Network tab for API errors

3. **"No posts found"**
   - This is normal if no posts exist in your area
   - Try: Create a post from backend or another account
   - Try: Increase radius in code (currently 5000m)

4. **"401 Unauthorized"**
   - Solution: Sign up/login again
   - Check: Token exists in localStorage
   - Check: Token hasn't expired

5. **Like/Comment/Save not working**
   - Check: You're authenticated (token in localStorage)
   - Check: Network tab for API errors
   - Check: Console for error messages

## 📝 Testing with Multiple Accounts

To test interactions between users:

1. **Create Account 1**: Sign up with email1@test.com
2. **Create a Post**: (If post creation is available)
3. **Logout**: Clear localStorage or use incognito
4. **Create Account 2**: Sign up with email2@test.com
5. **View Feed**: Should see Account 1's post
6. **Like/Comment**: Test interactions

## 🔗 API Endpoints Being Tested

- `GET /api/v1/feed?lat=X&lng=Y&radius=5000` - Fetch feed
- `POST /api/v1/content/posts/:postId/like` - Like post
- `DELETE /api/v1/content/posts/:postId/like` - Unlike post
- `GET /api/v1/content/posts/:postId/comments` - Get comments
- `POST /api/v1/content/posts/:postId/comments` - Create comment
- `POST /api/v1/content/posts/:postId/save` - Save post
- `DELETE /api/v1/content/posts/:postId/save` - Unsave post

## 🎯 Expected Behavior

### Optimistic Updates
- **Like**: Heart fills immediately, count updates, then API call
- **Save**: Bookmark fills immediately, then API call
- **Comment**: Appears in list immediately, then API call
- If API fails, UI rolls back to previous state

### Loading States
- Initial load: Full page spinner
- Infinite scroll: Small spinner at bottom
- Comments: Spinner in comments section
- Actions: Buttons may show loading state

### Error Handling
- Network errors: Show error message with retry button
- Location errors: Show message asking to enable location
- Auth errors: Redirect to login (if implemented)

## 📱 Testing on Mobile

1. **Use Browser DevTools**: 
   - Toggle device toolbar (Ctrl+Shift+M)
   - Test on mobile viewport
2. **Or Use Real Device**:
   - Connect to same network
   - Access `http://[your-ip]:3000`
   - Test touch interactions

## 🐛 Reporting Issues

When reporting issues, include:
1. **Browser**: Chrome, Firefox, Safari, etc.
2. **Console Errors**: Copy error messages
3. **Network Tab**: Screenshot of failed requests
4. **Steps to Reproduce**: What you did before the error
5. **Expected vs Actual**: What should happen vs what happened

---

## ✅ Quick Test Commands

```bash
# Start frontend
npm run dev

# Check if backend is running (in another terminal)
curl http://localhost:5000/api/v1/feed?lat=6.5244&lng=3.3792&radius=5000

# Check environment variables
cat .env.local

# Clear localStorage (in browser console)
localStorage.clear()
```

Happy Testing! 🚀
