/**
 * Example Dashboard Component
 * Demonstrates complete API integration
 */

'use client';

import { useAuth, usePosts, useNotifications, useUnreadCount } from '@/hooks';
import { usePostMutations } from '@/hooks';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ExampleDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, logout, isLoading: authLoading } = useAuth();
  const { data: unreadCount } = useUnreadCount();
  const {
    data: postsData,
    isLoading: postsLoading,
    fetchNextPage,
    hasNextPage,
  } = usePosts('all');
  const { createPost, likePost, isCreating } = usePostMutations();

  const [newPostContent, setNewPostContent] = useState('');

  // Redirect if not authenticated
  if (!authLoading && !isAuthenticated) {
    router.push('/login');
    return null;
  }

  // Loading state
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Handle create post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    try {
      await createPost({
        payload: {
          type: 'text',
          content: newPostContent,
          visibility: 'public',
        },
      });
      setNewPostContent('');
      alert('Post created successfully!');
    } catch (error) {
      // Error is automatically handled by handleApiError
    }
  };

  // Handle like post
  const handleLikePost = async (postId: string) => {
    try {
      await likePost(postId);
    } catch (error) {
      // Error handled
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      // Error handled
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">NeyborHuud</h1>
              <p className="text-sm text-gray-600">
                Welcome, {user?.firstName || user?.username}!
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button
                onClick={() => router.push('/notifications')}
                className="relative p-2 rounded-full hover:bg-gray-100"
              >
                🔔
                {unreadCount && unreadCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Profile */}
              <div className="flex items-center gap-2">
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.username}
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                    {user?.firstName?.[0] || user?.username?.[0] || '?'}
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-700 hover:text-gray-900"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Create Post Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <form onSubmit={handleCreatePost}>
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
            <div className="mt-3 flex justify-end">
              <button
                type="submit"
                disabled={isCreating || !newPostContent.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? 'Posting...' : 'Post'}
              </button>
            </div>
          </form>
        </div>

        {/* Posts Feed */}
        <div className="space-y-4">
          {postsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            </div>
          ) : (
            <>
              {postsData?.pages.map((page) => {
                // Extract the posts array from the paginated response
                const posts = page.content ?? [];
                return posts.map((post: any) => (
                  <div key={post.id} className="bg-white rounded-lg shadow p-6">
                    {/* Post Header */}
                    <div className="flex items-center gap-3 mb-4">
                      {post.author.profilePicture ? (
                        <img
                          src={post.author.profilePicture}
                          alt={post.author.username}
                          className="h-10 w-10 rounded-full"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          {post.author.firstName?.[0] || post.author.username[0]}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold">
                          {post.author.firstName} {post.author.lastName}
                        </p>
                        <p className="text-xs text-gray-500">
                          @{post.author.username}
                        </p>
                      </div>
                    </div>

                    {/* Post Content */}
                    <p className="text-gray-800 mb-4">{post.content}</p>

                    {/* Post Media */}
                    {post.media && post.media.length > 0 && (
                      <div className="mb-4 rounded-lg overflow-hidden">
                        {post.media[0].type === 'image' && (
                          <img
                            src={post.media[0].url}
                            alt="Post media"
                            className="w-full"
                          />
                        )}
                      </div>
                    )}

                    {/* Post Actions */}
                    <div className="flex items-center gap-6 pt-4 border-t">
                      <button
                        onClick={() => handleLikePost(post.id)}
                        className={`flex items-center gap-2 ${
                          post.isLiked ? 'text-red-500' : 'text-gray-600'
                        } hover:text-red-500`}
                      >
                        {post.isLiked ? '❤️' : '🤍'} {post.likes}
                      </button>
                      <button className="flex items-center gap-2 text-gray-600 hover:text-blue-500">
                        💬 {post.comments}
                      </button>
                      <button className="flex items-center gap-2 text-gray-600 hover:text-green-500">
                        🔄 {post.shares}
                      </button>
                    </div>
                  </div>
                ));
              })}

              {/* Load More Button */}
              {hasNextPage && (
                <div className="text-center py-4">
                  <button
                    onClick={() => fetchNextPage()}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Load More
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
