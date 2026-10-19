import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
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
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
    { media: '(prefers-color-scheme: light)', color: '#f3f4f7' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
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
                  // The palette of the company last opened here, inside the app only:
                  // the sign-in page stays neutral and never names a company.
                  var page = { light: '#f3f4f7', dark: '#000000' };
                  if (location.pathname.indexOf('/dashboard') === 0) {
                    var brand = JSON.parse(localStorage.getItem('cloudaos_brand') || 'null');
                    if (brand && brand.key) {
                      doc.setAttribute('data-brand', brand.key);
                      if (brand.page) page = brand.page;
                    }
                  }
                  doc.style.backgroundColor = dark ? page.dark : page.light;
                  doc.style.colorScheme = dark ? 'dark' : 'light';
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-transparent font-sans text-slate-900 antialiased dark:text-slate-100">
        <PwaManager>{children}</PwaManager>
      </body>
    </html>
  );
}
