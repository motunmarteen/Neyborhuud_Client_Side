# 🧪 MARKETPLACE TESTING GUIDE - MULTI-ACCOUNT SETUP

## 🚀 SERVERS RUNNING

**Backend:** http://localhost:5000 ✅
**Frontend:** http://localhost:3001 ⏳ (compiling...)

---

## 👥 TESTING WITH MULTIPLE ACCOUNTS

### **Setup: Create Test Users**

You'll need **2 browser windows** or **2 different browsers**:

#### **Window 1: Seller Account**
- Browser: Chrome (normal mode)
- URL: http://localhost:3001
- User: seller@test.com / password123

#### **Window 2: Buyer Account** 
- Browser: Chrome (incognito) OR Firefox
- URL: http://localhost:3001  
- User: buyer@test.com / password123

---

## 📋 STEP-BY-STEP TESTING FLOW

### **STEP 1: Create Test Accounts**

**If you don't have test accounts yet:**

1. **Window 1 (Chrome):**
   - Go to http://localhost:3001/signup
   - Create seller account:
     - Email: seller@test.com
     - Password: Test1234!
     - Username: seller_user
     - Complete profile

2. **Window 2 (Incognito/Firefox):**
   - Go to http://localhost:3001/signup
   - Create buyer account:
     - Email: buyer@test.com
     - Password: Test1234!
     - Username: buyer_user
     - Complete profile

---

### **STEP 2: Create Products (Seller)**

**Window 1 (Seller):**

1. Login as seller@test.com
2. Go to **Marketplace** → **Create Listing**

**Product A - Fixed Price:**
```
Title: iPhone 15 Pro Max
Description: Brand new, sealed in box
Price: 800000
Category: Electronics
Condition: New
Negotiable: ❌ NO (unchecked)
Images: Upload 1-2 images
Location: Use your location
```

**Product B - Negotiable:**
```
Title: MacBook Pro 2024
Description: Excellent condition, barely used
Price: 1200000
Category: Electronics
Condition: Like New
Negotiable: ✅ YES (checked)
Images: Upload 1-2 images
Location: Use your location
```

3. Click **Create** for each product
4. **Keep this window open** - you'll receive notifications here

---

### **STEP 3: Test Fixed-Price Purchase (Buyer)**

**Window 2 (Buyer):**

1. Login as buyer@test.com
2. Go to **Marketplace**
3. Click on **iPhone 15 Pro Max**
4. You should see:
   - ✅ Green **"Request to Buy"** button
   - ✅ Blue **"Contact Seller"** button
   - ✅ "My Orders" and "My Offers" links

5. **Click "Request to Buy"**

**Expected Result:**
- ✅ Toast: "Request to buy sent to seller!"
- ✅ **Redirects to chat** with seller
- ✅ Chat shows: "Marketplace Order: [orderId]"

6. Send a message: *"Hi, when can you deliver this iPhone?"*

**Window 1 (Seller):**
- ✅ Should receive notification of new order
- ✅ Go to **Messages** - see new chat
- ✅ See buyer's message
- ✅ Reply: *"I can deliver tomorrow! Payment first please."*

**Window 2 (Buyer):**
- ✅ See seller's reply in chat
- ✅ Go to **Marketplace → My Orders**
- ✅ See order with status **"PENDING"** (yellow badge)

**Window 1 (Seller):**
- ✅ Go to **Marketplace → My Sales**
- ✅ See order with buyer's name
- ✅ Click **Chat** button to continue conversation

---

### **STEP 4: Test Negotiable Purchase (Buyer)**

**Window 2 (Buyer):**

1. Go back to **Marketplace**
2. Click on **MacBook Pro 2024**
3. You should see:
   - ✅ Green **"Make Offer"** button (not "Request to Buy")

4. **Click "Make Offer"**
5. Dialog appears with:
   - Listed Price: ₦1,200,000
   - Your Offer: [input field]

6. **Enter: 1000000** (₦1,000,000 - lower than asking)
7. **Click "Send Offer"**

**Expected Result:**
- ✅ Toast: "Offer sent to seller!"
- ✅ Dialog closes

8. **Try making another offer** on same product

**Expected Result:**
- ❌ Error: "You already have an active offer on this product"
- ✅ **Duplicate prevention works!**

9. Go to **Marketplace → My Offers → Offers Sent**
10. You should see:
    - ✅ Your offer: ₦1,000,000
    - ✅ Status: **PENDING** (yellow)
    - ✅ Listed price shown

---

### **STEP 5: Seller Responds to Offer**

**Window 1 (Seller):**

1. ✅ Should receive notification: "New offer on MacBook Pro"
2. Go to **Marketplace → My Offers → Offers Received**
3. You should see:
   - ✅ Buyer's offer: ₦1,000,000
   - ✅ Your listed price: ₦1,200,000
   - ✅ Three buttons: **Accept** | **Counter** | **Reject**

**Option A: Counter Offer**
4. Click **"Counter"**
5. Counter Offer form appears
6. Enter: **1100000** (₦1,100,000 - middle ground)
7. Click **"Send Counter"**

**Expected Result:**
- ✅ Toast: "Response sent!"
- ✅ Offer status → **COUNTERED** (blue)
- ✅ Counter amount shown: ₦1,100,000

**Window 2 (Buyer):**
- ✅ Check **My Offers → Offers Sent**
- ✅ See counter offer: ₦1,100,000
- ✅ Status: **COUNTERED**

---

### **STEP 6: Accept Counter Offer**

**Window 1 (Seller):**

1. On same offer, click **"Accept"** (after countering)
   - *OR go back to Offers Received, find the offer, accept it*

**Actually, let me correct this flow:**

After seller counters with ₦1,100,000:

**Window 2 (Buyer):**
1. The buyer needs to make a NEW offer at ₦1,100,000
2. Go to MacBook product page
3. Click **"Make Offer"** again
4. Enter: **1100000**
5. Send offer

**Window 1 (Seller):**
1. See new offer at ₦1,100,000
2. Click **"Accept"** ✅

**Expected Result:**
- ✅ Toast: "Response sent!"
- ✅ Offer status → **ACCEPTED** (green)

---

### **STEP 7: Complete Purchase (Buyer)**

**Window 2 (Buyer):**

1. Go to **Marketplace → My Offers → Offers Sent**
2. Find the **ACCEPTED** offer
3. You should see:
   - ✅ Green **"Complete Purchase"** button

4. **Click "Complete Purchase"**

**Expected Result:**
- ✅ Redirected to product page
- ✅ Can now create order (or should auto-detect accepted offer)

5. Click **"Request to Buy"** or system auto-creates order

**Expected Result:**
- ✅ Order created with negotiated price: ₦1,100,000 (not ₦1,200,000!)
- ✅ Chat conversation created
- ✅ Redirected to chat
- ✅ Chat shows: "Marketplace Order: [orderId]"

6. Send message: *"Great! I'll pay ₦1,100,000. Here's my payment proof."*

7. Go to **Marketplace → My Orders**
8. You should see:
   - ✅ MacBook order at ₦1,100,000 (negotiated price!)
   - ✅ iPhone order at ₦800,000 (fixed price)
   - ✅ Both with **"Chat"** buttons

---

### **STEP 8: Seller View**

**Window 1 (Seller):**

1. Go to **Marketplace → My Sales**
2. You should see:
   - ✅ MacBook sale at ₦1,100,000
   - ✅ iPhone sale at ₦800,000
   - ✅ Buyer names shown
   - ✅ Order statuses

3. Click **"Chat"** on MacBook order
4. See buyer's payment proof message
5. Reply: *"Payment received! Shipping today."*

---

## ✅ WHAT TO VERIFY

### **Fixed-Price Flow:**
- [ ] Can create order directly without offer
- [ ] Chat created immediately
- [ ] Cannot create duplicate orders
- [ ] Appears in My Orders (buyer) and My Sales (seller)
- [ ] Both can access chat

### **Negotiable Flow:**
- [ ] Cannot buy directly - must make offer first
- [ ] Can make offer
- [ ] Cannot make duplicate offers
- [ ] Seller can accept/reject/counter
- [ ] After acceptance, "Complete Purchase" button appears
- [ ] Order created with negotiated price (not listed price!)
- [ ] Chat created when order made

### **UI Features:**
- [ ] Smart buttons: "Make Offer" vs "Request to Buy"
- [ ] Inline offer dialog (no page reload)
- [ ] Status badges with colors (PENDING, ACCEPTED, etc.)
- [ ] My Orders shows purchases
- [ ] My Sales shows sales
- [ ] My Offers shows sent/received with tabs
- [ ] Chat buttons work
- [ ] Product images display
- [ ] Prices formatted correctly

### **Authorization:**
- [ ] Cannot access other people's chats
- [ ] Cannot respond to offers you don't own
- [ ] Duplicate prevention works

---

## 🐛 TROUBLESHOOTING

**"Cannot make offer" error:**
- Check product has `negotiable: true`
- Check you don't already have active offer

**"Cannot create order" error:**
- Check you don't already have active order
- For negotiable products, need accepted offer first

**Chat not appearing:**
- Check order has `conversationId`
- Check both users are logged in
- Refresh the page

**Backend errors:**
- Check terminal running on port 5000
- Check MongoDB connection
- Look for error messages in backend terminal

---

## 🎯 TESTING SCENARIOS

### **Scenario 1: Full Negotiation**
1. Buyer offers ₦1M on ₦1.2M product
2. Seller counters ₦1.15M
3. Buyer offers ₦1.1M
4. Seller accepts
5. Buyer completes purchase at ₦1.1M ✅

### **Scenario 2: Immediate Purchase**
1. Buyer sees fixed-price ₦800K product
2. Clicks "Request to Buy"
3. Chat created
4. Deal completed ✅

### **Scenario 3: Rejection**
1. Buyer offers ₦500K on ₦1M product (too low)
2. Seller rejects
3. Offer status: REJECTED ❌
4. Buyer can make new offer

---

## 📱 BROWSER SETUP TIPS

**Option 1: Chrome + Chrome Incognito**
- Window 1: Chrome normal (Seller)
- Window 2: Chrome incognito (Buyer)
- Side-by-side view

**Option 2: Chrome + Firefox**
- Window 1: Chrome (Seller)
- Window 2: Firefox (Buyer)
- Easier to manage cookies

**Option 3: Two User Profiles**
- Chrome Profile 1 (Seller)
- Chrome Profile 2 (Buyer)
- Completely separate

---

## 🚀 QUICK START CHECKLIST

- [ ] Backend running on port 5000 ✅
- [ ] Frontend running on port 3001 (compiling...)
- [ ] Created seller account
- [ ] Created buyer account
- [ ] Created 1 fixed-price product
- [ ] Created 1 negotiable product
- [ ] Ready to test! 🎉

---

**When frontend finishes compiling, you'll see:**
```
✓ Compiled successfully
  Local:        http://localhost:3001
  Ready in X seconds
```

Then open **TWO BROWSER WINDOWS** and start testing! 🧪
