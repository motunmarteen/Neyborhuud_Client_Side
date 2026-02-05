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
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    alt="Current user"
                />
                <div className="flex-1 min-w-0">
                    <textarea
                        ref={textareaRef}
                        autoFocus={autoFocus}
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder={placeholder}
                        className="w-full bg-transparent border-none focus:ring-0 text-[16px] text-gray-900 dark:text-gray-100 placeholder-gray-500 resize-none py-1.5 h-auto overflow-hidden min-h-[40px]"
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
                                        className="w-20 h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-800"
                                        alt="Preview"
                                        onError={(e) => {
                                            e.currentTarget.src = 'https://placehold.co/100x100?text=Invalid+Image';
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeMediaUrl(idx)}
                                        className="absolute -top-1.5 -right-1.5 bg-black/50 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-black/70"
                                    >
                                        <i className="bi bi-x text-xs" />
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
                                className="flex-1 text-xs p-2 border border-blue-500/30 rounded-lg bg-blue-50/10 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMediaUrl())}
                            />
                            <button
                                type="button"
                                onClick={addMediaUrl}
                                className="text-xs bg-blue-500 text-white px-3 py-1 rounded-lg font-bold hover:bg-blue-600 active:scale-95 transition-all"
                            >
                                Add
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowMediaInput(false)}
                                className="text-xs text-gray-500 hover:text-gray-700"
                            >
                                Cancel
                            </button>
                        </div>
                    )}

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex gap-1">
                            <button
                                type="button"
                                onClick={() => setShowMediaInput(!showMediaInput)}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                title="Add Media URL"
                                disabled={isCreating}
                            >
                                <i className="bi bi-image text-[16px]" />
                            </button>
                            <button
                                type="button"
                                className="w-8 h-8 rounded-full flex items-center justify-center text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                title="Emoji"
                                disabled={isCreating}
                            >
                                <i className="bi bi-emoji-smile text-[16px]" />
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={isCreating || (!body.trim() && mediaUrls.length === 0)}
                            className="bg-neon-green text-white px-4 py-1.5 rounded-full text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neon-green/90 active:scale-95 transition-all shadow-sm"
                        >
                            {isCreating ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : parentId ? 'Reply' : 'Post'}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
};
