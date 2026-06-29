# 🚀 NeyborHuud API - Quick Reference

## 🎯 Import Patterns

```typescript
// Services (direct API calls)
import { authService, contentService, eventsService } from "@/services";

// Hooks (React Query wrappers)
import { useAuth, usePosts, useNotifications } from "@/hooks";

// Types
import type { User, Post, Event, CreatePostPayload } from "@/types/api";

// Utils
import apiClient from "@/lib/api-client";
import socketService from "@/lib/socket";
import { handleApiError } from "@/lib/error-handler";
```

---

## 🔐 Authentication

```typescript
// In a component
const { user, isAuthenticated, login, logout, register } = useAuth();

// Login
await login("username_or_email", "password");

// Register
await register({
  username: "john",
  email: "john@example.com",
  password: "SecurePass123!",
  location: { latitude: 6.5244, longitude: 3.3792 },
  agreeToTerms: true,
});

// Logout
await logout();

// Check auth status
if (isAuthenticated) {
  console.log("Logged in as:", user?.username);
}
```

---

## 📝 Posts/Content

```typescript
// Get posts feed (infinite scroll)
const { data, fetchNextPage, hasNextPage, isLoading } = usePosts("all");

// Access posts
data?.pages.forEach((page) => {
  page.data?.forEach((post) => {
    console.log(post.content);
  });
});

// Create post
const { createPost } = usePostMutations();
await createPost({
  payload: {
    type: "text",
    content: "Hello NeyborHuud!",
    visibility: "public",
    tags: ["community"],
  },
});

// Post with image
await createPost({
  payload: {
    type: "image",
    content: "Check this out!",
    media: [imageFile],
    visibility: "neighborhood",
  },
  onProgress: (progress) => console.log(`${progress}%`),
});

// Like/Unlike
const { likePost, unlikePost } = usePostMutations();
await likePost(postId);
await unlikePost(postId);

// Save/Unsave
const { savePost, unsavePost } = usePostMutations();
await savePost(postId);

// Delete
const { deletePost } = usePostMutations();
await deletePost(postId);
```

---

## 💬 Comments

```typescript
// Get comments
const { data, fetchNextPage } = useComments(postId);

// Create comment
const { createComment } = useCommentMutations(postId);
await createComment({ content: "Great post!" });

// Reply to comment
await createComment({
  content: "I agree!",
  parentId: commentId,
});

// Update/Delete
const { updateComment, deleteComment } = useCommentMutations(postId);
await updateComment({ commentId, content: "Updated text" });
await deleteComment(commentId);

// Like comment
const { likeComment } = useCommentMutations(postId);
await likeComment(commentId);
```

---

## 🔔 Notifications

```typescript
// Get unread count
const { data: unreadCount } = useUnreadCount();

// Get notifications
const { data, fetchNextPage } = useNotifications("unread");

// Mark as read
const { markAsRead, markAllAsRead } = useNotificationMutations();
await markAsRead(notificationId);
await markAllAsRead();

// Delete notification
const { deleteNotification } = useNotificationMutations();
await deleteNotification(notificationId);
```

---

## 🔍 Search

```typescript
import { searchService } from "@/services";
import { useDebouncedValue } from "@/hooks";

const [query, setQuery] = useState("");
const debouncedQuery = useDebouncedValue(query, 500);

// Global search
const { data } = useQuery({
  queryKey: ["search", debouncedQuery],
  queryFn: () => searchService.globalSearch(debouncedQuery),
  enabled: debouncedQuery.length > 2,
});

// Search specific type
await searchService.searchUsers("john");
await searchService.searchPosts("community");
await searchService.searchEvents("meetup");
```

---

## 🎮 Events

```typescript
import { eventsService } from "@/services";

// Get events
const { data } = useQuery({
  queryKey: ["events"],
  queryFn: () =>
    eventsService.getEvents(1, 20, {
      type: "community",
      status: "upcoming",
    }),
});

// Create event
await eventsService.createEvent({
  title: "Community Meetup",
  description: "Join us!",
  type: "community",
  location: { latitude: 6.5244, longitude: 3.3792 },
  venue: "City Hall",
  startDate: "2026-02-01T10:00:00Z",
  endDate: "2026-02-01T16:00:00Z",
  isFree: true,
  visibility: "public",
});

// Attend/Unattend
await eventsService.attendEvent(eventId);
await eventsService.unattendEvent(eventId);

// Get nearby events
await eventsService.getNearbyEvents(lat, lng, 5000);
```

---

## 💼 Jobs

```typescript
import { jobsService } from "@/services";

// Get jobs
await jobsService.getJobs(1, 20, {
  type: "full-time",
  workMode: "remote",
});

// Create job
await jobsService.createJob({
  title: "Software Engineer",
  description: "We are hiring!",
  type: "full-time",
  category: "Technology",
  location: { latitude: 6.5244, longitude: 3.3792 },
  workMode: "hybrid",
  salary: {
    min: 200000,
    max: 500000,
    currency: "NGN",
    period: "monthly",
  },
  requirements: ["React", "TypeScript"],
  skills: ["JavaScript", "Node.js"],
});

// Apply for job
await jobsService.applyForJob(jobId, "Cover letter...", resumeFile);

// Get my applications
await jobsService.getMyApplications();
```

---

## 🛒 Marketplace

```typescript
import { marketplaceService } from "@/services";

// List item
await marketplaceService.createItem({
  title: "iPhone 13 Pro",
  description: "Barely used, excellent condition",
  category: "electronics",
  price: 350000,
  currency: "NGN",
  condition: "like-new",
  images: [file1, file2, file3],
  location: { latitude: 6.5244, longitude: 3.3792 },
  delivery: {
    available: true,
    fee: 2000,
    methods: ["pickup", "delivery"],
  },
  negotiable: true,
  quantity: 1,
});

// Get items
await marketplaceService.getItems(1, 20, {
  category: "electronics",
  minPrice: 100000,
  maxPrice: 500000,
});

// Contact seller
await marketplaceService.contactSeller(itemId, "Is this still available?");

// Make offer
await marketplaceService.makeOffer(itemId, 300000, "Best I can do");

// Mark as sold
await marketplaceService.markAsSold(itemId);
```

---

## 💬 Chat/Messaging

```typescript
import { chatService } from "@/services";

// Get conversations
const { data } = useQuery({
  queryKey: ["conversations"],
  queryFn: () => chatService.getConversations(),
});

// Get messages
await chatService.getMessages(conversationId);

// Send text message
await chatService.sendMessage(conversationId, "Hello!");

// Send media
await chatService.sendMediaMessage(
  conversationId,
  imageFile,
  "Check this out!",
  (progress) => console.log(`${progress}%`),
);

// Create conversation
await chatService.createConversation([userId1, userId2]);

// Create group
await chatService.createConversation([userId1, userId2, userId3], "My Group");

// Mark as read
await chatService.markAsRead(conversationId);
```

---

## 📍 Geolocation

```typescript
import { useGeolocation } from "@/hooks";
import { geoService } from "@/services";

// Get current location
const { location, isLoading, error, getCurrentLocation } = useGeolocation();

useEffect(() => {
  getCurrentLocation();
}, []);

// Reverse geocode
const locationData = await geoService.reverseGeocode(6.5244, 3.3792);

// Get administrative divisions
const states = await geoService.getStates();
const lgas = await geoService.getLGAs("Lagos");
const wards = await geoService.getWards("Lagos", "Ikeja");

// Find nearby
await geoService.getNearbyUsers(lat, lng, 5000);
await geoService.getNearbyPosts(lat, lng, 5000);
```

---

## 🎯 Gamification

```typescript
import { gamificationService } from "@/services";

// Get leaderboard
await gamificationService.getLeaderboard("weekly", 50);

// Get my stats
await gamificationService.getMyStats();

// Get badges
await gamificationService.getMyBadges();

// Get achievements
await gamificationService.getMyAchievements();

// Claim reward
await gamificationService.claimReward(achievementId);

// Daily check-in
await gamificationService.checkIn();
```

---

## 👥 Social/Friends

```typescript
import { socialService } from "@/services";

// Send friend request
await socialService.sendFriendRequest(userId);

// Accept/Reject request
await socialService.acceptFriendRequest(requestId);
await socialService.rejectFriendRequest(requestId);

// Get friends
await socialService.getFriends();

// Unfriend
await socialService.unfriend(userId);

// Follow/Unfollow
await socialService.follow(userId);
await socialService.unfollow(userId);

// Block/Unblock
await socialService.blockUser(userId);
await socialService.unblockUser(userId);

// Get suggestions
await socialService.getFriendSuggestions(20);
```

---

## 💳 Payments

```typescript
import { paymentsService } from "@/services";

// Initiate payment
const { paymentUrl, reference } = await paymentsService.initiatePayment(
  "premium_subscription",
  5000,
  "NGN",
  { plan: "monthly" },
);

// Redirect user to paymentUrl
window.location.href = paymentUrl;

// Verify payment (after redirect back)
const payment = await paymentsService.verifyPayment(reference);

// Get payment history
await paymentsService.getPaymentHistory();
```

---

## 🔌 Real-time (Socket.IO)

```typescript
import socketService from "@/lib/socket";

useEffect(() => {
  // Connect
  socketService.connect();

  // Join rooms
  socketService.joinRoom(`user:${userId}`);
  socketService.joinRoom(`conversation:${conversationId}`);

  // Listen to events
  socketService.on("new-message", (message) => {
    console.log("New message:", message);
    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ["messages"] });
  });

  socketService.on("new-notification", (notification) => {
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  });

  // Cleanup
  return () => {
    socketService.leaveRoom(`user:${userId}`);
    socketService.disconnect();
  };
}, [userId]);
```

---

## 🛡️ Protected Routes

```typescript
'use client';

import { useAuth } from '@/hooks';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return null;

  return <div>Protected Content</div>;
}
```

---

## 🎨 Optimistic Updates

```typescript
const likeMutation = useMutation({
  mutationFn: (postId: string) => contentService.likePost(postId),
  onMutate: async (postId) => {
    // Cancel queries
    await queryClient.cancelQueries({ queryKey: ["posts"] });

    // Save previous state
    const previousPosts = queryClient.getQueryData(["posts"]);

    // Update immediately
    queryClient.setQueryData(["posts"], (old: any) => {
      // Your update logic
    });

    return { previousPosts };
  },
  onError: (err, variables, context) => {
    // Rollback
    if (context?.previousPosts) {
      queryClient.setQueryData(["posts"], context.previousPosts);
    }
  },
  onSettled: () => {
    // Refetch
    queryClient.invalidateQueries({ queryKey: ["posts"] });
  },
});
```

---

## 🐛 Error Handling

```typescript
import { handleApiError } from "@/lib/error-handler";

// Automatic (in mutations)
const mutation = useMutation({
  mutationFn: someService.someMethod,
  onError: handleApiError, // Shows toast automatically
});

// Manual
try {
  await contentService.createPost(payload);
  toast.success("Post created!");
} catch (error) {
  handleApiError(error);
}
```

---

## 📦 Direct Service Calls (without React Query)

```typescript
// In server components or API routes
import { authService } from "@/services";

const response = await authService.login("username", "password");

if (response.success) {
  const user = response.data?.user;
  const token = response.data?.token;
}
```

---

## 🎯 Common Patterns

### Infinite Scroll Component

```typescript
function InfiniteList() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = usePosts();
  const observerTarget = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, fetchNextPage]);

  return (
    <div>
      {data?.pages.map((page) =>
        page.data?.map((post) => <PostCard key={post.id} post={post} />)
      )}
      <div ref={observerTarget}>
        {isFetchingNextPage && 'Loading more...'}
      </div>
    </div>
  );
}
```

### Debounced Search

```typescript
function SearchInput() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 500);

  const { data, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchService.globalSearch(debouncedQuery),
    enabled: debouncedQuery.length > 2,
  });

  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

---

**Made with ❤️ for NeyborHuud**
