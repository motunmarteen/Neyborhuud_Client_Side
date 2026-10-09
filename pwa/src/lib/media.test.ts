import { describe, expect, it } from 'vitest';
import { cdnImage, cdnVideo, cdnVideoPoster, escapeAttr, isCloudinaryUrl, VIDEO_DELIVERY_TRANSFORM } from './media';
import imageLoader from './imageLoader';

const IMG = 'https://res.cloudinary.com/demo/image/upload/v1712345678/neyborhuud/posts/abc.jpg';
const VID = 'https://res.cloudinary.com/demo/video/upload/v1712345678/neyborhuud/posts/clip.mov';

describe('cdnImage', () => {
  it('requests auto format + quality at a capped, stepped width', () => {
    expect(cdnImage(IMG, 700)).toBe(
      'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_limit,w_828/v1712345678/neyborhuud/posts/abc.jpg',
    );
  });

  it('never exceeds the largest step', () => {
    expect(cdnImage(IMG, 5000)).toContain('w_1920');
  });

  it('leaves non-Cloudinary URLs untouched', () => {
    expect(cdnImage('/images/logo.png', 200)).toBe('/images/logo.png');
    expect(cdnImage('https://i.pravatar.cc/80', 200)).toBe('https://i.pravatar.cc/80');
  });

  it('is idempotent', () => {
    const once = cdnImage(IMG, 640);
    expect(cdnImage(once, 640)).toBe(once);
  });
});

describe('cdnVideo / cdnVideoPoster', () => {
  it('serves the light 720p H.264 MP4 rendition', () => {
    expect(cdnVideo(VID)).toBe(
      `https://res.cloudinary.com/demo/video/upload/${VIDEO_DELIVERY_TRANSFORM}/v1712345678/neyborhuud/posts/clip.mp4`,
    );
  });

  it('builds a JPEG poster from the first frame', () => {
    expect(cdnVideoPoster(VID, 600)).toBe(
      'https://res.cloudinary.com/demo/video/upload/so_0,f_auto,q_auto,c_limit,w_640/v1712345678/neyborhuud/posts/clip.jpg',
    );
  });

  it('ignores non-video URLs', () => {
    expect(cdnVideo(IMG)).toBe(IMG);
    expect(cdnVideoPoster(IMG)).toBeUndefined();
  });
});

describe('imageLoader', () => {
  it('routes Cloudinary images through the CDN transform', () => {
    expect(imageLoader({ src: IMG, width: 256 })).toContain('/image/upload/f_auto,q_auto,c_limit,w_256/');
  });

  it('honours an explicit quality', () => {
    expect(imageLoader({ src: IMG, width: 256, quality: 60 })).toContain('f_auto,q_60,');
  });

  it('passes other images through', () => {
    expect(imageLoader({ src: '/icon.png', width: 64 })).toBe('/icon.png');
  });
});

describe('helpers', () => {
  it('detects Cloudinary hosts only', () => {
    expect(isCloudinaryUrl(IMG)).toBe(true);
    expect(isCloudinaryUrl('https://evil.example/res.cloudinary.com/x.jpg')).toBe(false);
    expect(isCloudinaryUrl(undefined)).toBe(false);
  });

  it('escapes attribute values for HTML templates', () => {
    expect(escapeAttr('"><script>x</script>')).toBe('&quot;&gt;&lt;script&gt;x&lt;/script&gt;');
  });
});
