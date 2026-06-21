'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type PostCardMediaItem = {
  url: string;
  type?: 'video' | 'image' | string;
  thumbnailUrl?: string;
};

type PostCardMediaSliderProps = {
  items: PostCardMediaItem[];
  altPrefix?: string;
  className?: string;
  compact?: boolean;
};

export const isVideoMedia = (item: PostCardMediaItem) =>
  item.type === 'video' || /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(item.url);

export function PostCardMediaSlider({
  items,
  altPrefix = 'Post media',
  className = '',
  compact = false,
}: PostCardMediaSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedUrls, setFailedUrls] = useState<Set<string>>(() => new Set());
  const [mutedVideos, setMutedVideos] = useState<Record<number, boolean>>({});

  const count = items.length;
  const useDuoGrid = count === 2 && items.every((item) => !isVideoMedia(item));
  const isCarousel = count > 1 && !useDuoGrid;

  const syncActiveIndex = useCallback(() => {
    const track = trackRef.current;
    if (!track || !isCarousel) return;

    const slides = Array.from(track.querySelectorAll<HTMLElement>('.post-card-media-slider__slide'));
    if (slides.length === 0) return;

    const scrollLeft = track.scrollLeft;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    slides.forEach((slide, index) => {
      const distance = Math.abs(slide.offsetLeft - scrollLeft);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    setActiveIndex(closestIndex);
  }, [isCarousel]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !isCarousel) return;

    syncActiveIndex();
    track.addEventListener('scroll', syncActiveIndex, { passive: true });
    return () => track.removeEventListener('scroll', syncActiveIndex);
  }, [isCarousel, syncActiveIndex]);

  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (index === activeIndex) {
        video.play().catch(() => {});
      } else {
        video.pause();
        video.currentTime = 0;
      }
    });
  }, [activeIndex]);

  if (count === 0) return null;

  const stopCardClick = (e: React.SyntheticEvent) => e.stopPropagation();

  const renderImage = (item: PostCardMediaItem, index: number, alt: string) => {
    if (failedUrls.has(item.url)) {
      return (
        <div className="post-card-media-slider__fallback" aria-hidden>
          <span className="material-symbols-outlined text-[28px] text-white/50">broken_image</span>
        </div>
      );
    }

    return (
      <img
        src={item.url}
        alt={alt}
        className="post-card-media-slider__media"
        loading={index === 0 ? 'eager' : 'lazy'}
        draggable={false}
        onError={() => {
          setFailedUrls((prev) => {
            const next = new Set(prev);
            next.add(item.url);
            return next;
          });
        }}
      />
    );
  };

  const renderVideo = (item: PostCardMediaItem, index: number, showControls: boolean) => {
    const muted = mutedVideos[index] ?? true;

    return (
      <>
        <video
          ref={(el) => {
            if (el) videoRefs.current.set(index, el);
            else videoRefs.current.delete(index);
          }}
          src={item.url}
          poster={item.thumbnailUrl}
          className="post-card-media-slider__media post-card-media-slider__media--video"
          muted={muted}
          loop
          playsInline
          autoPlay={index === activeIndex}
          preload={index <= 1 ? 'metadata' : 'none'}
          aria-label={`${altPrefix} video ${index + 1}`}
        />
        {showControls && (
          <button
            type="button"
            className="post-card-media-slider__mute-btn"
            onClick={(e) => {
              e.stopPropagation();
              setMutedVideos((prev) => ({ ...prev, [index]: !muted }));
            }}
            aria-label={muted ? 'Unmute video' : 'Mute video'}
          >
            <span className="material-symbols-outlined text-[16px]">
              {muted ? 'volume_off' : 'volume_up'}
            </span>
          </button>
        )}
      </>
    );
  };

  if (useDuoGrid) {
    return (
      <div
        className={`post-card-media-slider post-card-media-slider--duo${compact ? ' post-card-media-slider--compact' : ''} ${className}`.trim()}
        onClick={stopCardClick}
      >
        <div className="post-card-media-slider__duo-grid" aria-label={`${altPrefix}, 2 images`}>
          {items.map((item, index) => (
            <div key={`${item.url}-${index}`} className="post-card-media-slider__duo-cell">
              {renderImage(item, index, `${altPrefix} ${index + 1}`)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`post-card-media-slider ${isCarousel ? 'post-card-media-slider--carousel' : 'post-card-media-slider--single'}${compact ? ' post-card-media-slider--compact' : ''} ${className}`.trim()}
      onClick={stopCardClick}
    >
      <div
        ref={trackRef}
        className="post-card-media-slider__track"
        role={isCarousel ? 'group' : undefined}
        aria-roledescription={isCarousel ? 'carousel' : undefined}
        aria-label={isCarousel ? `${altPrefix}, ${count} items` : undefined}
      >
        {items.map((item, index) => {
          const isVideo = isVideoMedia(item);
          const isActive = index === activeIndex;

          return (
            <div
              key={`${item.url}-${index}`}
              className="post-card-media-slider__slide"
              role={isCarousel ? 'group' : undefined}
              aria-roledescription={isCarousel ? 'slide' : undefined}
              aria-label={isCarousel ? `${index + 1} of ${count}` : undefined}
            >
              <div className="post-card-media-slider__frame">
                {isVideo
                  ? renderVideo(item, index, !isCarousel || isActive)
                  : renderImage(item, index, `${altPrefix} ${index + 1}`)}
              </div>
            </div>
          );
        })}
      </div>

      {isCarousel && (
        <>
          <div className="post-card-media-slider__counter" aria-live="polite">
            {activeIndex + 1}/{count}
          </div>

          <div className="post-card-media-slider__dots" role="tablist" aria-label="Media slides">
            {items.map((_, index) => (
              <button
                key={index}
                type="button"
                role="tab"
                aria-selected={index === activeIndex}
                aria-label={`Go to slide ${index + 1}`}
                className={`post-card-media-slider__dot${index === activeIndex ? ' post-card-media-slider__dot--active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  const track = trackRef.current;
                  const slide = track?.children[index] as HTMLElement | undefined;
                  slide?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
                }}
              />
            ))}
          </div>

        </>
      )}
    </div>
  );
}
