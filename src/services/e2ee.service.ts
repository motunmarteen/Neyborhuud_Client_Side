/**
 * E2EE Key Management Service
 *
 * Manages the client-side lifecycle of public/private key pairs used for
 * end-to-end encrypted messaging.
 *
 * KEY DESIGN:
 *  - Uses ECDH P-256 (universally supported browser crypto).
 *  - Public key is exported as base64 SPKI and registered with the backend.
 *  - Private key is stored in localStorage as JWK (base64-encoded JSON).
 *  - The backend stores ONLY the public key — private keys never leave the device.
 *
 * FINGERPRINT (Safety Number):
 *  - SHA-256 hex of the base64 SPKI public key string.
 *  - Displayed to users so they can compare out-of-band (phone call / in-person).
 *  - Backend computes the same fingerprint on registration and stores it.
 *  - If a user rotates their key, all conversation participants are notified
 *    via a `key:rotated` socket event so they know to re-verify.
 */

import apiClient from "@/lib/api-client";
import { KeyVerificationStatus } from "@/types/api";

const LS_PUB_KEY  = "neyborhuud_e2ee_public_key";   // base64 SPKI
const LS_PRIV_KEY = "neyborhuud_e2ee_private_key";  // base64-encoded JWK JSON
const LS_DEVICE_ID = "neyborhuud_e2ee_device_id";

const KEY_ALGO = { name: "ECDH", namedCurve: "P-256" } as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uint8ToBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function base64ToUint8(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const e2eeService = {
  /** Get or create a stable device identifier stored in localStorage. */
  getDeviceId(): string {
    if (typeof window === "undefined") return "server";
    let id = localStorage.getItem(LS_DEVICE_ID);
    if (!id) {
      id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(LS_DEVICE_ID, id);
    }
    return id;
  },

  /** Return the stored base64 SPKI public key, or null if none generated yet. */
  getStoredPublicKey(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(LS_PUB_KEY);
  },

  /**
   * Compute SHA-256 hex fingerprint of a public key string.
   * Mirrors the server-side computation in keys.controller.ts.
   */
  async computeFingerprint(publicKeyBase64: string): Promise<string> {
    const buf = new TextEncoder().encode(publicKeyBase64);
    const hash = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  },

  /**
   * Format a 64-char hex fingerprint into human-readable groups of 5.
   * e.g. "a3f91 b82c0 e441d …"
   * Makes out-of-band comparison easier over a phone call.
   */
  formatFingerprint(hex: string): string {
    return (hex.match(/.{1,5}/g) ?? [hex]).join(" ");
  },

  /** Generate a new ECDH P-256 key pair and persist it in localStorage. */
  async generateAndStoreKeyPair(): Promise<string> {
    const keyPair = await crypto.subtle.generateKey(KEY_ALGO, true, [
      "deriveKey",
      "deriveBits",
    ]);

    // Export public key as SPKI → base64
    const spki = await crypto.subtle.exportKey("spki", keyPair.publicKey);
    const pub64 = uint8ToBase64(spki);

    // Export private key as JWK → base64-encoded JSON
    const jwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);
    const priv64 = btoa(JSON.stringify(jwk));

    localStorage.setItem(LS_PUB_KEY, pub64);
    localStorage.setItem(LS_PRIV_KEY, priv64);

    return pub64;
  },

  /**
   * Register (or rotate) the calling user's public key with the backend.
   * Generates a new key pair if none exists locally.
   * Returns the fingerprint computed by the server.
   */
  async registerKey(): Promise<{ fingerprint: string; isNew: boolean }> {
    let pub64 = this.getStoredPublicKey();
    const isNew = !pub64;

    if (!pub64) {
      pub64 = await this.generateAndStoreKeyPair();
    }

    const deviceId = this.getDeviceId();
    const res = await apiClient.post<{
      keyId: string;
      algorithm: string;
      fingerprint: string;
      registeredAt: string;
    }>("/chat/keys/register", {
      publicKey: pub64,
      algorithm: "X25519",
      deviceId,
    });

    return {
      fingerprint: res.data?.fingerprint ?? "",
      isNew,
    };
  },

  /**
   * Rotate: generate a fresh key pair and re-register.
   * Triggers `key:rotated` socket events to all conversation participants.
   */
  async rotateKey(): Promise<{ fingerprint: string }> {
    await this.generateAndStoreKeyPair();
    const result = await this.registerKey();
    return { fingerprint: result.fingerprint };
  },

  /**
   * Revoke all active keys on the server and clear local keys.
   * Use after device loss or compromise.
   */
  async revokeAllKeys(): Promise<void> {
    await apiClient.delete("/chat/keys/revoke");
    localStorage.removeItem(LS_PUB_KEY);
    localStorage.removeItem(LS_PRIV_KEY);
  },

  // ─── Key Lookup ────────────────────────────────────────────────────────────

  /** Fetch another user's active key fingerprint (for display and comparison). */
  async getUserFingerprint(userId: string): Promise<{
    fingerprint: string;
    algorithm: string;
    publishedAt: string;
  } | null> {
    try {
      const res = await apiClient.get<{
        userId: string;
        fingerprint: string;
        algorithm: string;
        publishedAt: string;
      }>(`/chat/keys/${userId}/fingerprint`);
      return res.data ?? null;
    } catch {
      return null;
    }
  },

  // ─── Key Verification ─────────────────────────────────────────────────────

  /**
   * Record that the calling user has out-of-band verified a fingerprint.
   * The server validates that `fingerprint` matches the target's current active key
   * before storing the verification record.
   */
  async verifyUserKey(userId: string, fingerprint: string): Promise<void> {
    await apiClient.post(`/chat/keys/verify/${userId}`, { fingerprint });
  },

  /**
   * Check whether the calling user has verified the target's current key.
   * `fingerprintStillCurrent: false` means the target rotated after last verify.
   */
  async getVerificationStatus(userId: string): Promise<KeyVerificationStatus | null> {
    try {
      const res = await apiClient.get<KeyVerificationStatus>(
        `/chat/keys/verification-status/${userId}`,
      );
      return res.data ?? null;
    } catch {
      return null;
    }
  },
};
