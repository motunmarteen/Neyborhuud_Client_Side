'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePostMutations } from '@/hooks/usePosts';
import { getCurrentLocation } from '@/lib/geolocation';
import { CreatePostPayload } from '@/types/api';

interface CreatePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const SUCCESS_DISPLAY_MS = 1400;

export function CreatePostModal({ isOpen, onClose, onSuccess }: CreatePostModalProps) {
    const [content, setContent] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [postType, setPostType] = useState<'text' | 'image'>('text');
    const [category, setCategory] = useState<string>('');
    const [visibility, setVisibility] = useState<'public' | 'neighborhood' | 'ward'>('public');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { createPost } = usePostMutations();

    // After success state, close and notify after a short delay
    useEffect(() => {
        if (!showSuccess) return;
        const t = setTimeout(() => {
            setShowSuccess(false);
            onSuccess?.();
            onClose();
        }, SUCCESS_DISPLAY_MS);
        return () => clearTimeout(t);
    }, [showSuccess, onSuccess, onClose]);

    if (!isOpen) return null;

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            setSelectedFiles(files);
            setPostType('image');
        }
    };

    const handleRemoveFile = (index: number) => {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
        if (selectedFiles.length === 1) {
            setPostType('text');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() && selectedFiles.length === 0) return;

        setIsSubmitting(true);
        setUploadProgress(0);

        // Extract tags from content (hashtags) - moved outside try for error logging
        const hashtags = content.match(/#\w+/g) || [];
        const extractedTags = hashtags.map((tag) => tag.substring(1));
        if (category) {
            extractedTags.push(category.toLowerCase());
        }

        try {
            // Get user location
            const userLocation = await getCurrentLocation();

            const payload: CreatePostPayload = {
                type: postType === 'image' && selectedFiles.length > 0 ? 'image' : 'text',
                content: content.trim(),
                visibility,
                tags: extractedTags.length > 0 ? extractedTags : undefined,
                media: selectedFiles.length > 0 ? selectedFiles : undefined,
                location: userLocation
                    ? {
                          latitude: userLocation.lat,
                          longitude: userLocation.lng,
                      }
                    : undefined,
            };

            await createPost({
                payload,
                onProgress: setUploadProgress,
            });

            // Reset form
            setContent('');
            setSelectedFiles([]);
            setPostType('text');
            setCategory('');
            setVisibility('public');
            setUploadProgress(0);

            // Show success state briefly, then close (handled by useEffect)
            setShowSuccess(true);
        } catch (error: any) {
            console.error('❌ Create Post Error:', error);
            
            // Additional diagnostic info
            if (error.response?.status === 404) {
                console.error('📋 Backend Diagnostic Info:');
                console.error('   Endpoint: POST /api/v1/content/posts');
                console.error('   Request Type:', selectedFiles.length > 0 ? 'multipart/form-data (with images)' : 'application/json (text only)');
                console.error('   Payload:', {
                    type: postType === 'image' && selectedFiles.length > 0 ? 'image' : 'text',
                    contentLength: content.trim().length,
                    hasMedia: selectedFiles.length > 0,
                    mediaCount: selectedFiles.length,
                    visibility,
                    tagsCount: extractedTags.length,
                    hasLocation: true, // We always try to get location
                });
                console.error('   Backend should have:');
                console.error('   - Route: POST /api/v1/content/posts');
                console.error('   - Multer middleware for multipart requests');
                console.error('   - Handler that accepts both JSON and FormData');
            }
            
            // Error is handled by handleApiError in the hook
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setContent('');
            setSelectedFiles([]);
            setPostType('text');
            setCategory('');
            setVisibility('public');
            setUploadProgress(0);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
                {/* Success state */}
                {showSuccess ? (
                    <div className="flex flex-col items-center justify-center py-16 px-6">
                        <div className="w-16 h-16 rounded-full bg-neon-green/20 flex items-center justify-center mb-4">
                            <i className="bi bi-check-lg text-4xl text-neon-green"></i>
                        </div>
                        <h3 className="text-xl font-black uppercase text-charcoal tracking-tight">Post shared!</h3>
                        <p className="text-sm text-charcoal/60 mt-1">It will appear at the top of your feed.</p>
                    </div>
                ) : (
                    <>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-charcoal/10">
                    <h2 className="text-lg font-black uppercase text-charcoal">Create Post</h2>
                    <button
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-charcoal/60 hover:bg-charcoal/5 disabled:opacity-50"
                    >
                        <i className="bi bi-x-lg text-xl"></i>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                    <div className="p-4 space-y-4">
                        {/* Content Textarea */}
                        <div>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="What's happening in your neighborhood?"
                                className="w-full p-3 border border-charcoal/20 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-neon-green/50 text-sm min-h-[120px]"
                                rows={5}
                                disabled={isSubmitting}
                            />
                            <p className="text-xs text-charcoal/50 mt-1">
                                Use #hashtags for tags (e.g., #safety #event)
                            </p>
                        </div>

                        {/* Selected Images Preview */}
                        {selectedFiles.length > 0 && (
                            <div className="grid grid-cols-2 gap-2">
                                {selectedFiles.map((file, index) => (
                                    <div key={index} className="relative group">
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt={`Preview ${index + 1}`}
                                            className="w-full h-32 object-cover rounded-lg"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveFile(index)}
                                            disabled={isSubmitting}
                                            className="absolute top-2 right-2 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 disabled:opacity-50"
                                        >
                                            <i className="bi bi-x text-xs"></i>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Category Selection */}
                        <div>
                            <label className="block text-xs font-bold uppercase text-charcoal/60 mb-2">
                                Category (Optional)
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {['SAFETY', 'EVENT', 'MARKETPLACE', 'BULLETIN'].map((cat) => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setCategory(category === cat ? '' : cat)}
                                        disabled={isSubmitting}
                                        className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase transition-all ${
                                            category === cat
                                                ? 'bg-neon-green text-white'
                                                : 'bg-charcoal/5 text-charcoal/60 hover:bg-charcoal/10'
                                        } disabled:opacity-50`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Visibility Selection */}
                        <div>
                            <label className="block text-xs font-bold uppercase text-charcoal/60 mb-2">
                                Visibility
                            </label>
                            <select
                                value={visibility}
                                onChange={(e) => setVisibility(e.target.value as any)}
                                disabled={isSubmitting}
                                className="w-full p-2 border border-charcoal/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neon-green/50"
                            >
                                <option value="public">Public</option>
                                <option value="neighborhood">Neighborhood</option>
                                <option value="ward">Ward</option>
                            </select>
                        </div>

                        {/* Upload Progress */}
                        {uploadProgress > 0 && uploadProgress < 100 && (
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs text-charcoal/60">
                                    <span>Uploading...</span>
                                    <span>{uploadProgress}%</span>
                                </div>
                                <div className="w-full bg-charcoal/10 rounded-full h-2">
                                    <div
                                        className="bg-neon-green h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-charcoal/10 flex items-center justify-between gap-2">
                        {/* File Upload Button */}
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isSubmitting}
                            className="w-10 h-10 rounded-full bg-charcoal/5 flex items-center justify-center text-charcoal/60 hover:bg-charcoal/10 disabled:opacity-50"
                        >
                            <i className="bi bi-image text-lg"></i>
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                            disabled={isSubmitting}
                        />

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting || (!content.trim() && selectedFiles.length === 0)}
                            className="px-6 py-2 bg-brand-red text-white rounded-full text-sm font-bold uppercase tracking-wider hover:bg-brand-red/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Posting...</span>
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-send-fill"></i>
                                    <span>Post</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
                    </>
                )}
            </div>
        </div>
    );
}
