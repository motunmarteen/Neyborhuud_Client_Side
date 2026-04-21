/**
 * CreateGossipModal Component
 * Modal for creating gossip posts with anonymity toggle, tag input, and media upload
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { gossipService } from '@/services/gossip.service';
import { DiscussionType } from '@/types/gossip';
import apiClient from '@/lib/api-client';

interface CreateGossipModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    /** When set (non-"all" tab), the discussion type is locked and the dropdown is hidden */
    defaultDiscussionType?: DiscussionType;
}

export function CreateGossipModal({ isOpen, onClose, onSuccess, defaultDiscussionType }: CreateGossipModalProps) {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [discussionType, setDiscussionType] = useState<DiscussionType>(defaultDiscussionType ?? 'general');
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync discussion type whenever the modal opens or the locked type changes
    useEffect(() => {
        if (isOpen) {
            setDiscussionType(defaultDiscussionType ?? 'general');
        }
    }, [isOpen, defaultDiscussionType]);

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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const combined = [...selectedFiles, ...files].slice(0, 4);
        setSelectedFiles(combined);
        // Reset input so same file can be re-added after removal
        e.target.value = '';
    };

    const removeFile = (index: number) => {
        setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !body.trim()) return;
        setIsSubmitting(true);
        setError(null);

        try {
            let mediaUrls: string[] = [];

            if (selectedFiles.length > 0) {
                const uploadRes = await apiClient.uploadFiles<{ files: { url: string }[] }>(
                    '/media/upload',
                    selectedFiles,
                );
                mediaUrls = (uploadRes.data?.files || []).map((f) => f.url);
            }

            await gossipService.createGossip({
                title: title.trim(),
                body: body.trim(),
                anonymous: isAnonymous,
                discussion_type: discussionType,
                tags,
                mediaUrls,
            });

            onSuccess();
            onClose();

            // Reset form
            setTitle('');
            setBody('');
            setIsAnonymous(false);
            setDiscussionType(defaultDiscussionType ?? 'general');
            setTags([]);
            setTagInput('');
            setSelectedFiles([]);
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
                            disabled={isSubmitting}
                        />
                        <p className="text-xs mt-1" style={{ color: 'var(--neu-text-muted)' }}>
                            {body.length} characters
                        </p>
                    </div>

                    {/* Discussion Type — only shown on "All" tab */}
                    {!defaultDiscussionType && (
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--neu-text)' }}>
                            Discussion Type
                        </label>
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
                    )}

                    {/* Media Upload */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--neu-text)' }}>
                            Photos / Videos <span className="font-normal" style={{ color: 'var(--neu-text-muted)' }}>({selectedFiles.length}/4, optional)</span>
                        </label>

                        {selectedFiles.length > 0 && (
                            <div className="grid grid-cols-4 gap-2 mb-2">
                                {selectedFiles.map((file, i) => (
                                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden neu-socket">
                                        {file.type.startsWith('video/') ? (
                                            <div className="w-full h-full flex items-center justify-center bg-black/20">
                                                <span className="material-symbols-outlined text-2xl" style={{ color: 'var(--neu-text-muted)' }}>videocam</span>
                                            </div>
                                        ) : (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt={`media ${i + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => removeFile(i)}
                                            disabled={isSubmitting}
                                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center text-white hover:bg-black/90"
                                        >
                                            <span className="material-symbols-outlined text-[12px]">close</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {selectedFiles.length < 4 && (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isSubmitting}
                                className="w-full py-3 neu-btn rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                                style={{ color: 'var(--neu-text-muted)' }}
                            >
                                <span className="material-symbols-outlined text-[20px]">add_photo_alternate</span>
                                Add Photos or Videos
                            </button>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            className="hidden"
                            onChange={handleFileChange}
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--neu-text)' }}>
                            Tags <span className="font-normal" style={{ color: 'var(--neu-text-muted)' }}>({tags.length}/10, optional)</span>
                        </label>
                        {tags.length > 0 && (
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
                                            &times;
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                        {tags.length < 10 && (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={handleTagKeyDown}
                                    placeholder="Type a tag and press Enter..."
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
                                    {selectedFiles.length > 0 ? 'Uploading…' : 'Posting…'}
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
