'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { isIosDevice, markPwaInstalled } from '@/lib/pwa-install';

type BeforeInstallPromptEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export function usePwaInstall() {
    const deferredRef = useRef<BeforeInstallPromptEvent | null>(null);
    const [canNativeInstall, setCanNativeInstall] = useState(false);
    const [iosDevice] = useState(() => isIosDevice());

    useEffect(() => {
        const onBeforeInstall = (event: Event) => {
            event.preventDefault();
            deferredRef.current = event as BeforeInstallPromptEvent;
            setCanNativeInstall(true);
        };

        const onInstalled = () => {
            markPwaInstalled();
            deferredRef.current = null;
            setCanNativeInstall(false);
        };

        window.addEventListener('beforeinstallprompt', onBeforeInstall);
        window.addEventListener('appinstalled', onInstalled);
        return () => {
            window.removeEventListener('beforeinstallprompt', onBeforeInstall);
            window.removeEventListener('appinstalled', onInstalled);
        };
    }, []);

    const install = useCallback(async () => {
        const deferred = deferredRef.current;
        if (!deferred) return false;
        await deferred.prompt();
        const { outcome } = await deferred.userChoice;
        if (outcome === 'accepted') markPwaInstalled();
        deferredRef.current = null;
        setCanNativeInstall(false);
        return outcome === 'accepted';
    }, []);

    return {
        canNativeInstall,
        iosDevice,
        install,
    };
};
