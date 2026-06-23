import React, { useState, useRef } from 'react';
import { useCommentMutations } from '@/hooks/useComments';
import { useAuth } from '@/hooks/useAuth';
import { usePostMutations } from '@/hooks/usePosts';
import type { Post } from '@/types/api';

const QUICK_EMOJIS = ['❤️', '🙌', '🔥', '👏', '😢', '😍', '😮', '😂'];

interface CommentFormProps {
    postId: string;
    post?: Post;
    parentId?: string;
    onSuccess?: () => void;
    placeholder?: string;
    autoFocus?: boolean;
}

export const CommentForm: React.FC<CommentFormProps> = ({
    postId,
    post,
    parentId,
    onSuccess,
    placeholder = "Post your reply",
    autoFocus = false
}) => {
    const [body, setBody] = useState('');
    const [mediaUrls, setMediaUrls] = useState<string[]>([]);
    const [showMediaInput, setShowMediaInput] = useState(false);
    const [tempUrl, setTempUrl] = useState('');
    const { createComment, isCreating } = useCommentMutations(postId);
    const { isUpdating } = usePostMutations();
    const { user } = useAuth();
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleEmergencyAction = async (actionKey: string) => {
        if (!post?.id || isUpdating || isCreating) return;

        let commentText = '';
        if (actionKey === 'aware') commentText = '[STATUS:AWARE]';
        else if (actionKey === 'nearby') commentText = '[STATUS:NEARBY]';
        else if (actionKey === 'safe') commentText = '[STATUS:SAFE]';
        else if (actionKey === 'confirm') commentText = '[STATUS:CONFIRM]';
        else if (actionKey === 'dispute') commentText = '[STATUS:DISPUTE]';

        if (commentText) {
            try {
                await createComment({ body: commentText, parentId });
                setBody('');
                onSuccess?.();
            } catch (error) {
                console.error('Failed to post auto-comment', error);
            }
        }
    };

    const emergencyActionDefs = post?.contentType === 'emergency' && !parentId ? [
        { key: 'aware', icon: 'notifications_active', label: 'Aware', active: post.isAware, colorClass: 'text-brand-blue', bgClass: 'bg-brand-blue/10', borderClass: 'border-brand-blue/20', accentClass: 'bg-brand-blue/40' },
        { key: 'nearby', icon: 'location_on', label: 'Nearby', active: post.isNearby, colorClass: 'text-brand-red', bgClass: 'bg-brand-red/10', borderClass: 'border-brand-red/20', accentClass: 'bg-brand-red/40' },
        { key: 'safe', icon: 'shield', label: 'Safe', active: post.isSafe, colorClass: 'text-brand-green', bgClass: 'bg-brand-green/10', borderClass: 'border-brand-green/20', accentClass: 'bg-brand-green/40' },
        { key: 'confirm', icon: 'check_circle', label: 'Confirm', active: post.confirmDisputeAction === 'confirm', colorClass: 'text-primary', bgClass: 'bg-primary/10', borderClass: 'border-primary/20', accentClass: 'bg-primary/40' },
        { key: 'dispute', icon: 'cancel', label: 'Dispute', active: post.confirmDisputeAction === 'dispute', colorClass: 'text-brand-red', bgClass: 'bg-brand-red/10', borderClass: 'border-brand-red/20', accentClass: 'bg-brand-red/40' },
    ].filter(a => !post.availableActions || post.availableActions.includes(a.key)) : [];

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (!body.trim() && mediaUrls.length === 0) return;

        try {
            await createComment({
                body: body.trim(),
                mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
                parentId
            });
            setBody('');
            setMediaUrls([]);
            onSuccess?.();
        } catch (error) {
            console.error('Comment error:', error);
        }
    };

    const addMediaUrl = () => {
        if (tempUrl.trim()) {
            setMediaUrls([...mediaUrls, tempUrl.trim()]);
            setTempUrl('');
            setShowMediaInput(false);
        }
    };

    const removeMediaUrl = (idx: number) => {
        setMediaUrls(mediaUrls.filter((_, i) => i !== idx));
    };

    const insertEmoji = (emoji: string) => {
        setBody((prev) => prev + emoji);
        textareaRef.current?.focus();
    };

    return (
        <form onSubmit={handleSubmit} className="w-full">
            <div className="flex gap-3">
                <div className="mt-0.5 shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-[1.5px] border-white/60 dark:border-white/10 bg-white dark:bg-[#1A221C] shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
                        {user?.avatarUrl || user?.profilePicture ? (
                            <img 
                                src={user.avatarUrl || user.profilePicture} 
                                alt="Current user" 
                                className="w-full h-full object-cover" 
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center');
                                    e.currentTarget.parentElement!.innerHTML = '<span class="material-symbols-outlined text-[16px] opacity-50">person</span>';
                                }}
                            />
                        ) : (
                            <span className="material-symbols-outlined text-[16px] opacity-50">person</span>
                        )}
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    {/* Premium Quick Status Row */}
                    {emergencyActionDefs.length > 0 && (
                        <div className="mb-3">
                            <div className="flex items-center justify-between mb-2.5">
                                <span className="text-[10px] font-extrabold text-[var(--neu-text-secondary)] uppercase tracking-widest flex items-center gap-1.5 opacity-80">
                                    <span className="material-symbols-outlined text-[14px]">bolt</span>
                                    Quick Status Update
                                </span>
                            </div>
                            <div 
                                className="flex overflow-x-auto gap-2.5 pb-2.5 -mx-4 px-4" 
                                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
                            >
                                <style dangerouslySetInnerHTML={{__html: `
                                    .custom-hide-scrollbar::-webkit-scrollbar { display: none; }
                                `}} />
                                {emergencyActionDefs.map(a => {
                                    const isActive = a.active;
                                    return (
                                        <button
                                            key={a.key}
                                            type="button"
                                            disabled={isUpdating || isCreating}
                                            onClick={() => handleEmergencyAction(a.key)}
                                            className={`flex-shrink-0 relative overflow-hidden group flex flex-col items-center justify-center w-[76px] h-[84px] rounded-2xl border transition-all duration-300 disabled:opacity-50 active:scale-95 ${
                                                isActive 
                                                    ? `${a.bgClass} ${a.borderClass} shadow-sm` 
                                                    : 'bg-[var(--neu-bg)] border-black/5 dark:border-white/5 hover:bg-black/[0.03] dark:hover:bg-white/[0.03]'
                                            }`}
                                        >
                                            {isActive && (
                                                <div className={`absolute top-0 left-0 right-0 h-1 ${a.accentClass}`} />
                                            )}
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-1.5 transition-colors ${
                                                isActive ? `${a.bgClass} ${a.colorClass}` : 'bg-black/5 dark:bg-white/5 text-[var(--neu-text-secondary)] group-hover:bg-black/10 dark:group-hover:bg-white/10'
                                            }`}>
                                                <span className="material-symbols-outlined text-[20px]">{a.icon}</span>
                                            </div>
                                            <span className={`text-[11px] font-bold tracking-tight ${isActive ? a.colorClass : 'text-[var(--neu-text)]'}`}>
                                                {a.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="h-px w-full bg-gradient-to-r from-black/5 via-black/10 to-transparent dark:from-white/5 dark:via-white/10 mt-1.5 mb-2" />
                        </div>
                    )}

                    {/* Media Previews */}
                    {mediaUrls.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-2">
                            {mediaUrls.map((url, idx) => (
                                <div key={idx} className="group relative">
                                    <img
                                        src={url}
                                        className="h-20 w-20 rounded-lg object-cover neu-card-sm"
                                        alt="Preview"
                                        onError={(e) => {
                                            e.currentTarget.src = 'https://placehold.co/100x100?text=Invalid+Image';
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeMediaUrl(idx)}
                                        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                                    >
                                        <span className="material-symbols-outlined text-xs">close</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Media URL Input */}
                    {showMediaInput && (
                        <div className="mb-2 flex gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                            <input
                                type="url"
                                value={tempUrl}
                                onChange={(e) => setTempUrl(e.target.value)}
                                placeholder="Paste image URL..."
                                className="neu-input flex-1 rounded-lg p-2 text-xs text-[var(--neu-text)] transition-all placeholder:text-[var(--neu-text-muted)]"
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMediaUrl())}
                            />
                            <button
                                type="button"
                                onClick={addMediaUrl}
                                className="mod-chip mod-chip-active rounded-lg px-3 py-1 text-xs font-bold text-primary transition-all active:scale-95"
                            >
                                Add
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowMediaInput(false)}
                                className="text-xs text-[var(--neu-text-muted)] transition-colors hover:text-[var(--neu-text)]"
                            >
                                Cancel
                            </button>
                        </div>
                    )}

                    {/* Instagram-style quick emoji row (top-level comments only) */}
                    {!parentId && (
                        <div className="-mx-1 mb-2 flex items-center gap-1 overflow-x-auto px-1 pb-0.5" style={{ scrollbarWidth: 'none' }}>
                            {QUICK_EMOJIS.map((emoji) => (
                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => insertEmoji(emoji)}
                                    disabled={isCreating}
                                    className="flex-shrink-0 rounded-full px-1.5 py-0.5 text-[20px] leading-none transition-transform hover:bg-black/5 active:scale-90 disabled:opacity-50 dark:hover:bg-white/5"
                                    aria-label={`Add ${emoji}`}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Pill input — Facebook/Instagram hybrid */}
                    <div className="flex items-end gap-2 rounded-[24px] border border-black/[0.06] bg-black/[0.03] px-2 py-1 transition-all focus-within:border-black/10 dark:border-white/[0.06] dark:bg-white/[0.04] dark:focus-within:border-white/15">
                        <label htmlFor="comment-input" className="sr-only">Write a comment</label>
                        <textarea
                            id="comment-input"
                            ref={textareaRef}
                            autoFocus={autoFocus}
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit(e);
                                }
                            }}
                            placeholder={placeholder}
                            aria-label="Write a comment"
                            className="max-h-[120px] min-h-[36px] flex-1 resize-none border-none bg-transparent py-2 pl-2 text-[15px] text-[var(--neu-text)] placeholder:text-[var(--neu-text-muted)] focus:outline-none focus:ring-0"
                            rows={1}
                            onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = 'auto';
                                target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                            }}
                            disabled={isCreating}
                        />

                        <div className="flex flex-shrink-0 items-center gap-0.5 pb-1">
                            <button
                                type="button"
                                onClick={() => setShowMediaInput(!showMediaInput)}
                                className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--neu-text-secondary)] transition-colors hover:bg-black/5 hover:text-primary dark:hover:bg-white/5"
                                title="Add photo"
                                disabled={isCreating}
                            >
                                <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                            </button>

                            {(body.trim() || mediaUrls.length > 0) ? (
                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="flex h-8 w-8 items-center justify-center rounded-full text-primary transition-all hover:bg-primary/10 active:scale-90 disabled:opacity-50"
                                    aria-label={parentId ? 'Send reply' : 'Post comment'}
                                >
                                    {isCreating ? (
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                    ) : (
                                        <span className="material-symbols-outlined text-[20px] fill-1">send</span>
                                    )}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--neu-text-secondary)] transition-colors hover:bg-black/5 hover:text-primary dark:hover:bg-white/5"
                                    title="Sticker"
                                    disabled={isCreating}
                                >
                                    <span className="material-symbols-outlined text-[20px]">sentiment_satisfied</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
};
