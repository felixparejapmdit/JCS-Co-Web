import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PwaManager } from '@/components/pwa/PwaManager';

export const metadata: Metadata = {
  title: 'Cloud AOS',
  description: 'Cloud AOS: the modern accounting and operations system, running on your existing AOS100 database.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Cloud AOS',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.svg',
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#0b1f3a',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var mode = localStorage.getItem('aos100_theme_mode') || 'dark';
                  var dark = mode === 'dark' || (mode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  var doc = document.documentElement;
                  doc.classList.toggle('dark', dark);
                  doc.style.backgroundColor = dark ? '#0b1220' : '#f4f6fa';
                  doc.style.colorScheme = dark ? 'dark' : 'light';
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-[#f4f6fa] text-slate-900 antialiased selection:bg-teal-500 selection:text-white dark:bg-[#0b1220] dark:text-slate-100">
        <PwaManager>{children}</PwaManager>
      </body>
    </html>
  );
}
