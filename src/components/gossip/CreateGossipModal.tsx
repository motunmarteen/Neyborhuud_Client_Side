/**
 * CreateGossipModal Component
 * Modal for creating gossip posts with anonymity toggle
 */

'use client';

import { useState } from 'react';
import { gossipService } from '@/services/gossip.service';

interface CreateGossipModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function CreateGossipModal({ isOpen, onClose, onSuccess }: CreateGossipModalProps) {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(true);
    const [discussionType, setDiscussionType] = useState('general');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            await gossipService.createGossip({
                title,
                body,
                anonymous: isAnonymous,
                discussion_type: discussionType,
                tags: [],
            });

            // Success
            onSuccess();
            onClose();

            // Reset form
            setTitle('');
            setBody('');
            setIsAnonymous(true);
            setDiscussionType('general');
        } catch (err: any) {
            console.error('Failed to create gossip:', err);
            setError(err?.response?.data?.message || 'Failed to create post. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            onClose();
            setError(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="neu-modal rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 neu-base px-6 py-4 flex items-center justify-between rounded-t-2xl" style={{ boxShadow: '0 2px 8px var(--neu-shadow-dark)' }}>
                    <h2 className="text-xl font-bold" style={{ color: 'var(--neu-text)' }}>Start a Discussion</h2>
                    <button
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="neu-btn w-8 h-8 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined text-xl" style={{ color: 'var(--neu-text)' }}>close</span>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Error Message */}
                    {error && (
                        <div className="p-3 neu-socket rounded-xl text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--neu-text)' }}>
                            Title
                        </label>
                        <input
                            type="text"
                            placeholder="What's this about?"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl neu-input"
                            required
                            maxLength={100}
                            disabled={isSubmitting}
                        />
                        <p className="text-xs mt-1" style={{ color: 'var(--neu-text-muted)' }}>
                            {title.length}/100 characters
                        </p>
                    </div>

                    {/* Body */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--neu-text)' }}>
                            Description
                        </label>
                        <textarea
                            placeholder="Share your thoughts..."
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            rows={5}
                            className="w-full px-4 py-3 rounded-xl neu-input resize-none"
                            required
                            maxLength={1000}
                            disabled={isSubmitting}
                        />
                        <p className="text-xs mt-1" style={{ color: 'var(--neu-text-muted)' }}>
                            {body.length}/1000 characters
                        </p>
                    </div>

                    {/* Discussion Type */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--neu-text)' }}>
                            Discussion Type
                        </label>
                        <select
                            value={discussionType}
                            onChange={(e) => setDiscussionType(e.target.value)}
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

                    {/* Anonymous Toggle */}
                    <div className="neu-socket rounded-2xl p-4">
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isAnonymous}
                                onChange={(e) => setIsAnonymous(e.target.checked)}
                                className="w-5 h-5 mt-0.5 text-primary rounded focus:ring-primary accent-[var(--primary)]"
                                disabled={isSubmitting}
                            />
                            <div className="flex-1">
                                <div className="flex items-center gap-2 font-medium" style={{ color: 'var(--neu-text)' }}>
                                    <span className="material-symbols-outlined text-base">lock</span>
                                    <span>Post anonymously</span>
                                </div>
                                <p className="text-xs mt-1" style={{ color: 'var(--neu-text-muted)' }}>
                                    Your identity will be completely hidden. You&apos;ll appear as &quot;Anonymous Neighbor&quot;
                                </p>
                            </div>
                        </label>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-3 neu-btn rounded-2xl font-bold transition-colors disabled:opacity-50"
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
                                    Posting...
                                </>
                            ) : (
                                'Post'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
