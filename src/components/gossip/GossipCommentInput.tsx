/**
 * GossipCommentInput Component
 * Comment creation with anonymous toggle for gossip discussions
 */

'use client';

import { useState } from 'react';

interface GossipCommentInputProps {
    onSubmit: (body: string, anonymous: boolean, parentId?: string) => Promise<void>;
    parentId?: string;
    placeholder?: string;
    isSubmitting?: boolean;
    autoFocus?: boolean;
    onCancel?: () => void;
    submitLabel?: string;
}

export function GossipCommentInput({
    onSubmit,
    parentId,
    placeholder = 'Add a comment...',
    isSubmitting = false,
    autoFocus = false,
    onCancel,
    submitLabel,
}: GossipCommentInputProps) {
    const [body, setBody] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!body.trim() || isSubmitting) return;

        await onSubmit(body.trim(), isAnonymous, parentId);
        setBody('');
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-2">
            <div className="flex gap-2">
                <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder={placeholder}
                    rows={2}
                    maxLength={500}
                    disabled={isSubmitting}
                    autoFocus={autoFocus}
                    className="flex-1 px-3 py-2 rounded-xl neu-input text-sm resize-none"
                    style={{ color: 'var(--neu-text)' }}
                />
            </div>

            <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="w-4 h-4 rounded accent-[var(--primary)]"
                        disabled={isSubmitting}
                    />
                    <span className="text-xs flex items-center gap-1" style={{ color: 'var(--neu-text-muted)' }}>
                        <span className="material-symbols-outlined text-xs">lock</span>
                        Anonymous
                    </span>
                </label>

                <div className="flex items-center gap-2">
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-3 py-1.5 text-xs rounded-lg transition-colors"
                            style={{ color: 'var(--neu-text-muted)' }}
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={isSubmitting || !body.trim()}
                        className="px-4 py-1.5 neu-btn-active rounded-xl text-xs font-bold text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                Posting...
                            </>
                        ) : (
                            submitLabel ?? (parentId ? 'Reply' : 'Post')
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
}
