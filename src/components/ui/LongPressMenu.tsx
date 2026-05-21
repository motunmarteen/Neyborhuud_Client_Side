'use client';

import { motion, AnimatePresence } from 'framer-motion';

export interface LongPressMenuItem {
    id: string;
    label: string;
    icon: string;
    danger?: boolean;
    onSelect: () => void;
}

interface LongPressMenuProps {
    open: boolean;
    onClose: () => void;
    items: LongPressMenuItem[];
    anchor?: { x: number; y: number };
}

export function LongPressMenu({ open, onClose, items, anchor }: LongPressMenuProps) {
    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.button
                        type="button"
                        aria-label="Close menu"
                        className="fixed inset-0 z-[300] bg-brand-black/30 backdrop-blur-[2px] border-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    <motion.div
                        role="menu"
                        initial={{ opacity: 0, scale: 0.92, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 4 }}
                        transition={{ type: 'spring', damping: 26, stiffness: 380 }}
                        className="fixed z-[301] min-w-[200px] overflow-hidden rounded-2xl border border-white/25 bg-white/95 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl dark:bg-[rgba(12,18,24,0.92)]"
                        style={
                            anchor
                                ? {
                                      left: Math.min(anchor.x, typeof window !== 'undefined' ? window.innerWidth - 220 : anchor.x),
                                      top: Math.min(anchor.y, typeof window !== 'undefined' ? window.innerHeight - 280 : anchor.y),
                                  }
                                : { left: '50%', top: '40%', transform: 'translate(-50%, -50%)' }
                        }
                    >
                        {items.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                    item.onSelect();
                                    onClose();
                                }}
                                className={`flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors hover:bg-black/[0.04] active:scale-[0.98] ${
                                    item.danger ? 'text-brand-red' : 'text-brand-black dark:text-white'
                                }`}
                            >
                                <span className="material-symbols-outlined text-xl">{item.icon}</span>
                                {item.label}
                            </button>
                        ))}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
