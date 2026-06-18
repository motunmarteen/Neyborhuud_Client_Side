/**
 * Native camera/photo capture for the Capacitor build.
 *
 * On the web/PWA build this module's `pickNativePhotos` is a no-op (returns
 * null) so callers fall back to their existing `<input type="file">` flow. On
 * Android/iOS it opens the native camera/gallery prompt via @capacitor/camera
 * and returns standard `File` objects, so existing upload code that already
 * works with `File[]` from a file input needs no further change.
 *
 * @capacitor/camera is imported dynamically so the web bundle never loads it.
 */
import { isNativePlatform } from './platform';

type CapPhoto = {
  /** base64, present when resultType: 'base64'. */
  base64String?: string;
  /** file:// or data URI, present for other result types. */
  webPath?: string;
  dataUrl?: string;
  format: string; // 'jpeg' | 'png' | ...
};
type CapCameraPlugin = {
  getPhoto(options: Record<string, unknown>): Promise<CapPhoto>;
  pickImages(options: Record<string, unknown>): Promise<{ photos: CapPhoto[] }>;
  requestPermissions?(options?: {
    permissions?: Array<'camera' | 'photos'>;
  }): Promise<unknown>;
};

let cameraPromise: Promise<{
  Camera: CapCameraPlugin;
  CameraResultType: Record<string, string>;
  CameraSource: Record<string, string>;
}> | null = null;
function loadCamera() {
  if (!cameraPromise) {
    cameraPromise = import('@capacitor/camera').then((m) => ({
      Camera: m.Camera as unknown as CapCameraPlugin,
      CameraResultType: m.CameraResultType as unknown as Record<string, string>,
      CameraSource: m.CameraSource as unknown as Record<string, string>,
    }));
  }
  return cameraPromise;
}

function base64ToFile(base64: string, format: string, index = 0): File {
  const mime = format === 'png' ? 'image/png' : 'image/jpeg';
  const ext = format === 'png' ? 'png' : 'jpg';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], `photo-${Date.now()}-${index}.${ext}`, { type: mime });
}

export type NativePhotoSource = 'camera' | 'photos' | 'prompt';

/**
 * Capture/select photos natively and return them as `File[]`.
 *
 * Returns `null` on the web build (or if Capacitor camera is unavailable) so
 * the caller falls back to its existing file-input flow. Returns `[]` if the
 * user cancels. `multiple` only applies to the 'photos' / 'prompt' gallery path
 * — a single shot is returned when sourcing from the camera.
 */
export async function pickNativePhotos(opts?: {
  source?: NativePhotoSource;
  multiple?: boolean;
  quality?: number;
}): Promise<File[] | null> {
  if (!isNativePlatform()) return null;

  const source = opts?.source ?? 'prompt';
  const quality = opts?.quality ?? 80;

  try {
    const { Camera, CameraResultType, CameraSource } = await loadCamera();

    if (Camera.requestPermissions) {
      try {
        await Camera.requestPermissions({
          permissions: source === 'camera' ? ['camera'] : ['camera', 'photos'],
        });
      } catch {
        // Let getPhoto/pickImages surface the real failure below.
      }
    }

    // Multi-select from the gallery uses pickImages where available.
    if (opts?.multiple && source !== 'camera' && Camera.pickImages) {
      const res = await Camera.pickImages({ quality });
      const photos = res?.photos ?? [];
      const files: File[] = [];
      for (let i = 0; i < photos.length; i++) {
        const p = photos[i];
        const file = await photoToFile(p, i);
        if (file) files.push(file);
      }
      return files;
    }

    const srcEnum =
      source === 'camera'
        ? CameraSource.Camera
        : source === 'photos'
          ? CameraSource.Photos
          : CameraSource.Prompt;

    const photo = await Camera.getPhoto({
      quality,
      resultType: CameraResultType.Base64,
      source: srcEnum,
      allowEditing: false,
      saveToGallery: false,
    });

    const file = await photoToFile(photo, 0);
    return file ? [file] : [];
  } catch (e) {
    // User cancelled or permission denied — distinguish so callers can stay
    // silent on cancel. Capacitor throws 'User cancelled photos app' / similar.
    const msg = e instanceof Error ? e.message : String(e);
    if (/cancel/i.test(msg)) return [];
    // Unknown failure: fall back to the file input.
    console.warn('Native camera failed, falling back to file input:', msg);
    return null;
  }
}

async function photoToFile(photo: CapPhoto, index: number): Promise<File | null> {
  if (photo.base64String) {
    return base64ToFile(photo.base64String, photo.format, index);
  }
  // pickImages returns webPath rather than base64 — fetch it into a blob.
  const path = photo.webPath || photo.dataUrl;
  if (!path) return null;
  try {
    const res = await fetch(path);
    const blob = await res.blob();
    const ext = photo.format === 'png' ? 'png' : 'jpg';
    return new File([blob], `photo-${Date.now()}-${index}.${ext}`, {
      type: blob.type || 'image/jpeg',
    });
  } catch {
    return null;
  }
}

/** Whether native photo capture is available (i.e. running inside Capacitor). */
export function canUseNativeCamera(): boolean {
  return isNativePlatform();
}
