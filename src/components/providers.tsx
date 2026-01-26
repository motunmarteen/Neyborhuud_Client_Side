/**
 * App Providers
 * Wraps the app with necessary providers
 */

'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'sonner';
import { queryClient } from '@/lib/query-client';
import { useEffect } from 'react';
import socketService from '@/lib/socket';
import apiClient from '@/lib/api-client';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize socket connection if user is authenticated
    if (apiClient.isAuthenticated()) {
      socketService.connect();

      // Setup real-time event listeners
      socketService.on('new-notification', (notification) => {
        // Invalidate notifications query to refetch
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
      });

      socketService.on('new-message', (message) => {
        // Invalidate messages query
        queryClient.invalidateQueries({ queryKey: ['messages'] });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      });

      socketService.on('post-update', (post) => {
        // Invalidate posts query
        queryClient.invalidateQueries({ queryKey: ['posts'] });
        queryClient.invalidateQueries({ queryKey: ['post', post.id] });
      });

      return () => {
        socketService.disconnect();
      };
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster 
        position="top-right" 
        richColors 
        closeButton 
        duration={4000}
        toastOptions={{
          style: {
            background: 'var(--background)',
            color: 'var(--foreground)',
            border: '1px solid var(--border)',
          },
        }}
      />
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
