/**
 * Hooks Index
 * Central export for all custom hooks
 */

export { useAuth, usePasswordReset, useEmailVerification } from "./useAuth";
export {
  usePosts,
  usePost,
  useUserPosts,
  useSavedPosts,
  usePostMutations,
} from "./usePosts";
export { useComments, useCommentMutations } from "./useComments";
export { useFollow, useFollowers, useFollowing } from "./useFollow";
export {
  useNotifications,
  useUnreadCount,
  useNotificationMutations,
} from "./useNotifications";
export { useGeolocation, useWatchLocation } from "./useGeolocation";
export { useDebouncedValue } from "./useDebouncedValue";
export {
  useEmailValidation,
  useUsernameValidation,
} from "./useEmailValidation";
export { useSearch } from "./useSearch";
export {
  useDepartments,
  useDepartment,
  useDepartmentServices,
  useDepartmentRewards,
} from "./useDepartments";
export { useTripMonitor } from "./useTripMonitor";
export type { UseTripMonitor, TripMonitorState } from "./useTripMonitor";
export {
  useProduct,
  useMarketplaceProducts,
  useNearbyProducts,
  useMyListings,
  useSavedProducts,
  useProductMutations,
  useProductLike,
  useProductComments,
  useProductCommentMutations,
  useSaveProduct,
} from "./useMarketplace";
export {
  useMarketplaceSocket,
  useProductRoom,
} from "./useMarketplaceSocket";
