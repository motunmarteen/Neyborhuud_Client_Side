/**
 * App Providers
 * Wraps the app with necessary providers
 */

'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster, toast } from 'sonner';
import { queryClient } from '@/lib/query-client';
import { useEffect } from 'react';
import socketService from '@/lib/socket';
import apiClient from '@/lib/api-client';
import { authService } from '@/services/auth.service';

const METAMASK_EXTENSION_SUBSTRING = 'nkbihfbeogaeaoehlefnkodbefgpgknn';

function isMetaMaskExtensionNoise(reason: unknown): boolean {
  const details =
    typeof reason === 'object' && reason !== null
      ? (reason as {
          message?: unknown;
          stack?: unknown;
          cause?: unknown;
          filename?: unknown;
          fileName?: unknown;
          source?: unknown;
        })
      : null;
  const msg = details?.message ? String(details.message) : String(reason);
  const stack = details?.stack ? String(details.stack) : '';
  const cause = details?.cause ? String(details.cause) : '';
  const filename =
    details?.filename || details?.fileName || details?.source
      ? `${String(details.filename ?? '')} ${String(details.fileName ?? '')} ${String(details.source ?? '')}`
      : '';
  return (
    msg.includes('MetaMask') ||
    msg.includes('Failed to connect to MetaMask') ||
    cause.includes('MetaMask') ||
    filename.includes(METAMASK_EXTENSION_SUBSTRING) ||
    filename.includes('MetaMask') ||
    stack.includes(METAMASK_EXTENSION_SUBSTRING)
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isMetaMaskExtensionNoise(event.reason)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };

    const onError = (event: ErrorEvent) => {
      const fromMetaMask =
        event.filename?.includes(METAMASK_EXTENSION_SUBSTRING) ||
        event.message?.includes('MetaMask') ||
        isMetaMaskExtensionNoise(event.error ?? event.message);
      if (fromMetaMask) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };

    window.addEventListener('unhandledrejection', onUnhandledRejection, true);
    window.addEventListener('error', onError, true);
    return () => {
      window.removeEventListener('unhandledrejection', onUnhandledRejection, true);
      window.removeEventListener('error', onError, true);
    };
  }, []);

  useEffect(() => {
    // Initialize socket connection if user is authenticated
    if (apiClient.isAuthenticated()) {
      void authService.touchSession();
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

      // Emergency alert real-time listener
      socketService.on('safety:emergency_post', (data: any) => {
        // Refresh feed to show the new emergency post
        queryClient.invalidateQueries({ queryKey: ['locationFeed'] });

        // Show urgent toast notification
        const severity = data?.severity || 'critical';
        const emergencyType = data?.emergencyType || 'Emergency';
        const message = data?.preview || data?.content || 'A new emergency alert has been posted nearby.';

        if (severity === 'critical') {
          toast.error(`🚨 ${emergencyType.toUpperCase()}`, {
            description: message,
            duration: 10000,
          });
        } else {
          toast.warning(`⚠️ ${emergencyType}`, {
            description: message,
            duration: 7000,
          });
        }
      });

      // Emergency cancellation listener
      socketService.on('safety:emergency_cancelled', (data: any) => {
        queryClient.invalidateQueries({ queryKey: ['locationFeed'] });
        toast.info('Emergency alert cancelled', {
          description: data?.reason || 'An emergency alert in your area has been resolved.',
          duration: 5000,
        });
      });

      // Emergency interaction updates (other users' actions on emergency posts)
      const emergencyInteractionHandler = (data: any) => {
        if (data?.contentId) {
          queryClient.invalidateQueries({ queryKey: ['locationFeed'] });
          queryClient.invalidateQueries({ queryKey: ['post', data.contentId] });
        }
      };
      socketService.on('safety:awareness_update', emergencyInteractionHandler);
      socketService.on('safety:nearby_update', emergencyInteractionHandler);
      socketService.on('safety:safe_update', emergencyInteractionHandler);
      socketService.on('content:verification_update', emergencyInteractionHandler);

      return () => {
        socketService.disconnect();
      };
    }
  }, []);

  useEffect(() => {
    const pingIfAuthed = () => {
      if (
        typeof document !== 'undefined' &&
        document.visibilityState === 'visible' &&
        apiClient.isAuthenticated()
      ) {
        void authService.touchSession();
      }
    };
    const onVisibility = () => pingIfAuthed();
    document.addEventListener('visibilitychange', onVisibility);
    const interval = window.setInterval(pingIfAuthed, 12 * 60 * 1000);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.clearInterval(interval);
    };
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
