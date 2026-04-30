# 🧪 Marketplace Testing Checklist

**Date:** April 28, 2026  
**Tester:** _______________  
**Build:** Development

---

## ✅ **Pre-Testing Setup**

- [ ] Navigate to `http://localhost:3000/marketplace` (NOT `/feed?type=marketplace`)
- [ ] Verify you're logged in with a valid account
- [ ] Clear browser cache if you see old data
- [ ] Open browser DevTools Console (F12) to monitor for errors

---

## 📦 **1. Product Listing (CRUD Operations)**

### **Create Product**
- [ ] Click "Sell Item" button in top-right corner
- [ ] Redirects to `/marketplace/create` page
- [ ] Fill out the form:
  - [ ] Title (3-100 characters) - test validation
  - [ ] Description (min 10 characters) - test validation  
  - [ ] Price (positive number) - try entering negative value
  - [ ] Category - select from dropdown
  - [ ] Condition - click different condition buttons
  - [ ] Images - upload 1-5 images
  - [ ] Negotiable checkbox - toggle on/off
- [ ] Test form validation:
  - [ ] Try submitting with empty title → Should show error
  - [ ] Try submitting with short description → Should show error
  - [ ] Try uploading more than 5 images → Should show error message
- [ ] Submit valid form
- [ ] Verify redirect to product detail page (`/marketplace/{id}`)
- [ ] Verify product appears with correct data

### **View Product Details**
- [ ] Product page loads at `/marketplace/{id}`
- [ ] All fields display correctly:
  - [ ] Title in large heading
  - [ ] Price formatted with ₦ symbol
  - [ ] Category badge visible
  - [ ] Condition badge with correct color
  - [ ] Description with proper line breaks
  - [ ] Location shown (distance or address)
  - [ ] "Posted X ago" timestamp
  - [ ] Seller info card with avatar/initials
- [ ] Image gallery works:
  - [ ] Main image displays
  - [ ] Thumbnail grid shows all images
  - [ ] Clicking thumbnail changes main image
  - [ ] Border highlights selected thumbnail
- [ ] Back button returns to previous page

### **Edit Product (Your Own)**
- [ ] View a product you created
- [ ] Verify "Edit" and "Delete" buttons appear (only for your products)
- [ ] Click "Edit" button
- [ ] Form pre-fills with existing data
- [ ] Change title, price, or description
- [ ] Click "Update Product"
- [ ] Verify changes saved and page refreshes
- [ ] Toast notification shows "Product updated successfully"

### **Delete Product**
- [ ] View a product you created
- [ ] Click "Delete" button
- [ ] Confirmation dialog appears
- [ ] Click "Cancel" → Nothing happens
- [ ] Click "Delete" again → Confirm deletion
- [ ] Toast shows "Product deleted successfully"
- [ ] Redirects to `/marketplace` main page
- [ ] Product no longer appears in listings

### **Permissions Check**
- [ ] View a product created by another user
- [ ] Verify Edit/Delete buttons DO NOT appear
- [ ] Try to manually navigate to `/marketplace/{other-user-product-id}/edit` → Should fail gracefully

---

## ❤️ **2. Like Functionality**

### **Like a Product**
- [ ] View any product detail page
- [ ] Heart icon is outlined (unfilled) initially
- [ ] Click heart icon
- [ ] **Instant feedback** (optimistic update):
  - [ ] Heart fills with red color
  - [ ] Like count increments by 1
  - [ ] Heart scales up briefly (animation)
- [ ] Refresh page → Like persists
- [ ] Like count remains accurate

### **Unlike a Product**
- [ ] On a product you already liked
- [ ] Heart is filled/red
- [ ] Click heart icon again
- [ ] **Instant feedback**:
  - [ ] Heart becomes outlined (unfilled)
  - [ ] Like count decrements by 1
- [ ] Refresh page → Unlike persists

### **Real-Time Like Updates** (Advanced)
- [ ] Open same product in two browser windows/tabs
- [ ] In Window 1: Like the product
- [ ] In Window 2: Like count updates automatically (within 1-2 seconds)
- [ ] No page refresh needed in Window 2
- [ ] Console shows WebSocket event: `📢 Product updated`

### **Like When Not Logged In**
- [ ] Log out or open incognito window
- [ ] View a product
- [ ] Click like button → Should do nothing OR prompt login

---

## 💬 **3. Comments Functionality**

### **View Comments Section**
- [ ] Product detail page shows "Comments" heading
- [ ] Comment count shows: `Comments (X)` if X > 0
- [ ] Scroll down to see comments section
- [ ] If no comments: Shows "No comments yet. Be the first to comment!"

### **Add a Comment**
- [ ] Scroll to comment form at bottom
- [ ] Text area expands when clicked
- [ ] Character counter shows: `0/1000`
- [ ] Type a comment (at least 10 characters)
- [ ] Counter updates: `X/1000`
- [ ] Click "Post Comment" button
- [ ] **Optimistic update**:
  - [ ] Comment appears immediately at top of list
  - [ ] Shows "You" as username
  - [ ] Shows "Just now" timestamp
- [ ] Server confirms → Comment gets real ID and user info
- [ ] Toast shows "Comment posted!"
- [ ] Comment count in engagement bar increments

### **Comment Validation**
- [ ] Try posting empty comment → Button disabled
- [ ] Try posting just spaces → Should fail validation
- [ ] Type exactly 1000 characters → Should work
- [ ] Try typing 1001 characters → Should prevent/truncate

### **Rate Limiting**
- [ ] Post a comment successfully
- [ ] Immediately try posting another comment
- [ ] Immediately try posting a third comment
- [ ] On 4th attempt within 1 minute:
  - [ ] Toast shows "You're commenting too fast. Please wait X seconds."
  - [ ] Submit button disabled
  - [ ] Countdown timer shows remaining seconds
- [ ] Wait for countdown to finish
- [ ] Button re-enables automatically
- [ ] Can post comment again

### **Reply to Comments** (If Implemented)
- [ ] Click "Reply" button on existing comment
- [ ] Comment form shows "Replying to comment" banner
- [ ] Text prefills with `@username `
- [ ] Post reply
- [ ] Reply appears indented under parent comment
- [ ] Click "Cancel" on reply → Clears reply mode

### **Comment Pagination/Infinite Scroll**
- [ ] If product has 20+ comments
- [ ] Scroll to bottom of comments list
- [ ] "Load More Comments" button appears
- [ ] Click button
- [ ] Next 20 comments load and append to list
- [ ] Button updates state: "Loading..." while fetching

### **Real-Time Comment Updates**
- [ ] Open same product in two tabs
- [ ] In Tab 1: Add a comment
- [ ] In Tab 2: Comment appears automatically (1-2 second delay)
- [ ] Console shows: `💬 New comment on product`
- [ ] Comment count updates in both tabs

---

## 🔍 **4. Product Discovery**

### **Browse All Products**
- [ ] Main marketplace page `/marketplace` loads
- [ ] Shows grid of product cards (4 columns on desktop, 2 on tablet, 1 on mobile)
- [ ] Each card shows:
  - [ ] Product image (or placeholder)
  - [ ] Title (truncated to 2 lines)
  - [ ] Price in green with ₦ symbol
  - [ ] "negotiable" label if applicable
  - [ ] Location/distance
  - [ ] Posted timestamp
  - [ ] Seller avatar/initials
  - [ ] Like count badge (if > 0)

### **Category Filtering**
- [ ] Top of page shows category tabs: All, Electronics, Furniture, etc.
- [ ] Click "Electronics" tab
- [ ] Only electronics products display
- [ ] Tab highlights in green
- [ ] URL stays at `/marketplace` (no query param change needed)
- [ ] Click "All" → Shows all categories again

### **Infinite Scroll**
- [ ] Scroll to bottom of product list
- [ ] If more than 20 products exist:
  - [ ] "Load More" button appears
  - [ ] Click button
  - [ ] Next page of products loads
  - [ ] Button shows "Loading..." during fetch
  - [ ] Products append to existing list (no jump to top)

### **Empty States**
- [ ] Filter by category with no products
- [ ] Shows empty state: "No products found"
- [ ] Shows "Create Listing" button
- [ ] Click button → Redirects to create page

---

## 🗺️ **5. Location Features**

### **Distance Calculation**
- [ ] Products show "X km away" or "X m away"
- [ ] Nearby products (< 1 km) show meters
- [ ] Distant products show kilometers
- [ ] If location unavailable: Shows "Location unavailable"

### **Nearby Products** (If Implemented)
- [ ] Click "Nearby" filter/tab
- [ ] Products sorted by distance (closest first)
- [ ] Distance labels accurate

---

## 👤 **6. User-Specific Pages**

### **My Listings**
- [ ] Click "My Listings" link (top of marketplace or sidebar)
- [ ] Navigate to `/marketplace/my-listings`
- [ ] Shows only YOUR products
- [ ] Shows count: "X listing(s)"
- [ ] Each card shows edit/delete options (on hover or always visible)
- [ ] Empty state if no listings: "No listings yet"
- [ ] "Create Your First Listing" button works

### **Saved Products** (If Implemented)
- [ ] Navigate to `/marketplace/saved`
- [ ] Shows products you've saved/favorited
- [ ] Empty state if nothing saved

---

## 📱 **7. Mobile Responsiveness**

### **Test on Mobile Viewport**
- [ ] Open DevTools → Toggle device toolbar (Ctrl+Shift+M)
- [ ] Select iPhone/Android viewport (375px width)

### **Layout**
- [ ] Product grid shows 1 column on mobile
- [ ] Images fill full width
- [ ] Text is readable (not too small)
- [ ] Buttons are large enough to tap (min 44x44 pixels)

### **Engagement Bar**
- [ ] Like/comment buttons are thumb-friendly
- [ ] Buttons have adequate spacing (no mis-taps)
- [ ] Icons are visible and clear

### **Comment Form**
- [ ] Text area expands properly
- [ ] Keyboard doesn't obscure input
- [ ] Submit button accessible

### **Image Gallery**
- [ ] Images swipeable on touch devices
- [ ] Thumbnails scrollable horizontally

---

## ⚡ **8. Performance & Loading States**

### **Initial Load**
- [ ] Marketplace page shows skeleton loaders while fetching
- [ ] Skeletons match card layout (aspect-square, title lines, etc.)
- [ ] Smooth transition from skeleton to real data

### **Product Detail Load**
- [ ] Shows loading skeleton for image and content
- [ ] No layout shift when content loads

### **Optimistic Updates Speed**
- [ ] Like button responds instantly (< 50ms perceived)
- [ ] Comment appears immediately when posted
- [ ] No visible delay or spinner

---

## 🐛 **9. Error Handling**

### **Network Errors**
- [ ] Disconnect internet
- [ ] Try to load marketplace page
- [ ] Error message displays: "Failed to load products"
- [ ] "Retry" button appears
- [ ] Click Retry → Attempts to reload

### **404 Product Not Found**
- [ ] Navigate to `/marketplace/invalid-product-id-12345`
- [ ] Shows "Product Not Found" message
- [ ] "Back to Marketplace" button works

### **Permission Errors**
- [ ] Try to edit another user's product (manually change URL)
- [ ] Shows error: "You don't have permission"
- [ ] Doesn't crash the app

### **Rate Limit Exceeded**
- [ ] Trigger rate limit (3 comments in < 20 seconds)
- [ ] Shows countdown timer
- [ ] Button re-enables after timer expires

---

## 🔌 **10. Real-Time WebSocket**

### **Connection Status**
- [ ] Open browser console (F12)
- [ ] Look for: `Socket connected` message
- [ ] If disconnected: Shows warning icon or message

### **Live Updates Without Refresh**
- [ ] Open product in two browser tabs
- [ ] In Tab 1: Like the product
- [ ] In Tab 2: Within 1-2 seconds, like count updates
- [ ] No manual refresh needed
- [ ] Console shows: `📢 Product updated: { productId, action, likesCount }`

### **Reconnection**
- [ ] Disconnect internet briefly
- [ ] Reconnect internet
- [ ] WebSocket auto-reconnects
- [ ] Console shows: `Socket connected`
- [ ] Fresh data loads

---

## ♿ **11. Accessibility**

### **Keyboard Navigation**
- [ ] Press Tab key repeatedly
- [ ] Focus moves logically: Images → Engagement buttons → Comments → Form
- [ ] Focus indicators visible (blue outline)
- [ ] Can activate buttons with Enter or Space

### **Screen Reader** (Optional Advanced Test)
- [ ] Enable screen reader (NVDA on Windows, VoiceOver on Mac)
- [ ] Navigate marketplace page
- [ ] Hears product titles, prices, descriptions
- [ ] Buttons announce purpose: "Like this product", "Post comment"

### **Color Contrast**
- [ ] Text is readable on dark backgrounds
- [ ] Price in green is visible
- [ ] Badges have sufficient contrast

---

## 🎨 **12. Visual Design**

### **Theme Consistency**
- [ ] Dark theme applied: `#0f0f1e` background
- [ ] Cards have `#1a1a2e` background
- [ ] Green accents for marketplace: `#4ade80`
- [ ] Matches rest of NeyborHuud design

### **Animations**
- [ ] Like button scales on click
- [ ] Hover effects on cards
- [ ] Smooth transitions (no jank)

---

## 📊 **13. Browser Compatibility**

### **Test in Multiple Browsers**
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if on Mac)
- [ ] Mobile browsers (Chrome/Safari on real device)

### **Check for:**
- [ ] Images load correctly
- [ ] Forms submit properly
- [ ] WebSocket connects in all browsers

---

## ✅ **Final Checklist Summary**

| Feature | Status | Notes |
|---------|--------|-------|
| Create Product | ⬜ |  |
| View Product | ⬜ |  |
| Edit Product | ⬜ |  |
| Delete Product | ⬜ |  |
| Like/Unlike | ⬜ |  |
| Add Comment | ⬜ |  |
| Real-Time Updates | ⬜ |  |
| Category Filter | ⬜ |  |
| My Listings | ⬜ |  |
| Mobile Responsive | ⬜ |  |
| Error Handling | ⬜ |  |
| Accessibility | ⬜ |  |

---

## 🐛 **Bug Report Template**

If you find issues, document them like this:

```
**Bug:** [Short description]
**Steps to Reproduce:**
1. Go to...
2. Click on...
3. See error...

**Expected:** [What should happen]
**Actual:** [What actually happened]
**Console Errors:** [Copy from DevTools Console]
**Screenshot:** [If applicable]
```

---

## 📝 **Notes Section**

Use this space for observations:

```
[Your testing notes here]
```

---

**Testing Date:** _______________  
**All Tests Passed:** ⬜ Yes  ⬜ No  
**Ready for Production:** ⬜ Yes  ⬜ No (needs fixes)
