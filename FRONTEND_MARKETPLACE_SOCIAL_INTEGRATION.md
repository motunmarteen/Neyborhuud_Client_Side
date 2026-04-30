# Frontend Implementation Guide: Marketplace Social Features

**Date:** April 28, 2026  
**Backend Version:** Latest (with marketplace consolidation)  
**Target:** React/Next.js Frontend Team

---

## Overview

You are implementing social interaction features for the marketplace module in your React frontend application. The backend has been updated to support likes, comments, and full CRUD operations for marketplace product listings using a unified Product model. This guide provides everything you need to integrate these features seamlessly with your existing frontend architecture, including authentication patterns, API endpoints, state management recommendations, and UI/UX best practices specific to the NeyborHuud platform.

---

## Background Context

The backend marketplace system has been consolidated around a single Product model that serves as the source of truth for all marketplace listings. Previously, there may have been dual systems (Product model and Content with contentType marketplace), but now the Product model is primary and includes full social engagement capabilities identical to how posts work in your content feed. The system uses a polymorphic database design where likes and comments can target either content posts or marketplace products using targetId and targetType fields, but this complexity is abstracted away from the frontend—you simply call product-specific endpoints that handle everything internally.

All marketplace endpoints are prefixed with `/api/v1/marketplace` and follow the same authentication patterns you're already using for other protected routes. The authentication system requires a Bearer token in the Authorization header for protected endpoints, and user sessions are managed through JWT tokens with automatic refresh capabilities. Rate limiting is applied to certain operations like creating listings and adding comments to prevent spam, so your UI should handle 429 status codes gracefully by showing appropriate cooldown messages to users.

---

## Authentication Requirements

Before making any authenticated marketplace requests, ensure your application has valid user authentication state. You should already have authentication context or state management that stores the current user's JWT token, user ID, and profile information. All protected marketplace endpoints require the Authorization header with format `Bearer {token}` where the token is the JWT access token from your authentication flow. If you receive a 401 Unauthorized response, trigger your token refresh flow or redirect the user to login. For 403 Forbidden responses, this typically means the user is trying to perform an action they don't own (like editing someone else's product), so show an appropriate error message rather than refreshing tokens.

Your existing authentication utilities should handle token storage, retrieval, and automatic inclusion in API requests. If you're using axios, you likely have an interceptor that automatically adds the Authorization header. If using fetch, ensure every authenticated request includes the header manually or through a wrapper function. The backend validates tokens on every request and checks ownership for update and delete operations, so trust the backend's authorization decisions and surface errors appropriately in your UI.

---

## Core API Endpoints

The marketplace API exposes several endpoints organized into three categories: product management (CRUD operations), social interactions (likes and comments), and transactional features (orders, offers, escrow). For this implementation, you'll primarily work with product management and social interaction endpoints, as the transactional features are already implemented in your existing marketplace flows.

**Product Management Endpoints:**

Creating a new product listing requires a POST request to `/api/v1/marketplace` with authentication and a JSON body containing title (string, 3-100 characters), description (string, minimum 10 characters), price (number, minimum 0), category (string), images (array of image URLs with at least one required), and location object with latitude and longitude as numbers plus optional address string. This endpoint is rate-limited to prevent spam, so handle 429 responses by showing a cooldown message. The response includes the created product object with its generated MongoDB _id that you'll use for subsequent operations. Store this product ID when creating listings so users can manage their own products later.

Retrieving a single product uses GET `/api/v1/marketplace/{productId}` where productId is the MongoDB ObjectId string. This endpoint is public (no authentication required) but when called with authentication, it includes an `isLiked` boolean in the engagement object showing whether the current user has liked this product. The response structure includes the full product object with populated seller information (username, first name, last name, location) and an engagement object containing likesCount (number), commentsCount (number), and isLiked (boolean, only when authenticated). Use this engagement data to render like buttons, comment counts, and user interaction states in your product detail views.

Updating an existing product requires PATCH `/api/v1/marketplace/{productId}` with authentication and a JSON body containing any fields you want to update from the allowed set: title, description, price, category, images, location, status (active/sold/archived), or condition (new/like_new/good/fair/poor). You must include at least one field to update or the validation will fail. The backend verifies that the authenticated user owns this product (sellerId matches user ID) before allowing updates, so expect 403 errors if a user tries to edit someone else's listing. On success, you receive the updated product object with all changes applied and seller information populated, which you can use to update your local state or cache.

Deleting a product uses DELETE `/api/v1/marketplace/{productId}` with authentication. This performs a soft delete by setting the product status to "archived" rather than removing it from the database, preserving data integrity and allowing potential recovery. Like updates, this endpoint verifies ownership before proceeding. After successful deletion, you should remove the product from your UI, redirect users away from detail views, and update any product lists or user profile sections showing their listings. The response includes the product ID so you can match it against your local state for removal.

**Social Interaction Endpoints:**

Toggling likes on a product uses POST `/api/v1/marketplace/{productId}/like` with authentication. This endpoint is idempotent and handles both liking and unliking with a single request—if the user hasn't liked the product, it creates a like; if they have, it removes it. The response includes `isLiked` (boolean indicating current state after the action) and `likesCount` (number showing total likes). Use this data to immediately update your UI with optimistic updates: when the user clicks like, instantly update the UI to show the liked state and increment the count, then if the request fails, revert the changes and show an error message. This provides snappy user feedback while maintaining data accuracy.

Adding comments to products uses POST `/api/v1/marketplace/{productId}/comments` with authentication and a JSON body containing body (string, 1-1000 characters required), optional parentId (string, 24-character hex for nested replies), and optional mediaUrls (array of up to 4 URLs). This endpoint is rate-limited to maximum 3 comments per minute per user to prevent spam, so when you receive a 429 status, show a cooldown message like "You're commenting too fast. Please wait a moment." The response includes the created comment object with the user's information populated (username, avatar), which you should add to your comments list immediately. For nested replies, pass the parent comment's _id as parentId to create threaded conversations.

Retrieving comments for a product uses GET `/api/v1/marketplace/{productId}/comments` with optional query parameters page (number, default 1) and limit (number, default 20). This endpoint is public but typically called after viewing a product. The response includes a comments array with each comment having populated user data (id, username, firstName, lastName, avatar) and comment details (body, mediaUrls, likesCount, createdAt), plus a pagination object containing page (current page number), limit (items per page), total (total comment count), and pages (total pages available). Implement infinite scroll or pagination controls using this pagination data, and load initial comments when users view a product detail page.

---

## State Management Strategy

For managing marketplace product data and social interactions, you should integrate with your existing state management solution whether that's Redux, Zustand, React Query, or Context API. The recommended approach uses React Query or SWR for server state management since marketplace data is frequently updated by multiple users and requires cache invalidation strategies. If you're already using these libraries for your feed or other features, extend the same patterns to marketplace.

When fetching a single product, use a query key like `['marketplace', 'product', productId]` and enable automatic refetching on window focus to ensure users see updated like counts and comments when they return to a tab. Set a stale time of 30-60 seconds since product details don't change extremely frequently but engagement metrics do. For the product list view, use `['marketplace', 'products', filters]` as the query key where filters includes category, price range, search terms, and pagination state. This ensures separate caches for different filter combinations while enabling easy invalidation when a product is created or updated.

For optimistic updates on likes, use React Query's `useMutation` with an onMutate callback that immediately updates the cached product data before the server responds. Store the previous state in the mutation context so you can roll back if the request fails. When the mutation succeeds, invalidate the product query to refetch fresh data from the server, ensuring consistency with other users' interactions. This pattern provides instant user feedback while maintaining eventual consistency with the backend state.

For comments, implement a similar optimistic update strategy but also consider using infinite query patterns for pagination. When a user adds a comment, optimistically add it to the start of the comments list with a temporary ID and pending state, then replace it with the server response including the real ID and timestamp. If the comment fails to post (network error, rate limit), remove the optimistic comment and show an error toast notification. Invalidate the product query when comments are added to update the commentsCount in the product detail view.

---

## UI Component Implementation

Your marketplace product detail page should be structured as a main container component that fetches the product data and manages loading, error, and success states. Within this container, create separate components for the product information display, image gallery, seller profile card, engagement actions (like and comment buttons), and comments section. This separation of concerns makes components reusable and easier to test.

The product information section should display the title as a large heading, price prominently formatted with proper currency (₦ for NGN), category as a badge or tag, condition if available, description in a readable paragraph format, and location information. Include edit and delete buttons if the current user owns the product, checking user ID against sellerId from the product data. These buttons should be clearly visible but not interfere with the primary product information, perhaps in a fixed action bar or dropdown menu.

The engagement section should mirror your existing post engagement UI for consistency across the platform. Display a like button showing the current like state (filled heart for liked, outline for not liked), total likes count, and a comments icon with count. When users click the like button, trigger the like mutation with optimistic updates as described earlier. Position this engagement bar prominently, either fixed at the bottom on mobile or in a sidebar on desktop views. Ensure the like button provides visual feedback on click with a brief animation or color change.

For the comments section, implement a text input area that expands when focused, with a character counter showing remaining characters out of 1000 maximum. Include attachment buttons for adding media URLs if your design requires it, though most comments will be text-only. Show a submit button that disables during submission and displays a loading spinner. When the rate limit is hit (3 comments per minute), disable the submit button and show a countdown timer indicating when the user can comment again. This prevents frustration and clearly communicates the limitation.

Display comments in a list or thread format with each comment showing the user's avatar, username, timestamp (formatted relative like "2 hours ago"), comment body, and any media attachments. For nested replies, indent child comments or use threading UI patterns to show the conversation hierarchy. Include a reply button on each comment that opens a reply input field with the parent comment context visible. Show the likesCount for each comment if you want to enable comment likes (this uses a different endpoint not covered in this guide but follows similar patterns).

Implement pagination or infinite scroll for comments using the pagination data from the API response. For infinite scroll, load the next page when users scroll near the bottom of the comments list, appending new comments to the existing list. For traditional pagination, show page numbers or next/previous buttons at the bottom of the comments section. Cache each page separately to avoid re-fetching when users navigate back and forth between pages.

---

## Form Validation and Error Handling

On the product creation and update forms, implement client-side validation before submitting to the API to provide immediate feedback and reduce unnecessary API calls. For the title field, ensure it's between 3 and 100 characters with no leading or trailing whitespace. For description, require minimum 10 characters with clear error messages if users try to submit less. Price must be a positive number, formatted with proper decimal handling for currency. Category should be selected from a predefined list that matches your backend categories to prevent validation errors.

The images field requires at least one image URL for creation, though for updates it can be omitted. If you're handling image uploads separately, ensure the upload completes successfully and you have valid URLs before submitting the product form. Location requires latitude and longitude coordinates which you should obtain from either a map picker component, geocoding API, or the user's current GPS location with permission. Validate that latitude is between -90 and 90 and longitude between -180 and 180 before submission.

For comment forms, validate the body length (1-1000 characters) in real-time and show a character counter that turns red when approaching the limit. If users include a parentId for replies, verify it's a valid 24-character hexadecimal string matching MongoDB ObjectId format. For media URLs in comments, validate that they're properly formatted URLs and optionally verify they point to image or video content before submission.

Handle API errors gracefully with user-friendly messages rather than showing raw error responses. For 400 Bad Request errors, parse the validation error messages from the backend and display them next to the relevant form fields. For 401 Unauthorized, redirect to login or trigger token refresh. For 403 Forbidden on updates or deletes, show a message like "You don't have permission to modify this product." For 404 Not Found, redirect to the marketplace home page or show a "Product not found" empty state. For 429 Rate Limit errors, show the specific cooldown message and disable the submit button with a countdown timer.

Network errors should display a retry button and a message like "Failed to connect to server. Please check your internet connection and try again." For 500 Internal Server errors, log the error details for debugging and show a generic message asking users to try again later or contact support. Implement error boundaries in React to catch component errors and prevent the entire app from crashing if a marketplace component fails.

---

## Real-Time Updates and WebSocket Integration

The backend broadcasts WebSocket events for marketplace interactions that you should listen for to provide real-time updates across different user sessions. If you're already using Socket.IO for other real-time features like chat or notifications, extend your socket listeners to include marketplace events. The two primary events are `product:updated` which fires when a product is liked or unliked, and `product:commented` which fires when a comment is added.

The `product:updated` event payload includes productId (string), action (string, "liked" or "unliked"), userId (string of the user who performed the action), and likesCount (number, new total). When you receive this event, check if the productId matches any product currently displayed in your UI (detail view, list view, user's products). If it matches, update the likesCount in your local state or cache. If the userId matches the current user, this is just confirmation of their own action which you've already optimistically updated. If it's a different user, this represents another user interacting with the product in real-time, so update the UI to reflect the new engagement.

The `product:commented` event payload includes productId (string), comment (object with full comment data including user info, body, timestamps). When received, if you're displaying the comments section for this productId, append the new comment to your comments list and increment the commentsCount in the product detail. If the comment is from the current user, it's a duplicate of their optimistic update, so match by temporary ID and replace with the server version. If it's from another user, show a notification or subtle indicator that new comments are available, perhaps a "New comments available. Click to refresh" banner.

Connect to the WebSocket server on component mount and disconnect on unmount to prevent memory leaks. Use event listeners within useEffect hooks with proper cleanup. If your Socket.IO setup requires joining rooms, you may need to join a product-specific room when viewing a product detail page using something like `socket.emit('join:product', productId)` and leave when navigating away. Check your existing WebSocket implementation patterns and extend them for marketplace events.

Handle WebSocket connection states gracefully—when disconnected, show a small indicator that real-time updates are unavailable and fall back to periodic polling or manual refresh. When reconnecting, refetch current data to catch any events missed during the disconnection. This ensures users always have accurate data even with unstable connections.

---

## Performance Optimizations

To ensure smooth user experience especially on slower connections or older devices, implement several performance optimizations. Use lazy loading for product images with placeholder blur effects while loading, and consider using progressive image formats like WebP with JPEG fallbacks. For image galleries, load full resolution images only when users click to expand, displaying thumbnails in the initial view.

Implement virtual scrolling or windowing for long product lists using libraries like react-window or react-virtual. This renders only the visible items in the viewport plus a small buffer, dramatically improving performance when displaying hundreds of products. Combine this with infinite scroll pagination to load products in chunks as users scroll rather than loading everything upfront.

Debounce search inputs and filter controls to avoid excessive API calls while users are typing. Wait for 300-500ms of inactivity before triggering the search request. Show loading indicators during searches so users know the system is responding to their input. Use the same debounced approach for any real-time validation that requires API calls.

Cache product images and static assets aggressively using service workers or browser caching strategies. Product images rarely change, so long cache times are appropriate. For API responses, leverage React Query's built-in caching with appropriate stale times—use shorter times (30 seconds) for engagement data that changes frequently, longer times (5 minutes) for product details that change less often.

Prefetch data for likely next actions—when users hover over a product card in a list view, prefetch the full product details and initial comments. When viewing a product, prefetch the seller's profile information. This makes navigation feel instant while only costing minimal bandwidth for data users are likely to need.

---

## Mobile Responsiveness

Design your marketplace UI with mobile-first principles since many NeyborHuud users will access the platform from mobile devices. The product detail page should stack vertically on mobile with image gallery at the top, product information below, engagement actions in a fixed bottom bar, and comments in a scrollable section. Use full-width layouts on mobile and introduce columns only on tablet and desktop breakpoints.

The like and comment buttons in the engagement bar should be large enough for easy thumb tapping (minimum 44x44 pixels) with adequate spacing between them to prevent mis-taps. On mobile, consider using a bottom sheet or modal for the comment input rather than inline forms, providing more screen space for typing. The comment modal should slide up from the bottom, include a dismiss gesture, and focus the text input automatically when opened.

For product creation and editing forms on mobile, use single-column layouts with clear section breaks between different form groups. Use native mobile input types (type="number" for price, type="url" for image URLs) to trigger appropriate keyboards. For location selection, integrate with mobile map SDKs or use the device's current location with permission prompts.

Test thoroughly on actual mobile devices with varying screen sizes and connection speeds. Ensure touch targets are appropriately sized, scrolling is smooth without jank, and images don't cause layout shifts as they load. Use CSS clamp() functions for responsive typography that scales naturally between mobile and desktop without awkward breakpoints.

---

## Accessibility Considerations

Ensure all interactive elements are keyboard accessible with logical tab order and visible focus indicators. The like button should toggle on Enter or Space key press, not just mouse clicks. Comments should be navigable by keyboard with focus moving logically from the text input to the submit button to the comments list.

Use semantic HTML elements—buttons for actions (like, submit), links for navigation (view seller profile, go to product), headings for section titles (h2 for product title, h3 for "Comments" section heading). This provides proper structure for screen readers and improves SEO. Add aria-labels to icon-only buttons like the like button (aria-label="Like this product" or "Unlike this product" depending on state).

Ensure sufficient color contrast for text on backgrounds, especially for prices, engagement counts, and comment text. The WCAG AA standard requires 4.5:1 contrast ratio for normal text and 3:1 for large text. Test your color schemes with automated tools and manual verification. Don't rely solely on color to convey information—use icons, text labels, and patterns as well.

For loading states, use aria-live regions to announce status changes to screen reader users. When a product is loading, announce "Loading product details." When comments are posting, announce "Posting comment" then "Comment posted successfully" or error messages. This keeps visually impaired users informed about asynchronous operations.

Provide alt text for all product images describing what's shown (e.g., "iPhone 15 Pro Max front view showing screen and cameras"). For user avatars in comments, use alt text like "Avatar for @username". For decorative images or icons that don't convey meaning, use empty alt attributes (alt="") so screen readers skip them.

---

## Testing Requirements

Before deploying your marketplace implementation, conduct thorough testing across multiple dimensions. For unit testing, use Jest and React Testing Library to test individual components in isolation. Test that the like button renders correctly in both liked and unliked states, that clicking it triggers the mutation function, and that optimistic updates apply correctly. Test form validation by simulating various invalid inputs and verifying error messages display appropriately.

For integration testing, test complete user flows: create a product, view it, like it, comment on it, edit it, delete it. Verify that state updates propagate correctly through your state management system and that cache invalidations work as expected. Test error scenarios like network failures, validation errors, and unauthorized access attempts to ensure your error handling works correctly.

Perform cross-browser testing on Chrome, Firefox, Safari, and Edge to catch any browser-specific issues especially with form inputs, image loading, and WebSocket connections. Test on both desktop and mobile browsers since mobile Safari often has unique quirks. Use tools like BrowserStack or similar for testing on devices you don't have physical access to.

Conduct accessibility testing using screen readers (NVDA on Windows, VoiceOver on Mac/iOS) to verify that visually impaired users can navigate and use all marketplace features. Use automated accessibility testing tools like axe DevTools during development to catch common issues early. Verify keyboard navigation works completely without requiring a mouse.

Test with throttled network connections (simulate 3G, slow 4G) to ensure your loading states, error handling, and retry logic work correctly under poor network conditions. Verify that optimistic updates don't cause confusion if requests take a long time to complete. Test offline behavior if you've implemented service workers to ensure graceful degradation.

---

## Deployment Checklist

Before deploying to production, verify that all environment variables are correctly configured including API base URLs, WebSocket server addresses, and any third-party service credentials. Ensure your production build process includes proper minification, tree-shaking, and code splitting to optimize bundle sizes. The marketplace module should be in its own code-split chunk to avoid bloating the initial bundle.

Set up proper error logging and monitoring using services like Sentry or LogRocket to catch runtime errors in production that you might miss in testing. Configure source maps to be uploaded to your error tracking service so you can debug minified production errors effectively. Set up performance monitoring to track API response times, render performance, and user interaction metrics.

Verify that your CDN or hosting service is configured to cache static assets appropriately with correct cache headers. Product images should have long cache times since they rarely change. API responses should not be cached by CDN since they're user-specific or frequently updated. Configure CORS properly if your frontend and backend are on different domains.

Create comprehensive documentation for your team covering the marketplace implementation including API integration details, state management patterns, component hierarchy, and common debugging scenarios. Include runbook entries for common production issues like handling rate limiting, dealing with stale cache data, and troubleshooting WebSocket disconnections.

Plan a gradual rollout strategy starting with a beta group of users before full production release. Monitor error rates, API performance, and user engagement metrics closely during the rollout. Have a rollback plan ready in case critical issues are discovered. Set up feature flags if possible to enable/disable marketplace features without deploying new code.

---

## Summary

You are implementing a complete marketplace social interaction system that integrates seamlessly with your existing NeyborHuud frontend. The backend provides robust endpoints for product CRUD operations, likes, and comments with proper authentication, authorization, and rate limiting. Your implementation should prioritize user experience with optimistic updates, real-time synchronization, and graceful error handling while maintaining accessibility and performance standards. Follow the patterns and best practices outlined in this guide to ensure a consistent, high-quality implementation that matches the rest of your platform's feature set. Test thoroughly across devices, browsers, and network conditions before deploying to ensure all users have an excellent experience browsing and interacting with marketplace listings.
