import React, { useState, useRef } from 'react';
import { useCommentMutations } from '@/hooks/useComments';
import { useAuth } from '@/hooks/useAuth';

interface CommentFormProps {
    postId: string;
    parentId?: string;
    onSuccess?: () => void;
    placeholder?: string;
    autoFocus?: boolean;
}

export const CommentForm: React.FC<CommentFormProps> = ({
    postId,
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
    const { user } = useAuth();
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
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

    return (
        <form onSubmit={handleSubmit} className="w-full">
            <div className="flex gap-3">
                <img
                    src={user?.avatarUrl || user?.profilePicture || 'https://i.pravatar.cc/100?u=user'}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0 neu-avatar"
                    alt="Current user"
                />
                <div className="flex-1 min-w-0">
                    <textarea
                        ref={textareaRef}
                        autoFocus={autoFocus}
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder={placeholder}
                        className="w-full bg-transparent border-none focus:ring-0 text-[16px] placeholder-[var(--neu-text-muted)] resize-none py-1.5 h-auto overflow-hidden min-h-[40px]"
                        style={{ color: 'var(--neu-text)' }}
                        rows={1}
                        onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = 'auto';
                            target.style.height = `${target.scrollHeight}px`;
                        }}
                        disabled={isCreating}
                    />

                    {/* Media Previews */}
                    {mediaUrls.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {mediaUrls.map((url, idx) => (
                                <div key={idx} className="relative group">
                                    <img
                                        src={url}
                                        className="w-20 h-20 object-cover rounded-lg neu-card-sm"
                                        alt="Preview"
                                        onError={(e) => {
                                            e.currentTarget.src = 'https://placehold.co/100x100?text=Invalid+Image';
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeMediaUrl(idx)}
                                        className="absolute -top-1.5 -right-1.5 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-black/80"
                                    >
                                        <span className="material-symbols-outlined text-xs">close</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Media URL Input */}
                    {showMediaInput && (
                        <div className="flex gap-2 mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                            <input
                                type="url"
                                value={tempUrl}
                                onChange={(e) => setTempUrl(e.target.value)}
                                placeholder="Paste image URL..."
                                className="flex-1 text-xs p-2 rounded-lg neu-input transition-all"
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMediaUrl())}
                            />
                            <button
                                type="button"
                                onClick={addMediaUrl}
                                className="text-xs neu-btn-active text-primary px-3 py-1 rounded-lg font-bold active:scale-95 transition-all"
                            >
                                Add
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowMediaInput(false)}
                                className="text-xs" style={{ color: 'var(--neu-text-muted)' }}
                            >
                                Cancel
                            </button>
                        </div>
                    )}

                    <div className="flex items-center justify-between mt-3 pt-3">
                        <div className="flex gap-1">
                            <button
                                type="button"
                                onClick={() => setShowMediaInput(!showMediaInput)}
                                className="w-8 h-8 rounded-xl flex items-center justify-center text-primary hover:bg-primary/10 transition-colors"
                                title="Add Media URL"
                                disabled={isCreating}
                            >
                                <span className="material-symbols-outlined text-[18px]">image</span>
                            </button>
                            <button
                                type="button"
                                className="w-8 h-8 rounded-xl flex items-center justify-center text-primary hover:bg-primary/10 transition-colors"
                                title="Emoji"
                                disabled={isCreating}
                            >
                                <span className="material-symbols-outlined text-[18px]">mood</span>
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={isCreating || (!body.trim() && mediaUrls.length === 0)}
                            className="neu-btn-active text-primary px-4 py-1.5 rounded-2xl text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
                        >
                            {isCreating ? (
                                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            ) : parentId ? 'Reply' : 'Post'}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
};
