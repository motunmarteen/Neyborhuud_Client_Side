/**
 * next/image custom loader (configured in next.config.ts).
 *
 * Cloudinary images are resized/compressed by Cloudinary's CDN
 * (f_auto,q_auto,w_<width>) — this works identically in the web build and
 * the static Capacitor build (where Next's own optimizer can't run), and it
 * means we never pay Vercel to re-optimise user uploads.
 *
 * Everything else (bundled /public assets, third-party avatars) is served
 * as-is.
 */
import { cdnImage, isCloudinaryUrl } from "./media";

type LoaderProps = { src: string; width: number; quality?: number };

export default function imageLoader({ src, width, quality }: LoaderProps): string {
  if (isCloudinaryUrl(src)) return cdnImage(src, width, quality ?? "auto");
  return src;
}
