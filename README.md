# 🏘️ NeyborHuud PWA

A hyperlocal social network connecting neighbors and communities. Built with Next.js 16, React 19, and TypeScript.

## ✨ Features

- 🔐 **Complete Authentication** - Login, register, password reset, email verification
- 📝 **Content Management** - Posts, comments, likes, shares with infinite scrolling
- 💬 **Real-time Chat** - Direct messages and group conversations with Socket.IO
- 🎮 **Events** - Create, discover, and attend local events
- 💼 **Jobs** - Post jobs and apply for opportunities in your neighborhood
- 🛒 **Marketplace** - Buy and sell items locally
- 🔍 **Global Search** - Search users, posts, events, jobs, and more
- 🔔 **Notifications** - Real-time notifications with unread counts
- 📍 **Geolocation** - Find nearby content, users, and events
- 🎯 **Gamification** - Points, badges, achievements, and leaderboards
- 👥 **Social Features** - Friends, followers, blocking
- 💳 **Payments** - Integrated payment processing
- 🎨 **PWA Support** - Install as a mobile app

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd neyborhuud-PWA
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Configure environment**

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=https://neyborhuud-serverside.onrender.com/api/v1
NEXT_PUBLIC_SOCKET_URL=https://neyborhuud-serverside.onrender.com
```

4. **Wrap your app with Providers**

Update `src/app/layout.tsx`:

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

5. **Run the development server**

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📚 Documentation

- **[API Integration Guide](API_INTEGRATION.md)** - Complete guide with examples
- **[Quick Reference](QUICK_REFERENCE.md)** - Quick copy-paste examples
- **[Implementation Summary](IMPLEMENTATION_SUMMARY.md)** - What was built

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js app router pages
├── components/            # React components
│   ├── providers.tsx     # App-level providers
│   └── ExampleDashboard.tsx
├── hooks/                 # Custom React hooks
│   ├── useAuth.ts
│   ├── usePosts.ts
│   ├── useComments.ts
│   ├── useNotifications.ts
│   ├── useGeolocation.ts
│   └── useDebouncedValue.ts
├── lib/                   # Core utilities
│   ├── api-client.ts     # Axios HTTP client
│   ├── query-client.ts   # React Query config
│   ├── error-handler.ts  # Global error handling
│   └── socket.ts         # Socket.IO client
├── services/              # API service layer
│   ├── auth.service.ts
│   ├── content.service.ts
│   ├── chat.service.ts
│   ├── events.service.ts
│   ├── jobs.service.ts
│   ├── marketplace.service.ts
│   ├── services.service.ts
│   ├── notifications.service.ts
│   ├── search.service.ts
│   ├── geo.service.ts
│   ├── gamification.service.ts
│   ├── social.service.ts
│   ├── payments.service.ts
│   └── admin.service.ts
└── types/
    └── api.ts             # TypeScript type definitions
```

## 🔑 Key Technologies

- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **TanStack Query** - Data fetching and caching
- **Axios** - HTTP client
- **Socket.IO** - Real-time communication
- **Sonner** - Toast notifications
- **Tailwind CSS** - Styling (optional)

## 💻 Usage Examples

### Authentication

```typescript
import { useAuth } from "@/hooks";

function LoginPage() {
  const { login, isLoggingIn } = useAuth();

  const handleLogin = async () => {
    await login("username", "password");
  };
}
```

### Posts Feed

```typescript
import { usePosts, usePostMutations } from "@/hooks";

function Feed() {
  const { data, fetchNextPage, hasNextPage } = usePosts("all");
  const { createPost, likePost } = usePostMutations();

  // Render posts...
}
```

### Real-time Chat

```typescript
import socketService from "@/lib/socket";

useEffect(() => {
  socketService.connect();
  socketService.on("new-message", (message) => {
    // Handle new message
  });
  return () => socketService.disconnect();
}, []);
```

See [QUICK_REFERENCE.md](QUICK_REFERENCE.md) for more examples.

## 🎨 Building Features

### Create a New Page

```typescript
// src/app/my-page/page.tsx
'use client';

import { useAuth } from '@/hooks';

export default function MyPage() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return <div>Welcome {user?.firstName}!</div>;
}
```

### Use Any Service

```typescript
import { eventsService, jobsService, marketplaceService } from "@/services";

// Get events
const events = await eventsService.getEvents(1, 20);

// Create job
await jobsService.createJob({
  title: "Software Engineer",
  // ... other fields
});

// List marketplace item
await marketplaceService.createItem({
  title: "iPhone 13",
  // ... other fields
});
```

## 🔧 Development

### Run Development Server

```bash
pnpm dev
```

### Build for Production

```bash
pnpm build
```

### Run Production Build

```bash
pnpm start
```

### Lint Code

```bash
pnpm lint
```

## 📦 Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

## 🌐 API Endpoints

The app integrates with **200+ backend endpoints** covering:

- Authentication & User Management
- Content (Posts, Comments)
- Chat & Messaging
- Events
- Jobs
- Marketplace
- Professional Services
- Notifications
- Search
- Geolocation
- Gamification
- Social Features
- Payments
- Admin Functions

See [API_INTEGRATION.md](API_INTEGRATION.md) for complete details.

## 🐛 Troubleshooting

### CORS Errors

Ensure the backend allows your frontend origin.

### Token Issues

Check browser DevTools → Application → Local Storage for `neyborhuud_access_token`.

### Socket Connection

Verify `NEXT_PUBLIC_SOCKET_URL` in `.env.local`.

### Type Errors

Run `pnpm build` to check TypeScript errors.

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

This project is proprietary to NeyborHuud.

## 🙋 Support

For issues or questions:

- Check the [documentation](API_INTEGRATION.md)
- Review [examples](QUICK_REFERENCE.md)
- Contact the development team

---

**Built with ❤️ by the NeyborHuud Team** 🚀
