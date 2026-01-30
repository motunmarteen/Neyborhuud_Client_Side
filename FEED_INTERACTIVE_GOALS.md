# 🎯 Feed Interactive Enhancement - Goals & Endpoints

## 📋 Goals for Interactive Feed

### 1. **Real-Time Updates**
- ✅ Live feed updates using WebSocket/Socket.IO
- ✅ Real-time like/comment/share notifications
- ✅ New post notifications from neighbors
- ✅ Live engagement counters (likes, comments, views)

### 2. **Enhanced User Interactions**
- ✅ Clickable post actions (like, comment, share, save)
- ✅ Optimistic UI updates (instant feedback)
- ✅ Comment threading and replies
- ✅ Post reactions (beyond just likes)
- ✅ "Helpful" voting for safety/bulletin posts
- ✅ Post sharing (internal echo + external share)

### 3. **Location-Based Feed**
- ✅ Location-aware feed using user's current location
- ✅ Radius-based filtering (nearby posts)
- ✅ Category filtering (SAFETY, EVENT, MARKETPLACE, BULLETIN)
- ✅ Community/ward-specific content
- ✅ Distance indicators on posts

### 4. **Content Discovery**
- ✅ Infinite scroll with pagination
- ✅ Pull-to-refresh functionality
- ✅ Filter by post type (text, image, video, gallery)
- ✅ Filter by category (SAFETY, EVENT, MARKETPLACE, BULLETIN)
- ✅ Search within feed
- ✅ Trending posts section

### 5. **Rich Media Support**
- ✅ Image gallery viewer (swipeable)
- ✅ Video playback with controls
- ✅ Media preview/lightbox
- ✅ Multiple media items per post

### 6. **Social Features**
- ✅ User profiles from posts
- ✅ Follow/unfollow users
- ✅ Post author verification badges
- ✅ User mentions and tags
- ✅ Post engagement analytics (views, reach)

### 7. **Content Management**
- ✅ Create new posts from feed
- ✅ Edit own posts
- ✅ Delete own posts
- ✅ Report inappropriate content
- ✅ Save/bookmark posts
- ✅ Pin important posts

### 8. **Performance & UX**
- ✅ Lazy loading for images/videos
- ✅ Skeleton loaders during fetch
- ✅ Error states with retry
- ✅ Empty states with helpful messages
- ✅ Smooth animations and transitions
- ✅ Offline support (cached feed)

---

## 🔌 Available Endpoints

### 📍 **Feed & Posts Endpoints**

#### 1. **GET `/api/v1/feed`** (Primary Feed Endpoint)
- **Purpose:** Get location-based feed with PostGIS queries
- **Query Parameters:**
  - `lat` (number): User's latitude
  - `lng` (number): User's longitude
  - `radius` (number, optional): Search radius in meters (default: 5000)
  - `category` (string, optional): Filter by category (SAFETY, EVENT, MARKETPLACE, BULLETIN)
  - `page` (number, optional): Page number for pagination
  - `limit` (number, optional): Items per page (default: 20)
- **Functionality:**
  - Performs PostGIS `ST_DWithin` query to find posts within radius
  - Sorts by "Time Decay" + "Trust Score weighting"
  - Returns paginated list of posts
- **Response:** `PaginatedResponse<Post>`

#### 2. **GET `/api/v1/content/posts`** (Alternative Feed Endpoint)
- **Purpose:** Get posts feed with filters
- **Query Parameters:**
  - `page` (number, default: 1): Page number
  - `limit` (number, default: 20): Items per page
  - `filter` (string, optional): "all" | "friends" | "neighborhood"
- **Functionality:**
  - Returns posts based on visibility filter
  - Supports pagination
- **Response:** `PaginatedResponse<Post>`

#### 3. **GET `/api/v1/content/posts/:postId`**
- **Purpose:** Get a single post by ID
- **Functionality:**
  - Returns full post details including author, media, location
  - Includes engagement metrics (likes, comments, shares, views)
  - Includes user interaction status (isLiked, isSaved, isPinned)
- **Response:** `Post`

#### 4. **GET `/api/v1/content/users/:userId/posts`**
- **Purpose:** Get all posts by a specific user
- **Query Parameters:**
  - `page` (number, default: 1)
  - `limit` (number, default: 20)
- **Functionality:**
  - Returns paginated list of posts from a user
  - Useful for user profile pages
- **Response:** `PaginatedResponse<Post>`

#### 5. **GET `/api/v1/content/saved`**
- **Purpose:** Get user's saved/bookmarked posts
- **Query Parameters:**
  - `page` (number, default: 1)
  - `limit` (number, default: 20)
- **Functionality:**
  - Returns posts the user has saved
- **Response:** `PaginatedResponse<Post>`

---

### 📝 **Post Creation & Management**

#### 6. **POST `/api/v1/content/posts`**
- **Purpose:** Create a new post
- **Request Body:** `CreatePostPayload`
  ```typescript
  {
    type: "text" | "image" | "video" | "poll" | "event" | "article",
    content: string,
    media?: File[],
    visibility: "public" | "friends" | "neighborhood" | "ward" | "lga" | "state",
    tags?: string[],
    mentions?: string[],
    location?: LocationData
  }
  ```
- **Functionality:**
  - Creates a new post
  - Supports file uploads (images, videos)
  - Upload progress tracking available
  - Sets post visibility level
- **Response:** `Post`

#### 7. **PUT `/api/v1/content/posts/:postId`**
- **Purpose:** Update an existing post
- **Request Body:** `Partial<CreatePostPayload>`
- **Functionality:**
  - Updates post content, media, visibility, tags
  - Only post owner can update
- **Response:** `Post`

#### 8. **DELETE `/api/v1/content/posts/:postId`**
- **Purpose:** Delete a post
- **Functionality:**
  - Permanently deletes a post
  - Only post owner can delete
- **Response:** Success message

---

### ❤️ **Post Interactions**

#### 9. **POST `/api/v1/content/posts/:postId/like`**
- **Purpose:** Like a post
- **Functionality:**
  - Adds user's like to the post
  - Increments like count
  - Sets `isLiked: true` for user
- **Response:** Success message

#### 10. **DELETE `/api/v1/content/posts/:postId/like`**
- **Purpose:** Unlike a post
- **Functionality:**
  - Removes user's like from the post
  - Decrements like count
  - Sets `isLiked: false` for user
- **Response:** Success message

#### 11. **POST `/api/v1/content/posts/:postId/share`**
- **Purpose:** Share a post (external share)
- **Request Body:**
  ```typescript
  {
    message?: string  // Optional share message
  }
  ```
- **Functionality:**
  - Shares post externally (social media, messaging apps)
  - Increments share count
- **Response:** Success message

#### 12. **POST `/api/v1/content/posts/:postId/save`**
- **Purpose:** Save/bookmark a post
- **Functionality:**
  - Saves post to user's saved collection
  - Sets `isSaved: true` for user
- **Response:** Success message

#### 13. **DELETE `/api/v1/content/posts/:postId/save`**
- **Purpose:** Unsave a post
- **Functionality:**
  - Removes post from user's saved collection
  - Sets `isSaved: false` for user
- **Response:** Success message

#### 14. **POST `/api/v1/content/posts/:postId/pin`**
- **Purpose:** Pin a post (to top of feed)
- **Functionality:**
  - Pins post to user's feed
  - Sets `isPinned: true`
  - Only post owner can pin
- **Response:** Success message

#### 15. **DELETE `/api/v1/content/posts/:postId/pin`**
- **Purpose:** Unpin a post
- **Functionality:**
  - Unpins post
  - Sets `isPinned: false`
- **Response:** Success message

#### 16. **POST `/api/v1/content/posts/:postId/report`**
- **Purpose:** Report inappropriate content
- **Request Body:**
  ```typescript
  {
    reason: string,        // Report reason
    description?: string   // Optional details
  }
  ```
- **Functionality:**
  - Reports post for moderation
  - Sets `isReported: true`
- **Response:** Success message

---

### 💬 **Comments Endpoints**

#### 17. **GET `/api/v1/content/posts/:postId/comments`**
- **Purpose:** Get comments for a post
- **Query Parameters:**
  - `page` (number, default: 1)
  - `limit` (number, default: 20)
- **Functionality:**
  - Returns paginated list of comments
  - Includes nested replies
- **Response:** `PaginatedResponse<Comment>`

#### 18. **POST `/api/v1/content/posts/:postId/comments`**
- **Purpose:** Create a comment on a post
- **Request Body:**
  ```typescript
  {
    content: string,
    parentId?: string  // For nested replies
  }
  ```
- **Functionality:**
  - Creates a new comment
  - Supports threaded replies (via `parentId`)
  - Increments post comment count
- **Response:** `Comment`

#### 19. **PUT `/api/v1/content/comments/:commentId`**
- **Purpose:** Update a comment
- **Request Body:**
  ```typescript
  {
    content: string
  }
  ```
- **Functionality:**
  - Updates comment content
  - Only comment owner can update
- **Response:** `Comment`

#### 20. **DELETE `/api/v1/content/comments/:commentId`**
- **Purpose:** Delete a comment
- **Functionality:**
  - Deletes a comment
  - Only comment owner can delete
- **Response:** Success message

#### 21. **POST `/api/v1/content/comments/:commentId/like`**
- **Purpose:** Like a comment
- **Functionality:**
  - Adds like to comment
  - Increments comment like count
- **Response:** Success message

#### 22. **DELETE `/api/v1/content/comments/:commentId/like`**
- **Purpose:** Unlike a comment
- **Functionality:**
  - Removes like from comment
  - Decrements comment like count
- **Response:** Success message

#### 23. **GET `/api/v1/content/comments/:commentId/replies`**
- **Purpose:** Get replies to a comment
- **Query Parameters:**
  - `page` (number, default: 1)
  - `limit` (number, default: 10)
- **Functionality:**
  - Returns nested replies to a comment
- **Response:** `PaginatedResponse<Comment>`

#### 24. **POST `/api/v1/content/comments/:commentId/report`**
- **Purpose:** Report a comment
- **Request Body:**
  ```typescript
  {
    reason: string,
    description?: string
  }
  ```
- **Functionality:**
  - Reports comment for moderation
- **Response:** Success message

---

### 📍 **Location-Based Endpoints**

#### 25. **GET `/api/v1/geo/nearby/posts`**
- **Purpose:** Get posts near a location
- **Query Parameters:**
  - `lat` (number): Latitude
  - `lng` (number): Longitude
  - `radius` (number, default: 5000): Radius in meters
  - `page` (number, default: 1)
  - `limit` (number, default: 20)
- **Functionality:**
  - Uses PostGIS to find posts within radius
  - Returns location-sorted posts
- **Response:** `Post[]`

#### 26. **GET `/api/v1/geo/nearby/users`**
- **Purpose:** Get nearby users
- **Query Parameters:**
  - `lat` (number): Latitude
  - `lng` (number): Longitude
  - `radius` (number, default: 5000): Radius in meters
  - `limit` (number, default: 50)
- **Functionality:**
  - Finds users within radius
  - Useful for "nearby neighbors" feature
- **Response:** `User[]`

#### 27. **GET `/api/v1/geo/nearby/events`**
- **Purpose:** Get nearby events
- **Query Parameters:**
  - `lat` (number): Latitude
  - `lng` (number): Longitude
  - `radius` (number, default: 5000): Radius in meters
  - `page` (number, default: 1)
  - `limit` (number, default: 20)
- **Functionality:**
  - Finds events within radius
- **Response:** `Event[]`

---

### 🔍 **Search Endpoints**

#### 28. **GET `/api/v1/search/posts`**
- **Purpose:** Search for posts
- **Query Parameters:**
  - `q` (string): Search query
  - `type` (string, optional): Filter by type
  - `page` (number, default: 1)
  - `limit` (number, default: 20)
- **Functionality:**
  - Full-text search across posts
  - Filtered by user's current ward
  - Uses Meilisearch index
- **Response:** `PaginatedResponse<Post>`

---

## 🎨 UI Components Needed

### Existing Components (from current feed):
- ✅ `NeumorphicCard` - Post container
- ✅ `StackedGallery` - Image gallery viewer
- ✅ Status reel (stories) component

### New Components Needed:
- ⚠️ `PostCard` - Enhanced post card with interactions
- ⚠️ `CommentSection` - Comment thread component
- ⚠️ `PostActions` - Like/comment/share/save buttons
- ⚠️ `CreatePostModal` - Post creation modal
- ⚠️ `MediaViewer` - Image/video lightbox
- ⚠️ `FeedFilters` - Category/type filter buttons
- ⚠️ `LocationPicker` - Location selection for posts
- ⚠️ `PostSkeleton` - Loading skeleton
- ⚠️ `EmptyFeedState` - Empty state component

---

## 🔄 Integration Points

### React Query Hooks:
- ✅ `usePosts()` - Infinite query for feed
- ✅ `usePost(postId)` - Single post query
- ✅ `usePostMutations()` - Create/update/delete mutations
- ⚠️ `useComments(postId)` - Comments query
- ⚠️ `useCommentMutations(postId)` - Comment mutations
- ⚠️ `useFeedFilters()` - Filter state management

### Real-Time (Socket.IO):
- ⚠️ `socket.on('new_post')` - New post notification
- ⚠️ `socket.on('post_liked')` - Like update
- ⚠️ `socket.on('new_comment')` - New comment notification
- ⚠️ `socket.on('post_shared')` - Share update

---

## 📊 Data Flow

```
User Opens Feed
    ↓
1. Get user location (geoService.getCurrentPosition)
    ↓
2. Fetch feed (GET /api/v1/feed?lat=X&lng=Y&radius=5000)
    ↓
3. Render posts with interactions
    ↓
4. User interacts (like, comment, share)
    ↓
5. Optimistic update + API call
    ↓
6. Real-time updates via Socket.IO
    ↓
7. Infinite scroll → Load more posts
```

---

## 🚀 Implementation Priority

### Phase 1: Core Interactions (High Priority)
1. ✅ Connect to `/api/v1/feed` endpoint
2. ✅ Implement like/unlike functionality
3. ✅ Implement comment creation/viewing
4. ✅ Implement save/unsave functionality
5. ✅ Add location-based filtering

### Phase 2: Enhanced Features (Medium Priority)
6. ⚠️ Add real-time updates (Socket.IO)
7. ⚠️ Implement post creation from feed
8. ⚠️ Add media viewer (gallery, video)
9. ⚠️ Add category filters
10. ⚠️ Add search within feed

### Phase 3: Polish & Performance (Low Priority)
11. ⚠️ Optimistic UI updates
12. ⚠️ Skeleton loaders
13. ⚠️ Pull-to-refresh
14. ⚠️ Offline support
15. ⚠️ Advanced animations

---

## 📝 Notes

- The primary feed endpoint is `/api/v1/feed` which uses PostGIS for location-based queries
- All endpoints support pagination for infinite scroll
- Real-time updates should use Socket.IO for live engagement
- Optimistic updates will improve perceived performance
- Location is critical - feed should request user's location on load
