'use client';

import React, { useState } from 'react';

interface StackedGalleryProps {
    images: string[];
}

export const StackedGallery: React.FC<StackedGalleryProps> = ({ images }) => {
    // deck: The current order of images. 
    // We shuffle by moving Top (index 0) -> Bottom (end)
    const [deck, setDeck] = useState(images.map((img, i) => ({ id: i, url: img })));
    const [isAnimating, setIsAnimating] = useState(false);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    // If no images, render nothing
    if (!images || images.length === 0) return null;

    // --- Actions ---

    const handleNext = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (isAnimating) return;

        setIsAnimating(true);
        // Animate fly-out
        setTimeout(() => {
            setDeck(prev => {
                const [first, ...rest] = prev;
                return [...rest, first];
            });
            setIsAnimating(false);
        }, 300);
    };

    const handlePrev = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (isAnimating) return;

        // "Undo": Take Last -> Move to Top
        // No fly-out animation needed for Undo, usually just appearing is fine
        // Or we can animate it fly-IN. For now, instant snap back is safer UI.
        setDeck(prev => {
            const last = prev[prev.length - 1];
            const rest = prev.slice(0, prev.length - 1);
            return [last, ...rest];
        });
    };

    const isVideo = (url: string) => {
        return url.match(/\.(mp4|webm|ogg)$/i);
    };

    // We only render the top 4 visually
    const visibleDeck = deck.slice(0, 4);
    const topCard = visibleDeck[0];

    // Current Index Calculation: 
    // Because we shuffle the array, we can't just use index 0. 
    // We tracked original ID. So (topCard.id + 1) is the current number.

    return (
        <div className="w-full px-6 py-4 flex flex-col gap-4">

            {/* The Deck */}
            <div
                className="relative w-full h-80 cursor-pointer group perspective-1000"
                onClick={handleNext} // Clicking empty space / photo still Nexts
            >
                {[...visibleDeck].reverse().map((item, reverseIdx) => {
                    const index = visibleDeck.length - 1 - reverseIdx; // 0 = Top
                    const isTop = index === 0;

                    let styleClass = "";
                    if (isTop) {
                        styleClass = `z-30 top-0 left-0 hover:-translate-y-1 transition-transform duration-300 shadow-2xl ${isAnimating ? 'animate-fly-out' : ''}`;
                    } else if (index === 1) {
                        styleClass = "z-20 top-2 left-2 scale-[0.98] -rotate-1 opacity-100 shadow-xl opacity-90";
                    } else if (index === 2) {
                        styleClass = "z-10 top-4 left-4 scale-[0.96] rotate-2 opacity-80 shadow-lg opacity-80";
                    } else {
                        styleClass = "z-0 top-6 left-6 scale-[0.94] opacity-0";
                    }

                    return (
                        <div
                            key={item.id}
                            className={`absolute w-full h-full rounded-none overflow-hidden bg-white dark:bg-surface-dark border border-white/40 dark:border-border-dark transition-all duration-500 ease-out-back ${styleClass}`}
                        >
                            {isVideo(item.url) ? (
                                <div
                                    className="w-full h-full relative bg-black"
                                    onClick={(e) => e.stopPropagation()} // STOP shuffle when clicking video container
                                >
                                    <video
                                        src={item.url}
                                        className="w-full h-full object-contain"
                                        controls // Native controls
                                        playsInline
                                    // Manual play only
                                    />
                                </div>
                            ) : (
                                <img src={item.url} alt="Gallery" className="w-full h-full object-cover pointer-events-none" />
                            )}

                            {/* Top Card Overlays for Image Only */}
                            {isTop && !isVideo(item.url) && (
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6 pointer-events-none">
                                    <span className="text-white text-xs font-light tracking-widest uppercase backdrop-blur-md px-3 py-1 bg-white/10 rounded-full border border-white/20">
                                        Tap to Shuffle
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Controls Bar (Safe Navigation) */}
            <div className="flex justify-between items-center px-2">

                {/* PREV (Undo) */}
                <button
                    onClick={handlePrev}
                    className="w-10 h-10 rounded-full glass flex items-center justify-center text-charcoal/60 dark:text-text-secondary-dark hover:text-brand-blue dark:hover:text-primary hover:bg-white dark:hover:bg-surface-dark active:scale-95 transition-all"
                    title="Previous"
                >
                    <i className="bi bi-arrow-counterclockwise text-lg"></i>
                </button>

                {/* Counter & Grid Link */}
                <div className="flex flex-col items-center gap-0.5" onClick={() => setLightboxOpen(true)}>
                    <span className="text-xs font-black tracking-widest text-charcoal dark:text-white cursor-pointer hover:text-brand-blue dark:hover:text-primary transition-colors">
                        {topCard.id + 1} <span className="text-charcoal/30 dark:text-text-secondary-dark/30">/</span> {images.length}
                    </span>
                    <span className="text-[8px] font-light uppercase tracking-widest text-charcoal/40 dark:text-text-secondary-dark/40 cursor-pointer">
                        View Grid
                    </span>
                </div>

                {/* NEXT (Shuffle) */}
                <button
                    onClick={handleNext}
                    className="w-10 h-10 rounded-full glass flex items-center justify-center text-charcoal/60 dark:text-text-secondary-dark hover:text-primary hover:bg-white dark:hover:bg-surface-dark active:scale-95 transition-all"
                    title="Next"
                >
                    <i className="bi bi-arrow-right text-lg"></i>
                </button>
            </div>

            {/* Grid Lightbox */}
            {lightboxOpen && (
                <Lightbox
                    images={images}
                    onClose={() => setLightboxOpen(false)}
                />
            )}
        </div>
    );
};

// Full Grid Lightbox
const Lightbox = ({ images, onClose }: { images: string[]; onClose: () => void }) => {
    const isVideo = (url: string) => url.match(/\.(mp4|webm|ogg)$/i);

    return (
        <div
            className="fixed inset-0 z-[100] bg-white/95 dark:bg-background-dark/95 backdrop-blur-xl flex flex-col p-4 animate-in fade-in duration-300"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-light tracking-tight text-charcoal dark:text-white">Gallery View</span>
                <button
                    onClick={onClose}
                    className="w-12 h-12 rounded-full bg-charcoal/5 dark:bg-surface-dark flex items-center justify-center hover:bg-charcoal/10 dark:hover:bg-surface-base-dark transition-colors"
                >
                    <i className="bi bi-x-lg text-xl text-charcoal dark:text-white"></i>
                </button>
            </div>

            <div className="flex-grow overflow-y-auto grid grid-cols-2 gap-2 pb-20">
                {images.map((img, idx) => (
                    <div key={idx} className="relative w-full aspect-square bg-charcoal/5 dark:bg-surface-dark overflow-hidden group">
                        {isVideo(img) ? (
                            <>
                                <video src={img} className="w-full h-full object-cover" muted />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                                    <i className="bi bi-play-circle-fill text-white text-3xl"></i>
                                </div>
                            </>
                        ) : (
                            <img src={img} alt={`Grid ${idx}`} className="w-full h-full object-cover" />
                        )}
                        <div className="absolute top-2 left-2 bg-black/20 text-white text-[8px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm">
                            {idx + 1}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
