'use client';

import React, { useState, useRef, useEffect } from 'react';

interface AvatarAdjusterModalProps {
  file: File;
  onSave: (croppedFile: File) => void;
  onCancel: () => void;
}

export function AvatarAdjusterModal({ file, onSave, onCancel }: AvatarAdjusterModalProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [scale, setScale] = useState<number>(1.2);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Viewport aspect ratio matches MapPinAvatar (100 : 115)
  const VIEWPORT_WIDTH = 200;
  const VIEWPORT_HEIGHT = 230;

  useEffect(() => {
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, [file]);

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragStart.current = { x: clientX - offset.x, y: clientY - offset.y };
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    // Calculate new offsets
    let newX = clientX - dragStart.current.x;
    let newY = clientY - dragStart.current.y;

    // Apply basic bounding box constraints based on zoom scale
    if (imageRef.current && viewportRef.current) {
      const img = imageRef.current;
      const v = viewportRef.current;
      
      const imgW = img.naturalWidth;
      const imgH = img.naturalHeight;
      const aspect = imgW / imgH;

      let renderW = VIEWPORT_WIDTH * scale;
      let renderH = VIEWPORT_HEIGHT * scale;

      if (aspect > VIEWPORT_WIDTH / VIEWPORT_HEIGHT) {
        // Landscape or wider image
        renderH = VIEWPORT_HEIGHT * scale;
        renderW = renderH * aspect;
      } else {
        // Portrait or taller image
        renderW = VIEWPORT_WIDTH * scale;
        renderH = renderW / aspect;
      }

      const maxOffsetX = Math.max(0, (renderW - VIEWPORT_WIDTH) / 2);
      const maxOffsetY = Math.max(0, (renderH - VIEWPORT_HEIGHT) / 2);

      newX = Math.min(maxOffsetX, Math.max(-maxOffsetX, newX));
      newY = Math.min(maxOffsetY, Math.max(-maxOffsetY, newY));
    }

    setOffset({ x: newX, y: newY });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleSave = () => {
    if (!imageRef.current || !imageSrc) return;

    const img = imageRef.current;
    const canvas = document.createElement('canvas');
    // Output high resolution avatar (300 x 345)
    const outputWidth = 300;
    const outputHeight = 345;
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Calculate dimensions of the image relative to viewport
    const imgW = img.naturalWidth;
    const imgH = img.naturalHeight;
    const aspect = imgW / imgH;

    let renderW = VIEWPORT_WIDTH * scale;
    let renderH = VIEWPORT_HEIGHT * scale;

    if (aspect > VIEWPORT_WIDTH / VIEWPORT_HEIGHT) {
      renderH = VIEWPORT_HEIGHT * scale;
      renderW = renderH * aspect;
    } else {
      renderW = VIEWPORT_WIDTH * scale;
      renderH = renderW / aspect;
    }

    // Coordinates of viewport center relative to image rendering
    const cropXInViewport = (renderW - VIEWPORT_WIDTH) / 2 - offset.x;
    const cropYInViewport = (renderH - VIEWPORT_HEIGHT) / 2 - offset.y;

    // Convert those viewport crop coordinates back to natural image source space
    const scaleFactor = img.naturalWidth / renderW;
    const sourceX = cropXInViewport * scaleFactor;
    const sourceY = cropYInViewport * scaleFactor;
    const sourceWidth = VIEWPORT_WIDTH * scaleFactor;
    const sourceHeight = VIEWPORT_HEIGHT * scaleFactor;

    // Draw portion onto canvas
    ctx.drawImage(
      img,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      outputWidth,
      outputHeight
    );

    // Export canvas as Blob to File
    canvas.toBlob((blob) => {
      if (blob) {
        const croppedFile = new File([blob], file.name, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        onSave(croppedFile);
      }
    }, 'image/jpeg', 0.9);
  };

  if (!imageSrc) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white dark:bg-[#132218] shadow-2xl border border-black/5 dark:border-white/5 p-5 flex flex-col items-center">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Adjust Profile Photo</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-6">
          Drag your face to the center of the map pin, and use the slider to zoom.
        </p>

        {/* Viewport container with teardrop SVG mask */}
        <div 
          ref={viewportRef}
          className="relative overflow-hidden cursor-move touch-none flex items-center justify-center select-none"
          style={{ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT }}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        >
          <svg viewBox="0 0 200 230" className="absolute inset-0 w-full h-full select-none">
            <defs>
              <clipPath id="avatar-teardrop-clip">
                <path d="M100 12 C51.2 12 12 51.2 12 100 C12 163 100 218 100 218 C100 218 188 163 188 100 C188 51.2 148.8 12 100 12 Z" />
              </clipPath>
            </defs>

            {/* Draggable image inside foreignObject clipped to teardrop */}
            <g clipPath="url(#avatar-teardrop-clip)">
              <foreignObject x="0" y="0" width="200" height="230">
                <div className="w-full h-full flex items-center justify-center pointer-events-none">
                  <img
                    ref={imageRef}
                    src={imageSrc}
                    alt="Adjust preview"
                    className="max-w-none origin-center select-none"
                    style={{
                      transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    draggable={false}
                  />
                </div>
              </foreignObject>
            </g>

            {/* Dark semi-transparent background surrounding the teardrop */}
            <path 
              d="M0 0 H200 V230 H0 Z M100 12 C51.2 12 12 51.2 12 100 C12 163 100 218 100 218 C100 218 188 163 188 100 C188 51.2 148.8 12 100 12 Z" 
              fill="rgba(0,0,0,0.5)" 
              fillRule="evenodd"
            />

            {/* Teardrop border outline */}
            <path 
              d="M100 12 C51.2 12 12 51.2 12 100 C12 163 100 218 100 218 C100 218 188 163 188 100 C188 51.2 148.8 12 100 12 Z" 
              fill="none" 
              stroke="#ffffff" 
              strokeWidth="6" 
            />
          </svg>
        </div>

        {/* Zoom Control */}
        <div className="w-full mt-6 px-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-gray-400 text-lg">image</span>
          <input
            type="range"
            min="1.0"
            max="3.0"
            step="0.05"
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            className="flex-1 accent-primary h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
          />
          <span className="material-symbols-outlined text-gray-400 text-2xl">zoom_in</span>
        </div>

        {/* Action Buttons */}
        <div className="w-full mt-8 flex gap-3 px-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 text-sm font-semibold rounded-xl text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border border-gray-200 dark:border-white/5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-3 text-sm font-semibold rounded-xl text-white bg-primary hover:bg-primary/95 transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
          >
            Save Photo
          </button>
        </div>
      </div>
    </div>
  );
}
