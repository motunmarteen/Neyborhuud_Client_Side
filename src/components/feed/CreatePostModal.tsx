'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePostMutations } from '@/hooks/usePosts';
import { getCurrentLocation } from '@/lib/geolocation';
import { isUserInNigeria } from '@/lib/nigeriaCheck';
import { useTranslation } from '@/lib/i18n';
import { CreatePostPayload, ContentType, AppLanguage } from '@/types/api';

interface CreatePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const CONTENT_TYPES: { value: ContentType; labelKey: string; icon: string }[] = [
    { value: 'post', labelKey: 'contentType.post', icon: '💬' },
    { value: 'fyi', labelKey: 'contentType.fyi', icon: '📢' },
    { value: 'gossip', labelKey: 'contentType.gossip', icon: '🗣️' },
    { value: 'help_request', labelKey: 'contentType.help_request', icon: '🆘' },
    { value: 'job', labelKey: 'contentType.job', icon: '💼' },
    { value: 'event', labelKey: 'contentType.event', icon: '📅' },
    { value: 'marketplace', labelKey: 'contentType.marketplace', icon: '🛒' },
];

const SUCCESS_DISPLAY_MS = 1400;

export function CreatePostModal({ isOpen, onClose, onSuccess }: CreatePostModalProps) {
    const { t, language: appLanguage } = useTranslation();
    const [content, setContent] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [postType, setPostType] = useState<'text' | 'image'>('text');
    const [contentType, setContentType] = useState<ContentType>('post');
    const [postLanguage, setPostLanguage] = useState<AppLanguage>(appLanguage);
    const [category, setCategory] = useState<string>('');
    const [visibility, setVisibility] = useState<'public' | 'neighborhood' | 'ward'>('public');
    const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'critical'>('normal');
    const [culturalContext, setCulturalContext] = useState<string>('');
    const [taAgeMin, setTaAgeMin] = useState<string>('');
    const [taAgeMax, setTaAgeMax] = useState<string>('');
    const [taGender, setTaGender] = useState<string>('all');
    const [taInterests, setTaInterests] = useState<string>('');
    const [fyiSubtype, setFyiSubtype] = useState<string>('community_announcement');
    const [expiryDate, setExpiryDate] = useState<string>('');
    const [contactInfo, setContactInfo] = useState<string>('');
    // Event fields
    const [eventDate, setEventDate] = useState<string>('');
    const [eventTime, setEventTime] = useState<string>('');
    const [venueName, setVenueName] = useState<string>('');
    const [venueAddress, setVenueAddress] = useState<string>('');
    const [ticketInfo, setTicketInfo] = useState<'free' | 'paid'>('free');
    const [ticketPrice, setTicketPrice] = useState<string>('');
    const [capacity, setCapacity] = useState<string>('');
    const [organizer, setOrganizer] = useState<string>('');
    const [eventCategory, setEventCategory] = useState<string>('meetup');
    // Marketplace fields
    const [price, setPrice] = useState<string>('');
    const [itemCondition, setItemCondition] = useState<'new' | 'used' | 'refurbished' | 'free'>('used');
    const [isNegotiable, setIsNegotiable] = useState(false);
    const [deliveryOption, setDeliveryOption] = useState<'pickup' | 'delivery' | 'both'>('pickup');
    const [itemCategory, setItemCategory] = useState<string>('electronics');
    const [contactMethod, setContactMethod] = useState<string>('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const canPost = isUserInNigeria();

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

    // Block non-Nigeria users from creating posts
    if (!canPost) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="neu-modal rounded-2xl w-full max-w-md p-8 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full neu-socket flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-4xl text-orange-500">public_off</span>
                    </div>
                    <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--neu-text)' }}>
                        {t('createPost.nigeriaOnly')}
                    </h3>
                    <p className="text-sm mb-6" style={{ color: 'var(--neu-text-muted)' }}>
                        {t('createPost.canInteract')}
                    </p>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 neu-btn rounded-xl text-sm font-bold"
                        style={{ color: 'var(--neu-text)' }}
                    >
                        {t('common.close')}
                    </button>
                </div>
            </div>
        );
    }

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
                contentType,
                content: content.trim(),
                visibility,
                tags: extractedTags.length > 0 ? extractedTags : undefined,
                media: selectedFiles.length > 0 ? selectedFiles : undefined,
                language: postLanguage,
                priority: priority !== 'normal' ? priority : undefined,
                culturalContext: culturalContext.trim() ? culturalContext.split(',').map(s => s.trim()).filter(Boolean) : undefined,
                targetAudience: (taAgeMin || taAgeMax || taGender !== 'all' || taInterests.trim()) ? {
                    ageRange: (taAgeMin || taAgeMax) ? { min: taAgeMin ? Number(taAgeMin) : undefined, max: taAgeMax ? Number(taAgeMax) : undefined } : undefined,
                    gender: taGender !== 'all' ? taGender : undefined,
                    interests: taInterests.trim() ? taInterests.split(',').map(s => s.trim()).filter(Boolean) : undefined,
                } : undefined,
                ...(contentType === 'fyi' ? {
                    fyiType: fyiSubtype,
                    eventDetails: { expiryDate: expiryDate || undefined },
                    contactInfo: contactInfo || undefined,
                } as any : {}),
                ...(contentType === 'event' ? {
                    eventDate: eventDate || undefined,
                    eventTime: eventTime || undefined,
                    venue: venueName ? { name: venueName, address: venueAddress || undefined } : undefined,
                    ticketInfo,
                    ticketPrice: ticketInfo === 'paid' ? Number(ticketPrice) : undefined,
                    capacity: capacity ? Number(capacity) : undefined,
                    organizer: organizer || undefined,
                    eventCategory,
                } as any : {}),
                ...(contentType === 'marketplace' ? {
                    price: price ? Number(price) : undefined,
                    currency: 'NGN' as const,
                    itemCondition,
                    isNegotiable,
                    deliveryOption,
                    itemCategory: itemCategory || undefined,
                    contactMethod: contactMethod || undefined,
                } as any : {}),
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
            setContentType('post');
            setPostLanguage(appLanguage);
            setCategory('');
            setVisibility('public');
            setPriority('normal');
            setCulturalContext('');
            setTaAgeMin('');
            setTaAgeMax('');
            setTaGender('all');
            setTaInterests('');
            setFyiSubtype('community_announcement');
            setExpiryDate('');
            setContactInfo('');
            // Reset event fields
            setEventDate('');
            setEventTime('');
            setVenueName('');
            setVenueAddress('');
            setTicketInfo('free');
            setTicketPrice('');
            setCapacity('');
            setOrganizer('');
            setEventCategory('meetup');
            // Reset marketplace fields
            setPrice('');
            setItemCondition('used');
            setIsNegotiable(false);
            setDeliveryOption('pickup');
            setItemCategory('electronics');
            setContactMethod('');
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
            setContentType('post');
            setPostLanguage(appLanguage);
            setCategory('');
            setVisibility('public');
            setUploadProgress(0);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="neu-modal rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
                {/* Success state */}
                {showSuccess ? (
                    <div className="flex flex-col items-center justify-center py-16 px-6">
                        <div className="w-16 h-16 rounded-full neu-socket flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-4xl text-primary">check_circle</span>
                        </div>
                        <h3 className="text-xl font-bold" style={{ color: 'var(--neu-text)' }}>{t('createPost.postShared')}</h3>
                        <p className="text-sm mt-1" style={{ color: 'var(--neu-text-muted)' }}>{t('createPost.willAppear')}</p>
                    </div>
                ) : (
                    <>
                {/* Header */}
                <div className="flex items-center justify-between p-4">
                    <div className="neu-divider absolute bottom-0 left-0 right-0" />
                    <h2 className="text-lg font-bold" style={{ color: 'var(--neu-text)' }}>{t('createPost.title')}</h2>
                    <button
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="w-8 h-8 rounded-xl neu-btn flex items-center justify-center disabled:opacity-50 transition-all active:shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)]"
                    >
                        <span className="material-symbols-outlined text-xl" style={{ color: 'var(--neu-text-muted)' }}>close</span>
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
                                placeholder={t('feed.composerPlaceholder')}
                                className="w-full p-3 rounded-xl resize-none focus:outline-none text-sm min-h-[120px] neu-input"
                                rows={5}
                                disabled={isSubmitting}
                            />
                            <p className="text-xs mt-1" style={{ color: 'var(--neu-text-muted)' }}>
                                {t('createPost.hashtagHint')}
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
                                            <span className="material-symbols-outlined text-sm">close</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Content Type Selection */}
                        <div>
                            <label className="block text-xs font-bold uppercase mb-2" style={{ color: 'var(--neu-text-muted)' }}>
                                {t('createPost.postType')}
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {CONTENT_TYPES.map((ct) => (
                                    <button
                                        key={ct.value}
                                        type="button"
                                        onClick={() => setContentType(ct.value)}
                                        disabled={isSubmitting}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all ${
                                            contentType === ct.value
                                                ? 'neu-btn-active text-primary'
                                                : 'neu-btn'
                                        } disabled:opacity-50`}
                                        style={contentType !== ct.value ? { color: 'var(--neu-text-muted)' } : undefined}
                                    >
                                        <span className="mr-1">{ct.icon}</span>{t(ct.labelKey)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* FYI-Specific Fields */}
                        {contentType === 'fyi' && (
                            <div className="flex flex-col gap-3 p-3 rounded-xl" style={{ background: 'var(--neu-bg-offset, rgba(255,255,255,0.03))' }}>
                                <label className="block text-xs font-bold uppercase" style={{ color: 'var(--neu-text-muted)' }}>
                                    FYI Subtype
                                </label>
                                <select
                                    value={fyiSubtype}
                                    onChange={(e) => setFyiSubtype(e.target.value)}
                                    disabled={isSubmitting}
                                    className="w-full p-2 rounded-xl text-sm focus:outline-none neu-input"
                                >
                                    <option value="safety_notice">Safety Notice</option>
                                    <option value="lost_found">Lost &amp; Found</option>
                                    <option value="community_announcement">Community Announcement</option>
                                    <option value="local_news">Local News</option>
                                    <option value="alert">Alert</option>
                                </select>
                                <label className="block text-xs font-bold uppercase" style={{ color: 'var(--neu-text-muted)' }}>
                                    Expiry Date
                                </label>
                                <input
                                    type="datetime-local"
                                    value={expiryDate}
                                    onChange={(e) => setExpiryDate(e.target.value)}
                                    disabled={isSubmitting}
                                    className="w-full p-2 rounded-xl text-sm focus:outline-none neu-input"
                                    defaultValue={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)}
                                />
                                <label className="block text-xs font-bold uppercase" style={{ color: 'var(--neu-text-muted)' }}>
                                    Contact Info (optional)
                                </label>
                                <input
                                    type="text"
                                    value={contactInfo}
                                    onChange={(e) => setContactInfo(e.target.value)}
                                    disabled={isSubmitting}
                                    placeholder="e.g. phone number, email"
                                    className="w-full p-2 rounded-xl text-sm focus:outline-none neu-input"
                                />
                            </div>
                        )}

                        {/* Event-Specific Fields */}
                        {contentType === 'event' && (
                            <div className="flex flex-col gap-3 p-3 rounded-xl" style={{ background: 'var(--neu-bg-offset, rgba(255,255,255,0.03))' }}>
                                <label className="block text-xs font-bold uppercase" style={{ color: 'var(--neu-text-muted)' }}>
                                    📅 Event Details
                                </label>
                                <p className="text-[11px] -mt-1" style={{ color: 'var(--neu-text-muted)' }}>
                                    Describe your event above, then fill in the details below
                                </p>
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <label className="block text-xs mb-1" style={{ color: 'var(--neu-text-muted)' }}>Date *</label>
                                        <input
                                            type="date"
                                            value={eventDate}
                                            onChange={(e) => setEventDate(e.target.value)}
                                            disabled={isSubmitting}
                                            required
                                            className="w-full p-2 rounded-xl text-sm focus:outline-none neu-input"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs mb-1" style={{ color: 'var(--neu-text-muted)' }}>Time</label>
                                        <input
                                            type="time"
                                            value={eventTime}
                                            onChange={(e) => setEventTime(e.target.value)}
                                            disabled={isSubmitting}
                                            className="w-full p-2 rounded-xl text-sm focus:outline-none neu-input"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs mb-1" style={{ color: 'var(--neu-text-muted)' }}>Venue Name *</label>
                                    <input
                                        type="text"
                                        value={venueName}
                                        onChange={(e) => setVenueName(e.target.value)}
                                        disabled={isSubmitting}
                                        required
                                        placeholder="e.g. Eko Hotel, Tafawa Balewa Square"
                                        className="w-full p-2 rounded-xl text-sm focus:outline-none neu-input"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs mb-1" style={{ color: 'var(--neu-text-muted)' }}>Venue Address</label>
                                    <input
                                        type="text"
                                        value={venueAddress}
                                        onChange={(e) => setVenueAddress(e.target.value)}
                                        disabled={isSubmitting}
                                        placeholder="e.g. Victoria Island, Lagos"
                                        className="w-full p-2 rounded-xl text-sm focus:outline-none neu-input"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <label className="block text-xs mb-1" style={{ color: 'var(--neu-text-muted)' }}>Ticket</label>
                                        <select
                                            value={ticketInfo}
                                            onChange={(e) => setTicketInfo(e.target.value as 'free' | 'paid')}
                                            disabled={isSubmitting}
                                            className="w-full p-2 rounded-xl text-sm focus:outline-none neu-input"
                                        >
                                            <option value="free">Free</option>
                                            <option value="paid">Paid</option>
                                        </select>
                                    </div>
                                    {ticketInfo === 'paid' && (
                                        <div className="flex-1">
                                            <label className="block text-xs mb-1" style={{ color: 'var(--neu-text-muted)' }}>Price (₦) *</label>
                                            <input
                                                type="number"
                                                value={ticketPrice}
                                                onChange={(e) => setTicketPrice(e.target.value)}
                                                disabled={isSubmitting}
                                                required
                                                min="0"
                                                placeholder="0"
                                                className="w-full p-2 rounded-xl text-sm focus:outline-none neu-input"
                                            />
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <label className="block text-xs mb-1" style={{ color: 'var(--neu-text-muted)' }}>Capacity</label>
                                        <input
                                            type="number"
                                            value={capacity}
                                            onChange={(e) => setCapacity(e.target.value)}
                                            disabled={isSubmitting}
                                            min="1"
                                            placeholder="Max attendees"
                                            className="w-full p-2 rounded-xl text-sm focus:outline-none neu-input"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs mb-1" style={{ color: 'var(--neu-text-muted)' }}>Category</label>
                                        <select
                                            value={eventCategory}
                                            onChange={(e) => setEventCategory(e.target.value)}
                                            disabled={isSubmitting}
                                            className="w-full p-2 rounded-xl text-sm focus:outline-none neu-input"
                                        >
                                            <option value="meetup">Meetup</option>
                                            <option value="party">Party / Owambe</option>
                                            <option value="workshop">Workshop</option>
                                            <option value="religious">Religious</option>
                                            <option value="sports">Sports</option>
                                            <option value="cultural">Cultural</option>
                                            <option value="charity">Charity</option>
                                            <option value="concert">Concert</option>
                                            <option value="market">Market Day</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs mb-1" style={{ color: 'var(--neu-text-muted)' }}>Organizer</label>
                                    <input
                                        type="text"
                                        value={organizer}
                                        onChange={(e) => setOrganizer(e.target.value)}
                                        disabled={isSubmitting}
                                        placeholder="Your name or org"
                                        className="w-full p-2 rounded-xl text-sm focus:outline-none neu-input"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Marketplace-Specific Fields */}
                        {contentType === 'marketplace' && (
                            <div className="flex flex-col gap-3 p-3 rounded-xl" style={{ background: 'var(--neu-bg-offset, rgba(255,255,255,0.03))' }}>
                                <label className="block text-xs font-bold uppercase" style={{ color: 'var(--neu-text-muted)' }}>
                                    🛒 Marketplace Details
                                </label>
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <label className="block text-xs mb-1" style={{ color: 'var(--neu-text-muted)' }}>Price (₦) *</label>
                                        <input
                                            type="number"
                                            value={price}
                                            onChange={(e) => setPrice(e.target.value)}
                                            disabled={isSubmitting}
                                            required
                                            min="0"
                                            placeholder="e.g. 15000"
                                            className="w-full p-2 rounded-xl text-sm focus:outline-none neu-input"
                                        />
                                    </div>
                                    <div className="flex-1 flex items-end pb-0.5">
                                        <button
                                            type="button"
                                            onClick={() => setIsNegotiable(!isNegotiable)}
                                            disabled={isSubmitting}
                                            className={`w-full px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                                                isNegotiable
                                                    ? 'neu-btn-active text-green-400 bg-green-500/10'
                                                    : 'neu-btn'
                                            }`}
                                            style={!isNegotiable ? { color: 'var(--neu-text-muted)' } : undefined}
                                        >
                                            {isNegotiable ? '✓ Negotiable' : 'Fixed Price'}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs mb-1" style={{ color: 'var(--neu-text-muted)' }}>Item Category *</label>
                                    <select
                                        value={itemCategory}
                                        onChange={(e) => setItemCategory(e.target.value)}
                                        disabled={isSubmitting}
                                        className="w-full p-2 rounded-xl text-sm focus:outline-none neu-input"
                                    >
                                        <option value="electronics">📱 Electronics</option>
                                        <option value="phones">📞 Phones &amp; Accessories</option>
                                        <option value="fashion">👗 Fashion &amp; Clothing</option>
                                        <option value="food">🍲 Food &amp; Groceries</option>
                                        <option value="furniture">🛋️ Furniture &amp; Home</option>
                                        <option value="vehicles">🚗 Vehicles &amp; Auto Parts</option>
                                        <option value="beauty">💄 Beauty &amp; Health</option>
                                        <option value="services">🔧 Services</option>
                                        <option value="land">🏠 Land &amp; Property</option>
                                        <option value="baby">👶 Baby &amp; Kids</option>
                                        <option value="sports">⚽ Sports &amp; Outdoors</option>
                                        <option value="books">📚 Books &amp; Education</option>
                                        <option value="farming">🌾 Farming &amp; Agric</option>
                                        <option value="other">📦 Other</option>
                                    </select>
                                </div>
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <label className="block text-xs mb-1" style={{ color: 'var(--neu-text-muted)' }}>Condition *</label>
                                        <select
                                            value={itemCondition}
                                            onChange={(e) => setItemCondition(e.target.value as any)}
                                            disabled={isSubmitting}
                                            className="w-full p-2 rounded-xl text-sm focus:outline-none neu-input"
                                        >
                                            <option value="new">Brand New</option>
                                            <option value="used">Used (Tokunbo)</option>
                                            <option value="refurbished">Refurbished</option>
                                            <option value="free">Free / Dash</option>
                                        </select>
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs mb-1" style={{ color: 'var(--neu-text-muted)' }}>Delivery</label>
                                        <select
                                            value={deliveryOption}
                                            onChange={(e) => setDeliveryOption(e.target.value as any)}
                                            disabled={isSubmitting}
                                            className="w-full p-2 rounded-xl text-sm focus:outline-none neu-input"
                                        >
                                            <option value="pickup">Pickup Only</option>
                                            <option value="delivery">Delivery</option>
                                            <option value="both">Both</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs mb-1" style={{ color: 'var(--neu-text-muted)' }}>Contact Method</label>
                                    <input
                                        type="text"
                                        value={contactMethod}
                                        onChange={(e) => setContactMethod(e.target.value)}
                                        disabled={isSubmitting}
                                        placeholder="e.g. WhatsApp: 080..., DM, Call"
                                        className="w-full p-2 rounded-xl text-sm focus:outline-none neu-input"
                                    />
                                </div>
                                <p className="text-[11px] mt-1" style={{ color: 'var(--neu-text-muted)' }}>
                                    💡 Add photos of your item above for better visibility
                                </p>
                            </div>
                        )}

                        {/* Language Selection */}
                        <div>
                            <label className="block text-xs font-bold uppercase mb-2" style={{ color: 'var(--neu-text-muted)' }}>
                                {t('createPost.language')}
                            </label>
                            <select
                                value={postLanguage}
                                onChange={(e) => setPostLanguage(e.target.value as AppLanguage)}
                                disabled={isSubmitting}
                                className="w-full p-2 rounded-xl text-sm focus:outline-none neu-input"
                            >
                                <option value="en">English</option>
                                <option value="ha">Hausa</option>
                                <option value="yo">Yorùbá</option>
                                <option value="ig">Igbo</option>
                                <option value="pcm">Pidgin</option>
                            </select>
                        </div>

                        {/* Category Selection */}
                        <div>
                            <label className="block text-xs font-bold uppercase mb-2" style={{ color: 'var(--neu-text-muted)' }}>
                                {t('createPost.category')}
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {['SAFETY', 'EVENT', 'MARKETPLACE', 'BULLETIN'].map((cat) => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setCategory(category === cat ? '' : cat)}
                                        disabled={isSubmitting}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all ${
                                            category === cat
                                                ? 'neu-btn-active text-primary'
                                                : 'neu-btn'
                                        } disabled:opacity-50`}
                                        style={category !== cat ? { color: 'var(--neu-text-muted)' } : undefined}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Visibility Selection */}
                        <div>
                            <label className="block text-xs font-bold uppercase mb-2" style={{ color: 'var(--neu-text-muted)' }}>
                                {t('createPost.visibility')}
                            </label>
                            <select
                                value={visibility}
                                onChange={(e) => setVisibility(e.target.value as any)}
                                disabled={isSubmitting}
                                className="w-full p-2 rounded-xl text-sm focus:outline-none neu-input"
                            >
                                <option value="public">Public</option>
                                <option value="neighborhood">Neighborhood</option>
                                <option value="ward">Ward</option>
                            </select>
                        </div>

                        {/* Priority Selection */}
                        <div>
                            <label className="block text-xs font-bold uppercase mb-2" style={{ color: 'var(--neu-text-muted)' }}>
                                Priority
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {(['low', 'normal', 'high', 'critical'] as const).map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setPriority(p)}
                                        disabled={isSubmitting}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                            priority === p
                                                ? p === 'critical' ? 'bg-red-500/20 text-red-400 neu-btn-active'
                                                : p === 'high' ? 'bg-orange-500/20 text-orange-400 neu-btn-active'
                                                : 'text-primary neu-btn-active'
                                                : 'neu-btn'
                                        }`}
                                        style={priority !== p ? { color: 'var(--neu-text-muted)' } : undefined}
                                    >
                                        {p.charAt(0).toUpperCase() + p.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Cultural Context */}
                        <div>
                            <label className="block text-xs font-bold uppercase mb-2" style={{ color: 'var(--neu-text-muted)' }}>
                                Cultural Context <span className="normal-case font-normal">(comma-separated)</span>
                            </label>
                            <input
                                type="text"
                                value={culturalContext}
                                onChange={(e) => setCulturalContext(e.target.value)}
                                disabled={isSubmitting}
                                placeholder="e.g. yoruba, lagos-island, owambe"
                                className="w-full p-2 rounded-xl text-sm focus:outline-none neu-input"
                            />
                        </div>

                        {/* Target Audience */}
                        <div>
                            <label className="block text-xs font-bold uppercase mb-2" style={{ color: 'var(--neu-text-muted)' }}>
                                Target Audience <span className="normal-case font-normal">(optional)</span>
                            </label>
                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        value={taAgeMin}
                                        onChange={(e) => setTaAgeMin(e.target.value)}
                                        disabled={isSubmitting}
                                        placeholder="Min age"
                                        min="0"
                                        max="120"
                                        className="w-1/2 p-2 rounded-xl text-sm focus:outline-none neu-input"
                                    />
                                    <input
                                        type="number"
                                        value={taAgeMax}
                                        onChange={(e) => setTaAgeMax(e.target.value)}
                                        disabled={isSubmitting}
                                        placeholder="Max age"
                                        min="0"
                                        max="120"
                                        className="w-1/2 p-2 rounded-xl text-sm focus:outline-none neu-input"
                                    />
                                </div>
                                <select
                                    value={taGender}
                                    onChange={(e) => setTaGender(e.target.value)}
                                    disabled={isSubmitting}
                                    className="w-full p-2 rounded-xl text-sm focus:outline-none neu-input"
                                >
                                    <option value="all">All Genders</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                </select>
                                <input
                                    type="text"
                                    value={taInterests}
                                    onChange={(e) => setTaInterests(e.target.value)}
                                    disabled={isSubmitting}
                                    placeholder="Interests (comma-separated, e.g. tech, sports)"
                                    className="w-full p-2 rounded-xl text-sm focus:outline-none neu-input"
                                />
                            </div>
                        </div>

                        {/* Upload Progress */}
                        {uploadProgress > 0 && uploadProgress < 100 && (
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs" style={{ color: 'var(--neu-text-muted)' }}>
                                    <span>Uploading...</span>
                                    <span>{uploadProgress}%</span>
                                </div>
                                <div className="w-full neu-socket rounded-full h-2">
                                    <div
                                        className="bg-primary h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 flex items-center justify-between gap-2">
                        <div className="neu-divider absolute top-0 left-0 right-0" />
                        {/* File Upload Button */}
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isSubmitting}
                                className="flex items-center justify-center p-2 rounded-xl neu-btn transition-all text-primary disabled:opacity-50 active:shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)]"
                            >
                                <span className="material-symbols-outlined text-[20px]">image</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isSubmitting}
                                className="flex items-center justify-center p-2 rounded-xl neu-btn transition-all text-primary disabled:opacity-50 active:shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)]"
                            >
                                <span className="material-symbols-outlined text-[20px]">videocam</span>
                            </button>
                        </div>
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
                            className="px-6 py-2 neu-btn rounded-xl text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all active:shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)]"
                            style={{ color: 'var(--neu-text)' }}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-[#11221a] border-t-transparent rounded-full animate-spin"></div>
                                    <span>{t('createPost.posting')}</span>
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-[18px]">send</span>
                                    <span>{t('createPost.post')}</span>
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
