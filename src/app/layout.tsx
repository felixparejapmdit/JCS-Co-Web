import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AOS100 NextGen - Enterprise ERP & Financial Governance',
  description: 'Modern Multi-Tenant Financial Accounting, General Ledger, AP/AR, Tax Compliance and Cheque Printing Platform for JCS Co.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var mode = localStorage.getItem('aos100_theme_mode') || 'light';
                  var isDark = mode === 'dark' || (mode === 'auto' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  var doc = document.documentElement;
                  if (isDark) {
                    doc.classList.add('dark');
                    doc.style.backgroundColor = '#0F1115';
                    doc.style.colorScheme = 'dark';
                  } else {
                    doc.classList.remove('dark');
                    doc.style.backgroundColor = '#F8FAFC';
                    doc.style.colorScheme = 'light';
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-slate-50 dark:bg-[#0F1115] antialiased text-slate-900 dark:text-slate-100 selection:bg-cyan-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
