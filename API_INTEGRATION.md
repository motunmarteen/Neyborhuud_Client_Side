# NeyborHuud API Integration

Complete backend API integration for the NeyborHuud PWA with 200+ endpoints.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Update the API URL if needed:

```env
NEXT_PUBLIC_API_BASE_URL=https://neyborhuud-serverside.onrender.com/api/v1
NEXT_PUBLIC_SOCKET_URL=https://neyborhuud-serverside.onrender.com
```

### 3. Wrap App with Providers

Update [src/app/layout.tsx](src/app/layout.tsx):

```typescript
import { Providers } from '@/components/providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

### 4. Start Using the API

```typescript
"use client";

import { useAuth } from "@/hooks/useAuth";
import { usePosts } from "@/hooks/usePosts";

export default function HomePage() {
  const { user, isAuthenticated, login } = useAuth();
  const { data, isLoading } = usePosts();

  // Your component logic
}
```

## 📁 Project Structure

```
src/
├── types/
│   └── api.ts                 # TypeScript type definitions
├── lib/
│   ├── api-client.ts          # Axios client with interceptors
│   ├── query-client.ts        # React Query configuration
│   ├── error-handler.ts       # Global error handling
│   └── socket.ts              # Socket.IO client
├── services/
│   ├── auth.service.ts        # Authentication
│   ├── content.service.ts     # Posts & comments
│   ├── chat.service.ts        # Messaging
│   ├── events.service.ts      # Events
│   ├── jobs.service.ts        # Job postings
│   ├── marketplace.service.ts # Marketplace
│   ├── services.service.ts    # Professional services
│   ├── notifications.service.ts
│   ├── search.service.ts
│   ├── geo.service.ts         # Geolocation
│   ├── gamification.service.ts
│   ├── social.service.ts      # Friends & followers
│   ├── payments.service.ts
│   └── admin.service.ts       # Admin functions
├── hooks/
│   ├── useAuth.ts             # Authentication hook
│   ├── usePosts.ts            # Posts hook
│   ├── useComments.ts         # Comments hook
│   ├── useNotifications.ts    # Notifications hook
│   ├── useGeolocation.ts      # Geolocation hook
│   └── useDebouncedValue.ts   # Utility hook
└── components/
    └── providers.tsx          # App providers
```

## 🔑 Authentication

### Login

```typescript
import { useAuth } from "@/hooks/useAuth";

function LoginForm() {
  const { login, isLoggingIn } = useAuth();

  const handleLogin = async () => {
    try {
      await login("username_or_email", "password");
      // User is now logged in
    } catch (error) {
      // Error is automatically handled
    }
  };
}
```

### Register

```typescript
import { useAuth } from "@/hooks/useAuth";

function RegisterForm() {
  const { register, isRegistering } = useAuth();

  const handleRegister = async () => {
    try {
      await register({
        username: "john_doe",
        email: "john@example.com",
        password: "SecurePass123!",
        location: {
          latitude: 6.5244,
          longitude: 3.3792,
        },
        agreeToTerms: true,
      });
    } catch (error) {
      // Error handled
    }
  };
}
```

### Check Auth Status

```typescript
const { user, isAuthenticated, isLoading } = useAuth();

if (isLoading) return <Loading />;
if (!isAuthenticated) return <Login />;

return <Dashboard user={user} />;
```

## 📝 Content Management

### Get Posts Feed

```typescript
import { usePosts } from '@/hooks/usePosts';

function Feed() {
  const { data, isLoading, fetchNextPage, hasNextPage } = usePosts();

  return (
    <div>
      {data?.pages.map((page) =>
        page.data?.map((post) => (
          <PostCard key={post.id} post={post} />
        ))
      )}
      {hasNextPage && <button onClick={() => fetchNextPage()}>Load More</button>}
    </div>
  );
}
```

### Create Post

```typescript
import { usePostMutations } from "@/hooks/usePosts";

function CreatePost() {
  const { createPost, isCreating } = usePostMutations();

  const handleSubmit = async () => {
    await createPost({
      payload: {
        type: "text",
        content: "Hello NeyborHuud!",
        visibility: "public",
      },
    });
  };
}
```

### Create Post with Media

```typescript
const { createPost } = usePostMutations();
const [uploadProgress, setUploadProgress] = useState(0);

await createPost({
  payload: {
    type: "image",
    content: "Check out this photo!",
    media: [imageFile],
    visibility: "public",
  },
  onProgress: setUploadProgress,
});
```

### Like/Unlike Post

```typescript
const { likePost, unlikePost } = usePostMutations();

<button onClick={() => post.isLiked ? unlikePost(post.id) : likePost(post.id)}>
  {post.isLiked ? 'Unlike' : 'Like'} ({post.likes})
</button>
```

## 💬 Comments

```typescript
import { useComments, useCommentMutations } from '@/hooks/useComments';

function Comments({ postId }: { postId: string }) {
  const { data } = useComments(postId);
  const { createComment, isCreating } = useCommentMutations(postId);

  const handleComment = async (content: string) => {
    await createComment({ content });
  };

  return (
    <div>
      {data?.pages.map((page) =>
        page.data?.map((comment) => (
          <CommentCard key={comment.id} comment={comment} />
        ))
      )}
    </div>
  );
}
```

## 🔔 Notifications

```typescript
import { useNotifications, useUnreadCount } from '@/hooks/useNotifications';

function NotificationBell() {
  const { data: unreadCount } = useUnreadCount();
  const { data } = useNotifications('unread');

  return (
    <button>
      🔔 {unreadCount > 0 && <span>{unreadCount}</span>}
    </button>
  );
}
```

## 🔍 Search

```typescript
import { searchService } from "@/services/search.service";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

function SearchBar() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 500);

  const { data } = useQuery({
    queryKey: ["search", debouncedQuery],
    queryFn: () => searchService.globalSearch(debouncedQuery),
    enabled: debouncedQuery.length > 2,
  });
}
```

## 📍 Geolocation

```typescript
import { useGeolocation } from '@/hooks/useGeolocation';

function LocationPicker() {
  const { location, isLoading, error, getCurrentLocation } = useGeolocation();

  return (
    <button onClick={getCurrentLocation} disabled={isLoading}>
      {isLoading ? 'Getting location...' : 'Get Current Location'}
    </button>
  );
}
```

## 🎮 Events

```typescript
import { eventsService } from "@/services/events.service";

// Get events
const { data } = useQuery({
  queryKey: ["events"],
  queryFn: () => eventsService.getEvents(1, 20, { type: "community" }),
});

// Create event
await eventsService.createEvent({
  title: "Community Meetup",
  description: "Let's meet!",
  type: "community",
  location: { latitude: 6.5244, longitude: 3.3792 },
  startDate: "2026-02-01T10:00:00Z",
  endDate: "2026-02-01T16:00:00Z",
  isFree: true,
  visibility: "public",
});

// Attend event
await eventsService.attendEvent(eventId);
```

## 💼 Jobs

```typescript
import { jobsService } from "@/services/jobs.service";

// Get jobs
const { data } = useQuery({
  queryKey: ["jobs"],
  queryFn: () => jobsService.getJobs(1, 20, { type: "full-time" }),
});

// Apply for job
await jobsService.applyForJob(jobId, "Cover letter...", resumeFile);
```

## 🛒 Marketplace

```typescript
import { marketplaceService } from "@/services/marketplace.service";

// List item
await marketplaceService.createItem({
  title: "iPhone 13",
  description: "Barely used",
  category: "electronics",
  price: 250000,
  currency: "NGN",
  condition: "like-new",
  images: [file1, file2],
  location: { latitude: 6.5244, longitude: 3.3792 },
  delivery: { available: true, methods: ["pickup", "delivery"] },
  negotiable: true,
  quantity: 1,
});

// Contact seller
await marketplaceService.contactSeller(itemId, "Is this still available?");
```

## 💬 Real-time Chat

```typescript
import { chatService } from "@/services/chat.service";
import { useEffect } from "react";
import socketService from "@/lib/socket";

function ChatRoom({ conversationId }: { conversationId: string }) {
  const { data } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => chatService.getMessages(conversationId),
  });

  useEffect(() => {
    // Join conversation room
    socketService.joinRoom(`conversation:${conversationId}`);

    // Listen for new messages
    socketService.on("new-message", (message) => {
      if (message.conversationId === conversationId) {
        queryClient.invalidateQueries({
          queryKey: ["messages", conversationId],
        });
      }
    });

    return () => {
      socketService.leaveRoom(`conversation:${conversationId}`);
    };
  }, [conversationId]);

  const sendMessage = async (content: string) => {
    await chatService.sendMessage(conversationId, content);
  };
}
```

## 🎯 Error Handling

Errors are automatically handled by the `handleApiError` function:

```typescript
import { handleApiError } from "@/lib/error-handler";

try {
  await someService.someMethod();
} catch (error) {
  handleApiError(error); // Shows toast notification
}
```

## 🔐 Protected Routes

```typescript
'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) return <Loading />;
  if (!isAuthenticated) return null;

  return <YourProtectedContent />;
}
```

## 🎨 Optimistic Updates

```typescript
const likeMutation = useMutation({
  mutationFn: contentService.likePost,
  onMutate: async (postId) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ["posts"] });

    // Snapshot previous value
    const previousPosts = queryClient.getQueryData(["posts"]);

    // Optimistically update
    queryClient.setQueryData(["posts"], (old: any) => {
      // Update post in cache
      return updatePostInCache(old, postId, { isLiked: true, likes: +1 });
    });

    return { previousPosts };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    if (context?.previousPosts) {
      queryClient.setQueryData(["posts"], context.previousPosts);
    }
  },
});
```

## 📚 Additional Resources

- **API Documentation**: See the integration guide for complete endpoint reference
- **TypeScript Types**: All types are defined in `src/types/api.ts`
- **Service Files**: Each service file corresponds to a backend module

## 🐛 Troubleshooting

### CORS Errors

Make sure the backend has the correct CORS configuration for your frontend URL.

### Authentication Issues

Check that the token is being stored correctly:

```typescript
import apiClient from "@/lib/api-client";

console.log("Token:", apiClient.getToken());
```

### Socket Connection Issues

Verify the Socket.IO URL is correct and the backend supports WebSocket connections.

## 📝 License

This integration is part of the NeyborHuud project.
