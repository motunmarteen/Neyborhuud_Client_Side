/**
 * Media delivery + upload helpers.
 *
 * NeyborHuud is media-heavy and most residents are on mobile data, so:
 *  - DELIVERY: every Cloudinary image/video is requested through Cloudinary's
 *    CDN with automatic format (AVIF/WebP), automatic quality and a size
 *    capped to what the screen actually needs — never the camera original.
 *  - UPLOAD: photos are downscaled and re-encoded on the device before they
 *    leave the phone (less data, faster uploads), which also strips EXIF
 *    metadata such as the GPS location the photo was taken at.
 */

const CLOUDINARY_HOST = "res.cloudinary.com";

/** Widths we ever request — a small fixed set keeps the CDN cache hot. */
const WIDTH_STEPS = [64, 128, 256, 384, 640, 828, 1080, 1440, 1920];

function stepWidth(width: number): number {
  for (const w of WIDTH_STEPS) if (width <= w) return w;
  return WIDTH_STEPS[WIDTH_STEPS.length - 1];
}

export function isCloudinaryUrl(src: unknown): src is string {
  if (typeof src !== "string") return false;
  try {
    return new URL(src).hostname === CLOUDINARY_HOST;
  } catch {
    return false;
  }
}

/**
 * Insert a transformation right after `/<type>/upload/`.
 * Leaves the URL alone if it already starts with our transformation.
 */
function withTransformation(src: string, resource: "image" | "video", transformation: string): string {
  const marker = `/${resource}/upload/`;
  const i = src.indexOf(marker);
  if (i === -1) return src;
  const rest = src.slice(i + marker.length);
  if (rest.startsWith(transformation + "/")) return src;
  return `${src.slice(0, i + marker.length)}${transformation}/${rest}`;
}

/**
 * Optimised image URL: automatic format + quality, width capped to `width`
 * (rounded up to a fixed step). Non-Cloudinary URLs are returned unchanged.
 */
export function cdnImage(src: string, width = 1080, quality: number | "auto" = "auto"): string {
  if (!isCloudinaryUrl(src)) return src;
  const q = quality === "auto" ? "q_auto" : `q_${Math.max(1, Math.min(100, Math.round(quality)))}`;
  return withTransformation(src, "image", `f_auto,${q},c_limit,w_${stepWidth(width)}`);
}

/**
 * Must stay byte-identical to the backend's eager transformation
 * (NeyborHuud-ServerSide/src/utils/cloudinary.ts → VIDEO_DELIVERY_TRANSFORM)
 * so the pre-generated 720p rendition is served instead of re-encoding.
 */
export const VIDEO_DELIVERY_TRANSFORM = "c_limit,w_720,q_auto,vc_h264";

/** Light 720p H.264 MP4 rendition of a Cloudinary video (plays everywhere). */
export function cdnVideo(src: string): string {
  if (!isCloudinaryUrl(src) || !src.includes("/video/upload/")) return src;
  const transformed = withTransformation(src, "video", VIDEO_DELIVERY_TRANSFORM);
  return transformed.replace(/\.(mov|webm|mkv|avi|3gp|m4v|mp4)(\?.*)?$/i, ".mp4$2");
}

/** Small still frame for a Cloudinary video, used as the <video poster>. */
export function cdnVideoPoster(src: string, width = 640): string | undefined {
  if (!isCloudinaryUrl(src) || !src.includes("/video/upload/")) return undefined;
  const transformed = withTransformation(src, "video", `so_0,f_auto,q_auto,c_limit,w_${stepWidth(width)}`);
  return transformed.replace(/\.[a-z0-9]+(\?.*)?$/i, ".jpg$1");
}

// ── Upload-side compression ───────────────────────────────────────────────

const MAX_UPLOAD_DIMENSION = 2048;
const UPLOAD_QUALITY = 0.82;
/** Below this size a photo is already light — don't spend battery on it. */
const SKIP_BELOW_BYTES = 350 * 1024;

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Downscale + re-encode a photo on the device before upload.
 * Returns the original file untouched for non-photos, GIFs (animation),
 * small files, formats the browser can't decode, or if re-encoding would
 * not make it smaller. Never throws.
 */
export async function compressImageForUpload(file: File): Promise<File> {
  try {
    if (typeof window === "undefined" || typeof document === "undefined") return file;
    if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type.includes("svg")) return file;
    if (file.size < SKIP_BELOW_BYTES) return file;
    if (typeof createImageBitmap !== "function") return file;

    // imageOrientation keeps phone photos upright (EXIF rotation applied).
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
    const scale = Math.min(1, MAX_UPLOAD_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close?.();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    // WebP where supported (smaller); JPEG otherwise. Re-encoding drops EXIF.
    let blob = await canvasToBlob(canvas, "image/webp", UPLOAD_QUALITY);
    let type = "image/webp";
    if (!blob || blob.type !== "image/webp") {
      blob = await canvasToBlob(canvas, "image/jpeg", UPLOAD_QUALITY);
      type = "image/jpeg";
    }
    if (!blob || blob.size >= file.size) return file;

    const base = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${base}.${type === "image/webp" ? "webp" : "jpg"}`, {
      type,
      lastModified: Date.now(),
    });
  } catch {
    return file; // HEIC on Android Chrome etc. — the server still optimises it
  }
}

/** Compress every photo in a list (videos and other files pass through). */
export async function compressImagesForUpload(files: File[]): Promise<File[]> {
  return Promise.all(files.map((f) => compressImageForUpload(f)));
}

/** Escape a value for use inside an HTML attribute in a template string. */
export function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
