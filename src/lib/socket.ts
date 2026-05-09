/**
 * Socket.IO Client Setup
 * Handles real-time communication
 */

import { io, Socket } from "socket.io-client";
import apiClient from "./api-client";

class SocketService {
  private socket: Socket | null = null;
  /** The userId last passed to authenticate(); re-sent on every reconnect. */
  private authenticatedUserId: string | null = null;

  /**
   * Initialize socket connection
   */
  connect() {
    if (this.socket?.connected) {
      return this.socket;
    }

    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";
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
      // userId→socketId map stays accurate for private room routing.
      if (this.authenticatedUserId) {
        this.socket!.emit("authenticate", this.authenticatedUserId);
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
   * The userId is cached so it can be re-sent on every subsequent reconnect.
   */
  authenticate(userId: string): void {
    this.authenticatedUserId = userId;
    if (this.socket?.connected) {
      this.socket.emit("authenticate", userId);
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
    this.authenticatedUserId = null;
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
