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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Start a Discussion</h2>
                    <button
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors disabled:opacity-50"
                    >
                        <i className="bi bi-x text-2xl" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Error Message */}
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Title
                        </label>
                        <input
                            type="text"
                            placeholder="What's this about?"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-green bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            required
                            maxLength={100}
                            disabled={isSubmitting}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {title.length}/100 characters
                        </p>
                    </div>

                    {/* Body */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Description
                        </label>
                        <textarea
                            placeholder="Share your thoughts..."
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            rows={5}
                            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-green resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            required
                            maxLength={1000}
                            disabled={isSubmitting}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {body.length}/1000 characters
                        </p>
                    </div>

                    {/* Discussion Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Discussion Type
                        </label>
                        <select
                            value={discussionType}
                            onChange={(e) => setDiscussionType(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-green bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
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
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isAnonymous}
                                onChange={(e) => setIsAnonymous(e.target.checked)}
                                className="w-5 h-5 mt-0.5 text-neon-green rounded focus:ring-neon-green"
                                disabled={isSubmitting}
                            />
                            <div className="flex-1">
                                <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-gray-100">
                                    <i className="bi bi-incognito" />
                                    <span>Post anonymously</span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Your identity will be completely hidden. You'll appear as "Anonymous Neighbor"
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
                            className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-full font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 text-gray-900 dark:text-gray-100"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !title.trim() || !body.trim()}
                            className="flex-1 px-4 py-3 bg-neon-green text-white rounded-full font-bold hover:bg-neon-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
