/**
 * Socket.IO Client Setup
 * Handles real-time communication
 */

import { io, Socket } from "socket.io-client";
import apiClient, { getSocketUrl, shouldConnectSocket } from "./api-client";

class SocketService {
  private socket: Socket | null = null;
  /** Whether authenticate() has been called; re-sent on every reconnect. */
  private shouldAuthenticate = false;

  /**
   * Initialize socket connection
   */
  connect() {
    if (!shouldConnectSocket()) {
      return null;
    }

    if (this.socket?.connected) {
      return this.socket;
    }

    const socketUrl = getSocketUrl();
    const token = apiClient.getToken();

    this.socket = io(socketUrl, {
      autoConnect: false,
      auth: {
        token,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: Infinity,
    });

    this.setupEventListeners();
    this.socket.connect();

    return this.socket;
  }

  /**
   * Setup socket event listeners
   */
  private setupEventListeners() {
    if (!this.socket) return;
    // Remove any stale listeners before (re-)registering to prevent duplication
    this.socket.removeAllListeners("connect");
    this.socket.removeAllListeners("disconnect");
    this.socket.removeAllListeners("connect_error");
    this.socket.removeAllListeners("error");

    this.socket.on("connect", () => {
      // Re-authenticate automatically after every reconnect so the server-side
      // userId→socketId map stays accurate for private room routing. The server
      // verifies our session token itself — it never trusts a client-claimed id.
      if (this.shouldAuthenticate) {
        const token = apiClient.getToken();
        if (token) this.socket!.emit("authenticate", token);
      }
    });

    this.socket.on("disconnect", (_reason) => {
      // Disconnected — reconnection handled by socket.io's built-in reconnection
    });

    this.socket.on("connect_error", (_error) => {
      // Connection error — socket.io will retry automatically
    });

    this.socket.on("error", (_error) => {
      // Socket-level error
    });
  }

  /**
   * Authenticate with the server.
   * Call this once after connecting (e.g. after login).
   * Sends our session token, not a claimed userId — the server verifies the
   * token itself (same getSession() check the REST API uses) and derives the
   * real user id from it. The intent to authenticate is cached so it re-sends
   * a fresh token on every subsequent reconnect.
   */
  authenticate(_userId?: string): void {
    this.shouldAuthenticate = true;
    const token = apiClient.getToken();
    if (this.socket?.connected && token) {
      this.socket.emit("authenticate", token);
    }
  }

  /**
   * Disconnect socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.shouldAuthenticate = false;
  }

  /**
   * Get socket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Listen to an event
   */
  on<T = unknown>(event: string, callback: (data: T) => void): void {
    if (this.socket) {
      this.socket.on(event, callback as (...args: unknown[]) => void);
    }
  }

  /**
   * Remove event listener
   */
  off<T = unknown>(event: string, callback?: (data: T) => void): void {
    if (this.socket) {
      this.socket.off(event, callback as ((...args: unknown[]) => void) | undefined);
    }
  }

  /**
   * Emit an event
   */
  emit(event: string, ...args: unknown[]): void {
    if (this.socket) {
      this.socket.emit(event, ...args);
    }
  }

  /**
   * Join a room
   */
  joinRoom(room: string) {
    this.emit("join-room", room);
  }

  /**
   * Leave a room
   */
  leaveRoom(room: string) {
    this.emit("leave-room", room);
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Export singleton instance
const socketService = new SocketService();

export default socketService;
