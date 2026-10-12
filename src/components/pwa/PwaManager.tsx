'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { WifiOff, Download, X } from 'lucide-react';

interface PwaContextType {
  isOnline: boolean;
  canInstall: boolean;
  isInstalled: boolean;
  installApp: () => Promise<void>;
}

const PwaContext = createContext<PwaContextType>({
  isOnline: true,
  canInstall: false,
  isInstalled: false,
  installApp: async () => {},
});

export const usePwa = () => useContext(PwaContext);

export function PwaManager({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    // 1. Connection status monitoring
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);

      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // 2. Check if already installed (display-mode: standalone)
      if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
        setIsInstalled(true);
      }

      // 3. Register Service Worker
      if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('[Cloud AOS] Service Worker registered with scope:', registration.scope);
          })
          .catch((error) => {
            console.warn('[Cloud AOS] Service Worker registration failed:', error);
          });
      } else if ('serviceWorker' in navigator) {
        // Development: a worker left over from a production run on the same port would
        // serve stale files, so remove it.
        navigator.serviceWorker.getRegistrations().then((registrations) => registrations.forEach((r) => r.unregister()));
      }

      // 4. Capture PWA install prompt
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        // Show install toast/banner only if not already installed and not dismissed previously
        const dismissed = localStorage.getItem('cloudaos_pwa_dismissed');
        if (!dismissed) {
          setShowInstallBanner(true);
        }
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      window.addEventListener('appinstalled', () => {
        setIsInstalled(true);
        setDeferredPrompt(null);
        setShowInstallBanner(false);
        console.log('[Cloud AOS] App successfully installed');
      });

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    } catch (err) {
      console.warn('[Cloud AOS] Install prompt error:', err);
    }
  };

  const dismissBanner = () => {
    setShowInstallBanner(false);
    localStorage.setItem('cloudaos_pwa_dismissed', 'true');
  };

  return (
    <PwaContext.Provider
      value={{
        isOnline,
        canInstall: !!deferredPrompt && !isInstalled,
        isInstalled,
        installApp,
      }}
    >
      {/* Offline Toast Banner */}
      {!isOnline && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed bottom-20 left-4 z-50 flex items-center gap-3 rounded-xl border border-amber-500/40 bg-ink-850/90 px-4 py-2.5 text-xs font-medium text-amber-200 shadow-2xl backdrop-blur-md md:bottom-4"
        >
          <WifiOff className="h-4 w-4 shrink-0 text-amber-300" />
          <span>You&apos;re offline. Records load again when your connection returns.</span>
        </aside>
      )}

      {/* Install App Floating Banner */}
      {showInstallBanner && deferredPrompt && !isInstalled && (
        <aside
          role="region"
          aria-label="Install App"
          className="fixed bottom-20 right-4 z-50 max-w-sm w-[calc(100%-2rem)] p-4 bg-slate-900/95 md:bottom-4 border border-brand-500/40 text-slate-100 rounded-2xl shadow-2xl backdrop-blur-xl"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/icon-192x192.png" alt="" className="h-10 w-10 rounded-xl" />
              <div>
                <h4 className="font-bold text-sm text-white">Install Cloud AOS</h4>
                <p className="text-xs text-slate-400">Open it from your desktop or home screen like any app</p>
              </div>
            </div>
            <button
              onClick={dismissBanner}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={installApp}
              className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Install
            </button>
            <button
              onClick={dismissBanner}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
            >
              Later
            </button>
          </div>
        </aside>
      )}

      {children}
    </PwaContext.Provider>
  );
}
