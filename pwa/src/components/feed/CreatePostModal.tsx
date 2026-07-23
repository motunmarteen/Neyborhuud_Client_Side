'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { usePostMutations } from '@/hooks/usePosts';
import { getRegisteredLocationSync } from '@/hooks/useRegisteredLocation';
import { pickNativePhotos, canUseNativeCamera } from '@/lib/nativeCamera';
import { isUserInNigeria } from '@/lib/nigeriaCheck';
import { useTranslation } from '@/lib/i18n';
import { CreatePostPayload, ContentType, AppLanguage } from '@/types/api';
import { fyiService } from '@/services/fyi.service';
import apiClient from '@/lib/api-client';
import { useAwardCoins } from '@/hooks/useGamification';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { toKobo } from '@/lib/currency';

interface CreatePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    /** Open the device media picker when the modal appears */
    focusMediaOnOpen?: boolean;
    /** Pre-select a content type when the modal opens */
    defaultContentType?: ContentType;
    /** When true, hides the content type selector (modal is locked to defaultContentType) */
    lockContentType?: boolean;
    /** Pre-select and lock FYI subtype (hides the subtype selector) */
    defaultFyiSubtype?: string;
}

const POST_TYPES = [
    { value: 'services', label: 'Services', desc: 'Offer or hire local services', icon: '🛠️', color: 'text-[#00a555] bg-[#00a555]/5 border-[#00a555]/10 hover:bg-[#00a555]/10' },
    { value: 'fyi', label: 'FYI', desc: 'Announcements & notices', icon: '📢', color: 'text-[#3a6a9a] bg-[#3a6a9a]/5 border-[#3a6a9a]/10 hover:bg-[#3a6a9a]/10' },
    { value: 'help_request', label: 'Help Request', desc: 'Raise support or funds', icon: '🆘', color: 'text-[#cc3333] bg-[#cc3333]/5 border-[#cc3333]/10 hover:bg-[#cc3333]/10' },
    { value: 'marketplace', label: 'Marketplace', desc: 'Buy, sell or trade items', icon: '🛒', color: 'text-[#00c431] bg-[#00c431]/5 border-[#00c431]/10 hover:bg-[#00c431]/10' },
    { value: 'event', label: 'Event', desc: 'Gatherings & meetups', icon: '📅', color: 'text-brand-blue bg-brand-blue/5 border-brand-blue/10 hover:bg-brand-blue/10' },
    { value: 'job', label: 'Job', desc: 'Hiring or job postings', icon: '💼', color: 'text-[#9a5acf] bg-[#9a5acf]/5 border-[#9a5acf]/10 hover:bg-[#9a5acf]/10' },
    { value: 'emergency', label: 'Safety Alert', desc: 'Report incident or threat', icon: '🚨', color: 'text-brand-red bg-brand-red/5 border-brand-red/10 hover:bg-brand-red/10' },
    { value: 'alert', label: 'Urgent Alert', desc: 'Critical hazard warning', icon: '⚠️', color: 'text-status-warning bg-status-warning/5 border-status-warning/10 hover:bg-status-warning/10' },
];

const SUCCESS_DISPLAY_MS = 1400;

// ──────────────────────────────────────────────────────────────────────────────
// PostFormSelect — Custom dropdown rendered via React Portal.
// Prevents the overflow/clip issues of native <select> inside bottom sheets.
// ──────────────────────────────────────────────────────────────────────────────
interface SelectOption { value: string; label: string; }
interface PostFormSelectProps {
    value: string;
    onChange: (v: string) => void;
    options: SelectOption[];
    disabled?: boolean;
}

function PostFormSelect({ value, onChange, options, disabled }: PostFormSelectProps) {
    const [open, setOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const dropRef = useRef<HTMLDivElement>(null);
    const [coords, setCoords] = useState<React.CSSProperties>({});
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const selected = options.find(o => o.value === value) ?? options[0];

    const openDrop = useCallback(() => {
        if (!triggerRef.current) return;
        const r = triggerRef.current.getBoundingClientRect();
        const vh = window.innerHeight;
        const dropH = Math.min(options.length * 44 + 16, 260);
        const spaceBelow = vh - r.bottom - 8;
        setCoords(
            spaceBelow >= dropH
                ? { top: r.bottom + 6, left: r.left, width: r.width }
                : { bottom: vh - r.top + 6, left: r.left, width: r.width }
        );
        setOpen(true);
    }, [options.length]);

    useEffect(() => {
        if (!open) return;
        const close = (e: MouseEvent) => {
            if (
                triggerRef.current?.contains(e.target as Node) ||
                dropRef.current?.contains(e.target as Node)
            ) return;
            setOpen(false);
        };
        document.addEventListener('mousedown', close, true);
        return () => document.removeEventListener('mousedown', close, true);
    }, [open]);

    const triggerStyle: React.CSSProperties = {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.5rem',
        padding: '0.6rem 0.875rem',
        borderRadius: '0.75rem',
        border: open ? '1.5px solid rgba(0,196,49,0.5)' : '1.5px solid rgba(0,0,0,0.09)',
        background: open ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.025)',
        boxShadow: open
            ? 'inset 0 2px 4px rgba(0,0,0,0.02), 0 0 0 3px rgba(0,196,49,0.09)'
            : 'inset 0 2px 4px rgba(0,0,0,0.04)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit',
        fontSize: '0.8125rem',
        fontWeight: 600,
        color: 'var(--neu-text)',
        textAlign: 'left',
        transition: 'all 160ms ease',
        opacity: disabled ? 0.45 : 1,
    };

    return (
        <div className="relative">
            <button
                ref={triggerRef}
                type="button"
                disabled={disabled}
                onClick={open ? () => setOpen(false) : openDrop}
                style={triggerStyle}
            >
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selected?.label ?? ''}
                </span>
                <span
                    className="material-symbols-outlined"
                    style={{
                        fontSize: '1.15rem',
                        flexShrink: 0,
                        color: open ? 'rgba(0,140,30,0.8)' : 'rgba(0,0,0,0.35)',
                        transform: open ? 'rotate(180deg)' : 'none',
                        transition: 'transform 200ms ease, color 160ms ease',
                    }}
                >
                    expand_more
                </span>
            </button>

            {mounted && open && createPortal(
                <div
                    ref={dropRef}
                    style={{
                        position: 'fixed',
                        zIndex: 99999,
                        borderRadius: '0.875rem',
                        overflow: 'hidden',
                        maxHeight: '260px',
                        overflowY: 'auto',
                        background: 'rgba(255,255,255,0.97)',
                        backdropFilter: 'blur(24px)',
                        WebkitBackdropFilter: 'blur(24px)',
                        border: '1.5px solid rgba(0,196,49,0.18)',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.1)',
                        animation: 'dropdownFadeIn 140ms cubic-bezier(0.16,1,0.3,1)',
                        ...coords,
                    }}
                >
                    {options.map((opt, i) => {
                        const isSelected = opt.value === value;
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => { onChange(opt.value); setOpen(false); }}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    textAlign: 'left',
                                    padding: '0.65rem 0.875rem',
                                    fontSize: '0.8125rem',
                                    fontWeight: isSelected ? 700 : 500,
                                    fontFamily: 'inherit',
                                    background: isSelected ? 'rgba(0,196,49,0.07)' : 'transparent',
                                    color: isSelected ? 'rgb(0,130,28)' : 'rgb(30,30,30)',
                                    borderBottom: i < options.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                                    cursor: 'pointer',
                                    transition: 'background 100ms ease',
                                }}
                                onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'rgba(0,196,49,0.04)'; }}
                                onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                            >
                                {isSelected && (
                                    <span className="material-symbols-outlined" style={{ fontSize: '0.9rem', color: 'rgb(0,140,28)', flexShrink: 0 }}>check</span>
                                )}
                                <span style={{ flex: 1 }}>{opt.label}</span>
                            </button>
                        );
                    })}
                </div>,
                document.body
            )}
        </div>
    );
}

export function CreatePostModal({ isOpen, onClose, onSuccess, focusMediaOnOpen, defaultContentType, lockContentType, defaultFyiSubtype }: CreatePostModalProps) {
    const { t, language: appLanguage } = useTranslation();
    const { user } = useAuth();
    const awardCoins = useAwardCoins();
    const userLga = user?.location?.lga || '';

    // Step configuration
    const [formStep, setFormStep] = useState<'type_select' | 'form'>(defaultContentType ? 'form' : 'type_select');

    // Load defaults from local storage
    const [postSettings, setPostSettings] = useState({
        defaultLanguage: 'en',
        defaultVisibility: 'public',
        defaultPriorityStandard: 'normal',
        defaultPriorityUrgent: 'critical',
        autoHashtagLocation: true,
        bankName: '',
        accountName: '',
        accountNumber: '',
    });

    // Form inputs state
    const [content, setContent] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [postType, setPostType] = useState<'text' | 'image'>('text');
    const [contentType, setContentType] = useState<ContentType>(defaultContentType || 'post');
    const [postLanguage, setPostLanguage] = useState<AppLanguage>(appLanguage);
    const [category, setCategory] = useState<string>('');
    const [visibility, setVisibility] = useState<'public' | 'neighborhood' | 'ward'>('public');
    const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'critical'>('normal');
    
    // Custom post type fields
    const [fyiSubtype, setFyiSubtype] = useState<string>(defaultFyiSubtype || 'community_announcement');
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
    // Help Request fields
    const [hrStep, setHrStep] = useState<1 | 2 | 3>(1);
    const [helpCategory, setHelpCategory] = useState<string>('financial');
    const [targetAmount, setTargetAmount] = useState<string>('');
    const [bankName, setBankName] = useState<string>('');
    const [accountName, setAccountName] = useState<string>('');
    const [accountNumber, setAccountNumber] = useState<string>('');

    // Job fields
    const [jobTitle, setJobTitle] = useState('');
    const [jobType, setJobType] = useState('full-time');
    const [salary, setSalary] = useState('');
    const [workMode, setWorkMode] = useState('on-site');
    const [jobRequirements, setJobRequirements] = useState('');

    // Services fields
    const [serviceName, setServiceName] = useState('');
    const [serviceCategory, setServiceCategory] = useState('maintenance');
    const [serviceRate, setServiceRate] = useState('');
    const [serviceRateType, setServiceRateType] = useState('hourly');
    const [serviceAvailability, setServiceAvailability] = useState('available');
    const [serviceArea, setServiceArea] = useState('');

    // Safety Log fields (emergency)
    const [hazardType, setHazardType] = useState('danger');
    const [incidentTime, setIncidentTime] = useState('');
    const [incidentLocation, setIncidentLocation] = useState('');
    const [recommendedAction, setRecommendedAction] = useState('');

    // Urgent Alert fields (fyi alert subtype)
    const [alertType, setAlertType] = useState('weather');
    const [urgencyLevel, setUrgencyLevel] = useState('critical');
    const [affectedArea, setAffectedArea] = useState('');
    const [recommendedPrecautions, setRecommendedPrecautions] = useState('');
    
    const [contactDetails, setContactDetails] = useState('');

    const [uploadProgress, setUploadProgress] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const canPost = isUserInNigeria();

    const { createPost } = usePostMutations();

    // Reset workflow and load settings when modal toggles open
    useEffect(() => {
        if (isOpen) {
            setContentType(defaultContentType || 'services');
            if (defaultFyiSubtype) setFyiSubtype(defaultFyiSubtype);
            setFormStep(defaultContentType ? 'form' : 'type_select');

            if (typeof window !== 'undefined') {
                const stored = localStorage.getItem('neyborhuud_post_settings');
                if (stored) {
                    try {
                        const parsed = JSON.parse(stored);
                        setPostSettings((prev) => ({ ...prev, ...parsed }));
                        setPostLanguage(parsed.defaultLanguage || 'en');
                        setVisibility(parsed.defaultVisibility || 'public');
                        if (parsed.bankName) setBankName(parsed.bankName);
                        if (parsed.accountName) setAccountName(parsed.accountName);
                        if (parsed.accountNumber) setAccountNumber(parsed.accountNumber);
                    } catch { /* ignore */ }
                }
            }
        }
    }, [isOpen, defaultContentType, defaultFyiSubtype]);

    useEffect(() => {
        if (!showSuccess) return;
        const t = setTimeout(() => {
            setShowSuccess(false);
            onSuccess?.();
            onClose();
        }, SUCCESS_DISPLAY_MS);
        return () => clearTimeout(t);
    }, [showSuccess, onSuccess, onClose]);

    useEffect(() => {
        if (!isOpen || !focusMediaOnOpen) return;
        const timer = setTimeout(() => fileInputRef.current?.click(), 120);
        return () => clearTimeout(timer);
    }, [isOpen, focusMediaOnOpen]);

    if (!isOpen) return null;

    if (!canPost) {
        return (
            <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
                <div className="bg-white dark:bg-[#121b14] rounded-t-[32px] w-full max-w-md p-8 flex flex-col items-center text-center shadow-2xl">
                    <div className="w-12 h-1 bg-black/10 dark:bg-white/20 rounded-full mx-auto mb-6 shrink-0" />
                    <div className="w-16 h-16 rounded-full bg-brand-red/10 flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-4xl text-brand-red">public_off</span>
                    </div>
                    <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--neu-text)' }}>
                        {t('createPost.nigeriaOnly')}
                    </h3>
                    <p className="text-sm mb-6" style={{ color: 'var(--neu-text-muted)' }}>
                        {t('createPost.canInteract')}
                    </p>
                    <button
                        onClick={onClose}
                        className="mod-chip mod-chip-active w-full py-3 text-sm font-bold text-primary cursor-pointer rounded-xl"
                    >
                        {t('common.close')}
                    </button>
                </div>
            </div>
        );
    }

    const handleSelectPostType = (type: string) => {
        if (type === 'alert') {
            setContentType('fyi');
            setFyiSubtype('alert');
            setPriority((postSettings.defaultPriorityUrgent as any) || 'critical');
        } else if (type === 'emergency') {
            setContentType('emergency');
            setPriority((postSettings.defaultPriorityUrgent as any) || 'critical');
        } else {
            setContentType(type as ContentType);
            if (type === 'help_request') {
                setPriority((postSettings.defaultPriorityUrgent as any) || 'critical');
            } else if (type === 'services') {
                setPriority((postSettings.defaultPriorityStandard as any) || 'normal');
            } else {
                setPriority((postSettings.defaultPriorityStandard as any) || 'normal');
            }
        }
        setFormStep('form');
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            setSelectedFiles(files);
            setPostType('image');
        }
    };

    const handlePickMedia = async () => {
        if (canUseNativeCamera()) {
            const files = await pickNativePhotos({ source: 'prompt', multiple: true });
            if (files === null) {
                fileInputRef.current?.click();
                return;
            }
            if (files.length > 0) {
                setSelectedFiles(files);
                setPostType('image');
            }
            return;
        }
        fileInputRef.current?.click();
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

        const hashtags = content.match(/#\w+/g) || [];
        const extractedTags = hashtags.map((tag) => tag.substring(1));
        
        if (postSettings.autoHashtagLocation && userLga) {
            const normalizedLga = userLga.replace(/\s+/g, '').toLowerCase();
            if (normalizedLga && !extractedTags.includes(normalizedLga)) {
                extractedTags.push(normalizedLga);
            }
        }

        try {
            if (contentType === 'fyi' && lockContentType) {
                if (!extractedTags.includes('fyi')) extractedTags.push('fyi');

                let mediaUrls: string[] = [];
                if (selectedFiles.length > 0) {
                    setUploadProgress(10);
                    const uploadRes = await apiClient.uploadFiles<{ files: { url: string }[] }>(
                        '/media/upload',
                        selectedFiles,
                        undefined,
                        (p) => setUploadProgress(10 + Math.round(p * 0.8)),
                    );
                    mediaUrls = (uploadRes.data?.files || []).map((f) => f.url);
                    setUploadProgress(90);
                }

                const regLoc = getRegisteredLocationSync();
                await fyiService.createBulletin({
                    title: content.trim().substring(0, 100),
                    body: content.trim(),
                    fyiType: 'community_announcement',
                    tags: extractedTags,
                    mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
                    location: regLoc
                        ? { latitude: regLoc.latitude, longitude: regLoc.longitude }
                        : undefined,
                });
                awardCoins('fyi_created');
                setUploadProgress(100);
            } else {
                if (contentType === 'fyi') {
                    if (!extractedTags.includes('fyi')) extractedTags.push('fyi');
                    const subtypeHashMap: Record<string, string> = {
                        safety_notice: 'safetynotice',
                        lost_found: 'lostandfound',
                        community_announcement: 'announcement',
                        local_news: 'localnews',
                        alert: 'alert',
                    };
                    const subtypeHash = subtypeHashMap[fyiSubtype];
                    if (subtypeHash && !extractedTags.includes(subtypeHash)) extractedTags.push(subtypeHash);
                }

                if (contentType === 'help_request') {
                    if (!extractedTags.includes('helprequest')) extractedTags.push('helprequest');
                    if (helpCategory && !extractedTags.includes(helpCategory)) extractedTags.push(helpCategory);
                }

                const userLocation = getRegisteredLocationSync();

                const payload: CreatePostPayload = {
                    type: postType === 'image' && selectedFiles.length > 0 ? 'image' : 'text',
                    contentType,
                    content: content.trim(),
                    visibility: contentType === 'fyi' ? 'public' : visibility,
                    tags: extractedTags.length > 0 ? extractedTags : undefined,
                    media: selectedFiles.length > 0 ? selectedFiles : undefined,
                    language: postLanguage,
                    priority: priority !== 'normal' ? priority : undefined,
                    ...(contentType === 'fyi' ? {
                        fyiType: fyiSubtype,
                        contactInfo: contactInfo || undefined,
                    } as any : {}),
                    ...(contentType === 'help_request' ? {
                        helpCategory: helpCategory || undefined,
                        // API expects integer kobo — see lib/currency.ts.
                        targetAmount: targetAmount ? toKobo(Number(targetAmount)) : undefined,
                        helpRequestPayment: (bankName || accountName || accountNumber) ? {
                            bankName: bankName || undefined,
                            accountName: accountName || undefined,
                            accountNumber: accountNumber || undefined,
                        } : undefined,
                    } as any : {}),
                    ...(contentType === 'event' ? {
                        eventDate: eventDate || undefined,
                        eventTime: eventTime || undefined,
                        venue: venueName ? { name: venueName, address: venueAddress || undefined } : undefined,
                        ticketInfo,
                        // API expects integer kobo — see lib/currency.ts.
                        ticketPrice: ticketInfo === 'paid' ? toKobo(Number(ticketPrice)) : undefined,
                        capacity: capacity ? Number(capacity) : undefined,
                        organizer: organizer || undefined,
                        eventCategory,
                    } as any : {}),
                    ...(contentType === 'marketplace' ? {
                        // API expects integer kobo — see lib/currency.ts.
                        price: price ? toKobo(Number(price)) : undefined,
                        currency: 'NGN' as const,
                        itemCondition,
                        isNegotiable,
                        deliveryOption,
                        itemCategory: itemCategory || undefined,
                        contactMethod: contactMethod || undefined,
                    } as any : {}),
                    ...(contentType === 'services' ? {
                        serviceName: serviceName || undefined,
                        serviceCategory: serviceCategory || undefined,
                        // API expects integer kobo — see lib/currency.ts.
                        rate: serviceRate ? toKobo(Number(serviceRate)) : undefined,
                        rateType: serviceRateType || undefined,
                        availability: serviceAvailability || undefined,
                        serviceArea: serviceArea || undefined,
                        contactInfo: contactDetails || undefined,
                    } as any : {}),
                    ...(contentType === 'job' ? {
                        jobTitle: jobTitle || undefined,
                        jobType: jobType || undefined,
                        salary: salary || undefined,
                        workMode: workMode || undefined,
                        requirements: jobRequirements || undefined,
                        contactInfo: contactDetails || undefined,
                    } as any : {}),
                    ...(contentType === 'emergency' ? {
                        hazardType: hazardType || undefined,
                        incidentTime: incidentTime || undefined,
                        incidentLocation: incidentLocation || undefined,
                        recommendedAction: recommendedAction || undefined,
                        severity: priority || 'critical',
                    } as any : {}),
                    ...(contentType === 'fyi' && fyiSubtype === 'alert' ? {
                        fyiType: 'alert',
                        affectedArea: affectedArea || undefined,
                        precautions: recommendedPrecautions || undefined,
                    } as any : {}),
                    location: userLocation
                        ? {
                              latitude: userLocation.latitude,
                              longitude: userLocation.longitude,
                          }
                        : undefined,
                };

                await createPost({
                    payload,
                    onProgress: setUploadProgress,
                });
            }

            setContent('');
            setSelectedFiles([]);
            setPostType('text');
            setContentType(defaultContentType || 'services');
            setPostLanguage(appLanguage);
            setCategory('');
            setVisibility('public');
            setPriority('normal');
            setFyiSubtype(defaultFyiSubtype || 'community_announcement');
            setContactInfo('');
            setEventDate('');
            setEventTime('');
            setVenueName('');
            setVenueAddress('');
            setTicketInfo('free');
            setTicketPrice('');
            setCapacity('');
            setOrganizer('');
            setEventCategory('meetup');
            setPrice('');
            setItemCondition('used');
            setIsNegotiable(false);
            setDeliveryOption('pickup');
            setItemCategory('electronics');
            setContactMethod('');
            setHrStep(1);
            setHelpCategory('financial');
            setTargetAmount('');
            setBankName('');
            setAccountName('');
            setAccountNumber('');
            setJobTitle('');
            setJobType('full-time');
            setSalary('');
            setWorkMode('on-site');
            setJobRequirements('');
            setServiceName('');
            setServiceCategory('maintenance');
            setServiceRate('');
            setServiceRateType('hourly');
            setServiceAvailability('available');
            setServiceArea('');
            setHazardType('danger');
            setIncidentTime('');
            setIncidentLocation('');
            setRecommendedAction('');
            setAlertType('weather');
            setUrgencyLevel('critical');
            setAffectedArea('');
            setRecommendedPrecautions('');
            setContactDetails('');
            setUploadProgress(0);

            setShowSuccess(true);
        } catch (error: any) {
            void error;
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setContent('');
            setSelectedFiles([]);
            setPostType('text');
            setContentType(defaultContentType || 'post');
            setPostLanguage(appLanguage);
            setCategory('');
            setVisibility('public');
            setUploadProgress(0);
            setHrStep(1);
            setHelpCategory('financial');
            setTargetAmount('');
            setBankName('');
            setAccountName('');
            setAccountNumber('');
            setJobTitle('');
            setJobType('full-time');
            setSalary('');
            setWorkMode('on-site');
            setJobRequirements('');
            setServiceName('');
            setServiceCategory('maintenance');
            setServiceRate('');
            setServiceRateType('hourly');
            setServiceAvailability('available');
            setServiceArea('');
            setHazardType('danger');
            setIncidentTime('');
            setIncidentLocation('');
            setRecommendedAction('');
            setAlertType('weather');
            setUrgencyLevel('critical');
            setAffectedArea('');
            setRecommendedPrecautions('');
            setContactDetails('');
            onClose();
        }
    };

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-md">
                {/* Backdrop Layer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 cursor-pointer"
                    onClick={handleClose}
                />

                {/* iOS sliding sheet */}
                <motion.div
                    role="dialog"
                    aria-modal="true"
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 30, stiffness: 320 }}
                    className="relative z-10 w-full max-w-[580px] flex flex-col max-h-[92vh] overflow-hidden rounded-t-[36px]"
                    style={{
                        background: 'rgba(248, 251, 248, 0.99)',
                        backdropFilter: 'blur(50px) saturate(2)',
                        WebkitBackdropFilter: 'blur(50px) saturate(2)',
                        boxShadow: '0 -12px 80px rgba(0,0,0,0.20), 0 -3px 20px rgba(0,0,0,0.08)',
                        borderTop: '1px solid rgba(255,255,255,0.95)',
                    }}
                >
                    {/* Premium gradient handle pill */}
                    <div
                        className="mx-auto mt-3.5 mb-1 shrink-0 w-16 h-[5px] rounded-full"
                        style={{ background: 'linear-gradient(90deg, rgba(0,212,49,0.15), rgba(0,196,49,0.55) 50%, rgba(0,212,49,0.15))' }}
                    />

                    {showSuccess ? (
                        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-4xl text-primary">check_circle</span>
                            </div>
                            <h3 className="text-xl font-bold" style={{ color: 'var(--neu-text)' }}>{t('createPost.postShared')}</h3>
                            <p className="text-sm mt-1" style={{ color: 'var(--neu-text-muted)' }}>{t('createPost.willAppear')}</p>
                        </div>
                    ) : (
                        <>
                            {/* Screen 1: Premium Type Selection Grid */}
                            {formStep === 'type_select' && (
                                <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
                                    {/* Header */}
                                    <div className="px-5 pt-3 pb-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h2 className="text-[22px] font-black tracking-tight leading-tight" style={{ color: 'var(--neu-text)' }}>
                                                    What's on your<br />mind today?
                                                </h2>
                                                <p className="text-[11px] font-semibold text-[var(--neu-text-muted)] mt-1.5 tracking-widest uppercase">
                                                    Choose how to share
                                                </p>
                                            </div>
                                            <button
                                                onClick={handleClose}
                                                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-black/[0.07] transition-all cursor-pointer shrink-0 mt-0.5"
                                                style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--neu-text-muted)' }}
                                            >
                                                <span className="material-symbols-outlined text-[20px]">close</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Premium 2-column card grid */}
                                    <div className="px-4 pb-7 grid grid-cols-2 gap-3">
                                        {POST_TYPES.map((pt) => {
                                            let iconGradient = 'linear-gradient(145deg, #e8f0ff 0%, #c8d8ff 100%)';
                                            let cardBg = 'rgba(26,86,255,0.04)';
                                            let cardBorder = 'rgba(26,86,255,0.1)';
                                            let arrowColor = '#1A56FF';
                                            if (pt.value === 'fyi') {
                                                iconGradient = 'linear-gradient(145deg, #eef2f8 0%, #ccd8ec 100%)';
                                                cardBg = 'rgba(58,106,154,0.04)'; cardBorder = 'rgba(58,106,154,0.1)'; arrowColor = '#3a6a9a';
                                            }
                                            if (pt.value === 'help_request') {
                                                iconGradient = 'linear-gradient(145deg, #fff2f2 0%, #ffd0d0 100%)';
                                                cardBg = 'rgba(220,38,38,0.04)'; cardBorder = 'rgba(220,38,38,0.12)'; arrowColor = '#dc2626';
                                            }
                                            if (pt.value === 'marketplace') {
                                                iconGradient = 'linear-gradient(145deg, #e8fff2 0%, #c0ffd8 100%)';
                                                cardBg = 'rgba(0,180,60,0.04)'; cardBorder = 'rgba(0,180,60,0.12)'; arrowColor = '#00a040';
                                            }
                                            if (pt.value === 'event') {
                                                iconGradient = 'linear-gradient(145deg, #e8f5ff 0%, #bce4ff 100%)';
                                                cardBg = 'rgba(0,119,204,0.04)'; cardBorder = 'rgba(0,119,204,0.1)'; arrowColor = '#0077cc';
                                            }
                                            if (pt.value === 'job') {
                                                iconGradient = 'linear-gradient(145deg, #f4eeff 0%, #e0c8ff 100%)';
                                                cardBg = 'rgba(124,58,237,0.04)'; cardBorder = 'rgba(124,58,237,0.1)'; arrowColor = '#7c3aed';
                                            }
                                            if (pt.value === 'emergency') {
                                                iconGradient = 'linear-gradient(145deg, #fff0f0 0%, #ffc4c4 100%)';
                                                cardBg = 'rgba(220,0,0,0.04)'; cardBorder = 'rgba(220,0,0,0.1)'; arrowColor = '#dc0000';
                                            }
                                            if (pt.value === 'alert') {
                                                iconGradient = 'linear-gradient(145deg, #fffbea 0%, #ffe57a 100%)';
                                                cardBg = 'rgba(217,119,6,0.04)'; cardBorder = 'rgba(217,119,6,0.12)'; arrowColor = '#d97706';
                                            }

                                            return (
                                                <button
                                                    key={pt.value}
                                                    type="button"
                                                    onClick={() => handleSelectPostType(pt.value)}
                                                    className="group relative flex flex-col items-start gap-3 p-4 rounded-[24px] cursor-pointer transition-all duration-200 hover:scale-[1.025] active:scale-[0.975] text-left"
                                                    style={{
                                                        background: cardBg,
                                                        border: `1.5px solid ${cardBorder}`,
                                                        boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                                                    }}
                                                >
                                                    {/* Icon container with gradient bg */}
                                                    <div
                                                        className="w-14 h-14 rounded-[18px] flex items-center justify-center text-2xl transition-transform duration-200 group-hover:scale-110 group-active:scale-95 shadow-sm"
                                                        style={{ background: iconGradient }}
                                                    >
                                                        {pt.icon}
                                                    </div>
                                                    {/* Label & description */}
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-[13px] font-black tracking-tight leading-tight" style={{ color: 'var(--neu-text)' }}>{pt.label}</h4>
                                                        <p className="text-[10.5px] text-[var(--neu-text-muted)] mt-1 leading-snug font-medium">{pt.desc}</p>
                                                    </div>
                                                    {/* Hover arrow chip */}
                                                    <div
                                                        className="absolute bottom-3 right-3 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 scale-50 group-hover:scale-100"
                                                        style={{ background: cardBorder }}
                                                    >
                                                        <span className="material-symbols-outlined text-[13px]" style={{ color: arrowColor }}>arrow_forward</span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Screen 2: Template Form */}
                            {formStep === 'form' && (
                                <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
                                    {/* Premium form sub-header */}
                                    <div
                                        className="flex items-center justify-between px-5 py-3.5 border-b shrink-0"
                                        style={{ borderColor: 'rgba(0,0,0,0.06)' }}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            {!defaultContentType && (
                                                <button
                                                    type="button"
                                                    onClick={() => setFormStep('type_select')}
                                                    className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-black/[0.07] transition-all cursor-pointer shrink-0"
                                                    style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--neu-text-muted)' }}
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                                                </button>
                                            )}
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[16px]">
                                                        {contentType === 'emergency' ? '🚨' :
                                                         (contentType === 'fyi' && fyiSubtype === 'alert') ? '⚠️' :
                                                         POST_TYPES.find(p => p.value === contentType)?.icon || '📝'}
                                                    </span>
                                                    <h3 className="text-[15px] font-black capitalize tracking-tight" style={{ color: 'var(--neu-text)' }}>
                                                        {contentType === 'emergency' ? 'Safety Alert' :
                                                         (contentType === 'fyi' && fyiSubtype === 'alert') ? 'Urgent Alert' :
                                                         `Create ${contentType.replace('_', ' ')}`}
                                                    </h3>
                                                </div>
                                                <span
                                                    className="text-[9.5px] font-semibold tracking-widest uppercase mt-0.5"
                                                    style={{ color: 'var(--neu-text-muted)', marginLeft: defaultContentType ? '0' : '0' }}
                                                >
                                                    Share with your Huud
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleClose}
                                            disabled={isSubmitting}
                                            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-black/[0.07] transition-all cursor-pointer shrink-0"
                                            style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--neu-text-muted)' }}
                                        >
                                            <span className="material-symbols-outlined text-[20px]">close</span>
                                        </button>
                                    </div>

                                    {/* Main Form Fields (Scrollable) */}
                                    <div className="flex-1 overflow-y-auto p-5 space-y-5">
                                        {/* Profile summary - premium avatar row */}
                                        {user && (
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-11 h-11 rounded-full overflow-hidden relative shrink-0"
                                                    style={{
                                                        boxShadow: '0 0 0 2.5px rgba(0,196,49,0.3), 0 0 0 4px rgba(0,196,49,0.1)',
                                                    }}
                                                >
                                                    {user.avatarUrl ? (
                                                        <Image src={user.avatarUrl} alt="Avatar" fill sizes="44px" className="object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-sm font-black" style={{ background: 'linear-gradient(135deg, #00c431, #009924)', color: 'white' }}>
                                                            {user.username.slice(0,2).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[13px] font-black" style={{ color: 'var(--neu-text)' }}>
                                                        {user.firstName ? `${user.firstName} ${user.lastName}` : `@${user.username}`}
                                                    </span>
                                                    <span
                                                        className="text-[10px] font-semibold mt-0.5 px-2 py-0.5 rounded-full inline-flex items-center gap-1 w-fit"
                                                        style={{ background: 'rgba(0,196,49,0.08)', color: 'rgba(0,150,36,0.9)' }}
                                                    >
                                                        <span className="material-symbols-outlined text-[11px]">location_on</span>
                                                        {userLga || 'General Area'}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Content Textarea */}
                                        <div>
                                            <textarea
                                                value={content}
                                                onChange={(e) => setContent(e.target.value)}
                                                placeholder={
                                                    contentType === 'marketplace' ? 'Describe the item you are selling, details, or delivery logistics...' :
                                                    contentType === 'event' ? 'Describe the event, target audience, schedule details...' :
                                                    contentType === 'help_request' ? 'Explain the situation and what support is needed...' :
                                                    contentType === 'emergency' ? "What's the situation? Add any advice or precautions..." :
                                                    contentType === 'services' ? 'Describe your services, skills, qualifications, or project highlights...' :
                                                    contentType === 'job' ? 'Describe the role, responsibilities, salary range, and application process...' :
                                                    (contentType === 'fyi' && fyiSubtype === 'alert') ? 'Describe the critical threat or alert detail...' :
                                                    t('feed.composerPlaceholder')
                                                }
                                                className="w-full p-4 rounded-2xl resize-none text-[13px] font-medium min-h-[120px] focus:outline-none transition-all duration-200"
                                                style={{
                                                    border: '1.5px solid rgba(0,0,0,0.08)',
                                                    background: 'rgba(0,0,0,0.018)',
                                                    boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.04)',
                                                    color: 'var(--neu-text)',
                                                }}
                                                onFocus={(e) => {
                                                    e.target.style.border = '1.5px solid rgba(0,196,49,0.45)';
                                                    e.target.style.boxShadow = 'inset 0 2px 6px rgba(0,0,0,0.03), 0 0 0 3px rgba(0,196,49,0.08)';
                                                    e.target.style.background = 'rgba(255,255,255,0.9)';
                                                }}
                                                onBlur={(e) => {
                                                    e.target.style.border = '1.5px solid rgba(0,0,0,0.08)';
                                                    e.target.style.boxShadow = 'inset 0 2px 6px rgba(0,0,0,0.04)';
                                                    e.target.style.background = 'rgba(0,0,0,0.018)';
                                                }}
                                                rows={4}
                                                disabled={isSubmitting}
                                            />
                                            <p className="text-[10px] mt-2 font-medium" style={{ color: 'var(--neu-text-muted)' }}>
                                                {t('createPost.hashtagHint')}
                                            </p>
                                        </div>

                                        {/* Selected Images Preview */}
                                        {selectedFiles.length > 0 && (
                                            <div className="grid grid-cols-2 gap-2">
                                                {selectedFiles.map((file, index) => (
                                                    <div key={index} className="relative group rounded-xl overflow-hidden h-28">
                                                        <Image
                                                            src={URL.createObjectURL(file)}
                                                            alt={`Preview ${index + 1}`}
                                                            fill
                                                            unoptimized
                                                            sizes="50vw"
                                                            className="object-cover"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveFile(index)}
                                                            disabled={isSubmitting}
                                                            className="absolute top-2 right-2 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80 disabled:opacity-50"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">close</span>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* FYI-Specific Fields */}
                                        {contentType === 'fyi' && fyiSubtype !== 'alert' && (
                                            <div className="flex flex-col gap-3.5 p-4 rounded-2xl bg-black/[0.01] dark:bg-white/[0.01] border border-black/[0.05] dark:border-white/[0.08] shadow-sm animate-fadeIn">
                                                {!defaultFyiSubtype && (
                                                    <div>
                                                        <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5" style={{ color: 'var(--neu-text-muted)' }}>
                                                            FYI Subtype
                                                        </label>
                                                        <PostFormSelect
                                                            value={fyiSubtype}
                                                            onChange={(v) => setFyiSubtype(v)}
                                                            disabled={isSubmitting}
                                                            options={[
                                                                { value: 'community_announcement', label: 'Announcement' },
                                                                { value: 'safety_notice', label: 'Safety Notice' },
                                                                { value: 'lost_found', label: 'Lost & Found' },
                                                                { value: 'local_news', label: 'Local News' },
                                                            ]}
                                                        />
                                                    </div>
                                                )}
                                                <div>
                                                    <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5" style={{ color: 'var(--neu-text-muted)' }}>
                                                        Contact Info (optional)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={contactInfo}
                                                        onChange={(e) => setContactInfo(e.target.value)}
                                                        disabled={isSubmitting}
                                                        placeholder="e.g. WhatsApp: 080..., DM"
                                                        className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] focus:border-primary/50 focus:bg-white dark:focus:bg-[#121b14] focus:ring-2 focus:ring-primary/10 transition-all"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Event-Specific Fields */}
                                        {contentType === 'event' && (
                                            <div className="flex flex-col gap-3.5 p-4 rounded-2xl bg-black/[0.01] dark:bg-white/[0.01] border border-black/[0.05] dark:border-white/[0.08] shadow-sm animate-fadeIn">
                                                <label className="block text-[10px] font-black uppercase tracking-wider" style={{ color: 'var(--neu-text-muted)' }}>
                                                    📅 Event Schedule &amp; venue
                                                </label>
                                                <div className="flex gap-2">
                                                    <div className="flex-1">
                                                        <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--neu-text-muted)' }}>Date *</label>
                                                        <input
                                                            type="date"
                                                            value={eventDate}
                                                            onChange={(e) => setEventDate(e.target.value)}
                                                            disabled={isSubmitting}
                                                            required
                                                            className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] focus:border-primary/50 focus:bg-white dark:focus:bg-[#121b14] transition-all"
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--neu-text-muted)' }}>Time</label>
                                                        <input
                                                            type="time"
                                                            value={eventTime}
                                                            onChange={(e) => setEventTime(e.target.value)}
                                                            disabled={isSubmitting}
                                                            className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] focus:border-primary/50 focus:bg-white dark:focus:bg-[#121b14] transition-all"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--neu-text-muted)' }}>Venue Name *</label>
                                                    <input
                                                        type="text"
                                                        value={venueName}
                                                        onChange={(e) => setVenueName(e.target.value)}
                                                        disabled={isSubmitting}
                                                        required
                                                        placeholder="e.g. Town Hall, Landmark Centre"
                                                        className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] focus:border-primary/50 focus:bg-white dark:focus:bg-[#121b14] transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--neu-text-muted)' }}>Venue Address</label>
                                                    <input
                                                        type="text"
                                                        value={venueAddress}
                                                        onChange={(e) => setVenueAddress(e.target.value)}
                                                        disabled={isSubmitting}
                                                        placeholder="e.g. 15 Broad Street, Lagos"
                                                        className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] focus:border-primary/50 focus:bg-white dark:focus:bg-[#121b14] transition-all"
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <div className="flex-1">
                                                        <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--neu-text-muted)' }}>Ticket Access</label>
                                                        <PostFormSelect
                                                            value={ticketInfo}
                                                            onChange={(v) => setTicketInfo(v as 'free' | 'paid')}
                                                            disabled={isSubmitting}
                                                            options={[
                                                                { value: 'free', label: 'Free' },
                                                                { value: 'paid', label: 'Paid Ticket' },
                                                            ]}
                                                        />
                                                    </div>
                                                    {ticketInfo === 'paid' && (
                                                        <div className="flex-1">
                                                            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--neu-text-muted)' }}>Price (₦) *</label>
                                                            <input
                                                                type="number"
                                                                value={ticketPrice}
                                                                onChange={(e) => setTicketPrice(e.target.value)}
                                                                disabled={isSubmitting}
                                                                required
                                                                min="0"
                                                                placeholder="0"
                                                                className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] focus:border-primary/50 focus:bg-white dark:focus:bg-[#121b14] transition-all"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex gap-2">
                                                    <div className="flex-1">
                                                        <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--neu-text-muted)' }}>Max Capacity</label>
                                                        <input
                                                            type="number"
                                                            value={capacity}
                                                            onChange={(e) => setCapacity(e.target.value)}
                                                            disabled={isSubmitting}
                                                            min="1"
                                                            placeholder="Unlimited"
                                                            className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] focus:border-primary/50 focus:bg-white dark:focus:bg-[#121b14] transition-all"
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--neu-text-muted)' }}>Category</label>
                                                        <PostFormSelect
                                                            value={eventCategory}
                                                            onChange={(v) => setEventCategory(v)}
                                                            disabled={isSubmitting}
                                                            options={[
                                                                { value: 'meetup', label: 'Meetup' },
                                                                { value: 'party', label: 'Party / Owambe' },
                                                                { value: 'workshop', label: 'Workshop' },
                                                                { value: 'sports', label: 'Sports' },
                                                                { value: 'concert', label: 'Concert' },
                                                            ]}
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--neu-text-muted)' }}>Organizer</label>
                                                    <input
                                                        type="text"
                                                        value={organizer}
                                                        onChange={(e) => setOrganizer(e.target.value)}
                                                        disabled={isSubmitting}
                                                        placeholder="Your name or organization"
                                                        className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] focus:border-primary/50 focus:bg-white dark:focus:bg-[#121b14] transition-all"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Marketplace-Specific Fields */}
                                        {contentType === 'marketplace' && (
                                            <div className="flex flex-col gap-3.5 p-4 rounded-2xl bg-black/[0.01] dark:bg-white/[0.01] border border-black/[0.05] dark:border-white/[0.08] shadow-sm animate-fadeIn">
                                                <label className="block text-[10px] font-black uppercase tracking-wider" style={{ color: 'var(--neu-text-muted)' }}>
                                                    🛒 Marketplace Details
                                                </label>
                                                <div className="flex gap-2">
                                                    <div className="flex-1">
                                                        <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--neu-text-muted)' }}>Price (₦) *</label>
                                                        <input
                                                            type="number"
                                                            value={price}
                                                            onChange={(e) => setPrice(e.target.value)}
                                                            disabled={isSubmitting}
                                                            required
                                                            min="0"
                                                            placeholder="e.g. 15000"
                                                            className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] focus:border-primary/50 focus:bg-white dark:focus:bg-[#121b14] transition-all"
                                                        />
                                                    </div>
                                                    <div className="flex-1 flex items-end pb-0.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => setIsNegotiable(!isNegotiable)}
                                                            disabled={isSubmitting}
                                                            className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                                                                isNegotiable
                                                                    ? 'mod-chip mod-chip-active text-primary bg-primary/10 border-primary/25'
                                                                    : 'mod-chip border-black/5 dark:border-white/5'
                                                            }`}
                                                        >
                                                            {isNegotiable ? '✓ Negotiable' : 'Fixed Price'}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--neu-text-muted)' }}>Category *</label>
                                                    <PostFormSelect
                                                        value={itemCategory}
                                                        onChange={(v) => setItemCategory(v)}
                                                        disabled={isSubmitting}
                                                        options={[
                                                            { value: 'electronics', label: '📱 Electronics' },
                                                            { value: 'phones', label: '📞 Phones & Accessories' },
                                                            { value: 'fashion', label: '👗 Fashion & Clothing' },
                                                            { value: 'furniture', label: '🛋️ Furniture & Home' },
                                                            { value: 'vehicles', label: '🚗 Vehicles & Auto' },
                                                            { value: 'beauty', label: '💄 Beauty & Health' },
                                                            { value: 'food', label: '🍲 Food & Groceries' },
                                                            { value: 'other', label: '📦 Other Items' },
                                                        ]}
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <div className="flex-1">
                                                        <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--neu-text-muted)' }}>Condition *</label>
                                                        <PostFormSelect
                                                            value={itemCondition}
                                                            onChange={(v) => setItemCondition(v as any)}
                                                            disabled={isSubmitting}
                                                            options={[
                                                                { value: 'new', label: 'Brand New' },
                                                                { value: 'used', label: 'Used (Tokunbo)' },
                                                                { value: 'refurbished', label: 'Refurbished' },
                                                                { value: 'free', label: 'Free / Give away' },
                                                            ]}
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--neu-text-muted)' }}>Delivery Option</label>
                                                        <PostFormSelect
                                                            value={deliveryOption}
                                                            onChange={(v) => setDeliveryOption(v as any)}
                                                            disabled={isSubmitting}
                                                            options={[
                                                                { value: 'pickup', label: 'Pickup Only' },
                                                                { value: 'delivery', label: 'Delivery' },
                                                                { value: 'both', label: 'Both Options' },
                                                            ]}
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--neu-text-muted)' }}>Contact Method</label>
                                                    <input
                                                        type="text"
                                                        value={contactMethod}
                                                        onChange={(e) => setContactMethod(e.target.value)}
                                                        disabled={isSubmitting}
                                                        placeholder="e.g. WhatsApp: 080... or Call"
                                                        className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] focus:border-primary/50 focus:bg-white dark:focus:bg-[#121b14] transition-all"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Help Request — multi-step forms */}
                                        {contentType === 'help_request' && (
                                            <div className="flex flex-col gap-3.5 p-4 rounded-2xl bg-black/[0.01] dark:bg-white/[0.01] border border-black/[0.05] dark:border-white/[0.08] shadow-sm animate-fadeIn">
                                                {/* Step indicator */}
                                                <div className="flex items-center gap-2 mb-1">
                                                    {([1, 2, 3] as const).map((s) => (
                                                        <div key={s} className="flex items-center gap-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => setHrStep(s)}
                                                                className={`w-7 h-7 rounded-full text-[11px] font-bold flex items-center justify-center transition-all border ${
                                                                    hrStep === s 
                                                                        ? 'bg-primary text-black border-primary font-black shadow-sm' 
                                                                        : 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-neu-text-secondary/70 dark:text-white/50 hover:bg-black/10 dark:hover:bg-white/10'
                                                                }`}
                                                            >
                                                                {s}
                                                            </button>
                                                            {s < 3 && <div className="w-6 h-px" style={{ background: 'var(--neu-shadow-light)' }} />}
                                                        </div>
                                                    ))}
                                                    <span className="text-[10px] ml-1.5 font-bold uppercase tracking-wider text-neu-text-secondary/60 dark:text-white/40">
                                                        {hrStep === 1 ? 'Category' : hrStep === 2 ? 'Funding' : 'Payment Details'}
                                                    </span>
                                                </div>

                                                {/* Step 1: Category */}
                                                {hrStep === 1 && (
                                                    <>
                                                        <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--neu-text-muted)' }}>
                                                            Help Category
                                                        </label>
                                                        <PostFormSelect
                                                            value={helpCategory}
                                                            onChange={(v) => setHelpCategory(v)}
                                                            disabled={isSubmitting}
                                                            options={[
                                                                { value: 'financial', label: '🤝 Financial Assistance' },
                                                                { value: 'medical', label: '🏥 Medical emergency' },
                                                                { value: 'educational', label: '🎓 Education / Tuition' },
                                                                { value: 'disaster', label: '🔥 Natural Disaster / Fire' },
                                                                { value: 'other', label: '👥 Other Community support' },
                                                            ]}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setHrStep(2)}
                                                            className="mt-2 ml-auto px-4 py-2.5 rounded-xl text-xs font-bold text-primary border border-primary/20 bg-primary/5 hover:bg-primary/10 active:scale-[0.97] transition-all cursor-pointer"
                                                        >
                                                            Next →
                                                        </button>
                                                    </>
                                                )}

                                                {/* Step 2: Goal */}
                                                {hrStep === 2 && (
                                                    <>
                                                        <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--neu-text-muted)' }}>
                                                            Target Amount (₦)
                                                        </label>
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-neu-text-secondary/60 dark:text-white/40">₦</span>
                                                            <input
                                                                type="number"
                                                                value={targetAmount}
                                                                onChange={(e) => setTargetAmount(e.target.value)}
                                                                disabled={isSubmitting}
                                                                min="0"
                                                                step="100"
                                                                placeholder="e.g. 50000 (optional)"
                                                                className="w-full pl-7 pr-3.5 py-2.5 rounded-xl text-sm focus:outline-none border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] focus:border-primary/50 focus:bg-white dark:focus:bg-[#121b14] transition-all"
                                                            />
                                                        </div>
                                                        <div className="flex justify-between mt-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => setHrStep(1)}
                                                                className="px-4 py-2.5 rounded-xl text-xs font-bold border border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-neu-text-secondary active:scale-[0.97] transition-all cursor-pointer"
                                                            >
                                                                ← Back
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setHrStep(3)}
                                                                className="px-4 py-2.5 rounded-xl text-xs font-bold text-primary border border-primary/20 bg-primary/5 hover:bg-primary/10 active:scale-[0.97] transition-all cursor-pointer"
                                                            >
                                                                Next →
                                                            </button>
                                                        </div>
                                                    </>
                                                )}

                                                {/* Step 3: Bank account details */}
                                                {hrStep === 3 && (
                                                    <div className="space-y-3">
                                                        <label className="block text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--neu-text-muted)' }}>
                                                            Settlement Account Details
                                                        </label>
                                                        <div>
                                                            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--neu-text-muted)' }}>Bank Name</label>
                                                            <input
                                                                type="text"
                                                                value={bankName}
                                                                onChange={(e) => setBankName(e.target.value)}
                                                                disabled={isSubmitting}
                                                                placeholder="e.g. GTBank, Zenith"
                                                                className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] focus:border-primary/50 focus:bg-white dark:focus:bg-[#121b14] transition-all"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--neu-text-muted)' }}>Account Name</label>
                                                            <input
                                                                type="text"
                                                                value={accountName}
                                                                onChange={(e) => setAccountName(e.target.value)}
                                                                disabled={isSubmitting}
                                                                placeholder="Name matching account"
                                                                className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] focus:border-primary/50 focus:bg-white dark:focus:bg-[#121b14] transition-all"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--neu-text-muted)' }}>Account Number</label>
                                                            <input
                                                                type="text"
                                                                value={accountNumber}
                                                                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                                                disabled={isSubmitting}
                                                                placeholder="10-digit NUBAN"
                                                                maxLength={10}
                                                                inputMode="numeric"
                                                                className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] focus:border-primary/50 focus:bg-white dark:focus:bg-[#121b14] transition-all font-mono"
                                                            />
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => setHrStep(2)}
                                                            className="px-4 py-2.5 rounded-xl text-xs font-bold border border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-neu-text-secondary active:scale-[0.97] transition-all cursor-pointer self-start"
                                                        >
                                                            ← Back
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Services-Specific Fields */}
                                        {contentType === 'services' && (
                                            <div className="flex flex-col gap-3.5 p-4 rounded-2xl bg-black/[0.01] dark:bg-white/[0.01] border border-black/[0.05] dark:border-white/[0.08] shadow-sm animate-fadeIn">
                                                <label className="block text-[10px] font-black uppercase tracking-wider" style={{ color: 'var(--neu-text-muted)' }}>
                                                    🛠️ Service Details
                                                </label>
                                                <div>
                                                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--neu-text-muted)' }}>Service Name *</label>
                                                    <input
                                                        type="text"
                                                        value={serviceName}
                                                        onChange={(e) => setServiceName(e.target.value)}
                                                        disabled={isSubmitting}
                                                        required
                                                        placeholder="e.g. Professional Electrical Fixes"
                                                        className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] focus:border-primary/50 focus:bg-white dark:focus:bg-[#121b14] transition-all"
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <div className="flex-1">
                                                        <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--neu-text-muted)' }}>Category</label>
                                                        <PostFormSelect
                                                            value={serviceCategory}
                                                            onChange={(v) => setServiceCategory(v)}
                                                            disabled={isSubmitting}
                                                            options={[
                                                                { value: 'maintenance', label: '🛠️ Maintenance' },
                                                                { value: 'cleaning', label: '🧹 Cleaning' },
                                                                { value: 'tutoring', label: '📚 Tutoring' },
                                                                { value: 'beauty', label: '💄 Beauty' },
                                                                { value: 'delivery', label: '📦 Delivery' },
                                                                { value: 'consulting', label: '📈 Consulting' },
                                                                { value: 'other', label: '🧩 Other' },
                                                            ]}
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--neu-text-muted)' }}>Availability</label>
                                                        <PostFormSelect
                                                            value={serviceAvailability}
                                                            onChange={(v) => setServiceAvailability(v)}
                                                            disabled={isSubmitting}
                                                            options={[
                                                                { value: 'available', label: '🟢 Available' },
                                                                { value: 'busy', label: '🟡 Busy' },
                                                                { value: 'unavailable', label: '🔴 Unavailable' },
                                                            ]}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <div className="flex-1">
                                                        <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--neu-text-muted)' }}>Rate (₦)</label>
                                                        <input
                                                            type="number"
                                                            value={serviceRate}
                                                            onChange={(e) => setServiceRate(e.target.value)}
                                                            disabled={isSubmitting}
                                                            min="0"
                                                            placeholder="e.g. 5000 (optional)"
                                                            className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] focus:border-primary/50 focus:bg-white dark:focus:bg-[#121b14] transition-all"
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--neu-text-muted)' }}>Rate Type</label>
                                                        <PostFormSelect
                                                            value={serviceRateType}
                                                            onChange={(v) => setServiceRateType(v)}
                                                            disabled={isSubmitting}
                                                            options={[
                                                                { value: 'hourly', label: 'Per Hour' },
                                                                { value: 'flat', label: 'Flat Rate' },
                                                                { value: 'project', label: 'Per Project' },
                                                            ]}
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--neu-text-muted)' }}>Service Area</label>
                                                    <input
                                                        type="text"
                                                        value={serviceArea}
                                                        onChange={(e) => setServiceArea(e.target.value)}
                                                        disabled={isSubmitting}
                                                        placeholder="e.g. Ikeja, Lekki Phase 1, Yaba"
                                                        className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] focus:border-primary/50 focus:bg-white dark:focus:bg-[#121b14] transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--neu-text-muted)' }}>Contact Details *</label>
                                                    <input
                                                        type="text"
                                                        value={contactDetails}
                                                        onChange={(e) => setContactDetails(e.target.value)}
                                                        disabled={isSubmitting}
                                                        required
                                                        placeholder="e.g. WhatsApp: 080... or Call"
                                                        className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] focus:border-primary/50 focus:bg-white dark:focus:bg-[#121b14] transition-all"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Job-Specific Fields */}
                                        {contentType === 'job' && (
                                            <div className="flex flex-col gap-3.5 p-4 rounded-2xl bg-black/[0.01] dark:bg-white/[0.01] border border-black/[0.05] dark:border-white/[0.08] shadow-sm animate-fadeIn">
                                                <label className="block text-[10px] font-black uppercase tracking-wider" style={{ color: 'var(--neu-text-muted)' }}>
                                                    💼 Job Details
                                                </label>
                                                <div>
                                                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--neu-text-muted)' }}>Job Title *</label>
                                                    <input
                                                        type="text"
                                                        value={jobTitle}
                                                        onChange={(e) => setJobTitle(e.target.value)}
                                                        disabled={isSubmitting}
                                                        required
                                                        placeholder="e.g. Front-End React Developer"
                                                        className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] focus:border-primary/50 focus:bg-white dark:focus:bg-[#121b14] transition-all"
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <div className="flex-1">
                                                        <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--neu-text-muted)' }}>Job Type</label>
                                                        <PostFormSelect
                                                            value={jobType}
                                                            onChange={(v) => setJobType(v)}
                                                            disabled={isSubmitting}
                                                            options={[
                                                                { value: 'full-time', label: 'Full-time' },
                                                                { value: 'part-time', label: 'Part-time' },
                                                                { value: 'contract', label: 'Contract' },
                                                                { value: 'internship', label: 'Internship' },
                                                                { value: 'temporary', label: 'Temporary' },
                                                            ]}
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--neu-text-muted)' }}>Work Mode</label>
                                                        <PostFormSelect
                                                            value={workMode}
                                                            onChange={(v) => setWorkMode(v)}
                                                            disabled={isSubmitting}
                                                            options={[
                                                                { value: 'on-site', label: 'On-site' },
                                                                { value: 'remote', label: 'Remote' },
                                                                { value: 'hybrid', label: 'Hybrid' },
                                                            ]}
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--neu-text-muted)' }}>Salary / Compensation</label>
                                                    <input
                                                        type="text"
                                                        value={salary}
                                                        onChange={(e) => setSalary(e.target.value)}
                                                        disabled={isSubmitting}
                                                        placeholder="e.g. ₦150k - ₦200k / month (or Negotiable)"
                                                        className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] focus:border-primary/50 focus:bg-white dark:focus:bg-[#121b14] transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--neu-text-muted)' }}>Requirements / Key Skills</label>
                                                    <textarea
                                                        value={jobRequirements}
                                                        onChange={(e) => setJobRequirements(e.target.value)}
                                                        disabled={isSubmitting}
                                                        placeholder="e.g. 2+ years React experience, CSS/HTML, strong communication skills..."
                                                        className="w-full p-3 rounded-xl text-sm focus:outline-none border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] focus:border-primary/50 focus:bg-white dark:focus:bg-[#121b14] resize-none transition-all"
                                                        rows={3}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--neu-text-muted)' }}>Contact / Apply details *</label>
                                                    <input
                                                        type="text"
                                                        value={contactDetails}
                                                        onChange={(e) => setContactDetails(e.target.value)}
                                                        disabled={isSubmitting}
                                                        required
                                                        placeholder="e.g. Email cv to jobs@company.com or Call"
                                                        className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] focus:border-primary/50 focus:bg-white dark:focus:bg-[#121b14] transition-all"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Safety Log (Emergency) Fields */}
                                        {contentType === 'emergency' && (
                                            <div className="flex flex-col gap-3.5 p-4 rounded-2xl bg-black/[0.01] dark:bg-white/[0.01] border border-black/[0.05] dark:border-white/[0.08] shadow-sm animate-fadeIn">
                                                <label className="block text-[10px] font-black uppercase tracking-wider text-brand-red">
                                                    🚨 Incident / Threat Log Details
                                                </label>
                                                <div>
                                                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--neu-text-muted)' }}>Hazard / Incident Type</label>
                                                    <PostFormSelect
                                                        value={hazardType}
                                                        onChange={(v) => setHazardType(v)}
                                                        disabled={isSubmitting}
                                                        options={[
                                                            { value: 'danger', label: '⚠️ General Hazard' },
                                                            { value: 'crime', label: '👮 Crime / Robbery / Theft' },
                                                            { value: 'missing_person', label: '🔍 Missing Person' },
                                                            { value: 'fire', label: '🔥 Fire Outbreak' },
                                                            { value: 'accident', label: '🚗 Road Accident' },
                                                            { value: 'suspicious_activity', label: '👀 Suspicious Activity' },
                                                        ]}
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <div className="flex-1">
                                                        <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--neu-text-muted)' }}>Time of Incident</label>
                                                        <input
                                                            type="text"
                                                            value={incidentTime}
                                                            onChange={(e) => setIncidentTime(e.target.value)}
                                                            disabled={isSubmitting}
                                                            placeholder="e.g. Just now, 10 mins ago"
                                                            className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] focus:border-primary/50 focus:bg-white dark:focus:bg-[#121b14] transition-all"
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--neu-text-muted)' }}>Urgency Level</label>
                                                        <PostFormSelect
                                                            value={priority}
                                                            onChange={(v) => setPriority(v as any)}
                                                            disabled={isSubmitting}
                                                            options={[
                                                                { value: 'critical', label: '🚨 Critical (Default)' },
                                                                { value: 'high', label: '🔴 High' },
                                                                { value: 'normal', label: '🟡 Normal' },
                                                            ]}
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--neu-text-muted)' }}>Location / Nearby Landmark *</label>
                                                    <input
                                                        type="text"
                                                        value={incidentLocation}
                                                        onChange={(e) => setIncidentLocation(e.target.value)}
                                                        disabled={isSubmitting}
                                                        required
                                                        placeholder="e.g. Near Ikeja City Mall gate, Herbert Macaulay Way"
                                                        className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] focus:border-primary/50 focus:bg-white dark:focus:bg-[#121b14] transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--neu-text-muted)' }}>Recommended Precautions / Actions</label>
                                                    <input
                                                        type="text"
                                                        value={recommendedAction}
                                                        onChange={(e) => setRecommendedAction(e.target.value)}
                                                        disabled={isSubmitting}
                                                        placeholder="e.g. Avoid the area, take alternative routes"
                                                        className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] focus:border-primary/50 focus:bg-white dark:focus:bg-[#121b14] transition-all"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Urgent Alert Fields */}
                                        {contentType === 'fyi' && fyiSubtype === 'alert' && (
                                            <div className="flex flex-col gap-3.5 p-4 rounded-2xl bg-black/[0.01] dark:bg-white/[0.01] border border-black/[0.05] dark:border-white/[0.08] shadow-sm animate-fadeIn">
                                                <label className="block text-[10px] font-black uppercase tracking-wider text-status-warning">
                                                    ⚠️ Urgent Alert Details
                                                </label>
                                                <div className="flex gap-2">
                                                    <div className="flex-1">
                                                        <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--neu-text-muted)' }}>Alert Type</label>
                                                        <PostFormSelect
                                                            value={alertType}
                                                            onChange={(v) => setAlertType(v)}
                                                            disabled={isSubmitting}
                                                            options={[
                                                                { value: 'weather', label: '☁️ Severe Weather' },
                                                                { value: 'health', label: '🏥 Health / Outbreak' },
                                                                { value: 'infrastructure', label: '🔌 Infrastructure Outage' },
                                                                { value: 'security', label: '🛡️ Security Alert' },
                                                                { value: 'other', label: '⚠️ Other Critical Event' },
                                                            ]}
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--neu-text-muted)' }}>Urgency Level</label>
                                                        <PostFormSelect
                                                            value={priority}
                                                            onChange={(v) => setPriority(v as any)}
                                                            disabled={isSubmitting}
                                                            options={[
                                                                { value: 'critical', label: '🚨 Critical (Default)' },
                                                                { value: 'high', label: '🔴 High' },
                                                            ]}
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--neu-text-muted)' }}>Affected Area *</label>
                                                    <input
                                                        type="text"
                                                        value={affectedArea}
                                                        onChange={(e) => setAffectedArea(e.target.value)}
                                                        disabled={isSubmitting}
                                                        required
                                                        placeholder="e.g. Yaba LGA, whole of Lagos Mainland"
                                                        className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] focus:border-primary/50 focus:bg-white dark:focus:bg-[#121b14] transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--neu-text-muted)' }}>Recommended Precautions</label>
                                                    <input
                                                        type="text"
                                                        value={recommendedPrecautions}
                                                        onChange={(e) => setRecommendedPrecautions(e.target.value)}
                                                        disabled={isSubmitting}
                                                        placeholder="e.g. Stay indoors, boil all drinking water"
                                                        className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] focus:border-primary/50 focus:bg-white dark:focus:bg-[#121b14] transition-all"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Upload Progress Bar */}
                                        {uploadProgress > 0 && uploadProgress < 100 && (
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between text-xs" style={{ color: 'var(--neu-text-muted)' }}>
                                                    <span>Uploading media...</span>
                                                    <span>{uploadProgress}%</span>
                                                </div>
                                                <div className="w-full neu-socket rounded-full h-1.5">
                                                    <div
                                                        className="bg-primary h-1.5 rounded-full transition-all duration-300"
                                                        style={{ width: `${uploadProgress}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="p-4 px-6 pb-6 flex items-center justify-between border-t border-black/[0.04] dark:border-white/[0.04] shrink-0 bg-white/95 dark:bg-[#121b14]/95 backdrop-blur-md">
                                        {/* Attachment Buttons */}
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={handlePickMedia}
                                                disabled={isSubmitting}
                                                className="flex items-center justify-center w-9.5 h-9.5 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-all text-primary disabled:opacity-50 cursor-pointer"
                                                title="Add Photo"
                                            >
                                                <span className="material-symbols-outlined text-[19px]">image</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isSubmitting}
                                                className="flex items-center justify-center w-9.5 h-9.5 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-all text-primary disabled:opacity-50 cursor-pointer"
                                                title="Add Video"
                                            >
                                                <span className="material-symbols-outlined text-[19px]">videocam</span>
                                            </button>
                                        </div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*,video/*"
                                            multiple
                                            onChange={handleFileSelect}
                                            className="hidden"
                                            disabled={isSubmitting}
                                        />

                                        {/* Submit Button */}
                                        <button
                                            type="submit"
                                            disabled={isSubmitting || (!content.trim() && selectedFiles.length === 0)}
                                            className="px-6 py-3 rounded-xl disabled:opacity-40 flex items-center gap-2 cursor-pointer shadow-md hover:shadow-lg text-xs font-black bg-gradient-to-r from-primary to-[#00b33b] hover:from-primary/95 hover:to-[#00a034] text-black active:scale-[0.97] transition-all"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                                    <span>Posting...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="material-symbols-outlined text-[16px]">send</span>
                                                    <span>Share Update</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
}
