/**
 * EditGossipModal Component
 * Modal for editing existing gossip posts
 */

'use client';

import { useState } from 'react';
import { GossipPost, UpdateGossipPayload, DiscussionType } from '@/types/gossip';

interface EditGossipModalProps {
    gossip: GossipPost;
    onClose: () => void;
    onSave: (payload: UpdateGossipPayload) => Promise<void>;
    isSubmitting?: boolean;
}

export function EditGossipModal({ gossip, onClose, onSave, isSubmitting = false }: EditGossipModalProps) {
    const [title, setTitle] = useState(gossip.title);
    const [body, setBody] = useState(gossip.body);
    const [discussionType, setDiscussionType] = useState(gossip.discussionType);
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState<string[]>(gossip.tags || []);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const payload: UpdateGossipPayload = {};
        if (title !== gossip.title) payload.title = title;
        if (body !== gossip.body) payload.body = body;
        if (discussionType !== gossip.discussionType) payload.discussion_type = discussionType;
        if (JSON.stringify(tags) !== JSON.stringify(gossip.tags)) payload.tags = tags;

        if (Object.keys(payload).length === 0) {
            onClose();
            return;
        }

        try {
            await onSave(payload);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to update. Please try again.');
        }
    };

    const addTag = () => {
        const tag = tagInput.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
        if (tag && !tags.includes(tag) && tags.length < 10) {
            setTags([...tags, tag]);
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter((t) => t !== tagToRemove));
    };

    const handleTagKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="neu-modal rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 neu-base px-6 py-4 flex items-center justify-between rounded-t-2xl" style={{ boxShadow: '0 2px 8px var(--neu-shadow-dark)' }}>
                    <h2 className="text-xl font-bold" style={{ color: 'var(--neu-text)' }}>Edit Discussion</h2>
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="neu-btn w-8 h-8 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined text-xl" style={{ color: 'var(--neu-text)' }}>close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 neu-socket rounded-xl text-red-400 text-sm">{error}</div>
                    )}

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--neu-text)' }}>Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl neu-input"
                            required
                            maxLength={100}
                            disabled={isSubmitting}
                        />
                        <p className="text-xs mt-1" style={{ color: 'var(--neu-text-muted)' }}>{title.length}/100</p>
                    </div>

                    {/* Body */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--neu-text)' }}>Description</label>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            rows={5}
                            className="w-full px-4 py-3 rounded-xl neu-input resize-none"
                            required
                            maxLength={1000}
                            disabled={isSubmitting}
                        />
                        <p className="text-xs mt-1" style={{ color: 'var(--neu-text-muted)' }}>{body.length}/1000</p>
                    </div>

                    {/* Discussion Type */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--neu-text)' }}>Discussion Type</label>
                        <select
                            value={discussionType}
                            onChange={(e) => setDiscussionType(e.target.value as DiscussionType)}
                            className="w-full px-4 py-3 rounded-xl neu-input"
                            disabled={isSubmitting}
                        >
                            <option value="general">General Discussion</option>
                            <option value="local_gist">Local Gist</option>
                            <option value="recommendation_request">Recommendation Request</option>
                            <option value="community_question">Community Question</option>
                            <option value="cultural_discussion">Cultural Discussion</option>
                            <option value="business_inquiry">Business Inquiry</option>
                            <option value="social_update">Social Update</option>
                        </select>
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--neu-text)' }}>
                            Tags <span className="font-normal" style={{ color: 'var(--neu-text-muted)' }}>({tags.length}/10)</span>
                        </label>
                        <div className="flex gap-2 flex-wrap mb-2">
                            {tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="px-2 py-1 text-xs rounded-lg text-primary neu-chip flex items-center gap-1"
                                >
                                    #{tag}
                                    <button
                                        type="button"
                                        onClick={() => removeTag(tag)}
                                        className="ml-1 hover:text-red-400"
                                        disabled={isSubmitting}
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                        {tags.length < 10 && (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={handleTagKeyDown}
                                    placeholder="Add a tag..."
                                    className="flex-1 px-3 py-2 rounded-xl neu-input text-sm"
                                    disabled={isSubmitting}
                                    maxLength={30}
                                />
                                <button
                                    type="button"
                                    onClick={addTag}
                                    disabled={!tagInput.trim() || isSubmitting}
                                    className="px-3 py-2 neu-btn rounded-xl text-sm text-primary disabled:opacity-50"
                                >
                                    Add
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-3 neu-btn rounded-2xl font-bold disabled:opacity-50"
                            style={{ color: 'var(--neu-text)' }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !title.trim() || !body.trim()}
                            className="flex-1 px-4 py-3 neu-btn-active rounded-2xl font-bold text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
