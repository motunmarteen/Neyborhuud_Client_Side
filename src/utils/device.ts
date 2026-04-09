/**
 * Device Utilities for NeyborHuud
 * Handles device identification and info for authentication
 */

const DEVICE_ID_KEY = "neyborhuud_device_id";

export interface DeviceInfo {
  deviceId: string;
  platform: "ios" | "android" | "web";
  deviceName: string;
}

/**
 * Get or generate a unique device ID
 * This ID persists forever, even after logout
 */
export function getDeviceId(): string {
  if (typeof window === "undefined") return "";

  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

/**
 * Get browser name from user agent
 */
function getBrowserName(): string {
  if (typeof navigator === "undefined") return "Browser";

  const ua = navigator.userAgent;
  if (ua.includes("Edg")) return "Edge";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari")) return "Safari";
  if (ua.includes("Opera") || ua.includes("OPR")) return "Opera";
  return "Browser";
}

/**
 * Get OS name from user agent
 */
function getOSName(): string {
  if (typeof navigator === "undefined") return "Unknown";

  const ua = navigator.userAgent;
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac")) return "macOS";
  if (ua.includes("Linux")) return "Linux";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iOS") || ua.includes("iPhone") || ua.includes("iPad"))
    return "iOS";
  return "Unknown";
}

/**
 * Get complete device info for login requests
 */
export function getDeviceInfo(): DeviceInfo {
  return {
    deviceId: getDeviceId(),
    platform: "web",
    deviceName: `${getBrowserName()} on ${getOSName()}`,
  };
}
